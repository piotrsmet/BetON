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
    <header className="flex flex-wrap justify-between items-center px-4 md:px-6 lg:px-8 py-3 md:py-4 bg-secondary/90 backdrop-blur-xl border-b border-accent/10 sticky top-0 z-50 shadow-xl gap-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl md:text-3xl font-black bg-gradient-to-r from-accent to-emerald bg-clip-text text-transparent uppercase tracking-tight">
          BetON
        </span>
        <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full tracking-wider hidden sm:inline font-bold">
          LIVE
        </span>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
        <div className="relative bg-gradient-to-br from-secondary to-primary px-3 md:px-4 py-2 rounded-xl border border-accent/20 min-w-[100px] md:min-w-[120px] overflow-hidden shadow-lg">
          <span className="text-xs text-accent uppercase block font-bold">Saldo</span>
          <span className="font-mono text-lg md:text-xl font-bold text-white block">
            {displayBalance.toFixed(2)} PLN
          </span>
          <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-accent/10 to-transparent skew-x-[-20deg] animate-[shine_3s_infinite]" />
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-accent to-emerald rounded-full flex items-center justify-center font-bold text-dark shadow-lg">
            {username ? username[0].toUpperCase() : 'U'}
          </div>
          <span className="font-medium text-white hidden lg:inline">{username}</span>
        </div>

        <button 
          onClick={onLogout}
          className="bg-primary border border-accent/20 text-light hover:bg-secondary hover:border-accent/40 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm transition-all font-medium shadow-md"
        >
          Wyloguj
        </button>
      </div>
    </header>
  );
};
