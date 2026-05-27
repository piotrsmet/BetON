import axios from 'axios';
import prisma from '../prisma.js';

// URL do nowego API AI (FastAPI)
const AI_BASE = 'http://localhost:8000';
const AI_SINGLE_URL = `${AI_BASE}/generate/match`;

// Status pojedynczego cyklu importu - dostępny przez /api/import/status
export const importStatus = {
    totalRequested: 0,
    completed: 0,
    inProgress: false,
    startedAt: null,
    finishedAt: null,
    lastError: null,
    pages: [] // [{ index, home_team, away_team, status: 'pending'|'ok'|'error', matchId? }]
};

// Lista dostępnych drużyn Premier League
const TEAMS = [
    'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
    'Burnley', 'Chelsea', 'Crystal Palace', 'Everton', 'Fulham',
    'Liverpool', 'Luton', 'Man City', 'Man United', 'Newcastle',
    'Nottingham Forest', 'Sheffield United', 'Tottenham', 'West Ham', 'Wolves'
];

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
};

// Generuje pojedynczy mecz w AI i zapisuje do DB. Zwraca id meczu.
const generateAndPersist = async (pair, scheduledDate) => {
    const response = await axios.post(AI_SINGLE_URL, pair, { timeout: 60000 });
    const apiResponse = response.data;
    if (apiResponse.status !== 'ok') {
        throw new Error(apiResponse.error || apiResponse.message || 'AI error');
    }
    const matchData = apiResponse.data;
    return await persistMatchToDb(matchData, scheduledDate);
};

const persistMatchToDb = async (matchData, scheduledDate) => {
    const homeName = matchData.home_team;
    const awayName = matchData.away_team;
    const matchDate = scheduledDate;
    const status = 'PLANOWANY';
    const league = matchData.league || 'E0';
    const scoreHome = matchData.final_score_home ?? null;
    const scoreAway = matchData.final_score_away ?? null;

    const dateStr = matchDate.toISOString().split('T')[0];
    const startOfDay = new Date(dateStr);
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const existing = await prisma.mecze.findFirst({
        where: {
            nazwa_gospodarza: homeName,
            nazwa_goscia: awayName,
            data_spotkania: { gte: startOfDay, lt: endOfDay }
        }
    });

    let matchId;
    if (existing) {
        matchId = existing.id;
        await prisma.mecze.update({
            where: { id: matchId },
            data: { wynik_gospodarz: scoreHome, wynik_gosc: scoreAway, status, data_spotkania: matchDate }
        });
    } else {
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

    // Statystyki końcowe
    const minutes = matchData.minutes || [];
    if (minutes.length > 0) {
        const last = minutes[minutes.length - 1];
        // Wynik do przerwy - z minuty 45 lub ostatniej <= 45
        const htRow = minutes.filter(m => m.minute <= 45).pop() || minutes[0];
        await prisma.statystyki_meczu.deleteMany({ where: { mecz_id: matchId } });
        await prisma.statystyki_meczu.create({
            data: {
                mecz_id: matchId,
                gole_gospodarz: last.home_score ?? 0,
                gole_gosc: last.away_score ?? 0,
                gole_gospodarz_ht: htRow.home_score ?? 0,
                gole_gosc_ht: htRow.away_score ?? 0,
                rozne_gospodarz: last.home_corners ?? 0,
                rozne_gosc: last.away_corners ?? 0,
                faule_gospodarz: last.home_fouls ?? 0,
                faule_gosc: last.away_fouls ?? 0,
                zolte_kartki_gospodarz: last.home_yellow_cards ?? 0,
                zolte_kartki_gosc: last.away_yellow_cards ?? 0,
                czerwone_kartki_gospodarz: last.home_red_cards ?? 0,
                czerwone_kartki_gosc: last.away_red_cards ?? 0,
                strzaly_gospodarz: last.home_shots ?? 0,
                strzaly_gosc: last.away_shots ?? 0,
                strzaly_celne_gospodarz: last.home_shots_on_target ?? 0,
                strzaly_celne_gosc: last.away_shots_on_target ?? 0,
                spalone_gospodarz: last.home_offsides ?? 0,
                spalone_gosc: last.away_offsides ?? 0
            }
        });

        // Przebieg
        await prisma.przebieg_meczu.deleteMany({ where: { mecz_id: matchId } });
        await prisma.przebieg_meczu.createMany({
            data: minutes.map(m => ({
                mecz_id: matchId,
                minuta: m.minute,
                wynik: `${m.home_score}:${m.away_score}`,
                posiadanie: m.home_possession > 50 ? 'home' : 'away',
                komentarz: m.commentary || '',
                rozne_gospodarz: m.home_corners ?? 0,
                rozne_gosc: m.away_corners ?? 0,
                faule_gospodarz: m.home_fouls ?? 0,
                faule_gosc: m.away_fouls ?? 0,
                strzaly_gospodarz: m.home_shots ?? 0,
                strzaly_gosc: m.away_shots ?? 0,
                strzaly_celne_gospodarz: m.home_shots_on_target ?? 0,
                strzaly_celne_gosc: m.away_shots_on_target ?? 0,
                zolte_kartki_gospodarz: m.home_yellow_cards ?? 0,
                zolte_kartki_gosc: m.away_yellow_cards ?? 0,
                czerwone_kartki_gospodarz: m.home_red_cards ?? 0,
                czerwone_kartki_gosc: m.away_red_cards ?? 0,
                spalone_gospodarz: m.home_offsides ?? 0,
                spalone_gosc: m.away_offsides ?? 0,
                posiadanie_gospodarz: m.home_possession ?? 50,
                posiadanie_gosc: m.away_possession ?? 50
            }))
        });
    }

    // Kursy - tylko jeśli jeszcze nie istnieją
    const existingOddsCount = await prisma.kursy.count({ where: { mecz_id: matchId } });
    if (existingOddsCount === 0) {
        const o = matchData.pre_match_odds;
        if (o) {
            const goalsLine = o.goals_line ?? 2.5;
            const cornersLine = o.corners_line ?? 9.5;
            const cardsLine = o.cards_line ?? 4.5;
            const sotLine = o.sot_line ?? 8.5;
            const offsidesLine = o.offsides_line ?? 3.5;
            await prisma.kursy.createMany({
                data: [
                    { mecz_id: matchId, rodzaj: '1X2', typ: '1', opis: homeName, kurs: o.home_win, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: '1X2', typ: 'X', opis: 'Remis', kurs: o.draw, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: '1X2', typ: '2', opis: awayName, kurs: o.away_win, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'OU_GOALS', typ: 'OVER', linia: goalsLine, opis: `Powyżej ${goalsLine} bramek`, kurs: o.over_2_5, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'OU_GOALS', typ: 'UNDER', linia: goalsLine, opis: `Poniżej ${goalsLine} bramek`, kurs: o.under_2_5, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'BTTS', typ: 'YES', opis: 'Obie drużyny strzelą - TAK', kurs: o.btts_yes, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'BTTS', typ: 'NO', opis: 'Obie drużyny strzelą - NIE', kurs: o.btts_no, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'OU_CORNERS', typ: 'OVER', linia: cornersLine, opis: `Powyżej ${cornersLine} rzutów rożnych`, kurs: o.corners_over ?? 1.9, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'OU_CORNERS', typ: 'UNDER', linia: cornersLine, opis: `Poniżej ${cornersLine} rzutów rożnych`, kurs: o.corners_under ?? 1.9, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'OU_CARDS', typ: 'OVER', linia: cardsLine, opis: `Powyżej ${cardsLine} kartek`, kurs: o.cards_over ?? 1.9, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'OU_CARDS', typ: 'UNDER', linia: cardsLine, opis: `Poniżej ${cardsLine} kartek`, kurs: o.cards_under ?? 1.9, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'OU_SOT', typ: 'OVER', linia: sotLine, opis: `Powyżej ${sotLine} celnych strzałów`, kurs: o.sot_over ?? 1.9, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'OU_SOT', typ: 'UNDER', linia: sotLine, opis: `Poniżej ${sotLine} celnych strzałów`, kurs: o.sot_under ?? 1.9, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'OU_OFFSIDES', typ: 'OVER', linia: offsidesLine, opis: `Powyżej ${offsidesLine} spalonych`, kurs: o.offsides_over ?? 1.9, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'OU_OFFSIDES', typ: 'UNDER', linia: offsidesLine, opis: `Poniżej ${offsidesLine} spalonych`, kurs: o.offsides_under ?? 1.9, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'HTFT', typ: '1/1', opis: '1. połowa / mecz: 1 / 1', kurs: o.htft_1_1, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'HTFT', typ: '1/X', opis: '1. połowa / mecz: 1 / X', kurs: o.htft_1_x, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'HTFT', typ: '1/2', opis: '1. połowa / mecz: 1 / 2', kurs: o.htft_1_2, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'HTFT', typ: 'X/1', opis: '1. połowa / mecz: X / 1', kurs: o.htft_x_1, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'HTFT', typ: 'X/X', opis: '1. połowa / mecz: X / X', kurs: o.htft_x_x, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'HTFT', typ: 'X/2', opis: '1. połowa / mecz: X / 2', kurs: o.htft_x_2, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'HTFT', typ: '2/1', opis: '1. połowa / mecz: 2 / 1', kurs: o.htft_2_1, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'HTFT', typ: '2/X', opis: '1. połowa / mecz: 2 / X', kurs: o.htft_2_x, status: 'AKTYWNY' },
                    { mecz_id: matchId, rodzaj: 'HTFT', typ: '2/2', opis: '1. połowa / mecz: 2 / 2', kurs: o.htft_2_2, status: 'AKTYWNY' }
                ]
            });
        }
    }

    return matchId;
};

/**
 * Importuje mecze "stronicowo":
 *  - 1. mecz generowany i zapisywany synchronicznie (czeka caller)
 *  - kolejne mecze lecą w tle, sekwencyjnie, każdy zaplanowany 2 min dalej
 *
 * Frontend może odpytywać /api/import/status żeby pokazać progres.
 */
export const importDailyMatches = async (numMatches = 5) => {
    if (importStatus.inProgress) {
        console.log('Import już w toku, pomijam.');
        return;
    }

    const matchPairs = generateRandomMatchPairs(numMatches);
    importStatus.totalRequested = matchPairs.length;
    importStatus.completed = 0;
    importStatus.inProgress = true;
    importStatus.startedAt = new Date().toISOString();
    importStatus.finishedAt = null;
    importStatus.lastError = null;
    importStatus.pages = matchPairs.map((p, i) => ({
        index: i + 1,
        home_team: p.home_team,
        away_team: p.away_team,
        status: 'pending',
        matchId: null
    }));

    console.log(`Import stronicowy: ${matchPairs.length} meczów. 1. natychmiast, reszta w tle.`);

    // Mecz #1: start za 30 sekund (pozwala graczom obejrzeć kursy przed startem)
    const baseTime = Date.now() + 30 * 1000;
    const intervalMs = 2 * 60 * 1000; // każdy kolejny mecz +2 min

    // Strona 1 (synchronicznie)
    try {
        const id = await generateAndPersist(matchPairs[0], new Date(baseTime));
        importStatus.pages[0].status = 'ok';
        importStatus.pages[0].matchId = id;
        importStatus.completed = 1;
        console.log(`[page 1/${matchPairs.length}] OK: ${matchPairs[0].home_team} vs ${matchPairs[0].away_team}`);
    } catch (err) {
        importStatus.pages[0].status = 'error';
        importStatus.lastError = err.message;
        console.error('[page 1] BŁĄD:', err.message);
    }

    // Reszta - w tle, sekwencyjnie
    (async () => {
        for (let i = 1; i < matchPairs.length; i++) {
            try {
                const scheduled = new Date(baseTime + i * intervalMs);
                const id = await generateAndPersist(matchPairs[i], scheduled);
                importStatus.pages[i].status = 'ok';
                importStatus.pages[i].matchId = id;
                console.log(`[page ${i + 1}/${matchPairs.length}] OK: ${matchPairs[i].home_team} vs ${matchPairs[i].away_team}`);
            } catch (err) {
                importStatus.pages[i].status = 'error';
                importStatus.lastError = err.message;
                console.error(`[page ${i + 1}] BŁĄD:`, err.message);
            }
            importStatus.completed = i + 1;
        }
        importStatus.inProgress = false;
        importStatus.finishedAt = new Date().toISOString();
        console.log(`Import stronicowy zakończony.`);
    })();
};
