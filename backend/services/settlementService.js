import prisma from '../prisma.js';

export const updateMatchStatuses = async () => {
    console.log('Aktualizacja statusów meczów...');
    
    try {
        const now = new Date();

        await prisma.mecze.updateMany({
            where: {
                status: 'PLANOWANY',
                data_spotkania: { lte: now }
            },
            data: { status: 'TRWA' }
        });

        const ninetyOneMinutesAgo = new Date(now.getTime() - 99 * 60 * 1000);

        await prisma.mecze.updateMany({
            where: {
                status: { in: ['PLANOWANY', 'TRWA'] },
                data_spotkania: { lte: ninetyOneMinutesAgo }
            },
            data: { status: 'ZAKONCZONY' }
        });

        const finishedWithoutScore = await prisma.mecze.findMany({
            where: {
                status: 'ZAKONCZONY',
                OR: [
                    { wynik_gospodarz: null },
                    { wynik_gosc: null }
                ]
            },
            select: { id: true }
        });

        for (const match of finishedWithoutScore) {
            const scoreHome = Math.floor(Math.random() * 5); 
            const scoreAway = Math.floor(Math.random() * 5); 

            await prisma.mecze.update({
                where: { id: match.id },
                data: {
                    wynik_gospodarz: scoreHome,
                    wynik_gosc: scoreAway
                }
            });

            await prisma.kursy.updateMany({
                where: { mecz_id: match.id, status: 'AKTYWNY' },
                data: { status: 'ZABLOKOWANY' }
            });
        }
        
    } catch (err) {
        console.error('Błąd podczas aktualizacji statusów meczów:', err);
    }
};

export const settleCoupons = async () => {
    console.log('Rozliczanie kuponów...');
    
    try {
        const unresolvedMatches = await prisma.mecze.findMany({
            where: {
                status: 'ZAKONCZONY',
                wynik_gospodarz: { not: null },
                wynik_gosc: { not: null },
                kursy: {
                    some: { wynik: 'PENDING' }
                }
            },
            include: { kursy: true, statystyki_meczu: true }
        });

        await prisma.$transaction(async (tx) => {
            for (const match of unresolvedMatches) {
                const homeGoals = match.wynik_gospodarz;
                const awayGoals = match.wynik_gosc;
                const isHomeWin = homeGoals > awayGoals;
                const isAwayWin = awayGoals > homeGoals;
                const isDraw = homeGoals === awayGoals;
                const totalGoals = homeGoals + awayGoals;
                const bothScored = homeGoals > 0 && awayGoals > 0;

                const stats = match.statystyki_meczu?.[0] || null;
                const totalCorners = stats ? (stats.rozne_gospodarz ?? 0) + (stats.rozne_gosc ?? 0) : null;
                const totalCards = stats
                    ? (stats.zolte_kartki_gospodarz ?? 0) + (stats.zolte_kartki_gosc ?? 0)
                        + (stats.czerwone_kartki_gospodarz ?? 0) + (stats.czerwone_kartki_gosc ?? 0)
                    : null;

                for (const odd of match.kursy) {
                    let outcome = null; // 'WIN' | 'LOSS' | 'VOID' | null (skip)

                    if (odd.rodzaj === '1X2') {
                        if (odd.typ === '1') outcome = isHomeWin ? 'WIN' : 'LOSS';
                        else if (odd.typ === 'X') outcome = isDraw ? 'WIN' : 'LOSS';
                        else if (odd.typ === '2') outcome = isAwayWin ? 'WIN' : 'LOSS';
                    } else if (odd.rodzaj === 'OU_GOALS') {
                        const line = Number(odd.linia ?? 2.5);
                        if (totalGoals === line) outcome = 'VOID';
                        else if (odd.typ === 'OVER') outcome = totalGoals > line ? 'WIN' : 'LOSS';
                        else if (odd.typ === 'UNDER') outcome = totalGoals < line ? 'WIN' : 'LOSS';
                    } else if (odd.rodzaj === 'BTTS') {
                        if (odd.typ === 'YES') outcome = bothScored ? 'WIN' : 'LOSS';
                        else if (odd.typ === 'NO') outcome = !bothScored ? 'WIN' : 'LOSS';
                    } else if (odd.rodzaj === 'OU_CORNERS') {
                        if (totalCorners === null) continue;
                        const line = Number(odd.linia ?? 9.5);
                        if (totalCorners === line) outcome = 'VOID';
                        else if (odd.typ === 'OVER') outcome = totalCorners > line ? 'WIN' : 'LOSS';
                        else if (odd.typ === 'UNDER') outcome = totalCorners < line ? 'WIN' : 'LOSS';
                    } else if (odd.rodzaj === 'OU_CARDS') {
                        if (totalCards === null) continue;
                        const line = Number(odd.linia ?? 4.5);
                        if (totalCards === line) outcome = 'VOID';
                        else if (odd.typ === 'OVER') outcome = totalCards > line ? 'WIN' : 'LOSS';
                        else if (odd.typ === 'UNDER') outcome = totalCards < line ? 'WIN' : 'LOSS';
                    }

                    if (outcome) {
                        await tx.kursy.update({
                            where: { id: odd.id },
                            data: { status: 'ROZTRZYGNIETY', wynik: outcome }
                        });
                    }
                }
            }
        });

        await prisma.$transaction(async (tx) => {
            const pendingCouponItems = await tx.kupon_pozycje.findMany({
                where: { status: 'OCZEKUJACY' },
                include: { kursy: true }
            });

            for (const item of pendingCouponItems) {
                if (item.kursy.wynik === 'WIN') {
                    await tx.kupon_pozycje.update({
                        where: { id: item.id },
                        data: { status: 'WYGRANY' }
                    });
                } else if (item.kursy.wynik === 'LOSS') {
                    await tx.kupon_pozycje.update({
                        where: { id: item.id },
                        data: { status: 'PRZEGRANY' }
                    });
                } else if (item.kursy.wynik === 'VOID') {
                    // Pozycja zwrócona - kurs traktowany jako 1.00 przy rozliczeniu
                    await tx.kupon_pozycje.update({
                        where: { id: item.id },
                        data: { status: 'ZWROT' }
                    });
                }
            }
        });

        await prisma.$transaction(async (tx) => {
            const pendingCoupons = await tx.kupony.findMany({
                where: { status: 'OCZEKUJACY' },
                include: { kupon_pozycje: true }
            });

            for (const coupon of pendingCoupons) {
                const items = coupon.kupon_pozycje;
                const anyPending = items.some(i => i.status === 'OCZEKUJACY');
                const anyLost = items.some(i => i.status === 'PRZEGRANY');

                if (anyLost) {
                    await tx.kupony.update({
                        where: { id: coupon.id },
                        data: { status: 'PRZEGRANY' }
                    });
                } else if (!anyPending) {
                    const allSettled = items.every(i => i.status === 'WYGRANY' || i.status === 'ZWROT');
                    if (allSettled) {
                        // Przelicz kurs z uwzględnieniem zwrotów (VOID liczone jako 1.0)
                        const effectiveOdds = items.reduce((acc, i) => {
                            if (i.status === 'WYGRANY') return acc * Number(i.kurs_w_momencie);
                            return acc; // ZWROT -> mnożnik 1.0
                        }, 1);
                        const payout = Number((Number(coupon.stawka) * effectiveOdds).toFixed(2));

                        await tx.kupony.update({
                            where: { id: coupon.id },
                            data: {
                                status: 'WYGRANY',
                                potencjalna_wygrana: payout
                            }
                        });

                        await tx.uzytkownicy.update({
                            where: { id: coupon.uzytkownik_id },
                            data: { saldo: { increment: payout } }
                        });

                        await tx.transakcje.create({
                            data: {
                                uzytkownik_id: coupon.uzytkownik_id,
                                typ: 'WYGRANA',
                                kwota: payout,
                                opis: `Wygrana z kuponu #${coupon.id}`
                            }
                        });
                    }
                }
            }
        });
        
    } catch (err) {
        console.error('Błąd podczas rozliczania kuponów:', err);
    }
};
