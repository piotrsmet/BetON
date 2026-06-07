import React, { useState, useMemo } from 'react';
import { useBetting } from '../../../context/BettingContext';
import { apiClient } from '../../../api/client';

const BET_BUILDER_DISCOUNT = 0.80;

// Mapa rodzaj -> krótka nazwa rynku
const RODZAJ_LABEL = {
  '1X2': 'Wynik 1X2',
  'OU_GOALS': 'Liczba bramek',
  'BTTS': 'Obie strzelą',
  'OU_CORNERS': 'Rzuty rożne',
  'OU_CARDS': 'Kartki',
  'OU_SOT': 'Celne strzały',
  'OU_OFFSIDES': 'Spalone',
  'HTFT': '1.poł / mecz'
};

export const Betslip = () => {
  const { bets, removeBet, clearBets } = useBetting();
  const [stake, setStake] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Grupowanie po meczu
  const grouped = useMemo(() => {
    const map = new Map();
    bets.forEach(b => {
      if (!map.has(b.matchId)) map.set(b.matchId, { matchName: b.matchName, legs: [] });
      map.get(b.matchId).legs.push(b);
    });
    return Array.from(map.entries()).map(([matchId, g]) => {
      const rawOdds = g.legs.reduce((acc, l) => acc * parseFloat(l.ratio || 1), 1);
      const isBuilder = g.legs.length >= 2;
      const effectiveOdds = isBuilder ? rawOdds * BET_BUILDER_DISCOUNT : rawOdds;
      return { matchId, matchName: g.matchName, legs: g.legs, rawOdds, effectiveOdds, isBuilder };
    });
  }, [bets]);

  const totalOdds = grouped.reduce((acc, g) => acc * g.effectiveOdds, 1);
  const potentialWin = (stake * totalOdds).toFixed(2);
  const hasBuilder = grouped.some(g => g.isBuilder);

  const handlePlaceBet = async () => {
    if (stake <= 0) return;
    setIsSubmitting(true);
    setResult(null);
    try {
      await apiClient.createCoupon(stake, bets.map(b => b.courseId));
      setResult({ type: 'success', message: 'Kupon postawiony pomyślnie!' });
      clearBets();
      setTimeout(() => {
        setIsMobileOpen(false);
        window.location.reload();
      }, 1500);
    } catch (err) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const BetslipContent = ({ isMobile = false }) => {
    if (bets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-muted text-center p-8 py-12">
          <div className="text-7xl mb-6 opacity-20">📋</div>
          <p className="font-semibold text-lg mb-2 text-light/60">Twój kupon jest pusty</p>
          <small className="text-sm mt-1">Kliknij na kurs, aby dodać zakład</small>
          {result && result.type === 'success' && (
            <div className="mt-4 p-3 bg-win/15 text-win rounded-lg text-sm">{result.message}</div>
          )}
        </div>
      );
    }

    return (
      <>
        <div className={`overflow-y-auto p-4 space-y-3 ${isMobile ? 'max-h-[40vh]' : 'flex-1 max-h-[55vh]'}`}>
          {grouped.map(group => (
            <div key={group.matchId} className={`rounded-xl border ${group.isBuilder ? 'border-accent/40 bg-gradient-to-br from-accent/10 to-accent-hover/5 shadow-lg shadow-accent/5' : 'border-surface/30 bg-dark/30'}`}>
              {/* Nagłówek grupy */}
              <div className="px-3 py-2 border-b border-surface/20 flex justify-between items-center">
                <h4 className="text-sm font-bold text-light truncate">{group.matchName}</h4>
                {group.isBuilder && (
                  <span className="text-[10px] uppercase tracking-widest text-accent font-black bg-accent/15 px-2 py-0.5 rounded-full ml-2 shrink-0">
                    🎯 Bet Builder
                  </span>
                )}
              </div>

              {/* Pozycje */}
              <div className="divide-y divide-surface/15">
                {group.legs.map(bet => (
                  <div key={bet.courseId} className="px-3 py-2 flex justify-between items-center group">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted font-bold">
                        {RODZAJ_LABEL[bet.rodzaj] || bet.rodzaj || 'Rynek'}
                      </div>
                      <div className="text-sm text-light truncate">{bet.selectionName}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-win bg-win/10 px-2 py-1 rounded text-sm">{bet.ratio}</span>
                      <button onClick={() => removeBet(bet.courseId)} className="text-muted hover:text-lose transition-colors text-sm">✕</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stopka grupy (gdy bet builder) */}
              {group.isBuilder && (
                <div className="px-3 py-2 bg-dark/30 border-t border-accent/15 text-xs flex justify-between">
                  <span className="text-muted">Surowy kurs: <span className="line-through">{group.rawOdds.toFixed(2)}</span></span>
                  <span className="text-accent font-bold">→ {group.effectiveOdds.toFixed(2)} <span className="text-muted">(-20%)</span></span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Podsumowanie */}
        <div className="p-5 bg-dark/40 border-t border-surface/20">
          {hasBuilder && (
            <div className="mb-3 p-2 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent/90">
              🎯 Kupon zawiera <b>bet builder</b> — rabat korelacyjny zastosowany.
            </div>
          )}

          <div className="flex justify-between text-sm mb-2 text-muted">
            <span>Kurs całkowity:</span>
            <span className="font-bold text-white">{totalOdds.toFixed(2)}</span>
          </div>

          <div className="mb-4">
            <label className="text-xs text-muted block mb-1">Stawka (PLN)</label>
            <input
              type="number"
              min="1"
              value={stake}
              onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
              className="w-full bg-dark/60 border border-surface rounded-lg p-3 text-white focus:border-accent outline-none font-bold"
            />
          </div>

          <div className="flex justify-between text-sm mb-4">
            <span className="text-muted">Do wygrania:</span>
            <span className="font-bold text-win text-lg">{potentialWin} PLN</span>
          </div>

          {result && (
            <div className={`p-3 mb-3 rounded-lg text-sm ${
              result.type === 'error' ? 'bg-lose/15 text-lose' : 'bg-win/15 text-win'
            }`}>
              {result.message}
            </div>
          )}

          <button
            disabled={isSubmitting || stake <= 0}
            onClick={handlePlaceBet}
            className="w-full bg-gradient-to-r from-accent to-accent-hover text-dark font-black py-4 rounded-xl shadow-lg hover:shadow-accent/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Przetwarzanie...' : 'POSTAW KUPON'}
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Floating Action Button (Universal) */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-40 bg-gradient-to-br from-accent to-accent-hover text-dark w-16 h-16 lg:w-20 lg:h-20 rounded-full shadow-[0_8px_32px_rgba(240,185,11,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
      >
        <div className="relative">
          <span className="text-2xl lg:text-3xl group-hover:rotate-12 transition-transform">🎫</span>
          {bets.length > 0 && (
            <span className="absolute -top-2 -right-3 lg:-top-3 lg:-right-4 bg-live text-white w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center text-xs lg:text-sm font-black border-2 border-dark animate-pulse shadow-lg">
              {bets.length}
            </span>
          )}
        </div>
      </button>

      {/* Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Floating Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 w-full sm:w-[400px] h-screen bg-primary/80 backdrop-blur-2xl border-l border-surface/40 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-surface/30 flex justify-between items-center bg-dark/20">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎫</span>
            <h3 className="font-black text-xl tracking-wide text-white uppercase">Twój Kupon</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-accent text-dark w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-lg">{bets.length}</span>
            <button onClick={() => setIsMobileOpen(false)} className="w-8 h-8 bg-surface/50 hover:bg-surface rounded-full flex items-center justify-center text-muted hover:text-white transition-colors">✕</button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <BetslipContent />
        </div>
      </div>
    </>
  );
};
