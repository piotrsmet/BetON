import bcrypt from 'bcrypt';
import prisma from '../prisma.js';
import { generateToken } from '../middleware/auth.js';

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

        const token = generateToken(newUser);

        res.status(201).json({
            message: 'Użytkownik został zarejestrowany pomyślnie',
            userId: newUser.id,
            token,
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

        const token = generateToken(user);

        res.status(200).json({
            message: 'Zalogowano pomyślnie',
            userId: user.id,
            username: user.nazwa,
            balance: user.saldo,
            token,
        });
    } catch (err) {
        console.error('Błąd podczas logowania:', err);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

export const checkSession = async (req, res) => {
    // Z JWT: jeśli middleware przepuścił request, to user jest zalogowany
    // Ale check-session jest publiczny, więc sprawdzamy token ręcznie
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({ isLoggedIn: false });
    }

    try {
        const jwt = await import('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'beton-super-secret-key-zmien-na-produkcji';
        const decoded = jwt.default.verify(authHeader.split(' ')[1], JWT_SECRET);

        const user = await prisma.uzytkownicy.findUnique({
            where: { id: decoded.userId },
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
            res.json({ isLoggedIn: false });
        }
    } catch (err) {
        res.json({ isLoggedIn: false });
    }
};

export const logout = (req, res) => {
    // Z JWT logout odbywa się po stronie klienta (usunięcie tokenu)
    res.json({ message: 'Wylogowano pomyślnie' });
};
