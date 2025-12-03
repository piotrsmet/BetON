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
    <div className="py-4">
      <h3 className="text-2xl mb-6 text-white flex items-center gap-3 font-bold">
        <span className="text-3xl">🔥</span> 
        NA ŻYWO / HITY DNIA
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {matches.map(match => {
          const flashClass = match.lastChange === 'up' 
            ? 'animate-[flashGreen_0.5s_ease]' 
            : match.lastChange === 'down' 
            ? 'animate-[flashRed_0.5s_ease]'
            : '';
          
          return (
            <div 
              key={match.id} 
              className={`bg-secondary rounded-xl p-6 border-2 border-accent/20 hover:-translate-y-1 hover:shadow-2xl hover:border-accent transition-all duration-300 relative overflow-hidden ${flashClass}`}
            >
              <div className="flex justify-between mb-4 text-sm text-light/60">
                <span className="bg-accent/30 px-3 py-1 rounded-md text-light font-medium">{match.league}</span>
                <span className="font-medium">{match.time}</span>
              </div>
              
              <div className="flex justify-between items-center mb-6 text-xl">
                <div className="text-white font-bold flex-1">{match.home}</div>
                <div className="text-accent/70 text-sm mx-4 font-black">VS</div>
                <div className="text-white font-bold flex-1 text-right">{match.away}</div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button className="bg-primary border-2 border-accent/30 rounded-lg p-4 flex flex-col items-center hover:bg-accent hover:border-accent transition-all text-white group">
                  <span className="text-xs text-light/60 mb-1 font-medium">1</span>
                  <span className="font-bold text-2xl text-accent group-hover:text-white">{match.odds.home.toFixed(2)}</span>
                </button>
                <button className="bg-primary border-2 border-accent/30 rounded-lg p-4 flex flex-col items-center hover:bg-accent hover:border-accent transition-all text-white group">
                  <span className="text-xs text-light/60 mb-1 font-medium">X</span>
                  <span className="font-bold text-2xl text-accent group-hover:text-white">{match.odds.draw.toFixed(2)}</span>
                </button>
                <button className="bg-primary border-2 border-accent/30 rounded-lg p-4 flex flex-col items-center hover:bg-accent hover:border-accent transition-all text-white group">
                  <span className="text-xs text-light/60 mb-1 font-medium">2</span>
                  <span className="font-bold text-2xl text-accent group-hover:text-white">{match.odds.away.toFixed(2)}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
