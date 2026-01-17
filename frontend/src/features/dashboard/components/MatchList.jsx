import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../api/client';
import { useBetting } from '../../../context/BettingContext';

export const MatchList = ({ onMatchSelect }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addBet, bets } = useBetting();

  const fetchMatches = async () => {
    try {
      const data = await apiClient.getMatches();
      setMatches(data);
    } catch (error) {
      console.error('Failed to fetch matches', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const calculateTime = (dateStr, status) => {
    const matchDate = new Date(dateStr);
    const now = new Date();
    
    if (status === 'ZAKONCZONY') return 'FT';
    if (status === 'PLANOWANY') {
        return matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // TRWA -> Calculate minutes
    const diffMs = now - matchDate;
    const minutes = Math.floor(diffMs / 60000);
    
    // If match started 5-10m ago (based on our importer), show minutes. 
    // Just clamp it to 0-90+
    if (minutes < 0) return matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (minutes > 90) return '90+';
    return `${minutes}'`;
  };

  const handleBetClick = (e, match, type, courseId, ratio) => {
    e.stopPropagation();
    if (!ratio || !courseId) return;
    
    addBet({
        matchId: match.id,
        courseId: courseId,
        type: type === '1' ? '1' : type === '2' ? '2' : 'X',
        ratio: ratio,
        matchName: `${match.nazwa_gospodarza} - ${match.nazwa_goscia}`,
        selectionName: type === '1' ? match.nazwa_gospodarza : type === '2' ? match.nazwa_goscia : 'Remis'
    });
  };

  const isSelected = (courseId) => {
    return bets.some(b => b.courseId === courseId);
  };

  if (loading && matches.length === 0) {
      return <div className="text-white text-center p-10">Ładowanie meczów...</div>;
  }

  return (
    <div className="py-2 md:py-4">
      <h3 className="text-xl md:text-2xl mb-4 md:mb-6 text-white flex items-center gap-2 md:gap-3 font-bold">
        <span className="text-2xl md:text-3xl">🔥</span> 
        <span>Top mecze na żywo</span>
      </h3>
      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {matches.map(match => {
          // Determine status text/color
          const timeDisplay = calculateTime(match.data_spotkania, match.status);
          const isLive = match.status === 'TRWA' || (match.status !== 'ZAKONCZONY' && match.status !== 'PLANOWANY');
          // Simple live check: if minutes contain '
          const reallyLive = timeDisplay.includes("'");

          return (
            <div 
              key={match.id} 
              onClick={() => onMatchSelect && onMatchSelect(match.id)}
              className={`cursor-pointer bg-secondary/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border ${reallyLive ? 'border-accent/40 shadow-accent/10' : 'border-accent/10'} hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 relative overflow-hidden`}
            >
              <div className="flex justify-between mb-3 md:mb-4 text-xs md:text-sm">
                <span className="bg-primary/80 text-accent px-2 md:px-3 py-1 rounded-full font-bold border border-accent/20">{match.liga}</span>
                <span className={`font-medium ${reallyLive ? 'text-accent animate-pulse' : 'text-light/60'}`}>
                    {reallyLive && '● '} {timeDisplay}
                </span>
                {(match.status === 'TRWA' || match.status === 'ZAKONCZONY') && (
                     <span className="font-bold text-white bg-dark/50 px-2 py-1 rounded">
                        {match.wynik_gospodarz ?? 0} : {match.wynik_gosc ?? 0}
                     </span>
                )}
              </div>
              
              <div className="flex justify-between items-center mb-4 md:mb-6 text-base md:text-xl">
                <div className="text-white font-bold flex-1 truncate pr-2">{match.nazwa_gospodarza}</div>
                <div className="text-accent text-xs md:text-sm mx-2 md:mx-4 font-bold flex-shrink-0">VS</div>
                <div className="text-white font-bold flex-1 text-right truncate pl-2">{match.nazwa_goscia}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <button 
                    onClick={(e) => handleBetClick(e, match, '1', match.odds?.ids?.home, match.odds?.home)}
                    className={`bg-primary/60 border rounded-xl p-2 md:p-4 flex flex-col items-center transition-all group ${
                        isSelected(match.odds?.ids?.home) 
                        ? 'bg-blue/40 border-blue shadow-lg shadow-blue/20 ring-1 ring-blue' 
                        : 'border-blue/30 hover:bg-blue/20 hover:border-blue'
                    } ${!match.odds?.home ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`text-xs mb-1 font-medium ${isSelected(match.odds?.ids?.home) ? 'text-white' : 'text-light/60 group-hover:text-blue'}`}>1</span>
                  <span className={`font-bold text-lg md:text-2xl ${isSelected(match.odds?.ids?.home) ? 'text-white' : 'text-white group-hover:text-blue'}`}>{match.odds?.home || '-'}</span>
                </button>
                
                <button 
                    onClick={(e) => handleBetClick(e, match, 'X', match.odds?.ids?.draw, match.odds?.draw)}
                    className={`bg-primary/60 border rounded-xl p-2 md:p-4 flex flex-col items-center transition-all group ${
                        isSelected(match.odds?.ids?.draw) 
                        ? 'bg-amber/40 border-amber shadow-lg shadow-amber/20 ring-1 ring-amber' 
                        : 'border-amber/30 hover:bg-amber/20 hover:border-amber'
                    } ${!match.odds?.draw ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`text-xs mb-1 font-medium ${isSelected(match.odds?.ids?.draw) ? 'text-white' : 'text-light/60 group-hover:text-amber'}`}>X</span>
                  <span className={`font-bold text-lg md:text-2xl ${isSelected(match.odds?.ids?.draw) ? 'text-white' : 'text-white group-hover:text-amber'}`}>{match.odds?.draw || '-'}</span>
                </button>
                
                <button 
                    onClick={(e) => handleBetClick(e, match, '2', match.odds?.ids?.away, match.odds?.away)}
                    className={`bg-primary/60 border rounded-xl p-2 md:p-4 flex flex-col items-center transition-all group ${
                        isSelected(match.odds?.ids?.away) 
                        ? 'bg-rose/40 border-rose shadow-lg shadow-rose/20 ring-1 ring-rose' 
                        : 'border-rose/30 hover:bg-rose/20 hover:border-rose'
                    } ${!match.odds?.away ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`text-xs mb-1 font-medium ${isSelected(match.odds?.ids?.away) ? 'text-white' : 'text-light/60 group-hover:text-rose'}`}>2</span>
                  <span className={`font-bold text-lg md:text-2xl ${isSelected(match.odds?.ids?.away) ? 'text-white' : 'text-white group-hover:text-rose'}`}>{match.odds?.away || '-'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
