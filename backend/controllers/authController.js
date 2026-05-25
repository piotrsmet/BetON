import bcrypt from 'bcrypt';
import prisma from '../prisma.js';

export const register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const usernameCheck = await prisma.uzytkownicy.findFirst({
            where: { nazwa: username }
        });

        if (usernameCheck) {
            return res.status(400).json({ error: 'Nazwa użytkownika jest już zajęta' });
        }

        const emailCheck = await prisma.uzytkownicy.findFirst({
            where: { email: email }
        });

        if (emailCheck) {
            return res.status(400).json({ error: 'Email jest już zarejestrowany' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = await prisma.uzytkownicy.create({
            data: {
                nazwa: username,
                email: email,
                haslo: hashedPassword
            }
        });

        res.status(201).json({
            message: 'Użytkownik został zarejestrowany pomyślnie',
            userId: newUser.id,
        });
    } catch (err) {
        console.error('Błąd podczas rejestracji:', err);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

export const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.uzytkownicy.findFirst({
            where: { nazwa: username }
        });

        if (!user) {
            return res.status(400).json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło' });
        }

        const passwordMatch = await bcrypt.compare(password, user.haslo);

        if (!passwordMatch) {
            return res.status(400).json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło' });
        }

        req.session.userId = user.id;
        req.session.username = user.nazwa;

        res.status(200).json({
            message: 'Zalogowano pomyślnie',
            userId: user.id,
            username: user.nazwa,
            balance: user.saldo,
        });
    } catch (err) {
        console.error('Błąd podczas logowania:', err);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

export const checkSession = async (req, res) => {
    if (req.session.userId) {
        try {
            const user = await prisma.uzytkownicy.findUnique({
                where: { id: req.session.userId },
                select: { id: true, nazwa: true, saldo: true }
            });

            if (user) {
                res.json({
                    isLoggedIn: true,
                    userId: user.id,
                    username: user.nazwa,
                    balance: user.saldo,
                });
            } else {
                req.session.destroy();
                res.json({ isLoggedIn: false });
            }
        } catch (err) {
            console.error('Błąd podczas sprawdzania sesji:', err);
            res.status(500).json({ error: 'Błąd serwera' });
        }
    } else {
        res.json({ isLoggedIn: false });
    }
};

export const logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Błąd podczas wylogowania' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Wylogowano pomyślnie' });
    });
};
