import axios from 'axios';
import db from '../db.js';

// URL do API AI - do skonfigurowania
const AI_API_URL = 'http://localhost:5000/api/export/matchday'; // Placeholder

export const clearMatchData = async () => {
    console.log('Czyszczenie danych meczowych...');
    const connection = await db.getConnection();
    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE przebieg_meczu');
        await connection.query('TRUNCATE TABLE statystyki_meczu');
        await connection.query('TRUNCATE TABLE kursy'); // Również czyścimy kursy, aby uniknąć sierot
        await connection.query('TRUNCATE TABLE mecze');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Dane wyczyszczone.');
    } catch (err) {
        console.error('Błąd podczas czyszczenia danych:', err);
        // Przywróć sprawdzanie kluczy w razie błędu
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    } finally {
        connection.release();
    }
}

export const importDailyMatches = async () => {
    console.log('Rozpoczynanie importu meczów z API AI...');
    try {
        // 1. Pobierz dane (API wymaga POST)
        const response = await axios.post(AI_API_URL, {}); 
        const data = response.data; 

        // API zwraca { matches: [...] }
        const matches = Array.isArray(data) ? data : (data.matches || []);
        
        if (matches.length === 0) {
            console.log('Brak meczów do zaimportowania.');
            return;
        }

        const connection = await db.getConnection();
        
        // Data generacji matchday jako domyślna data meczu
        const defaultDate = data.date ? new Date(data.date) : new Date();

        try {
            await connection.beginTransaction();

            for (const matchData of matches) {
                // Mapowanie pól z Python API
                const homeName = matchData.home_team || matchData.teams?.home || matchData.nazwa_gospodarza;
                const awayName = matchData.away_team || matchData.teams?.away || matchData.nazwa_goscia;
                
                // Data meczu: z API lub domyślnie "za 5 minut"
                let matchDate;
                if (matchData.date || matchData.data_spotkania) {
                    matchDate = new Date(matchData.date || matchData.data_spotkania);
                } else {
                    matchDate = new Date(Date.now() + 5 * 60 * 1000);
                }
                
                // Status meczu
                let status = 'PLANOWANY';
                if (matchData.status) {
                    // Mapowanie statusów
                    if (matchData.status === 'FINISHED' || matchData.status === 'FT') status = 'ZAKONCZONY';
                    else if (matchData.status === 'LIVE' || matchData.status === 'IN_PLAY') status = 'TRWA';
                    else status = matchData.status; // Zostaw jak jest
                }
                
                const league = matchData.league || 'Premier League'; // Domyślnie PL bo to symulator PL
                
                // API nie zwraca ID meczu, więc mid może być pusty.
                // Używamy nazwy drużyn i daty do znalezienia duplikatu.
                
                // Sprawdź czy mecz już istnieje (po nazwach i dacie - zakres dnia)
                const dateStr = matchDate.toISOString().split('T')[0]; // YYYY-MM-DD
                
                const [existing] = await connection.query(
                    `SELECT id FROM mecze 
                     WHERE nazwa_gospodarza = ? 
                     AND nazwa_goscia = ? 
                     AND DATE(data_spotkania) = ?`, 
                    [homeName, awayName, dateStr]
                );
                
                let matchId;
                const scoreHome = matchData.stats?.home_goals ?? matchData.stats?.goals?.home ?? null;
                const scoreAway = matchData.stats?.away_goals ?? matchData.stats?.goals?.away ?? null;

                if (existing.length > 0) {
                    // Aktualizacja
                     matchId = existing[0].id;
                     console.log(`Aktualizacja meczu: ${homeName} vs ${awayName} (ID: ${matchId})`);
                     
                     await connection.query(
                         'UPDATE mecze SET wynik_gospodarz = ?, wynik_gosc = ?, status = ? WHERE id = ?',
                         [
                             scoreHome, 
                             scoreAway, 
                             status,
                             matchId
                         ]
                     );
                } else {
                    // Wstawienie
                    console.log(`Dodawanie nowego meczu: ${homeName} vs ${awayName}`);
                    const [res] = await connection.query(
                        'INSERT INTO mecze (mid, nazwa_gospodarza, nazwa_goscia, data_spotkania, liga, status, wynik_gospodarz, wynik_gosc) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        [
                            null, // brak zewnętrznego ID
                            homeName, 
                            awayName, 
                            matchDate, 
                            league, 
                            status,
                            scoreHome,
                            scoreAway
                        ]
                    );
                    matchId = res.insertId;
                }

                // Import Statystyk
                const stats = matchData.stats || matchData.statystyki;
                if (stats) {
                    await connection.query('DELETE FROM statystyki_meczu WHERE mecz_id = ?', [matchId]);
                    
                    await connection.query(
                        `INSERT INTO statystyki_meczu 
                        (mecz_id, gole_gospodarz, gole_gosc, rozne_gospodarz, rozne_gosc, faule_gospodarz, faule_gosc, 
                        zolte_kartki_gospodarz, zolte_kartki_gosc, czerwone_kartki_gospodarz, czerwone_kartki_gosc, 
                        strzaly_gospodarz, strzaly_gosc, strzaly_celne_gospodarz, strzaly_celne_gosc)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            matchId,
                            stats.home_goals ?? 0, stats.away_goals ?? 0,
                            stats.home_corners ?? 0, stats.away_corners ?? 0,
                            stats.home_fouls ?? 0, stats.away_fouls ?? 0,
                            stats.home_yellow_cards ?? 0, stats.away_yellow_cards ?? 0,
                            stats.home_red_cards ?? 0, stats.away_red_cards ?? 0,
                            stats.home_shots ?? 0, stats.away_shots ?? 0,
                            stats.home_shots_on_target ?? 0, stats.away_shots_on_target ?? 0
                        ]
                    );
                }

                // Import Przebiegu (Timeline)
                const timeline = matchData.minutes || matchData.przebieg || matchData.timeline;
                if (timeline) {
                    await connection.query('DELETE FROM przebieg_meczu WHERE mecz_id = ?', [matchId]);

                    for (const event of timeline) {
                        await connection.query(
                            `INSERT INTO przebieg_meczu (mecz_id, minuta, wynik, posiadanie, komentarz, rozne_gospodarz, rozne_gosc, faule_gospodarz, faule_gosc)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                matchId,
                                event.minute,
                                event.score,
                                event.possession,
                                event.comment,
                                event.home_corners ?? 0,
                                event.away_corners ?? 0,
                                event.home_fouls ?? 0,
                                event.away_fouls ?? 0
                            ]
                        );
                    }
                }
                // Import Kursów - jeśli są dostarczane z API lub generujemy mockowe
                const odds = matchData.kursy || matchData.odds || [];
                
                // MOCK: Jeśli brak kursów, generujemy losowe dla 1X2
                if (odds.length === 0) {
                     const k1 = (Math.random() * 1.5 + 1.5).toFixed(2); // 1.50 - 3.00
                     const kx = (Math.random() * 1.0 + 3.0).toFixed(2); // 3.00 - 4.00
                     const k2 = (Math.random() * 2.0 + 1.8).toFixed(2); // 1.80 - 3.80
                     
                     odds.push({ rodzaj: '1X2', typ: '1', opis: homeName, kurs: k1 });
                     odds.push({ rodzaj: '1X2', typ: 'X', opis: 'Remis', kurs: kx });
                     odds.push({ rodzaj: '1X2', typ: '2', opis: awayName, kurs: k2 });
                }

                if (odds.length > 0) {
                   const [existingOdds] = await connection.query('SELECT count(*) as cnt FROM kursy WHERE mecz_id = ?', [matchId]);
                   if (existingOdds[0].cnt === 0) {
                       for (const odd of odds) {
                           await connection.query(
                               'INSERT INTO kursy (mecz_id, rodzaj, typ, opis, kurs, status) VALUES (?, ?, ?, ?, ?, ?)',
                               [matchId, odd.rodzaj || '1X2', odd.typ, odd.opis, odd.kurs, 'AKTYWNY']
                           );
                       }
                   }
                }
            }

            await connection.commit();
            console.log('Import zakończony sukcesem.');
        } catch (err) {
            await connection.rollback();
            console.error('Błąd podczas importu danych:', err);
            throw err;
        } finally {
            connection.release();
        }

    } catch (err) {
        if (err.response) {
             console.error(`Błąd API AI: ${err.response.status} ${err.response.statusText}`);
             console.error(err.response.data);
        } else {
             console.error('Główny błąd serwisu importu:', err.message);
        }
    }
}
