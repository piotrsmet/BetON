import db from '../db.js'

export const getMatches = async (req, res) => {
    try {
        const { liga, status, dateFrom, dateTo } = req.query;
        let query = 'SELECT * FROM mecze WHERE 1=1';
        const params = [];

        if (liga) {
            query += ' AND liga = ?';
            params.push(liga);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        if (dateFrom) {
            query += ' AND data_spotkania >= ?';
            params.push(dateFrom);
        }
        if (dateTo) {
            query += ' AND data_spotkania <= ?';
            params.push(dateTo);
        }

        query += ' ORDER BY data_spotkania ASC';

        const [matches] = await db.query(query, params);
        
        // Attach odds to each match
        const matchesWithOdds = await Promise.all(matches.map(async (m) => {
            const [odds] = await db.query('SELECT * FROM kursy WHERE mecz_id = ? AND rodzaj = "1X2"', [m.id]);
            // Find 1, X, 2 specific odds
            const oddsMap = {
                home: odds.find(o => o.typ === '1')?.kurs || null,
                draw: odds.find(o => o.typ === 'X')?.kurs || null,
                away: odds.find(o => o.typ === '2')?.kurs || null,
                ids: {
                    home: odds.find(o => o.typ === '1')?.id,
                    draw: odds.find(o => o.typ === 'X')?.id,
                    away: odds.find(o => o.typ === '2')?.id
                }
            };
            return { ...m, odds: oddsMap };
        }));

        res.json(matchesWithOdds);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd pobierania meczów' });
    }
}

export const getMatchDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [matches] = await db.query('SELECT * FROM mecze WHERE id = ?', [id]);
        if (matches.length === 0) {
            return res.status(404).json({ error: 'Mecz nie znaleziony' });
        }
        const match = matches[0];

        const [stats] = await db.query('SELECT * FROM statystyki_meczu WHERE mecz_id = ?', [id]);
        const [timeline] = await db.query('SELECT * FROM przebieg_meczu WHERE mecz_id = ? ORDER BY minuta ASC', [id]);
        const [odds] = await db.query('SELECT * FROM kursy WHERE mecz_id = ?', [id]);

        res.json({
            ...match,
            statystyki: stats[0] || null,
            przebieg: timeline,
            kursy: odds
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd pobierania szczegółów meczu' });
    }
}

// Admin / System endpoints
export const createMatch = async (req, res) => {
    try {
        const { mid, nazwa_gospodarza, nazwa_goscia, data_spotkania, liga, logo_gospodarza, logo_goscia } = req.body;
        // Simple validation
        if (!nazwa_gospodarza || !nazwa_goscia || !data_spotkania) {
            return res.status(400).json({ error: 'Brak wymaganych danych' });
        }
        
        const [result] = await db.query(
            'INSERT INTO mecze (mid, nazwa_gospodarza, nazwa_goscia, data_spotkania, liga, logo_gospodarza, logo_goscia) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [mid, nazwa_gospodarza, nazwa_goscia, data_spotkania, liga, logo_gospodarza, logo_goscia]
        );
        
        res.status(201).json({ id: result.insertId, message: 'Mecz utworzony' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd tworzenia meczu' });
    }
}

export const updateMatchStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, wynik_gospodarz, wynik_gosc } = req.body;
        
        await db.query(
            'UPDATE mecze SET status = ?, wynik_gospodarz = ?, wynik_gosc = ? WHERE id = ?',
            [status, wynik_gospodarz, wynik_gosc, id]
        );
        
        res.json({ message: 'Status meczu zaktualizowany' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd aktualizacji statusu' });
    }
}

export const updateMatchStats = async (req, res) => {
    try {
        const { id } = req.params; // mecz_id
        const stats = req.body; // object with stats keys
        
        // Upsert stats
        const [existing] = await db.query('SELECT id FROM statystyki_meczu WHERE mecz_id = ?', [id]);
        
        if (existing.length > 0) {
           await db.query(
               `UPDATE statystyki_meczu SET 
               gole_gospodarz = ?, gole_gosc = ?, 
               rozne_gospodarz = ?, rozne_gosc = ?, 
               faule_gospodarz = ?, faule_gosc = ?, 
               zolte_kartki_gospodarz = ?, zolte_kartki_gosc = ?, 
               czerwone_kartki_gospodarz = ?, czerwone_kartki_gosc = ?, 
               strzaly_gospodarz = ?, strzaly_gosc = ?, 
               strzaly_celne_gospodarz = ?, strzaly_celne_gosc = ? 
               WHERE mecz_id = ?`,
               [
                   stats.gole_gospodarz, stats.gole_gosc,
                   stats.rozne_gospodarz, stats.rozne_gosc,
                   stats.faule_gospodarz, stats.faule_gosc,
                   stats.zolte_kartki_gospodarz, stats.zolte_kartki_gosc,
                   stats.czerwone_kartki_gospodarz, stats.czerwone_kartki_gosc,
                   stats.strzaly_gospodarz, stats.strzaly_gosc,
                   stats.strzaly_celne_gospodarz, stats.strzaly_celne_gosc,
                   id
               ]
           ); 
        } else {
            await db.query(
               `INSERT INTO statystyki_meczu 
               (mecz_id, gole_gospodarz, gole_gosc, rozne_gospodarz, rozne_gosc, faule_gospodarz, faule_gosc, 
               zolte_kartki_gospodarz, zolte_kartki_gosc, czerwone_kartki_gospodarz, czerwone_kartki_gosc, 
               strzaly_gospodarz, strzaly_gosc, strzaly_celne_gospodarz, strzaly_celne_gosc)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
               [
                   id,
                   stats.gole_gospodarz, stats.gole_gosc,
                   stats.rozne_gospodarz, stats.rozne_gosc,
                   stats.faule_gospodarz, stats.faule_gosc,
                   stats.zolte_kartki_gospodarz, stats.zolte_kartki_gosc,
                   stats.czerwone_kartki_gospodarz, stats.czerwone_kartki_gosc,
                   stats.strzaly_gospodarz, stats.strzaly_gosc,
                   stats.strzaly_celne_gospodarz, stats.strzaly_celne_gosc
               ]
           );
        }
        res.json({ message: 'Statystyki zaktualizowane' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd aktualizacji statystyk' });
    }
}

export const addTimelineEvent = async (req, res) => {
    try {
        const { id } = req.params; // mecz_id
        const { minuta, wynik, posiadanie, komentarz, rozne_gospodarz, rozne_gosc, faule_gospodarz, faule_gosc } = req.body;
        
        await db.query(
            `INSERT INTO przebieg_meczu (mecz_id, minuta, wynik, posiadanie, komentarz, rozne_gospodarz, rozne_gosc, faule_gospodarz, faule_gosc)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, minuta, wynik, posiadanie, komentarz, rozne_gospodarz, rozne_gosc, faule_gospodarz, faule_gosc]
        );
        res.status(201).json({ message: 'Zdarzenie dodane' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd dodawania zdarzenia' });
    }
}
