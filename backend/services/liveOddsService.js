import axios from 'axios';
import prisma from '../prisma.js';

const AI_BASE = process.env.AI_BASE_URL || 'http://localhost:8000';
const AI_LIVE_URL = `${AI_BASE}/odds/live`;

// Cykl: kurs zmienia się co `UPDATE_INTERVAL_MS`, blokowany `LOCK_BEFORE_MS` przed kolejną zmianą.
const UPDATE_INTERVAL_MS = 30 * 1000;
const LOCK_BEFORE_MS = 5 * 1000;

// Czy mecz jest "live" (TRWA / w trakcie symulowanego okna)
const isMatchLive = (m, now) => {
    if (m.status !== 'TRWA' && m.status !== 'PLANOWANY') return false;
    const start = new Date(m.data_spotkania).getTime();
    const elapsed = (now.getTime() - start) / 60000;
    return elapsed >= 0 && elapsed < 90;
};

// Wylicza bieżący snapshot statystyk meczu z `przebieg_meczu` na podstawie minuty
const computeLiveSnapshot = (match, currentMinute) => {
    const rows = (match.przebieg_meczu || []).filter(r => r.minuta <= currentMinute);
    if (rows.length === 0) {
        return {
            minute: Math.max(0, currentMinute),
            home_score: 0, away_score: 0,
            home_corners: 0, away_corners: 0,
            home_yellow_cards: 0, away_yellow_cards: 0,
            home_red_cards: 0, away_red_cards: 0,
            home_shots_on_target: 0, away_shots_on_target: 0,
            home_offsides: 0, away_offsides: 0
        };
    }
    const last = rows[rows.length - 1];
    const [h, a] = last.wynik.split(':').map(x => parseInt(x, 10));
    return {
        minute: Math.max(0, Math.min(90, currentMinute)),
        home_score: h ?? 0,
        away_score: a ?? 0,
        home_corners: last.rozne_gospodarz ?? 0,
        away_corners: last.rozne_gosc ?? 0,
        home_yellow_cards: last.zolte_kartki_gospodarz ?? 0,
        away_yellow_cards: last.zolte_kartki_gosc ?? 0,
        home_red_cards: last.czerwone_kartki_gospodarz ?? 0,
        away_red_cards: last.czerwone_kartki_gosc ?? 0,
        home_shots_on_target: last.strzaly_celne_gospodarz ?? 0,
        away_shots_on_target: last.strzaly_celne_gosc ?? 0,
        home_offsides: last.spalone_gospodarz ?? 0,
        away_offsides: last.spalone_gosc ?? 0
    };
};

// Mapowanie z AI -> aktualizacje pojedynczych kursów w DB
const applyLiveOddsToKursy = async (matchId, liveOdds, kursy) => {
    const map = [
        { rodzaj: '1X2', typ: '1', value: liveOdds.home_win },
        { rodzaj: '1X2', typ: 'X', value: liveOdds.draw },
        { rodzaj: '1X2', typ: '2', value: liveOdds.away_win },
        { rodzaj: 'OU_GOALS', typ: 'OVER', value: liveOdds.over_goals },
        { rodzaj: 'OU_GOALS', typ: 'UNDER', value: liveOdds.under_goals },
        { rodzaj: 'BTTS', typ: 'YES', value: liveOdds.btts_yes },
        { rodzaj: 'BTTS', typ: 'NO', value: liveOdds.btts_no },
        { rodzaj: 'OU_CORNERS', typ: 'OVER', value: liveOdds.over_corners },
        { rodzaj: 'OU_CORNERS', typ: 'UNDER', value: liveOdds.under_corners },
        { rodzaj: 'OU_CARDS', typ: 'OVER', value: liveOdds.over_cards },
        { rodzaj: 'OU_CARDS', typ: 'UNDER', value: liveOdds.under_cards },
        { rodzaj: 'OU_SOT', typ: 'OVER', value: liveOdds.over_sot },
        { rodzaj: 'OU_SOT', typ: 'UNDER', value: liveOdds.under_sot },
        { rodzaj: 'OU_OFFSIDES', typ: 'OVER', value: liveOdds.over_offsides },
        { rodzaj: 'OU_OFFSIDES', typ: 'UNDER', value: liveOdds.under_offsides }
    ];
    const nextUpdateAt = new Date(Date.now() + UPDATE_INTERVAL_MS);
    for (const entry of map) {
        const k = kursy.find(x => x.rodzaj === entry.rodzaj && x.typ === entry.typ);
        if (!k) continue;
        if (entry.value == null) continue;
        await prisma.kursy.update({
            where: { id: k.id },
            data: {
                kurs: entry.value,
                status: 'AKTYWNY',
                next_update_at: nextUpdateAt
            }
        });
    }
};

// Główny tick - powinien być wołany co ~5s
export const tickLiveOdds = async () => {
    try {
        const now = new Date();
        const liveMatches = await prisma.mecze.findMany({
            where: {
                status: { in: ['PLANOWANY', 'TRWA'] }
            },
            include: {
                kursy: { where: { wynik: 'PENDING' } },
                przebieg_meczu: { orderBy: { minuta: 'asc' } }
            }
        });

        for (const match of liveMatches) {
            if (!isMatchLive(match, now)) continue;
            const start = new Date(match.data_spotkania).getTime();
            const minute = Math.max(0, Math.min(90, Math.floor((now.getTime() - start) / 60000)));
            const snapshot = computeLiveSnapshot(match, minute);

            // Inicjalizacja next_update_at dla nowych "live" kursów: ustaw 30s w przyszłości
            const needInit = match.kursy.filter(k => !k.next_update_at);
            if (needInit.length > 0) {
                const initNext = new Date(now.getTime() + UPDATE_INTERVAL_MS);
                await prisma.kursy.updateMany({
                    where: { id: { in: needInit.map(k => k.id) } },
                    data: { next_update_at: initNext }
                });
            }

            // Sprawdź czy któreś kursy są w fazie blokady (5s przed update)
            const refreshedKursy = await prisma.kursy.findMany({
                where: { mecz_id: match.id, wynik: 'PENDING' }
            });
            const toLock = refreshedKursy.filter(k =>
                k.next_update_at &&
                k.status === 'AKTYWNY' &&
                (new Date(k.next_update_at).getTime() - now.getTime()) <= LOCK_BEFORE_MS &&
                (new Date(k.next_update_at).getTime() - now.getTime()) > 0
            );
            if (toLock.length > 0) {
                await prisma.kursy.updateMany({
                    where: { id: { in: toLock.map(k => k.id) } },
                    data: { status: 'ZABLOKOWANY' }
                });
            }

            // Kursy które wymagają aktualizacji (czas minął)
            const toUpdate = refreshedKursy.filter(k =>
                k.next_update_at && new Date(k.next_update_at).getTime() <= now.getTime()
            );
            if (toUpdate.length === 0) continue;

            // Wywołaj AI dla nowych kursów
            try {
                const aiResp = await axios.post(AI_LIVE_URL, {
                    home_team: match.nazwa_gospodarza,
                    away_team: match.nazwa_goscia,
                    minute: snapshot.minute,
                    home_score: snapshot.home_score,
                    away_score: snapshot.away_score,
                    home_corners: snapshot.home_corners,
                    away_corners: snapshot.away_corners,
                    home_yellow_cards: snapshot.home_yellow_cards,
                    away_yellow_cards: snapshot.away_yellow_cards,
                    home_red_cards: snapshot.home_red_cards,
                    away_red_cards: snapshot.away_red_cards,
                    home_shots_on_target: snapshot.home_shots_on_target,
                    away_shots_on_target: snapshot.away_shots_on_target,
                    home_offsides: snapshot.home_offsides,
                    away_offsides: snapshot.away_offsides,
                    goals_line: Number(toUpdate.find(k => k.rodzaj === 'OU_GOALS')?.linia ?? 2.5),
                    corners_line: Number(toUpdate.find(k => k.rodzaj === 'OU_CORNERS')?.linia ?? 9.5),
                    cards_line: Number(toUpdate.find(k => k.rodzaj === 'OU_CARDS')?.linia ?? 4.5),
                    sot_line: Number(toUpdate.find(k => k.rodzaj === 'OU_SOT')?.linia ?? 8.5),
                    offsides_line: Number(toUpdate.find(k => k.rodzaj === 'OU_OFFSIDES')?.linia ?? 3.5)
                }, { timeout: 8000 });
                if (aiResp.data.status === 'ok') {
                    await applyLiveOddsToKursy(match.id, aiResp.data.data, refreshedKursy);
                }
            } catch (err) {
                console.error(`[liveOdds] AI błąd dla meczu ${match.id}:`, err.message);
                // Bez aktualizacji - przesuń next_update_at o jeden cykl
                await prisma.kursy.updateMany({
                    where: { id: { in: toUpdate.map(k => k.id) } },
                    data: { status: 'AKTYWNY', next_update_at: new Date(now.getTime() + UPDATE_INTERVAL_MS) }
                });
            }
        }
    } catch (err) {
        console.error('Błąd tickLiveOdds:', err);
    }
};
