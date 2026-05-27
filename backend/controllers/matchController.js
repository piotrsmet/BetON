import prisma from '../prisma.js';
import { importStatus } from '../services/matchImporter.js';

export const getImportStatus = async (req, res) => {
    res.json(importStatus);
};

export const getMatches = async (req, res) => {
    try {
        const { liga, status, dateFrom, dateTo } = req.query;
        
        let where = {};
        if (liga) where.liga = liga;
        if (status) where.status = status;
        if (dateFrom || dateTo) {
            where.data_spotkania = {};
            if (dateFrom) where.data_spotkania.gte = new Date(dateFrom);
            if (dateTo) where.data_spotkania.lte = new Date(dateTo);
        }

        const matches = await prisma.mecze.findMany({
            where,
            orderBy: { data_spotkania: 'asc' },
            include: {
                kursy: true
            }
        });

        const matchesWithOdds = matches.map(m => {
            const odds = m.kursy;
            const find = (rodzaj, typ) => odds.find(o => o.rodzaj === rodzaj && o.typ === typ);
            const h = find('1X2', '1');
            const d = find('1X2', 'X');
            const a = find('1X2', '2');
            const ouOver = find('OU_GOALS', 'OVER');
            const ouUnder = find('OU_GOALS', 'UNDER');
            const bttsY = find('BTTS', 'YES');
            const bttsN = find('BTTS', 'NO');
            const cornersOver = find('OU_CORNERS', 'OVER');
            const cornersUnder = find('OU_CORNERS', 'UNDER');
            const cardsOver = find('OU_CARDS', 'OVER');
            const cardsUnder = find('OU_CARDS', 'UNDER');

            const lockedStatus = (o) => o ? { kurs: o.kurs, status: o.status, locked: o.status === 'ZABLOKOWANY', next_update_at: o.next_update_at } : null;

            const oddsMap = {
                home: h?.kurs || null,
                draw: d?.kurs || null,
                away: a?.kurs || null,
                ids: {
                    home: h?.id,
                    draw: d?.id,
                    away: a?.id
                },
                meta_1x2: {
                    home: lockedStatus(h),
                    draw: lockedStatus(d),
                    away: lockedStatus(a)
                },
                ou_goals: ouOver ? {
                    line: Number(ouOver.linia ?? 2.5),
                    over: ouOver.kurs,
                    under: ouUnder?.kurs || null,
                    over_id: ouOver.id,
                    under_id: ouUnder?.id
                } : null,
                btts: bttsY ? {
                    yes: bttsY.kurs,
                    no: bttsN?.kurs || null,
                    yes_id: bttsY.id,
                    no_id: bttsN?.id
                } : null,
                ou_corners: cornersOver ? {
                    line: Number(cornersOver.linia ?? 9.5),
                    over: cornersOver.kurs,
                    under: cornersUnder?.kurs || null,
                    over_id: cornersOver.id,
                    under_id: cornersUnder?.id
                } : null,
                ou_cards: cardsOver ? {
                    line: Number(cardsOver.linia ?? 4.5),
                    over: cardsOver.kurs,
                    under: cardsUnder?.kurs || null,
                    over_id: cardsOver.id,
                    under_id: cardsUnder?.id
                } : null
            };
            const matchData = { ...m, odds: oddsMap };
            delete matchData.kursy;
            return matchData;
        });

        res.json(matchesWithOdds);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd pobierania meczów' });
    }
};

export const getMatchDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        const match = await prisma.mecze.findUnique({
            where: { id: parseInt(id) },
            include: {
                statystyki_meczu: true,
                przebieg_meczu: { orderBy: { minuta: 'asc' } },
                kursy: true
            }
        });

        if (!match) {
            return res.status(404).json({ error: 'Mecz nie znaleziony' });
        }

        // Usuwamy oryginalne pola relacji z odpowiedzi
        const { statystyki_meczu, przebieg_meczu, kursy, ...matchData } = match;

        res.json({
            ...matchData,
            statystyki: statystyki_meczu?.[0] || null,
            przebieg: przebieg_meczu,
            kursy: kursy,
            odds: kursy  // MatchDetails.jsx oczekuje pola 'odds'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd pobierania szczegółów meczu' });
    }
};

export const createMatch = async (req, res) => {
    try {
        const { mid, nazwa_gospodarza, nazwa_goscia, data_spotkania, liga, logo_gospodarza, logo_goscia } = req.body;
        
        if (!nazwa_gospodarza || !nazwa_goscia || !data_spotkania) {
            return res.status(400).json({ error: 'Brak wymaganych danych' });
        }
        
        const result = await prisma.mecze.create({
            data: {
                mid: mid || null,
                nazwa_gospodarza,
                nazwa_goscia,
                data_spotkania: new Date(data_spotkania),
                liga,
                logo_gospodarza,
                logo_goscia
            }
        });
        
        res.status(201).json({ id: result.id, message: 'Mecz utworzony' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd tworzenia meczu' });
    }
};

export const updateMatchStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, wynik_gospodarz, wynik_gosc } = req.body;
        
        await prisma.mecze.update({
            where: { id: parseInt(id) },
            data: {
                status,
                wynik_gospodarz,
                wynik_gosc
            }
        });
        
        res.json({ message: 'Status meczu zaktualizowany' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd aktualizacji statusu' });
    }
};

export const updateMatchStats = async (req, res) => {
    try {
        const { id } = req.params;
        const stats = req.body; 
        
        const existing = await prisma.statystyki_meczu.findFirst({
            where: { mecz_id: parseInt(id) }
        });
        
        if (existing) {
           await prisma.statystyki_meczu.update({
               where: { id: existing.id },
               data: {
                   gole_gospodarz: stats.gole_gospodarz,
                   gole_gosc: stats.gole_gosc,
                   rozne_gospodarz: stats.rozne_gospodarz,
                   rozne_gosc: stats.rozne_gosc,
                   faule_gospodarz: stats.faule_gospodarz,
                   faule_gosc: stats.faule_gosc,
                   zolte_kartki_gospodarz: stats.zolte_kartki_gospodarz,
                   zolte_kartki_gosc: stats.zolte_kartki_gosc,
                   czerwone_kartki_gospodarz: stats.czerwone_kartki_gospodarz,
                   czerwone_kartki_gosc: stats.czerwone_kartki_gosc,
                   strzaly_gospodarz: stats.strzaly_gospodarz,
                   strzaly_gosc: stats.strzaly_gosc,
                   strzaly_celne_gospodarz: stats.strzaly_celne_gospodarz,
                   strzaly_celne_gosc: stats.strzaly_celne_gosc
               }
           }); 
        } else {
            await prisma.statystyki_meczu.create({
                data: {
                    mecz_id: parseInt(id),
                    gole_gospodarz: stats.gole_gospodarz,
                    gole_gosc: stats.gole_gosc,
                    rozne_gospodarz: stats.rozne_gospodarz,
                    rozne_gosc: stats.rozne_gosc,
                    faule_gospodarz: stats.faule_gospodarz,
                    faule_gosc: stats.faule_gosc,
                    zolte_kartki_gospodarz: stats.zolte_kartki_gospodarz,
                    zolte_kartki_gosc: stats.zolte_kartki_gosc,
                    czerwone_kartki_gospodarz: stats.czerwone_kartki_gospodarz,
                    czerwone_kartki_gosc: stats.czerwone_kartki_gosc,
                    strzaly_gospodarz: stats.strzaly_gospodarz,
                    strzaly_gosc: stats.strzaly_gosc,
                    strzaly_celne_gospodarz: stats.strzaly_celne_gospodarz,
                    strzaly_celne_gosc: stats.strzaly_celne_gosc
                }
            });
        }
        res.json({ message: 'Statystyki zaktualizowane' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd aktualizacji statystyk' });
    }
};

export const addTimelineEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { minuta, wynik, posiadanie, komentarz, rozne_gospodarz, rozne_gosc, faule_gospodarz, faule_gosc } = req.body;
        
        await prisma.przebieg_meczu.create({
            data: {
                mecz_id: parseInt(id),
                minuta,
                wynik,
                posiadanie,
                komentarz,
                rozne_gospodarz,
                rozne_gosc,
                faule_gospodarz,
                faule_gosc
            }
        });
        res.status(201).json({ message: 'Zdarzenie dodane' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd dodawania zdarzenia' });
    }
};
