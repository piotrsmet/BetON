import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import { useBetting } from '../../../context/BettingContext';

const isLockedStatus = (odd) => odd?.status === 'ZABLOKOWANY';

export const MatchDetails = () => {
    const { id: matchId } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [currentStats, setCurrentStats] = useState(null);
    const [currentScore, setCurrentScore] = useState({ home: 0, away: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('typy');
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
        }, 5000);

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
                if (minute < 0) {
                    minute = 0;
                    filteredEvents = [];
                } else {
                    filteredEvents = match.przebieg.filter(e => e.minuta <= minute);
                }
            }

            // Reverse for display (newest on top)
            setTimeline([...filteredEvents].reverse());
            
            // Update stats & score from latest available event
            if (filteredEvents.length > 0) {
                const latest = filteredEvents[filteredEvents.length - 1];
                
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
        const timer = setInterval(updateTimeline, 5000);
        return () => clearInterval(timer);

    }, [match]);

    const handleBetClick = (type, courseId, ratio, selectionLabel, locked, rodzaj) => {
        if (!ratio || !courseId || !match) return;
        if (locked) return;
        const fallback = type === '1' ? match.nazwa_gospodarza : type === '2' ? match.nazwa_goscia : 'Remis';
        addBet({
            matchId: match.id,
            courseId: courseId,
            type: type,
            ratio: ratio,
            rodzaj: rodzaj || '1X2',
            matchName: `${match.nazwa_gospodarza} - ${match.nazwa_goscia}`,
            selectionName: selectionLabel || fallback
        });
    };

    const isSelected = (courseId) => bets.some(b => b.courseId === courseId);

    // Animacja zmiany kursu
    const prevOddsRef = useRef({});
    const [oddsTrend, setOddsTrend] = useState({});
    useEffect(() => {
        if (!match?.odds) return;
        const trends = {};
        match.odds.forEach(o => {
            const prev = prevOddsRef.current[o.id];
            const curr = Number(o.kurs);
            if (prev != null && curr !== prev) {
                trends[o.id] = curr > prev ? 'up' : 'down';
            }
            prevOddsRef.current[o.id] = curr;
        });
        if (Object.keys(trends).length > 0) {
            setOddsTrend(prev => ({ ...prev, ...trends }));
            const tid = setTimeout(() => setOddsTrend({}), 2500);
            return () => clearTimeout(tid);
        }
    }, [match?.odds]);

    const trendClass = (id) => oddsTrend[id] === 'up' ? 'text-win' : oddsTrend[id] === 'down' ? 'text-lose' : '';

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
            <div className="bg-secondary/50 rounded-2xl p-5 border border-surface/30">
                <h4 className="text-white font-bold mb-4 text-sm">{title}{headerLine}</h4>
                <div className="grid grid-cols-2 gap-2">
                    {[{odd: left, label: leftLabel, typ: leftTyp}, {odd: right, label: rightLabel, typ: rightTyp}].map(({odd, label, typ}) => {
                        const locked = isLockedStatus(odd) || match?.status === 'ZAKONCZONY';
                        const isWon = match?.status === 'ZAKONCZONY' && odd?.wynik === 'WYGRANY';
                        const sel = odd && isSelected(odd.id);
                        return (
                            <button
                                key={typ}
                                disabled={!odd || locked}
                                onClick={() => handleBetClick(typ, odd?.id, odd?.kurs, `${title}: ${label}`, locked, rodzaj)}
                                className={`p-3 rounded-xl border flex flex-col items-center transition-all relative ${
                                    isWon
                                    ? 'bg-win/20 text-win border-win shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                    : sel
                                    ? 'bg-accent/20 text-accent border-accent'
                                    : 'bg-surface/30 border-surface/50 hover:bg-surface/60 text-white'
                                } ${!odd ? 'opacity-40 cursor-not-allowed' : ''} ${locked && !isWon ? 'opacity-60 cursor-not-allowed' : ''} ${odd?.status === 'ZABLOKOWANY' ? 'animate-pulse' : ''}`}
                            >
                                <span className="text-xs opacity-60 font-bold mb-1">{label}</span>
                                <span className={`font-bold text-lg transition-colors duration-500 ${!isWon && trendClass(odd?.id)}`}>{odd?.kurs ?? '-'}</span>
                                {odd?.status === 'ZABLOKOWANY' && !isWon && (
                                    <span className="absolute top-1 right-1 text-[10px] bg-dark/80 text-amber px-1.5 py-0.5 rounded font-bold">🔒</span>
                                )}
                                {isWon && (
                                    <span className="absolute -top-2 -right-2 text-sm bg-dark/80 rounded-full w-6 h-6 flex items-center justify-center border border-win text-win font-black">✓</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    // HTFT
    const renderHtft = () => {
        const list = oddsByRodzaj['HTFT'] || [];
        if (list.length === 0) return null;
        const map = Object.fromEntries(list.map(o => [o.typ, o]));
        const layout = [
            ['1/1', '1/X', '1/2'],
            ['X/1', 'X/X', 'X/2'],
            ['2/1', '2/X', '2/2']
        ];
        return (
            <div className="bg-secondary/50 rounded-2xl p-5 border border-surface/30">
                <h4 className="text-white font-bold mb-2 text-sm">1. połowa / mecz</h4>
                <p className="text-xs text-muted mb-4">Wybór wyniku do przerwy <b>i</b> wyniku końcowego.</p>
                <div className="grid grid-cols-3 gap-2">
                    {layout.flat().map(typ => {
                        const odd = map[typ];
                        const locked = isLockedStatus(odd) || match?.status === 'ZAKONCZONY';
                        const isWon = match?.status === 'ZAKONCZONY' && odd?.wynik === 'WYGRANY';
                        const sel = odd && isSelected(odd.id);
                        const [ht, ft] = typ.split('/');
                        return (
                            <button
                                key={typ}
                                disabled={!odd || locked}
                                onClick={() => handleBetClick(typ, odd?.id, odd?.kurs, `HT/FT ${typ}`, locked, 'HTFT')}
                                className={`p-2 rounded-xl border flex flex-col items-center transition-all relative ${
                                    isWon
                                    ? 'bg-win/20 text-win border-win shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                    : sel
                                    ? 'bg-accent/20 text-accent border-accent'
                                    : 'bg-surface/30 border-surface/50 hover:bg-surface/60 text-white'
                                } ${!odd ? 'opacity-40 cursor-not-allowed' : ''} ${locked && !isWon ? 'opacity-60 cursor-not-allowed' : ''} ${odd?.status === 'ZABLOKOWANY' ? 'animate-pulse' : ''}`}
                            >
                                <span className="text-[10px] opacity-60 font-bold tracking-wide">{ht} → {ft}</span>
                                <span className={`font-bold text-base transition-colors duration-500 ${!isWon && trendClass(odd?.id)}`}>{odd?.kurs ?? '-'}</span>
                                {odd?.status === 'ZABLOKOWANY' && !isWon && (
                                    <span className="absolute top-1 right-1 text-[9px] bg-dark/80 text-amber px-1 rounded font-bold">🔒</span>
                                )}
                                {isWon && (
                                    <span className="absolute -top-1.5 -right-1.5 text-[10px] bg-dark/80 rounded-full w-4 h-4 flex items-center justify-center border border-win text-win font-black">✓</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };


    if (loading) return <div className="p-10 text-center text-light">Ładowanie meczu...</div>;
    if (!match) return <div className="p-10 text-center text-light">Nie znaleziono meczu</div>;

    const timeDisplay = (() => {
        if (match.status === 'ZAKONCZONY') return 'FT';
        const diff = Math.floor((new Date() - new Date(match.data_spotkania)) / 60000);
        if (diff < 0) return new Date(match.data_spotkania).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        return diff > 90 ? '90+' : diff + "'";
    })();

    return (
        <div className="relative">
            <button onClick={() => navigate('/')} className="mb-4 flex items-center gap-2 text-muted hover:text-accent transition-colors font-medium">
                ← Powrót
            </button>

            {/* Scoreboard */}
            <div className="bg-secondary/60 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-surface/30 mb-6 text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>
                 
                 <div className="text-sm font-bold text-accent mb-2 uppercase tracking-widest">{match.liga}</div>
                 <div className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-2 flex justify-center items-center gap-3 md:gap-8">
                     <span className="flex-1 text-right truncate">{match.nazwa_gospodarza}</span>
                     <span className="bg-dark/60 px-3 md:px-4 py-1 md:py-2 rounded-xl border border-surface/30 text-accent shadow-[0_0_20px_rgba(240,185,11,0.1)] flex-shrink-0">
                         {currentScore.home} : {currentScore.away}
                     </span>
                     <span className="flex-1 text-left truncate">{match.nazwa_goscia}</span>
                 </div>
                 <div className="text-muted font-mono text-lg animate-pulse">{timeDisplay}</div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex bg-dark/40 p-1 rounded-2xl border border-surface/30 mb-6 mx-auto max-w-2xl relative z-10">
                <button 
                  onClick={() => setActiveTab('typy')}
                  className={`flex-1 px-4 py-2.5 md:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeTab === 'typy'
                      ? 'bg-gradient-to-r from-accent to-accent-hover text-dark shadow-lg' 
                      : 'text-muted hover:text-light hover:bg-surface/30'
                  }`}
                >
                  Typy
                </button>
                <button 
                  onClick={() => setActiveTab('statystyki')}
                  className={`flex-1 px-4 py-2.5 md:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeTab === 'statystyki'
                      ? 'bg-gradient-to-r from-accent to-accent-hover text-dark shadow-lg' 
                      : 'text-muted hover:text-light hover:bg-surface/30'
                  }`}
                >
                  Statystyki
                </button>
                <button 
                  onClick={() => setActiveTab('live')}
                  className={`flex-1 px-4 py-2.5 md:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'live'
                      ? 'bg-gradient-to-r from-accent to-accent-hover text-dark shadow-lg' 
                      : 'text-muted hover:text-light hover:bg-surface/30'
                  }`}
                >
                  {match.status === 'TRWA' && <span className={`w-2 h-2 rounded-full ${activeTab === 'live' ? 'bg-dark' : 'bg-live'} animate-pulse`}></span>}
                  Relacja LIVE
                </button>
            </div>

            {/* Tab Content */}
            <div className="w-full max-w-4xl mx-auto pb-24">
                
                {/* TYPY TAB */}
                {activeTab === 'typy' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 animate-fade-in">
                        <div className="space-y-4 lg:space-y-6">
                            {/* Odds 1X2 */}
                            <div className="bg-secondary/50 rounded-2xl p-5 border border-surface/30">
                                <h4 className="text-white font-bold mb-4 flex items-center justify-between text-sm">
                                    <span>Kursy 1X2</span>
                                    {match.status === 'TRWA' && <span className="text-[10px] uppercase tracking-widest text-live animate-pulse">● LIVE</span>}
                                </h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {(oddsByRodzaj['1X2'] || []).map(odd => {
                                        const locked = isLockedStatus(odd) || match.status === 'ZAKONCZONY';
                                        const isWon = match.status === 'ZAKONCZONY' && odd.wynik === 'WYGRANY';
                                        const sel = isSelected(odd.id);
                                        return (
                                            <button
                                                key={odd.id}
                                                disabled={locked}
                                                onClick={() => handleBetClick(odd.typ, odd.id, odd.kurs, undefined, locked, '1X2')}
                                                className={`p-3 rounded-xl border flex flex-col items-center transition-all relative ${
                                                    isWon
                                                    ? 'bg-win/20 text-win border-win shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                                    : sel
                                                    ? 'bg-accent/20 text-accent border-accent'
                                                    : 'bg-surface/30 border-surface/50 hover:bg-surface/60 text-white'
                                                } ${locked && !isWon ? 'opacity-60 cursor-not-allowed' : ''} ${odd.status === 'ZABLOKOWANY' ? 'animate-pulse' : ''}`}
                                            >
                                                <span className="text-xs opacity-60 font-bold mb-1">{odd.typ}</span>
                                                <span className={`font-bold text-lg transition-colors duration-500 ${!isWon && trendClass(odd.id)}`}>{odd.kurs}</span>
                                                {odd.status === 'ZABLOKOWANY' && !isWon && (
                                                    <span className="absolute top-1 right-1 text-[10px] bg-dark/80 text-amber px-1.5 py-0.5 rounded font-bold">🔒</span>
                                                )}
                                                {isWon && (
                                                    <span className="absolute -top-2 -right-2 text-sm bg-dark/80 rounded-full w-6 h-6 flex items-center justify-center border border-win text-win font-black">✓</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Bet builder info */}
                            {(() => {
                                const myMatchBets = bets.filter(b => b.matchId === match.id);
                                if (myMatchBets.length < 2) return null;
                                return (
                                    <div className="bg-gradient-to-r from-accent/15 to-accent-hover/10 border border-accent/30 rounded-2xl p-4 shadow-[0_0_15px_rgba(240,185,11,0.15)]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-2xl">🎯</span>
                                            <span className="font-black text-accent uppercase tracking-wider text-sm">Bet Builder</span>
                                            <span className="bg-accent text-dark text-xs font-black px-2 py-0.5 rounded-full">x{myMatchBets.length}</span>
                                        </div>
                                        <p className="text-xs text-light/70">Zakłady z tego meczu zostaną złączone z rabatem korelacyjnym 20% (wszystkie muszą wejść).</p>
                                    </div>
                                );
                            })()}
                            
                            {renderTwoWayMarket('Liczba bramek', 'OU_GOALS', 'OVER', 'UNDER', 'Powyżej', 'Poniżej')}
                            {renderTwoWayMarket('Obie strzelą (BTTS)', 'BTTS', 'YES', 'NO', 'TAK', 'NIE')}
                        </div>
                        
                        <div className="space-y-4 lg:space-y-6">
                            {renderTwoWayMarket('Rzuty rożne', 'OU_CORNERS', 'OVER', 'UNDER', 'Powyżej', 'Poniżej')}
                            {renderTwoWayMarket('Kartki', 'OU_CARDS', 'OVER', 'UNDER', 'Powyżej', 'Poniżej')}
                            {renderTwoWayMarket('Celne strzały', 'OU_SOT', 'OVER', 'UNDER', 'Powyżej', 'Poniżej')}
                            {renderTwoWayMarket('Spalone', 'OU_OFFSIDES', 'OVER', 'UNDER', 'Powyżej', 'Poniżej')}
                            {renderHtft()}
                        </div>
                    </div>
                )}

                {/* STATYSTYKI TAB */}
                {activeTab === 'statystyki' && (
                    <div className="animate-fade-in">
                        {currentStats ? (
                            <div className="bg-secondary/50 rounded-3xl p-6 md:p-8 border border-surface/30 shadow-2xl">
                                <h4 className="text-white font-bold mb-8 text-lg md:text-xl text-center">Statystyki meczowe</h4>
                                
                                <div className="space-y-6 md:space-y-8 max-w-2xl mx-auto">
                                    {/* Posiadanie piłki */}
                                    <div>
                                        <div className="flex justify-between text-sm md:text-base mb-2 font-medium">
                                            <span className="text-info w-12 text-right">{Math.round(currentStats.posiadanie_gospodarz)}%</span>
                                            <span className="text-muted uppercase tracking-wider text-xs md:text-sm pt-1">Posiadanie piłki</span>
                                            <span className="text-live w-12 text-left">{Math.round(currentStats.posiadanie_gosc)}%</span>
                                        </div>
                                        <div className="h-3 md:h-4 bg-dark rounded-full overflow-hidden flex shadow-inner">
                                            <div style={{ width: `${currentStats.posiadanie_gospodarz}%` }} className="bg-gradient-to-r from-info/60 to-info h-full transition-all duration-500" />
                                            <div style={{ width: `${currentStats.posiadanie_gosc}%` }} className="bg-gradient-to-l from-live/60 to-live h-full transition-all duration-500" />
                                        </div>
                                    </div>

                                    {/* Strzały */}
                                    <div>
                                        <div className="flex justify-between text-sm md:text-base mb-2 font-medium">
                                            <span className="text-white w-12 text-right">{currentStats.strzaly_gospodarz}</span>
                                            <span className="text-muted uppercase tracking-wider text-xs md:text-sm pt-1">Strzały</span>
                                            <span className="text-white w-12 text-left">{currentStats.strzaly_gosc}</span>
                                        </div>
                                        <div className="h-2.5 md:h-3 bg-dark rounded-full overflow-hidden flex shadow-inner">
                                            <div style={{ width: `${(currentStats.strzaly_gospodarz / (currentStats.strzaly_gospodarz + currentStats.strzaly_gosc || 1)) * 100}%` }} className="bg-info h-full transition-all duration-500" />
                                            <div style={{ width: `${(currentStats.strzaly_gosc / (currentStats.strzaly_gospodarz + currentStats.strzaly_gosc || 1)) * 100}%` }} className="bg-live h-full transition-all duration-500" />
                                        </div>
                                    </div>

                                    {/* Strzały celne */}
                                    <div>
                                        <div className="flex justify-between text-sm md:text-base mb-2 font-medium">
                                            <span className="text-white w-12 text-right">{currentStats.strzaly_celne_gospodarz}</span>
                                            <span className="text-muted uppercase tracking-wider text-xs md:text-sm pt-1">Strzały celne</span>
                                            <span className="text-white w-12 text-left">{currentStats.strzaly_celne_gosc}</span>
                                        </div>
                                        <div className="h-2.5 md:h-3 bg-dark rounded-full overflow-hidden flex shadow-inner">
                                            <div style={{ width: `${(currentStats.strzaly_celne_gospodarz / (currentStats.strzaly_celne_gospodarz + currentStats.strzaly_celne_gosc || 1)) * 100}%` }} className="bg-info h-full transition-all duration-500" />
                                            <div style={{ width: `${(currentStats.strzaly_celne_gosc / (currentStats.strzaly_celne_gospodarz + currentStats.strzaly_celne_gosc || 1)) * 100}%` }} className="bg-live h-full transition-all duration-500" />
                                        </div>
                                    </div>

                                    {/* Rzuty rożne */}
                                    <div>
                                        <div className="flex justify-between text-sm md:text-base mb-2 font-medium">
                                            <span className="text-white w-12 text-right">{currentStats.rozne_gospodarz}</span>
                                            <span className="text-muted uppercase tracking-wider text-xs md:text-sm pt-1">Rzuty rożne</span>
                                            <span className="text-white w-12 text-left">{currentStats.rozne_gosc}</span>
                                        </div>
                                        <div className="h-2.5 md:h-3 bg-dark rounded-full overflow-hidden flex shadow-inner">
                                            <div style={{ width: `${(currentStats.rozne_gospodarz / (currentStats.rozne_gospodarz + currentStats.rozne_gosc || 1)) * 100}%` }} className="bg-info h-full transition-all duration-500" />
                                            <div style={{ width: `${(currentStats.rozne_gosc / (currentStats.rozne_gospodarz + currentStats.rozne_gosc || 1)) * 100}%` }} className="bg-live h-full transition-all duration-500" />
                                        </div>
                                    </div>
                                    
                                    {/* Faule */}
                                    <div>
                                        <div className="flex justify-between text-sm md:text-base mb-2 font-medium">
                                            <span className="text-white w-12 text-right">{currentStats.faule_gospodarz}</span>
                                            <span className="text-muted uppercase tracking-wider text-xs md:text-sm pt-1">Faule</span>
                                            <span className="text-white w-12 text-left">{currentStats.faule_gosc}</span>
                                        </div>
                                        <div className="h-2.5 md:h-3 bg-dark rounded-full overflow-hidden flex shadow-inner">
                                            <div style={{ width: `${(currentStats.faule_gospodarz / (currentStats.faule_gospodarz + currentStats.faule_gosc || 1)) * 100}%` }} className="bg-info h-full transition-all duration-500" />
                                            <div style={{ width: `${(currentStats.faule_gosc / (currentStats.faule_gospodarz + currentStats.faule_gosc || 1)) * 100}%` }} className="bg-live h-full transition-all duration-500" />
                                        </div>
                                    </div>

                                    {/* Kartki */}
                                    <div className="pt-4 mt-4 border-t border-surface/20">
                                        <div className="flex justify-around">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-xs text-muted uppercase">Gospodarze</span>
                                                <div className="flex gap-4">
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-3.5 h-5 bg-amber rounded-sm shadow-[0_0_8px_rgba(251,191,36,0.3)]"></div>
                                                        <span className="font-bold text-white ml-1">{currentStats.zolte_kartki_gospodarz}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-3.5 h-5 bg-lose rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.3)]"></div>
                                                        <span className="font-bold text-white ml-1">{currentStats.czerwone_kartki_gospodarz}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="w-px bg-surface/30 h-10"></div>
                                            
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-xs text-muted uppercase">Goście</span>
                                                <div className="flex gap-4">
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-3.5 h-5 bg-amber rounded-sm shadow-[0_0_8px_rgba(251,191,36,0.3)]"></div>
                                                        <span className="font-bold text-white ml-1">{currentStats.zolte_kartki_gosc}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-3.5 h-5 bg-lose rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.3)]"></div>
                                                        <span className="font-bold text-white ml-1">{currentStats.czerwone_kartki_gosc}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-muted p-12 bg-secondary/30 rounded-3xl border border-surface/30">
                                <span className="text-4xl block mb-4 opacity-50">📊</span>
                                Brak dostępnych statystyk z tego spotkania.
                            </div>
                        )}
                    </div>
                )}

                {/* RELACJA LIVE TAB */}
                {activeTab === 'live' && (
                    <div className="bg-secondary/30 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-surface/30 max-h-[700px] overflow-y-auto animate-fade-in shadow-2xl">
                        <div className="space-y-6 relative ml-4 md:ml-10 border-l-2 border-surface/30 pl-8 md:pl-12 py-2">
                            {timeline.length === 0 ? (
                                <div className="text-muted italic flex items-center gap-3">
                                    <span className="text-2xl">⏳</span>
                                    Mecz jeszcze się nie rozpoczął lub brak wydarzeń...
                                </div>
                            ) : (
                                timeline.map((event, idx) => (
                                    <div key={idx} className="relative group">
                                        <div className={`absolute -left-[45px] md:-left-[63px] top-0 w-8 md:w-10 h-8 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm border-4 border-secondary shadow-lg transition-transform group-hover:scale-110 ${
                                             event.komentarz.includes('GOOL') ? 'bg-accent text-dark border-accent/20' : 'bg-surface text-muted border-surface/20'
                                        }`}>
                                            {event.minuta}'
                                        </div>
                                        
                                        <div className={`rounded-2xl p-5 md:p-6 transition-all ${
                                            event.komentarz.includes('GOOL') 
                                            ? 'bg-gradient-to-r from-accent/15 to-transparent border border-accent/30 shadow-[0_0_20px_rgba(240,185,11,0.1)]' 
                                            : 'bg-surface/20 border border-surface/20 hover:bg-surface/30 hover:border-surface/40'
                                        }`}>
                                             {event.komentarz.includes('GOOL') && (
                                                 <div className="text-accent font-black text-sm mb-2 uppercase tracking-wider flex items-center gap-2">
                                                     <span>⚽</span> GOOL!
                                                 </div>
                                             )}
                                             <p className={`text-sm md:text-base leading-relaxed ${event.komentarz.includes('GOOL') ? 'text-white font-bold' : 'text-light'}`}>
                                                 {event.komentarz}
                                             </p>
                                             <div className="mt-3 inline-block bg-dark/50 px-3 py-1 rounded-lg text-xs font-mono text-muted border border-surface/30 shadow-inner">
                                                 Wynik: <span className={event.komentarz.includes('GOOL') ? 'text-accent font-bold' : 'text-white'}>{event.wynik}</span>
                                             </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
