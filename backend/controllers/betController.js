import prisma from '../prisma.js';

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

            let totalOdds = 1.0;
            const validKursy = [];

            for (const kursId of kursy) {
                const odd = await tx.kursy.findUnique({ where: { id: kursId } });
                if (!odd) throw new Error(`Kurs o ID ${kursId} nie istnieje`);
                if (odd.status !== 'AKTYWNY') throw new Error(`Kurs ${odd.opis} jest nieaktywny`);
                totalOdds *= Number(odd.kurs);
                validKursy.push(odd);
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

            const coupon = await tx.kupony.create({
                data: {
                    uzytkownik_id: userId,
                    stawka: stawka,
                    kurs_calkowity: totalOdds,
                    potencjalna_wygrana: simplePotentialWin,
                    status: 'OCZEKUJACY',
                    kupon_pozycje: {
                        create: validKursy.map(odd => ({
                            kurs_id: odd.id,
                            kurs_w_momencie: odd.kurs
                        }))
                    }
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
