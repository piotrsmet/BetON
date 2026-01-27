import axios from 'axios';
import db from '../db.js';

// URL do nowego API AI (FastAPI)
const AI_API_URL = 'http://localhost:8000/generate/batch';

// Lista dostępnych drużyn Premier League
const TEAMS = [
    'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
    'Burnley', 'Chelsea', 'Crystal Palace', 'Everton', 'Fulham',
    'Liverpool', 'Luton', 'Man City', 'Man United', 'Newcastle',
    'Nottingham Forest', 'Sheffield United', 'Tottenham', 'West Ham', 'Wolves'
];

// Funkcja losowej pary meczów
const generateRandomMatchPairs = (numMatches = 5) => {
    const shuffled = [...TEAMS].sort(() => Math.random() - 0.5);
    const pairs = [];
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < Math.min(numMatches * 2, shuffled.length); i += 2) {
        pairs.push({
            home_team: shuffled[i],
            away_team: shuffled[i + 1],
            date: today,
            use_historical_data: true
        });
    }
    return pairs;
};

export const clearMatchData = async () => {
    console.log('Czyszczenie danych meczowych...');
    const connection = await db.getConnection();
    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE przebieg_meczu');
        await connection.query('TRUNCATE TABLE statystyki_meczu');
        await connection.query('TRUNCATE TABLE kursy');
        await connection.query('TRUNCATE TABLE mecze');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Dane wyczyszczone.');
    } catch (err) {
        console.error('Błąd podczas czyszczenia danych:', err);
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    } finally {
        connection.release();
    }
}

export const importDailyMatches = async (numMatches = 5) => {
    console.log('Rozpoczynanie importu meczów z nowego API AI...');
    try {
        // 1. Przygotuj pary meczowe
        const matchPairs = generateRandomMatchPairs(numMatches);
        console.log(`Generowanie ${matchPairs.length} meczów...`);
        
        // 2. Wywołaj API /generate/batch
        const response = await axios.post(AI_API_URL, { 
            matches: matchPairs 
        });
        
        const apiResponse = response.data;
        
        // Nowe API zwraca: { status: "ok", data: { matches: [...], count: N } }
        if (apiResponse.status !== 'ok') {
            console.error('API zwróciło błąd:', apiResponse.error || apiResponse.message);
            return;
        }
        
        const matches = apiResponse.data?.matches || [];
        
        if (matches.length === 0) {
            console.log('Brak meczów do zaimportowania.');
            return;
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            for (const matchData of matches) {
                const homeName = matchData.home_team;
                const awayName = matchData.away_team;
                
                // Data meczu: aktualna godzina + 2 minuty
                const matchDate = new Date(Date.now() + 2 * 60 * 1000);
                
                // Status - nowe API symuluje od razu, więc ustawiamy PLANOWANY
                const status = 'PLANOWANY';
                const league = matchData.league || 'E0'; // E0 = Premier League
                
                // Sprawdź czy mecz już istnieje
                const dateStr = matchDate.toISOString().split('T')[0];
                
                const [existing] = await connection.query(
                    `SELECT id FROM mecze 
                     WHERE nazwa_gospodarza = ? 
                     AND nazwa_goscia = ? 
                     AND DATE(data_spotkania) = ?`, 
                    [homeName, awayName, dateStr]
                );
                
                let matchId;
                
                // Wynik końcowy z API
                const scoreHome = matchData.final_score_home ?? null;
                const scoreAway = matchData.final_score_away ?? null;

                if (existing.length > 0) {
                    matchId = existing[0].id;
                    console.log(`Aktualizacja meczu: ${homeName} vs ${awayName} (ID: ${matchId})`);
                    
                    await connection.query(
                        'UPDATE mecze SET wynik_gospodarz = ?, wynik_gosc = ?, status = ? WHERE id = ?',
                        [scoreHome, scoreAway, status, matchId]
                    );
                } else {
                    console.log(`Dodawanie nowego meczu: ${homeName} vs ${awayName}`);
                    const [res] = await connection.query(
                        'INSERT INTO mecze (mid, nazwa_gospodarza, nazwa_goscia, data_spotkania, liga, status, wynik_gospodarz, wynik_gosc) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        [
                            null, // mid musi być integer, API zwraca string - pomijamy
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

                // Import Statystyk z ostatniej minuty
                const minutes = matchData.minutes || [];
                if (minutes.length > 0) {
                    const lastMinute = minutes[minutes.length - 1];
                    
                    await connection.query('DELETE FROM statystyki_meczu WHERE mecz_id = ?', [matchId]);
                    
                    await connection.query(
                        `INSERT INTO statystyki_meczu 
                        (mecz_id, gole_gospodarz, gole_gosc, rozne_gospodarz, rozne_gosc, faule_gospodarz, faule_gosc, 
                        zolte_kartki_gospodarz, zolte_kartki_gosc, czerwone_kartki_gospodarz, czerwone_kartki_gosc, 
                        strzaly_gospodarz, strzaly_gosc, strzaly_celne_gospodarz, strzaly_celne_gosc)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            matchId,
                            lastMinute.home_score ?? 0, 
                            lastMinute.away_score ?? 0,
                            lastMinute.home_corners ?? 0, 
                            lastMinute.away_corners ?? 0,
                            lastMinute.home_fouls ?? 0, 
                            lastMinute.away_fouls ?? 0,
                            lastMinute.home_yellow_cards ?? 0, 
                            lastMinute.away_yellow_cards ?? 0,
                            lastMinute.home_red_cards ?? 0, 
                            lastMinute.away_red_cards ?? 0,
                            lastMinute.home_shots ?? 0, 
                            lastMinute.away_shots ?? 0,
                            lastMinute.home_shots_on_target ?? 0, 
                            lastMinute.away_shots_on_target ?? 0
                        ]
                    );
                }

                // Import Przebiegu (Timeline) - minuta po minucie
                if (minutes.length > 0) {
                    await connection.query('DELETE FROM przebieg_meczu WHERE mecz_id = ?', [matchId]);

                    for (const minuteData of minutes) {
                        // Mapowanie nowego formatu na stary
                        const wynik = `${minuteData.home_score}:${minuteData.away_score}`;
                        const posiadanie = minuteData.home_possession > 50 ? 'home' : 'away';
                        
                        await connection.query(
                            `INSERT INTO przebieg_meczu (
                                mecz_id, minuta, wynik, posiadanie, komentarz, 
                                rozne_gospodarz, rozne_gosc, faule_gospodarz, faule_gosc,
                                strzaly_gospodarz, strzaly_gosc, strzaly_celne_gospodarz, strzaly_celne_gosc,
                                zolte_kartki_gospodarz, zolte_kartki_gosc, czerwone_kartki_gospodarz, czerwone_kartki_gosc,
                                posiadanie_gospodarz, posiadanie_gosc
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                matchId,
                                minuteData.minute,
                                wynik,
                                posiadanie,
                                minuteData.commentary || '',
                                minuteData.home_corners ?? 0,
                                minuteData.away_corners ?? 0,
                                minuteData.home_fouls ?? 0,
                                minuteData.away_fouls ?? 0,
                                minuteData.home_shots ?? 0,
                                minuteData.away_shots ?? 0,
                                minuteData.home_shots_on_target ?? 0,
                                minuteData.away_shots_on_target ?? 0,
                                minuteData.home_yellow_cards ?? 0,
                                minuteData.away_yellow_cards ?? 0,
                                minuteData.home_red_cards ?? 0,
                                minuteData.away_red_cards ?? 0,
                                minuteData.home_possession ?? 50,
                                minuteData.away_possession ?? 50
                            ]
                        );
                    }
                }
                
                // Import Kursów z pre_match_odds
                const preMatchOdds = matchData.pre_match_odds;
                if (preMatchOdds) {
                    const [existingOdds] = await connection.query('SELECT count(*) as cnt FROM kursy WHERE mecz_id = ?', [matchId]);
                    
                    if (existingOdds[0].cnt === 0) {
                        // Kurs 1 (home_win)
                        await connection.query(
                            'INSERT INTO kursy (mecz_id, rodzaj, typ, opis, kurs, status) VALUES (?, ?, ?, ?, ?, ?)',
                            [matchId, '1X2', '1', homeName, preMatchOdds.home_win, 'AKTYWNY']
                        );
                        // Kurs X (draw)
                        await connection.query(
                            'INSERT INTO kursy (mecz_id, rodzaj, typ, opis, kurs, status) VALUES (?, ?, ?, ?, ?, ?)',
                            [matchId, '1X2', 'X', 'Remis', preMatchOdds.draw, 'AKTYWNY']
                        );
                        // Kurs 2 (away_win)
                        await connection.query(
                            'INSERT INTO kursy (mecz_id, rodzaj, typ, opis, kurs, status) VALUES (?, ?, ?, ?, ?, ?)',
                            [matchId, '1X2', '2', awayName, preMatchOdds.away_win, 'AKTYWNY']
                        );
                    }
                } else {
                    // Fallback: generuj losowe kursy jeśli brak pre_match_odds
                    const [existingOdds] = await connection.query('SELECT count(*) as cnt FROM kursy WHERE mecz_id = ?', [matchId]);
                    if (existingOdds[0].cnt === 0) {
                        const k1 = (Math.random() * 1.5 + 1.5).toFixed(2);
                        const kx = (Math.random() * 1.0 + 3.0).toFixed(2);
                        const k2 = (Math.random() * 2.0 + 1.8).toFixed(2);
                        
                        await connection.query(
                            'INSERT INTO kursy (mecz_id, rodzaj, typ, opis, kurs, status) VALUES (?, ?, ?, ?, ?, ?)',
                            [matchId, '1X2', '1', homeName, k1, 'AKTYWNY']
                        );
                        await connection.query(
                            'INSERT INTO kursy (mecz_id, rodzaj, typ, opis, kurs, status) VALUES (?, ?, ?, ?, ?, ?)',
                            [matchId, '1X2', 'X', 'Remis', kx, 'AKTYWNY']
                        );
                        await connection.query(
                            'INSERT INTO kursy (mecz_id, rodzaj, typ, opis, kurs, status) VALUES (?, ?, ?, ?, ?, ?)',
                            [matchId, '1X2', '2', awayName, k2, 'AKTYWNY']
                        );
                    }
                }
            }

            await connection.commit();
            console.log(`Import zakończony sukcesem. Zaimportowano ${matches.length} meczów.`);
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
