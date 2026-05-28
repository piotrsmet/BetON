import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const Header = ({ username, balance, onLogout }) => {
  const [displayBalance, setDisplayBalance] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

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
      
      // Easing function for smooth feel
      const ease = 1 - Math.pow(1 - progress, 3);
      
      setDisplayBalance(start + (end - start) * ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [balance]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname.startsWith('/match');
    return location.pathname.startsWith(path);
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-center px-4 md:px-8 py-3 bg-primary/80 backdrop-blur-2xl border-b border-surface/40 sticky top-0 z-50 shadow-2xl gap-4">
      {/* Top row for mobile (Logo + Balance) */}
      <div className="w-full md:w-auto flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <span className="text-2xl md:text-3xl font-black bg-gradient-to-r from-accent via-amber to-accent-hover bg-clip-text text-transparent uppercase tracking-tighter group-hover:drop-shadow-[0_0_8px_rgba(240,185,11,0.5)] transition-all">
            BetON
          </span>
          <span className="text-xs bg-live/15 text-live px-2 py-1 rounded-full tracking-wider hidden sm:inline font-bold border border-live/30 shadow-[0_0_10px_rgba(244,63,94,0.2)] animate-pulse">
            LIVE
          </span>
        </div>

        {/* Mobile Balance & User (Visible only on mobile) */}
        <div className="flex md:hidden items-center gap-3">
          <div className="relative bg-dark/50 px-3 py-1.5 rounded-xl border border-surface/50 overflow-hidden cursor-pointer" 
               onClick={async () => {
                   try {
                       const { apiClient } = await import('../../../api/client');
                       await apiClient.deposit(100);
                       window.location.reload(); 
                   } catch (e) {
                       alert('Błąd doładowania');
                   }
               }}>
            <span className="font-mono text-sm font-bold text-white block">
              {displayBalance.toFixed(2)} PLN
            </span>
          </div>
          <button onClick={onLogout} className="w-8 h-8 bg-surface/50 rounded-full flex items-center justify-center text-xs border border-surface/50 text-muted">
             ✕
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex bg-dark/40 p-1 rounded-2xl border border-surface/30">
        <button 
          onClick={() => navigate('/')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            isActive('/') 
              ? 'bg-gradient-to-r from-accent to-accent-hover text-dark shadow-lg shadow-accent/20' 
              : 'text-muted hover:text-light hover:bg-surface/30'
          }`}
        >
          Zakłady
        </button>
        <button 
          onClick={() => navigate('/coupons')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            isActive('/coupons') 
              ? 'bg-gradient-to-r from-accent to-accent-hover text-dark shadow-lg shadow-accent/20' 
              : 'text-muted hover:text-light hover:bg-surface/30'
          }`}
        >
          Moje Kupony
        </button>
      </nav>
      
      {/* Desktop Balance & User */}
      <div className="hidden md:flex items-center gap-4">
        <div className="relative bg-dark/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-surface/50 overflow-hidden shadow-lg group cursor-pointer hover:border-accent/50 transition-colors" 
             onClick={async () => {
                 try {
                     const { apiClient } = await import('../../../api/client');
                     await apiClient.deposit(100);
                     window.location.reload(); 
                 } catch (e) {
                     alert('Błąd doładowania');
                 }
             }}>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted uppercase font-bold group-hover:text-accent transition-colors">Saldo</span>
            <span className="text-xs text-win uppercase hidden group-hover:block font-bold absolute right-4 bg-dark/80 px-1">+100 PLN</span>
            <span className="font-mono text-lg font-black text-white">
              {displayBalance.toFixed(2)} PLN
            </span>
          </div>
          <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-accent/10 to-transparent skew-x-[-20deg] group-hover:animate-[shine_1.5s_ease-in-out]" />
        </div>
        
        <div className="flex items-center gap-3 pl-2 border-l border-surface/50">
          <div className="w-10 h-10 bg-gradient-to-br from-surface to-dark rounded-full border border-surface/50 flex items-center justify-center font-bold text-accent shadow-lg text-sm">
            {username ? username[0].toUpperCase() : 'U'}
          </div>
          <button 
            onClick={onLogout}
            className="text-xs text-muted hover:text-lose transition-colors font-bold uppercase tracking-wider"
          >
            Wyloguj
          </button>
        </div>
      </div>
    </header>
  );
};
