import React, { useEffect, useState, useRef } from 'react';
import { apiClient } from '../../../api/client';
import { useBetting } from '../../../context/BettingContext';

export const MatchDetails = ({ matchId, onBack }) => {
    const [match, setMatch] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [currentStats, setCurrentStats] = useState(null);
    const [currentScore, setCurrentScore] = useState({ home: 0, away: 0 });
    const [loading, setLoading] = useState(true);
    const { addBet, bets } = useBetting();
    const timelineRef = useRef(null);

    const fetchMatchDetails = async () => {
        try {
            const data = await apiClient.getMatchDetails(matchId);
            setMatch(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatchDetails(); // Initial fetch

        const interval = setInterval(async () => {
             fetchMatchDetails();
        }, 10000);

        return () => clearInterval(interval);
    }, [matchId]);

    // Calculate current simulated minute and filter timeline
    useEffect(() => {
        if (!match || !match.przebieg) return;

        const updateTimeline = () => {
            const matchDate = new Date(match.data_spotkania);
            const now = new Date();
            let minute = Math.floor((now - matchDate) / 60000);
            
            let filteredEvents = [];
            
            // If genuinely finished (old date or status), show everything
            if (match.status === 'ZAKONCZONY') {
                filteredEvents = match.przebieg;
                minute = 90; 
            } else {
                // PLANOWANY or TRWA - simulate live based on time
                // If minute < 0, match hasn't started -> empty timeline
                if (minute < 0) {
                    minute = 0;
                    filteredEvents = [];
                } else {
                    // Match in progress
                    // Filter events that happened at or before current minute
                    filteredEvents = match.przebieg.filter(e => e.minuta <= minute);
                }
            }

            // Reverse for display (newest on top)
            setTimeline([...filteredEvents].reverse());
            
            // Update stats & score from latest available event
            if (filteredEvents.length > 0) {
                const latest = filteredEvents[filteredEvents.length - 1]; // Last chronological event
                
                setCurrentStats({
                    rozne_gospodarz: latest.rozne_gospodarz || 0,
                    rozne_gosc: latest.rozne_gosc || 0,
                    faule_gospodarz: latest.faule_gospodarz || 0,
                    faule_gosc: latest.faule_gosc || 0,
                    strzaly_gospodarz: latest.strzaly_gospodarz || 0,
                    strzaly_gosc: latest.strzaly_gosc || 0,
                    strzaly_celne_gospodarz: latest.strzaly_celne_gospodarz || 0,
                    strzaly_celne_gosc: latest.strzaly_celne_gosc || 0,
                    zolte_kartki_gospodarz: latest.zolte_kartki_gospodarz || 0,
                    zolte_kartki_gosc: latest.zolte_kartki_gosc || 0,
                    czerwone_kartki_gospodarz: latest.czerwone_kartki_gospodarz || 0,
                    czerwone_kartki_gosc: latest.czerwone_kartki_gosc || 0,
                    posiadanie_gospodarz: latest.posiadanie_gospodarz || 50,
                    posiadanie_gosc: latest.posiadanie_gosc || 50
                });
                
                const [h, a] = latest.wynik.split(':');
                setCurrentScore({ home: h, away: a });
            } else {
                // Default stats or pre-match
                 setCurrentStats({
                    rozne_gospodarz: 0,
                    rozne_gosc: 0,
                    faule_gospodarz: 0,
                    faule_gosc: 0,
                    strzaly_gospodarz: 0,
                    strzaly_gosc: 0,
                    strzaly_celne_gospodarz: 0,
                    strzaly_celne_gosc: 0,
                    zolte_kartki_gospodarz: 0,
                    zolte_kartki_gosc: 0,
                    czerwone_kartki_gospodarz: 0,
                    czerwone_kartki_gosc: 0,
                    posiadanie_gospodarz: 50,
                    posiadanie_gosc: 50
                });
                setCurrentScore({ home: 0, away: 0 });
            }
        };

        updateTimeline();
        const timer = setInterval(updateTimeline, 5000); // Update timeline view every 5s
        return () => clearInterval(timer);

    }, [match]);

    const handleBetClick = (type, courseId, ratio, selectionLabel) => {
        if (!ratio || !courseId || !match) return;
        const fallback = type === '1' ? match.nazwa_gospodarza : type === '2' ? match.nazwa_goscia : 'Remis';
        addBet({
            matchId: match.id,
            courseId: courseId,
            type: type,
            ratio: ratio,
            matchName: `${match.nazwa_gospodarza} - ${match.nazwa_goscia}`,
            selectionName: selectionLabel || fallback
        });
    };

    const isSelected = (courseId) => bets.some(b => b.courseId === courseId);

    // Grupowanie kursów wg rodzaju rynku
    const oddsByRodzaj = (match?.odds || []).reduce((acc, o) => {
        const key = o.rodzaj || '1X2';
        (acc[key] = acc[key] || []).push(o);
        return acc;
    }, {});

    const findOdd = (rodzaj, typ) => (oddsByRodzaj[rodzaj] || []).find(o => o.typ === typ);

    const renderTwoWayMarket = (title, rodzaj, leftTyp, rightTyp, leftLabel, rightLabel) => {
        const left = findOdd(rodzaj, leftTyp);
        const right = findOdd(rodzaj, rightTyp);
        if (!left && !right) return null;
        const line = left?.linia ?? right?.linia;
        const headerLine = line != null ? ` (${Number(line)})` : '';
        return (
            <div className="bg-dark/30 rounded-2xl p-6 border border-white/5">
                <h4 className="text-white font-bold mb-4">{title}{headerLine}</h4>
                <div className="grid grid-cols-2 gap-2">
                    {[{odd: left, label: leftLabel, typ: leftTyp}, {odd: right, label: rightLabel, typ: rightTyp}].map(({odd, label, typ}) => (
                        <button
                            key={typ}
                            disabled={!odd}
                            onClick={() => handleBetClick(typ, odd?.id, odd?.kurs, `${title}: ${label}`)}
                            className={`p-3 rounded-xl border flex flex-col items-center transition-all ${
                                odd && isSelected(odd.id)
                                ? 'bg-accent text-dark border-accent'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                            } ${!odd ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                            <span className="text-xs opacity-60 font-bold mb-1">{label}</span>
                            <span className="font-bold text-lg">{odd?.kurs ?? '-'}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    };


    if (loading) return <div className="p-10 text-center text-white">Ładowanie meczu...</div>;
    if (!match) return <div className="p-10 text-center text-white">Nie znaleziono meczu</div>;

    const timeDisplay = (() => {
        if (match.status === 'ZAKONCZONY') return 'FT';
        const diff = Math.floor((new Date() - new Date(match.data_spotkania)) / 60000);
        if (diff < 0) return new Date(match.data_spotkania).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        return diff > 90 ? '90+' : diff + "'";
    })();

    return (
        <div className="relative">
            <button onClick={onBack} className="mb-4 flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                ← Powrót
            </button>

            {/* Scoreboard */}
            <div className="bg-secondary/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-accent/10 mb-6 text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>
                 
                 <div className="text-sm font-bold text-accent mb-2 uppercase tracking-widest">{match.liga}</div>
                 <div className="text-3xl md:text-5xl font-black text-white mb-2 flex justify-center items-center gap-4 md:gap-8">
                     <span className="flex-1 text-right">{match.nazwa_gospodarza}</span>
                     <span className="bg-dark/50 px-4 py-2 rounded-lg border border-white/10 text-accent shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                         {currentScore.home} : {currentScore.away}
                     </span>
                     <span className="flex-1 text-left">{match.nazwa_goscia}</span>
                 </div>
                 <div className="text-light/60 font-mono text-lg animate-pulse">{timeDisplay}</div>
            </div>

            {/* Stats & Timeline Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Stats Column */}
                <div className="lg:col-span-1 space-y-6">
                     {/* Odds 1X2 */}
                    <div className="bg-dark/30 rounded-2xl p-6 border border-white/5">
                        <h4 className="text-white font-bold mb-4">Kursy 1X2</h4>
                         <div className="grid grid-cols-3 gap-2">
                            {(oddsByRodzaj['1X2'] || []).map(odd => (
                                <button
                                    key={odd.id}
                                    onClick={() => handleBetClick(odd.typ, odd.id, odd.kurs)}
                                    className={`p-3 rounded-xl border flex flex-col items-center transition-all ${
                                        isSelected(odd.id)
                                        ? 'bg-accent text-dark border-accent'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                    }`}
                                >
                                    <span className="text-xs opacity-60 font-bold mb-1">{odd.typ}</span>
                                    <span className="font-bold text-lg">{odd.kurs}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Liczba bramek (Over/Under) */}
                    {renderTwoWayMarket('Liczba bramek', 'OU_GOALS', 'OVER', 'UNDER', 'Powyżej', 'Poniżej')}

                    {/* BTTS - obie strzelą */}
                    {renderTwoWayMarket('Obie strzelą (BTTS)', 'BTTS', 'YES', 'NO', 'TAK', 'NIE')}

                    {/* Rzuty rożne (Over/Under) */}
                    {renderTwoWayMarket('Rzuty rożne', 'OU_CORNERS', 'OVER', 'UNDER', 'Powyżej', 'Poniżej')}

                    {/* Kartki (Over/Under) */}
                    {renderTwoWayMarket('Kartki', 'OU_CARDS', 'OVER', 'UNDER', 'Powyżej', 'Poniżej')}

                    {/* Live Stats */}
                    {currentStats && (
                        <div className="bg-dark/30 rounded-2xl p-6 border border-white/5">
                             <h4 className="text-white font-bold mb-4">Statystyki na żywo</h4>
                             
                             <div className="space-y-4">
                                 {/* Posiadanie piłki */}
                                 <div>
                                     <div className="flex justify-between text-xs text-white/60 mb-1">
                                         <span className="font-bold text-blue">{Math.round(currentStats.posiadanie_gospodarz)}%</span>
                                         <span>Posiadanie piłki</span>
                                         <span className="font-bold text-rose">{Math.round(currentStats.posiadanie_gosc)}%</span>
                                     </div>
                                     <div className="h-3 bg-dark rounded-full overflow-hidden flex">
                                         <div style={{ width: `${currentStats.posiadanie_gospodarz}%` }} className="bg-blue h-full transition-all duration-500" />
                                         <div style={{ width: `${currentStats.posiadanie_gosc}%` }} className="bg-rose h-full transition-all duration-500" />
                                     </div>
                                 </div>

                                 {/* Strzały */}
                                 <div>
                                     <div className="flex justify-between text-xs text-white/60 mb-1">
                                         <span>{currentStats.strzaly_gospodarz}</span>
                                         <span>Strzały</span>
                                         <span>{currentStats.strzaly_gosc}</span>
                                     </div>
                                     <div className="h-2 bg-dark rounded-full overflow-hidden flex">
                                         <div style={{ width: `${(currentStats.strzaly_gospodarz / (currentStats.strzaly_gospodarz + currentStats.strzaly_gosc || 1)) * 100}%` }} className="bg-blue h-full transition-all duration-500" />
                                         <div style={{ width: `${(currentStats.strzaly_gosc / (currentStats.strzaly_gospodarz + currentStats.strzaly_gosc || 1)) * 100}%` }} className="bg-rose h-full transition-all duration-500" />
                                     </div>
                                 </div>

                                 {/* Strzały celne */}
                                 <div>
                                     <div className="flex justify-between text-xs text-white/60 mb-1">
                                         <span>{currentStats.strzaly_celne_gospodarz}</span>
                                         <span>Strzały celne</span>
                                         <span>{currentStats.strzaly_celne_gosc}</span>
                                     </div>
                                     <div className="h-2 bg-dark rounded-full overflow-hidden flex">
                                         <div style={{ width: `${(currentStats.strzaly_celne_gospodarz / (currentStats.strzaly_celne_gospodarz + currentStats.strzaly_celne_gosc || 1)) * 100}%` }} className="bg-blue h-full transition-all duration-500" />
                                         <div style={{ width: `${(currentStats.strzaly_celne_gosc / (currentStats.strzaly_celne_gospodarz + currentStats.strzaly_celne_gosc || 1)) * 100}%` }} className="bg-rose h-full transition-all duration-500" />
                                     </div>
                                 </div>

                                 {/* Rzuty rożne */}
                                 <div>
                                     <div className="flex justify-between text-xs text-white/60 mb-1">
                                         <span>{currentStats.rozne_gospodarz}</span>
                                         <span>Rzuty rożne</span>
                                         <span>{currentStats.rozne_gosc}</span>
                                     </div>
                                     <div className="h-2 bg-dark rounded-full overflow-hidden flex">
                                         <div style={{ width: `${(currentStats.rozne_gospodarz / (currentStats.rozne_gospodarz + currentStats.rozne_gosc || 1)) * 100}%` }} className="bg-blue h-full transition-all duration-500" />
                                         <div style={{ width: `${(currentStats.rozne_gosc / (currentStats.rozne_gospodarz + currentStats.rozne_gosc || 1)) * 100}%` }} className="bg-rose h-full transition-all duration-500" />
                                     </div>
                                 </div>
                                 
                                 {/* Faule */}
                                 <div>
                                     <div className="flex justify-between text-xs text-white/60 mb-1">
                                         <span>{currentStats.faule_gospodarz}</span>
                                         <span>Faule</span>
                                         <span>{currentStats.faule_gosc}</span>
                                     </div>
                                     <div className="h-2 bg-dark rounded-full overflow-hidden flex">
                                         <div style={{ width: `${(currentStats.faule_gospodarz / (currentStats.faule_gospodarz + currentStats.faule_gosc || 1)) * 100}%` }} className="bg-blue h-full transition-all duration-500" />
                                         <div style={{ width: `${(currentStats.faule_gosc / (currentStats.faule_gospodarz + currentStats.faule_gosc || 1)) * 100}%` }} className="bg-rose h-full transition-all duration-500" />
                                     </div>
                                 </div>

                                 {/* Żółte kartki */}
                                 <div>
                                     <div className="flex justify-between text-xs text-white/60 mb-1">
                                         <span className="text-yellow-400">ŻK {currentStats.zolte_kartki_gospodarz}</span>
                                         <span>Żółte kartki</span>
                                         <span className="text-yellow-400">{currentStats.zolte_kartki_gosc} ŻK</span>
                                     </div>
                                 </div>

                                 {/* Czerwone kartki */}
                                 <div>
                                     <div className="flex justify-between text-xs text-white/60 mb-1">
                                         <span className="text-red-500">CK {currentStats.czerwone_kartki_gospodarz}</span>
                                         <span>Czerwone kartki</span>
                                         <span className="text-red-500">{currentStats.czerwone_kartki_gosc} CK</span>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>

                {/* Timeline Column */}
                <div className="lg:col-span-2 bg-secondary/30 backdrop-blur-md rounded-2xl p-6 border border-white/5 max-h-[600px] overflow-y-auto">
                    <h4 className="text-white font-bold mb-6 flex items-center gap-2">
                        <span className="animate-pulse text-rose-500">●</span> Relacja LIVE
                    </h4>
                    
                    <div className="space-y-6 relative ml-4 border-l border-white/10 pl-8 md:pl-12 py-2">
                        {timeline.length === 0 ? (
                            <div className="text-white/40 italic">Mecz jeszcze się nie rozpoczął...</div>
                        ) : (
                            timeline.map((event, idx) => (
                                <div key={idx} className="relative group">
                                    <div className={`absolute -left-[45px] md:-left-[61px] top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-4 border-secondary transition-transform group-hover:scale-110 ${
                                         event.komentarz.includes('GOOL') ? 'bg-accent text-dark' : 'bg-dark text-white/60'
                                    }`}>
                                        {event.minuta}'
                                    </div>
                                    
                                    <div className={`rounded-xl p-4 transition-all ${
                                        event.komentarz.includes('GOOL') 
                                        ? 'bg-gradient-to-r from-accent/20 to-transparent border border-accent/20' 
                                        : 'bg-white/5 border border-white/5'
                                    }`}>
                                         {event.komentarz.includes('GOOL') && (
                                             <div className="text-accent font-black text-sm mb-1 uppercase tracking-wider">GOOL!</div>
                                         )}
                                         <p className="text-white/90 text-sm leading-relaxed">{event.komentarz}</p>
                                         <div className="mt-2 text-xs font-mono text-white/40">Wynik: {event.wynik}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
