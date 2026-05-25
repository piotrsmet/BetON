import prisma from '../prisma.js';

export const getUsers = async (req, res) => {
    try {
        const users = await prisma.uzytkownicy.findMany();
        res.json(users);
    } catch (err) {
        console.error('Błąd podczas pobierania użytkowników:', err);
        res.status(500).send('Błąd serwera');
    }
};
