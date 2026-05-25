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
            include: { kursy: true }
        });

        await prisma.$transaction(async (tx) => {
            for (const match of unresolvedMatches) {
                const isHomeWin = match.wynik_gospodarz > match.wynik_gosc;
                const isAwayWin = match.wynik_gosc > match.wynik_gospodarz;
                const isDraw = match.wynik_gospodarz === match.wynik_gosc;

                for (const odd of match.kursy) {
                    if (odd.typ === '1') {
                        await tx.kursy.update({
                            where: { id: odd.id },
                            data: {
                                status: 'ROZTRZYGNIETY',
                                wynik: isHomeWin ? 'WIN' : 'LOSS'
                            }
                        });
                    } else if (odd.typ === 'X') {
                        await tx.kursy.update({
                            where: { id: odd.id },
                            data: {
                                status: 'ROZTRZYGNIETY',
                                wynik: isDraw ? 'WIN' : 'LOSS'
                            }
                        });
                    } else if (odd.typ === '2') {
                        await tx.kursy.update({
                            where: { id: odd.id },
                            data: {
                                status: 'ROZTRZYGNIETY',
                                wynik: isAwayWin ? 'WIN' : 'LOSS'
                            }
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
                    const allWon = items.every(i => i.status === 'WYGRANY');
                    if (allWon) {
                        await tx.kupony.update({
                            where: { id: coupon.id },
                            data: { status: 'WYGRANY' }
                        });
                        
                        await tx.uzytkownicy.update({
                            where: { id: coupon.uzytkownik_id },
                            data: { saldo: { increment: coupon.potencjalna_wygrana } }
                        });
                        
                        await tx.transakcje.create({
                            data: {
                                uzytkownik_id: coupon.uzytkownik_id,
                                typ: 'WYGRANA',
                                kwota: coupon.potencjalna_wygrana,
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
