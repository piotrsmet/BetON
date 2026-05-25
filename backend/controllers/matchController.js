import prisma from '../prisma.js';

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
                kursy: {
                    where: { rodzaj: '1X2' }
                }
            }
        });
        
        const matchesWithOdds = matches.map(m => {
            const odds = m.kursy;
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
