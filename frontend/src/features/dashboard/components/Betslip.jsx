import React, { useState } from 'react';
import { useBetting } from '../../../context/BettingContext';
import { apiClient } from '../../../api/client';

export const Betslip = () => {
  const { bets, removeBet, clearBets } = useBetting();
  const [stake, setStake] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const totalOdds = bets.reduce((acc, bet) => acc * parseFloat(bet.ratio), 1).toFixed(2);
  const potentialWin = (stake * totalOdds * 0.88).toFixed(2); // Tax assumption

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

  // Zawartość kuponu - używana zarówno na desktop jak i mobile
  const BetslipContent = ({ isMobile = false }) => {
    if (bets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-light/40 text-center p-8 py-12">
          <div className="text-7xl mb-6 opacity-20"></div>
          <p className="font-semibold text-lg mb-2 text-light/60">Twój kupon jest pusty</p>
          <small className="text-sm mt-1">Kliknij na kurs, aby dodać zakład</small>
          
          {result && result.type === 'success' && (
              <div className="mt-4 p-3 bg-emerald/20 text-emerald rounded-lg">
                  {result.message}
              </div>
          )}
        </div>
      );
    }

    return (
      <>
        {/* Lista zakładów */}
        <div className={`overflow-y-auto p-4 space-y-3 ${isMobile ? 'max-h-[40vh]' : 'flex-1 max-h-[50vh]'}`}>
          {bets.map((bet) => (
            <div key={bet.courseId} className="bg-dark/30 rounded-xl p-3 border border-white/5 relative group">
              <button 
                  onClick={() => removeBet(bet.courseId)}
                  className="absolute top-2 right-2 text-white/20 hover:text-red-400 transition-colors"
              >
                  ✕
              </button>
              <h4 className="text-sm font-bold text-white/90 pr-6">{bet.matchName}</h4>
              <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-accent uppercase font-bold">{bet.selectionName}</span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">{bet.ratio}</span>
              </div>
              <div className="text-xs text-white/40 mt-1">{bet.type}</div>
            </div>
          ))}
        </div>

        {/* Sekcja podsumowania */}
        <div className="p-5 bg-dark/40 border-t border-accent/10">
          <div className="flex justify-between text-sm mb-2 text-white/60">
              <span>Kurs całkowity:</span>
              <span className="font-bold text-white">{totalOdds}</span>
          </div>
          
          <div className="mb-4">
              <label className="text-xs text-white/40 block mb-1">Stawka (PLN)</label>
              <input 
                  type="number" 
                  min="1"
                  value={stake}
                  onChange={(e) => setStake(parseFloat(e.target.value))}
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
              disabled={isSubmitting}
              onClick={handlePlaceBet}
              className="w-full bg-gradient-to-r from-accent to-emerald text-dark font-black py-4 rounded-xl shadow-lg hover:shadow-accent/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
              {isSubmitting ? 'Przetwarzanie...' : 'POSTAW KUPON'}
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Desktop Betslip - wyświetlany tylko na xl */}
      <aside className="hidden xl:flex flex-col w-96 bg-secondary/50 backdrop-blur-xl border-l border-accent/10 sticky top-20 h-fit max-h-[calc(100vh-100px)]">
        <div className="p-5 border-b border-accent/10 flex justify-between items-center">
          <h3 className="font-bold text-xl tracking-wide text-white">Kupon</h3>
          <span className="bg-accent text-dark w-8 h-8 rounded-full flex items-center justify-center text-sm font-black">{bets.length}</span>
        </div>
        <BetslipContent />
      </aside>

      {/* Mobile Betslip - button i panel */}
      <div className="xl:hidden">
        {/* Floating button */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-accent to-emerald text-dark w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
          style={{ boxShadow: '0 8px 32px rgba(255, 204, 0, 0.4)' }}
        >
          <div className="relative">
            <span className="text-2xl"></span>
            {bets.length > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                {bets.length}
              </span>
            )}
          </div>
        </button>

        {/* Overlay */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sliding panel */}
        <div 
          className={`fixed bottom-0 left-0 right-0 z-50 bg-secondary/95 backdrop-blur-xl border-t border-accent/20 rounded-t-3xl transform transition-transform duration-300 ease-out ${
            isMobileOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ maxHeight: '85vh' }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
          </div>
          
          {/* Header */}
          <div className="p-4 border-b border-accent/10 flex justify-between items-center">
            <h3 className="font-bold text-xl tracking-wide text-white">Kupon</h3>
            <div className="flex items-center gap-3">
              <span className="bg-accent text-dark w-8 h-8 rounded-full flex items-center justify-center text-sm font-black">{bets.length}</span>
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="text-white/60 hover:text-white text-2xl transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
            <BetslipContent isMobile={true} />
          </div>
        </div>
      </div>
    </>
  );
};
