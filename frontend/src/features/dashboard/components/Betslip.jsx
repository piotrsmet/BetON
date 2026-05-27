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

  // Grupowanie po meczu - jeśli z meczu >=2 zakładów to bet builder z rabatem 0.80
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
      setIsMobileOpen(false);
    } catch (err) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const BetslipContent = ({ isMobile = false }) => {
    if (bets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-light/40 text-center p-8 py-12">
          <div className="text-7xl mb-6 opacity-20">📋</div>
          <p className="font-semibold text-lg mb-2 text-light/60">Twój kupon jest pusty</p>
          <small className="text-sm mt-1">Kliknij na kurs, aby dodać zakład</small>
          {result && result.type === 'success' && (
            <div className="mt-4 p-3 bg-emerald-500/20 text-emerald-300 rounded-lg">{result.message}</div>
          )}
        </div>
      );
    }

    return (
      <>
        <div className={`overflow-y-auto p-4 space-y-3 ${isMobile ? 'max-h-[40vh]' : 'flex-1 max-h-[55vh]'}`}>
          {grouped.map(group => (
            <div key={group.matchId} className={`rounded-xl border ${group.isBuilder ? 'border-accent/50 bg-gradient-to-br from-accent/10 to-emerald/5 shadow-lg shadow-accent/10' : 'border-white/5 bg-dark/30'}`}>
              {/* Nagłówek grupy */}
              <div className="px-3 py-2 border-b border-white/5 flex justify-between items-center">
                <h4 className="text-sm font-bold text-white/90 truncate">{group.matchName}</h4>
                {group.isBuilder && (
                  <span className="text-[10px] uppercase tracking-widest text-accent font-black bg-accent/20 px-2 py-0.5 rounded-full ml-2 shrink-0">
                    🎯 Bet Builder
                  </span>
                )}
              </div>

              {/* Pozycje */}
              <div className="divide-y divide-white/5">
                {group.legs.map(bet => (
                  <div key={bet.courseId} className="px-3 py-2 flex justify-between items-center group">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold">
                        {RODZAJ_LABEL[bet.rodzaj] || bet.rodzaj || 'Rynek'}
                      </div>
                      <div className="text-sm text-white/90 truncate">{bet.selectionName}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-sm">{bet.ratio}</span>
                      <button onClick={() => removeBet(bet.courseId)} className="text-white/30 hover:text-red-400 transition-colors text-sm">✕</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stopka grupy (gdy bet builder) */}
              {group.isBuilder && (
                <div className="px-3 py-2 bg-dark/30 border-t border-accent/20 text-xs flex justify-between">
                  <span className="text-white/60">Surowy kurs: <span className="line-through">{group.rawOdds.toFixed(2)}</span></span>
                  <span className="text-accent font-bold">→ {group.effectiveOdds.toFixed(2)} <span className="text-white/40">(-20%)</span></span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Podsumowanie */}
        <div className="p-5 bg-dark/40 border-t border-accent/10">
          {hasBuilder && (
            <div className="mb-3 p-2 rounded-lg bg-accent/10 border border-accent/30 text-xs text-accent/90">
              🎯 Kupon zawiera <b>bet builder</b> — rabat korelacyjny zastosowany.
            </div>
          )}

          <div className="flex justify-between text-sm mb-2 text-white/60">
            <span>Kurs całkowity:</span>
            <span className="font-bold text-white">{totalOdds.toFixed(2)}</span>
          </div>

          <div className="mb-4">
            <label className="text-xs text-white/40 block mb-1">Stawka (PLN)</label>
            <input
              type="number"
              min="1"
              value={stake}
              onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none font-bold"
            />
          </div>

          <div className="flex justify-between text-sm mb-4">
            <span className="text-white/60">Do wygrania:</span>
            <span className="font-bold text-emerald-400 text-lg">{potentialWin} PLN</span>
          </div>

          {result && (
            <div className={`p-3 mb-3 rounded-lg text-sm ${
              result.type === 'error' ? 'bg-red-500/20 text-red-200' : 'bg-emerald-500/20 text-emerald-200'
            }`}>
              {result.message}
            </div>
          )}

          <button
            disabled={isSubmitting || stake <= 0}
            onClick={handlePlaceBet}
            className="w-full bg-gradient-to-r from-accent to-emerald-400 text-dark font-black py-4 rounded-xl shadow-lg hover:shadow-accent/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Przetwarzanie...' : 'POSTAW KUPON'}
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Desktop */}
      <aside className="hidden xl:flex flex-col w-96 bg-secondary/50 backdrop-blur-xl border-l border-accent/10 sticky top-20 h-fit max-h-[calc(100vh-100px)]">
        <div className="p-5 border-b border-accent/10 flex justify-between items-center">
          <h3 className="font-bold text-xl tracking-wide text-white">Kupon</h3>
          <span className="bg-accent text-dark w-8 h-8 rounded-full flex items-center justify-center text-sm font-black">{bets.length}</span>
        </div>
        <BetslipContent />
      </aside>

      {/* Mobile */}
      <div className="xl:hidden">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-accent to-emerald-400 text-dark w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
          style={{ boxShadow: '0 8px 32px rgba(255, 204, 0, 0.4)' }}
        >
          <div className="relative">
            <span className="text-2xl">🎫</span>
            {bets.length > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                {bets.length}
              </span>
            )}
          </div>
        </button>

        {isMobileOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setIsMobileOpen(false)} />
        )}

        <div
          className={`fixed bottom-0 left-0 right-0 z-50 bg-secondary/95 backdrop-blur-xl border-t border-accent/20 rounded-t-3xl transform transition-transform duration-300 ease-out ${
            isMobileOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ maxHeight: '85vh' }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
          </div>
          <div className="p-4 border-b border-accent/10 flex justify-between items-center">
            <h3 className="font-bold text-xl tracking-wide text-white">Kupon</h3>
            <div className="flex items-center gap-3">
              <span className="bg-accent text-dark w-8 h-8 rounded-full flex items-center justify-center text-sm font-black">{bets.length}</span>
              <button onClick={() => setIsMobileOpen(false)} className="text-white/60 hover:text-white text-2xl transition-colors">✕</button>
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
            <BetslipContent isMobile={true} />
          </div>
        </div>
      </div>
    </>
  );
};
