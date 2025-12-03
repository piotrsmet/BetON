import React, { useState, useEffect } from 'react';

export const Header = ({ username, balance, onLogout }) => {
  const [displayBalance, setDisplayBalance] = useState(0);

  // Rolling number animation for balance
  useEffect(() => {
    const targetBalance = parseFloat(balance) || 0;
    let start = 0;
    const end = targetBalance;
    const duration = 2000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for "slot machine" feel (easeOutElastic)
      const ease = 1 - Math.pow(1 - progress, 3);
      
      setDisplayBalance(start + (end - start) * ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [balance]);

  return (
    <header className="flex justify-between items-center px-8 py-4 bg-primary/95 backdrop-blur-md border-b border-light/10 sticky top-0 z-50 shadow-2xl">
      <div className="flex items-center gap-2">
        <span className="text-3xl font-black bg-gradient-to-r from-accent to-light bg-clip-text text-transparent uppercase tracking-tight">
          BetON
        </span>
        <span className="text-xs bg-secondary px-2 py-1 rounded text-light/70 tracking-wider">
          CASINO & SPORT
        </span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative bg-gradient-to-b from-secondary to-primary px-4 py-2 rounded-lg border border-accent/40 min-w-[120px] overflow-hidden">
          <span className="text-xs text-light/60 uppercase block">SALDO</span>
          <span className="font-mono text-xl font-bold text-accent block">
            {displayBalance.toFixed(2)} PLN
          </span>
          <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] animate-[shine_3s_infinite]" />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center font-bold text-white border-2 border-light/20">
            {username ? username[0].toUpperCase() : 'U'}
          </div>
          <span className="font-medium text-light">{username}</span>
        </div>

        <button 
          onClick={onLogout}
          className="bg-transparent border border-accent/40 text-light/80 hover:border-accent/60 hover:text-white hover:bg-light/5 px-4 py-2 rounded-md text-sm transition-all"
        >
          Wyloguj
        </button>
      </div>
    </header>
  );
};
