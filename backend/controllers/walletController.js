import db from '../db.js'

export const getTransactions = async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Nieozalogowany' });

    try {
        const [transactions] = await db.query('SELECT * FROM transakcje WHERE uzytkownik_id = ? ORDER BY data DESC', [userId]);
        res.json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd pobierania transakcji' });
    }
}

export const deposit = async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Nieozalogowany' });
    
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Nieprawidłowa kwota' });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        await connection.query('UPDATE uzytkownicy SET saldo = saldo + ? WHERE id = ?', [amount, userId]);
        await connection.query('INSERT INTO transakcje (uzytkownik_id, typ, kwota, opis) VALUES (?, ?, ?, ?)',
            [userId, 'WPLATA', amount, 'Wpłata środków']);
            
        await connection.commit();
        res.json({ message: 'Wpłata zakończona sukcesem' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Błąd wpłaty' });
    } finally {
        connection.release();
    }
}

export const withdraw = async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Nieozalogowany' });

    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Nieprawidłowa kwota' });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const [users] = await connection.query('SELECT saldo FROM uzytkownicy WHERE id = ? FOR UPDATE', [userId]);
        if (users[0].saldo < amount) {
            throw new Error('Niewystarczające środki');
        }

        await connection.query('UPDATE uzytkownicy SET saldo = saldo - ? WHERE id = ?', [amount, userId]);
        await connection.query('INSERT INTO transakcje (uzytkownik_id, typ, kwota, opis) VALUES (?, ?, ?, ?)',
            [userId, 'WYPLATA', amount, 'Wypłata środków']);
            
        await connection.commit();
        res.json({ message: 'Wypłata zakończona sukcesem' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(400).json({ error: err.message || 'Błąd wypłaty' });
    } finally {
        connection.release();
    }
}
