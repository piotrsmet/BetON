import db from '../db.js'

export const createCoupon = async (req, res) => {
    // Expecting req.body: { stawka: number, kursy: [id1, id2, ...] }
    // Assuming req.session.userId is set after login
    // If not using session, check how auth is handled. For now assuming session.
    
    // Fallback if userId not in session (dev mode or separate auth middleware needed)
    const userId = req.session?.userId; 
    
    if (!userId) {
        return res.status(401).json({ error: 'Nieozalogowany' });
    }

    const { stawka, kursy } = req.body;

    if (!stawka || stawka <= 0 || !kursy || kursy.length === 0) {
        return res.status(400).json({ error: 'Nieprawidłowe dane kuponu' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Check User Balance
        const [users] = await connection.query('SELECT saldo FROM uzytkownicy WHERE id = ? FOR UPDATE', [userId]);
        if (users.length === 0) {
            throw new Error('Użytkownik nie istnieje');
        }
        const user = users[0];
        if (parseFloat(user.saldo) < parseFloat(stawka)) {
            throw new Error('Niewystarczające środki');
        }

        // 2. Validate Odds and Calculate Total Odds
        let totalOdds = 1.0;
        const validKursy = [];

        for (const kursId of kursy) {
            const [oddsData] = await connection.query('SELECT * FROM kursy WHERE id = ?', [kursId]);
            if (oddsData.length === 0) {
                throw new Error(`Kurs o ID ${kursId} nie istnieje`);
            }
            const odd = oddsData[0];
            if (odd.status !== 'AKTYWNY') {
                throw new Error(`Kurs ${odd.opis} jest nieaktywny`);
            }
            totalOdds *= parseFloat(odd.kurs);
            validKursy.push(odd);
        }

        totalOdds = parseFloat(totalOdds.toFixed(2));
        const potentialWin = parseFloat((stawka * totalOdds * 0.88).toFixed(2)); // Taxes? Maybe just raw for now or standard 0.88 factor? keeping logic simple or as required. 
        // Let's assume standard win = stake * odds. If tax needed, user can request.
        // Reverting to simple calculation:
        const simplePotentialWin = parseFloat((stawka * totalOdds).toFixed(2));

        // 3. Deduct Balance
        await connection.query('UPDATE uzytkownicy SET saldo = saldo - ? WHERE id = ?', [stawka, userId]);
        
        // 4. Create Transaction Record (optional per schema, usually good practice)
        await connection.query('INSERT INTO transakcje (uzytkownik_id, typ, kwota, opis) VALUES (?, ?, ?, ?)', 
            [userId, 'STAWKA', stawka, `Postawienie kuponu`]);

        // 5. Create Coupon
        const [couponResult] = await connection.query(
            'INSERT INTO kupony (uzytkownik_id, stawka, kurs_calkowity, potencjalna_wygrana, status) VALUES (?, ?, ?, ?, ?)',
            [userId, stawka, totalOdds, simplePotentialWin, 'OCZEKUJACY']
        );
        const couponId = couponResult.insertId;

        // 6. Create Coupon Items
        for (const odd of validKursy) {
            await connection.query(
                'INSERT INTO kupon_pozycje (kupon_id, kurs_id, kurs_w_momencie) VALUES (?, ?, ?)',
                [couponId, odd.id, odd.kurs]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Kupon postawiony', kuponId: couponId });

    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(400).json({ error: err.message || 'Błąd tworzenia kuponu' });
    } finally {
        connection.release();
    }
}

export const getUserCoupons = async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Nieozalogowany' });

    try {
        // Get coupons
        const [coupons] = await db.query('SELECT * FROM kupony WHERE uzytkownik_id = ? ORDER BY data_utworzenia DESC', [userId]);
        
        // For each coupon, get items (this can be optimized with JOIN but N+1 is okay for small scale)
        const couponsWithItems = await Promise.all(coupons.map(async (coupon) => {
            const [items] = await db.query(
                `SELECT kp.*, k.opis, k.typ, k.rodzaj, m.nazwa_gospodarza, m.nazwa_goscia 
                 FROM kupon_pozycje kp 
                 JOIN kursy k ON kp.kurs_id = k.id 
                 JOIN mecze m ON k.mecz_id = m.id
                 WHERE kp.kupon_id = ?`, 
                [coupon.id]
            );
            return { ...coupon, pozycje: items };
        }));

        res.json(couponsWithItems);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd pobierania kuponów' });
    }
}
