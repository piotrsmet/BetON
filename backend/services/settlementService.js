
import db from '../db.js';

export const updateMatchStatuses = async () => {
    console.log('Aktualizacja statusów meczów...');
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const now = new Date();

        // 1. Zmień status na TRWA dla meczów, które się zaczęły
        // Szukamy meczów PLANOWANYCH, których data_spotkania już minęła
        await connection.query(`
            UPDATE mecze 
            SET status = 'TRWA'
            WHERE status = 'PLANOWANY' 
            AND data_spotkania <= ?
        `, [now]);

        // 2. Zmień status na ZAKONCZONY dla meczów, które trwają ponad 91 minut
        // Szukamy meczów TRWA (lub PLANOWANY jeśli skrypt nie chodził), 
        // gdzie data_spotkania + 91 minut < teraz
        // 91 minut = 91 * 60 * 1000 milisekund
        
        // Obliczamy timestamp graniczny: mecze starsze niż ta data powinny być zakończone
        // match_date < now - 91 min
        const ninetyOneMinutesAgo = new Date(now.getTime() - 91 * 60 * 1000);

        await connection.query(`
            UPDATE mecze 
            SET status = 'ZAKONCZONY'
            WHERE status IN ('PLANOWANY', 'TRWA') 
            AND data_spotkania <= ?
        `, [ninetyOneMinutesAgo]);
        
        // Logika symulacji wyniku dla meczów, które się zakończyły, ale nie mają wyniku
        // (Jeśli import API nie działa i chcemy symulować wyniki)
        const [finishedWithoutScore] = await connection.query(`
            SELECT id FROM mecze 
            WHERE status = 'ZAKONCZONY' 
            AND (wynik_gospodarz IS NULL OR wynik_gosc IS NULL)
        `);

        for (const match of finishedWithoutScore) {
            // Generuj losowy wynik, jeśli go nie ma (zabezpieczenie)
            const scoreHome = Math.floor(Math.random() * 5); // 0-4
            const scoreAway = Math.floor(Math.random() * 5); // 0-4
            
            await connection.query(`
                UPDATE mecze 
                SET wynik_gospodarz = ?, wynik_gosc = ?
                WHERE id = ?
            `, [scoreHome, scoreAway, match.id]);
            
            console.log(`Wygenerowano losowy wynik dla meczu ${match.id}: ${scoreHome}:${scoreAway}`);
        }

        await connection.commit();
        console.log('Zaktualizowano statusy meczów.');
    } catch (err) {
        await connection.rollback();
        console.error('Błąd podczas aktualizacji statusów:', err);
    } finally {
        connection.release();
    }
};

export const settleMatches = async () => {
    console.log('Rozpoczynanie rozliczania meczów...');
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Pobierz zakończone mecze, które mają nierozliczone kursy
        const [finishedMatches] = await connection.query(`
            SELECT id, wynik_gospodarz, wynik_gosc 
            FROM mecze 
            WHERE status = 'ZAKONCZONY'
        `);

        for (const match of finishedMatches) {
            if (match.wynik_gospodarz === null || match.wynik_gosc === null) continue;

            const scoreHome = match.wynik_gospodarz;
            const scoreAway = match.wynik_gosc;

            // Rozstrzygnięcie 1X2
            let winningType1X2 = '';
            if (scoreHome > scoreAway) winningType1X2 = '1';
            else if (scoreHome === scoreAway) winningType1X2 = 'X';
            else winningType1X2 = '2';

            // Zaktualizuj kursy dla tego meczu
            // 1X2
            await connection.query(`
                UPDATE kursy 
                SET wynik = CASE 
                    WHEN typ = ? THEN 'WIN' 
                    ELSE 'LOSS' 
                END,
                status = 'ROZTRZYGNIETY'
                WHERE mecz_id = ? AND rodzaj = '1X2' AND status != 'ROZTRZYGNIETY'
            `, [winningType1X2, match.id]);

            // Tutaj można dodać logikę dla innych rodzajów zakładów (np. OVER/UNDER)
        }

        await connection.commit();
        console.log(`Rozliczono mecze: ${finishedMatches.length}`);
    } catch (err) {
        await connection.rollback();
        console.error('Błąd podczas rozliczania meczów:', err);
    } finally {
        connection.release();
    }
};

export const settleCoupons = async () => {
    console.log('Rozpoczynanie rozliczania kuponów...');
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Zaktualizuj statusy pozycji kuponów na podstawie rozstrzygniętych kursów
        await connection.query(`
            UPDATE kupon_pozycje kp
            JOIN kursy k ON kp.kurs_id = k.id
            SET kp.status = CASE 
                WHEN k.wynik = 'WIN' THEN 'WYGRANY'
                WHEN k.wynik = 'LOSS' THEN 'PRZEGRANY'
                WHEN k.wynik = 'VOID' THEN 'ZWROT'
                ELSE kp.status
            END
            WHERE kp.status = 'OCZEKUJACY' AND k.status = 'ROZTRZYGNIETY'
        `);

        // 2. Znajdź kupony, które są wciąż OCZEKUJACY, ale mogą zostać zamknięte
        const [pendingCoupons] = await connection.query(`
            SELECT id, uzytkownik_id, potencjalna_wygrana, stawka 
            FROM kupony 
            WHERE status = 'OCZEKUJACY'
        `);

        for (const coupon of pendingCoupons) {
            // Sprawdź pozycje kuponu
            const [positions] = await connection.query(`
                SELECT status FROM kupon_pozycje WHERE kupon_id = ?
            `, [coupon.id]);

            const allPositions = positions.length;
            const wonPositions = positions.filter(p => p.status === 'WYGRANY').length;
            const lostPositions = positions.filter(p => p.status === 'PRZEGRANY').length;
            const pendingPositions = positions.filter(p => p.status === 'OCZEKUJACY').length;

            if (lostPositions > 0) {
                // Kupon przegrany
                await connection.query('UPDATE kupony SET status = "PRZEGRANY" WHERE id = ?', [coupon.id]);
                console.log(`Kupon ${coupon.id} oznaczony jako PRZEGRANY.`);
            } else if (pendingPositions === 0 && wonPositions === allPositions) {
                // Kupon wygrany
                await connection.query('UPDATE kupony SET status = "WYGRANY" WHERE id = ?', [coupon.id]);
                
                // Wypłata wygranej
                await connection.query('UPDATE uzytkownicy SET saldo = saldo + ? WHERE id = ?', [coupon.potencjalna_wygrana, coupon.uzytkownik_id]);
                
                // Rejestracja transakcji
                await connection.query(`
                    INSERT INTO transakcje (uzytkownik_id, typ, kwota, opis) 
                    VALUES (?, 'WYGRANA', ?, ?)
                `, [coupon.uzytkownik_id, coupon.potencjalna_wygrana, `Wygrana z kuponu #${coupon.id}`]);

                console.log(`Kupon ${coupon.id} oznaczony jako WYGRANY. Wypłacono ${coupon.potencjalna_wygrana}.`);
            }
            // Jeśli są pending, czekamy
        }

        await connection.commit();
        console.log('Rozliczanie kuponów zakończone.');
    } catch (err) {
        await connection.rollback();
        console.error('Błąd podczas rozliczania kuponów:', err);
    } finally {
        connection.release();
    }
};
