import React, { useState, useEffect } from 'react';

const MOCK_MATCHES = [
  { id: 1, home: 'Manchester City', away: 'Liverpool', time: '20:45', league: 'Premier League', odds: { home: 1.95, draw: 3.80, away: 3.60 } },
  { id: 2, home: 'Arsenal', away: 'Chelsea', time: '18:30', league: 'Premier League', odds: { home: 2.10, draw: 3.40, away: 3.50 } },
  { id: 3, home: 'Manchester United', away: 'Tottenham', time: '15:30', league: 'Premier League', odds: { home: 2.30, draw: 3.30, away: 3.10 } },
  { id: 4, home: 'Newcastle', away: 'Aston Villa', time: '21:00', league: 'Premier League', odds: { home: 2.05, draw: 3.50, away: 3.80 } },
  { id: 5, home: 'Brighton', away: 'West Ham', time: '17:00', league: 'Premier League', odds: { home: 2.20, draw: 3.45, away: 3.30 } },
  { id: 6, home: 'Brentford', away: 'Fulham', time: '19:15', league: 'Premier League', odds: { home: 2.50, draw: 3.20, away: 2.90 } },
];

export const MatchList = () => {
  const [matches, setMatches] = useState(MOCK_MATCHES);

  useEffect(() => {
    const interval = setInterval(() => {
      setMatches(currentMatches => 
        currentMatches.map(match => {
          if (Math.random() > 0.7) {
            const changeType = Math.random() > 0.5 ? 'up' : 'down';
            const multiplier = changeType === 'up' ? 1.05 : 0.95;
            
            return {
              ...match,
              odds: {
                home: parseFloat((match.odds.home * (Math.random() > 0.5 ? multiplier : 1)).toFixed(2)),
                draw: parseFloat((match.odds.draw * (Math.random() > 0.5 ? multiplier : 1)).toFixed(2)),
                away: parseFloat((match.odds.away * (Math.random() > 0.5 ? multiplier : 1)).toFixed(2)),
              },
              lastChange: changeType
            };
          }
          return { ...match, lastChange: null };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-2 md:py-4">
      <h3 className="text-xl md:text-2xl mb-4 md:mb-6 text-white flex items-center gap-2 md:gap-3 font-bold">
        <span className="text-2xl md:text-3xl">🔥</span> 
        <span>Top mecze na żywo</span>
      </h3>
      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {matches.map(match => {
          const flashClass = match.lastChange === 'up' 
            ? 'animate-[flashGreen_0.5s_ease]' 
            : match.lastChange === 'down' 
            ? 'animate-[flashRed_0.5s_ease]'
            : '';
          
          return (
            <div 
              key={match.id} 
              className={`bg-secondary/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-accent/10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/10 hover:border-accent/30 transition-all duration-300 relative overflow-hidden ${flashClass}`}
            >
              <div className="flex justify-between mb-3 md:mb-4 text-xs md:text-sm">
                <span className="bg-primary/80 text-accent px-2 md:px-3 py-1 rounded-full font-bold border border-accent/20">{match.league}</span>
                <span className="font-medium text-light/60">{match.time}</span>
              </div>
              
              <div className="flex justify-between items-center mb-4 md:mb-6 text-base md:text-xl">
                <div className="text-white font-bold flex-1 truncate pr-2">{match.home}</div>
                <div className="text-accent text-xs md:text-sm mx-2 md:mx-4 font-bold flex-shrink-0">VS</div>
                <div className="text-white font-bold flex-1 text-right truncate pl-2">{match.away}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <button className="bg-primary/60 border border-blue/30 rounded-xl p-2 md:p-4 flex flex-col items-center hover:bg-blue/20 hover:border-blue transition-all group">
                  <span className="text-xs text-light/60 mb-1 font-medium group-hover:text-blue">1</span>
                  <span className="font-bold text-lg md:text-2xl text-white group-hover:text-blue">{match.odds.home.toFixed(2)}</span>
                </button>
                <button className="bg-primary/60 border border-amber/30 rounded-xl p-2 md:p-4 flex flex-col items-center hover:bg-amber/20 hover:border-amber transition-all group">
                  <span className="text-xs text-light/60 mb-1 font-medium group-hover:text-amber">X</span>
                  <span className="font-bold text-lg md:text-2xl text-white group-hover:text-amber">{match.odds.draw.toFixed(2)}</span>
                </button>
                <button className="bg-primary/60 border border-rose/30 rounded-xl p-2 md:p-4 flex flex-col items-center hover:bg-rose/20 hover:border-rose transition-all group">
                  <span className="text-xs text-light/60 mb-1 font-medium group-hover:text-rose">2</span>
                  <span className="font-bold text-lg md:text-2xl text-white group-hover:text-rose">{match.odds.away.toFixed(2)}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
