import axios from 'axios';
import prisma from '../prisma.js';

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
    try {
        // Używamy raw SQL dla TRUNCATE z wyłączeniem FK checks
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
        await prisma.$executeRawUnsafe('TRUNCATE TABLE przebieg_meczu');
        await prisma.$executeRawUnsafe('TRUNCATE TABLE statystyki_meczu');
        await prisma.$executeRawUnsafe('TRUNCATE TABLE kursy');
        await prisma.$executeRawUnsafe('TRUNCATE TABLE mecze');
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Dane wyczyszczone.');
    } catch (err) {
        console.error('Błąd podczas czyszczenia danych:', err);
        try {
            await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
        } catch (_) {}
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

        for (const matchData of matches) {
            try {
                const homeName = matchData.home_team;
                const awayName = matchData.away_team;
                
                // Data meczu: aktualna godzina + 2 minuty
                const matchDate = new Date(Date.now() + 2 * 60 * 1000);
                
                // Status - nowe API symuluje od razu, więc ustawiamy PLANOWANY
                const status = 'PLANOWANY';
                const league = matchData.league || 'E0'; // E0 = Premier League
                
                // Wynik końcowy z API
                const scoreHome = matchData.final_score_home ?? null;
                const scoreAway = matchData.final_score_away ?? null;
                
                // Sprawdź czy mecz już istnieje
                const dateStr = matchDate.toISOString().split('T')[0];
                const startOfDay = new Date(dateStr);
                const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
                
                const existing = await prisma.mecze.findFirst({
                    where: {
                        nazwa_gospodarza: homeName,
                        nazwa_goscia: awayName,
                        data_spotkania: {
                            gte: startOfDay,
                            lt: endOfDay
                        }
                    }
                });
                
                let matchId;
                
                if (existing) {
                    matchId = existing.id;
                    console.log(`Aktualizacja meczu: ${homeName} vs ${awayName} (ID: ${matchId})`);
                    
                    await prisma.mecze.update({
                        where: { id: matchId },
                        data: {
                            wynik_gospodarz: scoreHome,
                            wynik_gosc: scoreAway,
                            status
                        }
                    });
                } else {
                    console.log(`Dodawanie nowego meczu: ${homeName} vs ${awayName}`);
                    const newMatch = await prisma.mecze.create({
                        data: {
                            nazwa_gospodarza: homeName,
                            nazwa_goscia: awayName,
                            data_spotkania: matchDate,
                            liga: league,
                            status,
                            wynik_gospodarz: scoreHome,
                            wynik_gosc: scoreAway
                        }
                    });
                    matchId = newMatch.id;
                }

                // Import Statystyk z ostatniej minuty
                const minutes = matchData.minutes || [];
                if (minutes.length > 0) {
                    const lastMinute = minutes[minutes.length - 1];
                    
                    await prisma.statystyki_meczu.deleteMany({
                        where: { mecz_id: matchId }
                    });
                    
                    await prisma.statystyki_meczu.create({
                        data: {
                            mecz_id: matchId,
                            gole_gospodarz: lastMinute.home_score ?? 0,
                            gole_gosc: lastMinute.away_score ?? 0,
                            rozne_gospodarz: lastMinute.home_corners ?? 0,
                            rozne_gosc: lastMinute.away_corners ?? 0,
                            faule_gospodarz: lastMinute.home_fouls ?? 0,
                            faule_gosc: lastMinute.away_fouls ?? 0,
                            zolte_kartki_gospodarz: lastMinute.home_yellow_cards ?? 0,
                            zolte_kartki_gosc: lastMinute.away_yellow_cards ?? 0,
                            czerwone_kartki_gospodarz: lastMinute.home_red_cards ?? 0,
                            czerwone_kartki_gosc: lastMinute.away_red_cards ?? 0,
                            strzaly_gospodarz: lastMinute.home_shots ?? 0,
                            strzaly_gosc: lastMinute.away_shots ?? 0,
                            strzaly_celne_gospodarz: lastMinute.home_shots_on_target ?? 0,
                            strzaly_celne_gosc: lastMinute.away_shots_on_target ?? 0
                        }
                    });
                }

                // Import Przebiegu (Timeline) - minuta po minucie
                if (minutes.length > 0) {
                    await prisma.przebieg_meczu.deleteMany({
                        where: { mecz_id: matchId }
                    });

                    await prisma.przebieg_meczu.createMany({
                        data: minutes.map(minuteData => ({
                            mecz_id: matchId,
                            minuta: minuteData.minute,
                            wynik: `${minuteData.home_score}:${minuteData.away_score}`,
                            posiadanie: minuteData.home_possession > 50 ? 'home' : 'away',
                            komentarz: minuteData.commentary || '',
                            rozne_gospodarz: minuteData.home_corners ?? 0,
                            rozne_gosc: minuteData.away_corners ?? 0,
                            faule_gospodarz: minuteData.home_fouls ?? 0,
                            faule_gosc: minuteData.away_fouls ?? 0,
                            strzaly_gospodarz: minuteData.home_shots ?? 0,
                            strzaly_gosc: minuteData.away_shots ?? 0,
                            strzaly_celne_gospodarz: minuteData.home_shots_on_target ?? 0,
                            strzaly_celne_gosc: minuteData.away_shots_on_target ?? 0,
                            zolte_kartki_gospodarz: minuteData.home_yellow_cards ?? 0,
                            zolte_kartki_gosc: minuteData.away_yellow_cards ?? 0,
                            czerwone_kartki_gospodarz: minuteData.home_red_cards ?? 0,
                            czerwone_kartki_gosc: minuteData.away_red_cards ?? 0,
                            posiadanie_gospodarz: minuteData.home_possession ?? 50,
                            posiadanie_gosc: minuteData.away_possession ?? 50
                        }))
                    });
                }
                
                // Import Kursów z pre_match_odds
                const existingOddsCount = await prisma.kursy.count({
                    where: { mecz_id: matchId }
                });
                
                if (existingOddsCount === 0) {
                    const preMatchOdds = matchData.pre_match_odds;
                    
                    if (preMatchOdds) {
                        await prisma.kursy.createMany({
                            data: [
                                { mecz_id: matchId, rodzaj: '1X2', typ: '1', opis: homeName, kurs: preMatchOdds.home_win, status: 'AKTYWNY' },
                                { mecz_id: matchId, rodzaj: '1X2', typ: 'X', opis: 'Remis', kurs: preMatchOdds.draw, status: 'AKTYWNY' },
                                { mecz_id: matchId, rodzaj: '1X2', typ: '2', opis: awayName, kurs: preMatchOdds.away_win, status: 'AKTYWNY' }
                            ]
                        });
                    } else {
                        // Fallback: generuj losowe kursy jeśli brak pre_match_odds
                        const k1 = parseFloat((Math.random() * 1.5 + 1.5).toFixed(2));
                        const kx = parseFloat((Math.random() * 1.0 + 3.0).toFixed(2));
                        const k2 = parseFloat((Math.random() * 2.0 + 1.8).toFixed(2));
                        
                        await prisma.kursy.createMany({
                            data: [
                                { mecz_id: matchId, rodzaj: '1X2', typ: '1', opis: homeName, kurs: k1, status: 'AKTYWNY' },
                                { mecz_id: matchId, rodzaj: '1X2', typ: 'X', opis: 'Remis', kurs: kx, status: 'AKTYWNY' },
                                { mecz_id: matchId, rodzaj: '1X2', typ: '2', opis: awayName, kurs: k2, status: 'AKTYWNY' }
                            ]
                        });
                    }
                }
                
                console.log(`Mecz ${homeName} vs ${awayName} zaimportowany (ID: ${matchId})`);
            } catch (matchErr) {
                console.error(`Błąd importu meczu ${matchData.home_team} vs ${matchData.away_team}:`, matchErr);
            }
        }

        console.log(`Import zakończony sukcesem. Zaimportowano ${matches.length} meczów.`);

    } catch (err) {
        if (err.response) {
            console.error(`Błąd API AI: ${err.response.status} ${err.response.statusText}`);
            console.error(err.response.data);
        } else {
            console.error('Główny błąd serwisu importu:', err.message);
        }
    }
}
