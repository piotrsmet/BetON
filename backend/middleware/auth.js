import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '3965b85c97c626ea8a56cf12e551fc9d258bfc1537f5c5e17d6aa9cc905b2109';
const JWT_EXPIRES_IN = '7d';

export const generateToken = (user) => {
    return jwt.sign(
        { userId: user.id, username: user.nazwa },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Brak tokenu autoryzacji' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token wygasł' });
        }
        return res.status(401).json({ error: 'Nieprawidłowy token' });
    }
};

export { JWT_SECRET };
