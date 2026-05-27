import prisma from '../prisma.js';

// Rabat korelacyjny dla bet buildera (multi-leg w obrębie 1 meczu)
const BET_BUILDER_DISCOUNT = 0.80;

export const createCoupon = async (req, res) => {
    const userId = req.userId;

    const { stawka, kursy } = req.body;

    if (!stawka || stawka <= 0 || !kursy || kursy.length === 0) {
        return res.status(400).json({ error: 'Nieprawidłowe dane kuponu' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.uzytkownicy.findUnique({
                where: { id: userId },
                select: { saldo: true }
            });
            if (!user) throw new Error('Użytkownik nie istnieje');
            if (Number(user.saldo) < Number(stawka)) throw new Error('Niewystarczające środki');

            const validKursy = [];

            for (const kursId of kursy) {
                const odd = await tx.kursy.findUnique({
                    where: { id: kursId },
                    include: { mecze: true }
                });
                if (!odd) throw new Error(`Kurs o ID ${kursId} nie istnieje`);
                if (odd.status === 'ZABLOKOWANY') throw new Error(`Kurs ${odd.opis} jest zablokowany (zmiana kursu) - spróbuj za chwilę`);
                if (odd.status !== 'AKTYWNY') throw new Error(`Kurs ${odd.opis} jest nieaktywny`);
                if (odd.mecze?.status === 'ZAKONCZONY') throw new Error(`Mecz ${odd.mecze.nazwa_gospodarza} - ${odd.mecze.nazwa_goscia} jest już zakończony`);
                validKursy.push(odd);
            }

            // Sprawdź wzajemnie wykluczające się kursy w tym samym rynku (np. OVER i UNDER)
            const seen = new Set();
            for (const k of validKursy) {
                const key = `${k.mecz_id}|${k.rodzaj}`;
                if (k.rodzaj !== 'HTFT' && seen.has(key)) {
                    throw new Error(`Nie możesz obstawić dwóch wykluczających się kursów w rynku ${k.rodzaj}`);
                }
                seen.add(key);
            }

            // Bet builder - grupuj po mecz_id, każda grupa >=2 dostaje rabat korelacyjny
            const byMatch = validKursy.reduce((acc, k) => {
                (acc[k.mecz_id] = acc[k.mecz_id] || []).push(k);
                return acc;
            }, {});

            let totalOdds = 1.0;
            for (const matchId of Object.keys(byMatch)) {
                const legs = byMatch[matchId];
                let groupOdds = legs.reduce((acc, k) => acc * Number(k.kurs), 1);
                if (legs.length >= 2) {
                    groupOdds *= BET_BUILDER_DISCOUNT;
                }
                totalOdds *= groupOdds;
            }

            totalOdds = parseFloat(totalOdds.toFixed(2));
            const simplePotentialWin = parseFloat((Number(stawka) * totalOdds).toFixed(2));

            await tx.uzytkownicy.update({
                where: { id: userId },
                data: { saldo: { decrement: stawka } }
            });

            await tx.transakcje.create({
                data: {
                    uzytkownik_id: userId,
                    typ: 'STAWKA',
                    kwota: stawka,
                    opis: 'Postawienie kuponu'
                }
            });

            // Wstaw rabat bet buildera w kurs_w_momencie pierwszej pozycji z każdej grupy
            // (tak żeby settlement dawał spójną wypłatę z totalOdds)
            const firstOfGroup = new Set();
            const pozycjeData = validKursy.map(odd => {
                let kursLockedIn = Number(odd.kurs);
                const legs = byMatch[odd.mecz_id];
                if (legs.length >= 2 && !firstOfGroup.has(odd.mecz_id)) {
                    firstOfGroup.add(odd.mecz_id);
                    kursLockedIn = parseFloat((kursLockedIn * BET_BUILDER_DISCOUNT).toFixed(4));
                }
                return { kurs_id: odd.id, kurs_w_momencie: kursLockedIn };
            });

            const coupon = await tx.kupony.create({
                data: {
                    uzytkownik_id: userId,
                    stawka: stawka,
                    kurs_calkowity: totalOdds,
                    potencjalna_wygrana: simplePotentialWin,
                    status: 'OCZEKUJACY',
                    kupon_pozycje: { create: pozycjeData }
                }
            });

            return coupon;
        });

        res.status(201).json({ message: 'Kupon postawiony', kuponId: result.id });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message || 'Błąd tworzenia kuponu' });
    }
};

// Współczynnik prowizji bukmachera przy cashoucie (10%)
const CASHOUT_MARGIN = 0.90;

/**
 * Wylicza aktualną wartość cashoutu dla kuponu.
 * Reguła per pozycja:
 *   WYGRANY        -> multiplier = kurs_w_momencie (zysk zalegający w kursie)
 *   ZWROT/VOID     -> multiplier = 1.0
 *   PRZEGRANY      -> multiplier = 0 (cashout = 0)
 *   OCZEKUJACY     -> multiplier = kurs_w_momencie / kurs_aktualny  (jeśli kursy się skróciły, multiplier > 1)
 * cashout = stake * Π(multiplier) * CASHOUT_MARGIN
 */
const computeCashoutValue = (coupon) => {
    const stake = Number(coupon.stawka);
    let product = 1;
    let allowed = true;
    let allSettled = true;

    for (const pos of coupon.kupon_pozycje) {
        const status = pos.status || 'OCZEKUJACY';
        const lockedOdds = Number(pos.kurs_w_momencie);
        if (status === 'PRZEGRANY') {
            return { value: 0, allowed: false, reason: 'Co najmniej jedna pozycja przegrana' };
        }
        if (status === 'WYGRANY') {
            product *= lockedOdds;
            continue;
        }
        if (status === 'ZWROT') {
            product *= 1.0;
            continue;
        }
        // OCZEKUJACY
        allSettled = false;
        const live = pos.kursy;
        if (!live) { allowed = false; continue; }
        const matchStatus = live.mecze?.status;
        if (matchStatus === 'ZAKONCZONY') {
            // Mecz po końcu, czekamy na rozliczenie — cashout zablokowany
            return { value: 0, allowed: false, reason: 'Mecz zakończony, czekam na rozliczenie' };
        }
        if (live.status === 'ZABLOKOWANY') {
            return { value: 0, allowed: false, reason: 'Kurs chwilowo zablokowany (live update)' };
        }
        const currentOdds = Number(live.kurs);
        if (!currentOdds || currentOdds <= 1.0) {
            return { value: 0, allowed: false, reason: 'Niedostępny aktualny kurs' };
        }
        product *= (lockedOdds / currentOdds);
    }

    if (allSettled) {
        // Wszystko rozstrzygnięte (i bez przegranych) -> nie ma już co cashoutować
        return { value: 0, allowed: false, reason: 'Kupon w pełni rozstrzygnięty' };
    }

    const value = parseFloat((stake * product * CASHOUT_MARGIN).toFixed(2));
    return { value, allowed, reason: null };
};

export const getCashoutValue = async (req, res) => {
    const userId = req.userId;
    const couponId = parseInt(req.params.id, 10);
    try {
        const coupon = await prisma.kupony.findUnique({
            where: { id: couponId },
            include: {
                kupon_pozycje: {
                    include: { kursy: { include: { mecze: true } } }
                }
            }
        });
        if (!coupon) return res.status(404).json({ error: 'Kupon nie istnieje' });
        if (coupon.uzytkownik_id !== userId) return res.status(403).json({ error: 'Brak dostępu' });
        if (coupon.status !== 'OCZEKUJACY') return res.json({ available: false, value: 0, reason: 'Kupon już rozliczony' });

        const { value, allowed, reason } = computeCashoutValue(coupon);
        res.json({ available: allowed && value > 0, value, reason });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd obliczania cashoutu' });
    }
};

export const cashoutCoupon = async (req, res) => {
    const userId = req.userId;
    const couponId = parseInt(req.params.id, 10);
    try {
        const result = await prisma.$transaction(async (tx) => {
            const coupon = await tx.kupony.findUnique({
                where: { id: couponId },
                include: {
                    kupon_pozycje: {
                        include: { kursy: { include: { mecze: true } } }
                    }
                }
            });
            if (!coupon) throw new Error('Kupon nie istnieje');
            if (coupon.uzytkownik_id !== userId) throw new Error('Brak dostępu');
            if (coupon.status !== 'OCZEKUJACY') throw new Error('Kupon już rozliczony');

            const { value, allowed, reason } = computeCashoutValue(coupon);
            if (!allowed || value <= 0) throw new Error(reason || 'Cashout niedostępny');

            // Wypłata: zwiększ saldo, oznacz kupon jako WYGRANY z faktyczną wartością wypłaty,
            // oznacz pozycje OCZEKUJACY jako ZWROT (żeby settlement już ich nie ruszał).
            await tx.kupony.update({
                where: { id: coupon.id },
                data: { status: 'WYGRANY', potencjalna_wygrana: value }
            });
            await tx.kupon_pozycje.updateMany({
                where: { kupon_id: coupon.id, status: 'OCZEKUJACY' },
                data: { status: 'ZWROT' }
            });
            await tx.uzytkownicy.update({
                where: { id: userId },
                data: { saldo: { increment: value } }
            });
            await tx.transakcje.create({
                data: {
                    uzytkownik_id: userId,
                    typ: 'WYGRANA',
                    kwota: value,
                    opis: `Cashout kuponu #${coupon.id}`
                }
            });

            return value;
        });

        res.json({ message: 'Cashout zrealizowany', value: result });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message || 'Błąd cashoutu' });
    }
};

export const getUserCoupons = async (req, res) => {
    const userId = req.userId;

    try {
        const coupons = await prisma.kupony.findMany({
            where: { uzytkownik_id: userId },
            orderBy: { data_utworzenia: 'desc' },
            include: {
                kupon_pozycje: {
                    include: {
                        kursy: {
                            include: {
                                mecze: {
                                    select: {
                                        nazwa_gospodarza: true,
                                        nazwa_goscia: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const formattedCoupons = coupons.map(c => {
            const { kupon_pozycje, ...couponData } = c;
            return {
                ...couponData,
                pozycje: kupon_pozycje
                    .filter(kp => kp.kursy && kp.kursy.mecze)  // filtruj osierocoone pozycje
                    .map(kp => ({
                        ...kp,
                        opis: kp.kursy.opis,
                        typ: kp.kursy.typ,
                        rodzaj: kp.kursy.rodzaj,
                        nazwa_gospodarza: kp.kursy.mecze.nazwa_gospodarza,
                        nazwa_goscia: kp.kursy.mecze.nazwa_goscia
                    }))
            };
        });

        res.json(formattedCoupons);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd pobierania kuponów' });
    }
};
