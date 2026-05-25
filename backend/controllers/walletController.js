import prisma from '../prisma.js';

export const getTransactions = async (req, res) => {
    const userId = req.userId;

    try {
        const transactions = await prisma.transakcje.findMany({
            where: { uzytkownik_id: userId },
            orderBy: { data: 'desc' }
        });
        res.json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd pobierania transakcji' });
    }
};

export const deposit = async (req, res) => {
    const userId = req.userId;
    
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Nieprawidłowa kwota' });

    try {
        await prisma.$transaction(async (tx) => {
            await tx.uzytkownicy.update({
                where: { id: userId },
                data: { saldo: { increment: amount } }
            });
            await tx.transakcje.create({
                data: {
                    uzytkownik_id: userId,
                    typ: 'WPLATA',
                    kwota: amount,
                    opis: 'Wpłata środków'
                }
            });
        });
            
        res.json({ message: 'Wpłata zakończona sukcesem' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd wpłaty' });
    }
};

export const withdraw = async (req, res) => {
    const userId = req.userId;

    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Nieprawidłowa kwota' });

    try {
        await prisma.$transaction(async (tx) => {
            const user = await tx.uzytkownicy.findUnique({
                where: { id: userId },
                select: { saldo: true }
            });
            
            if (!user || user.saldo < amount) {
                throw new Error('Niewystarczające środki');
            }

            await tx.uzytkownicy.update({
                where: { id: userId },
                data: { saldo: { decrement: amount } }
            });

            await tx.transakcje.create({
                data: {
                    uzytkownik_id: userId,
                    typ: 'WYPLATA',
                    kwota: amount,
                    opis: 'Wypłata środków'
                }
            });
        });
            
        res.json({ message: 'Wypłata zakończona sukcesem' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message || 'Błąd wypłaty' });
    }
};
