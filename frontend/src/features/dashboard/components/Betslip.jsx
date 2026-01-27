import React, { useState } from 'react';
import { useBetting } from '../../../context/BettingContext';
import { apiClient } from '../../../api/client';

export const Betslip = () => {
  const { bets, removeBet, clearBets } = useBetting();
  const [stake, setStake] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

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
    } catch (err) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (bets.length === 0) {
    return (
        <aside className="hidden xl:block w-96 bg-secondary/50 backdrop-blur-xl border-l border-accent/10 min-h-[calc(100vh-80px)] sticky top-20">
          <div className="p-5 border-b border-accent/10 flex justify-between items-center">
            <h3 className="font-bold text-xl tracking-wide text-white">Kupon</h3>
            <span className="bg-accent text-dark w-8 h-8 rounded-full flex items-center justify-center text-sm font-black">0</span>
          </div>
          
          <div className="flex flex-col items-center justify-center text-light/40 text-center p-8 h-[calc(100%-200px)]">
            <div className="text-7xl mb-6 opacity-20">🎫</div>
            <p className="font-semibold text-lg mb-2 text-light/60">Twój kupon jest pusty</p>
            <small className="text-sm mt-1">Kliknij na kurs, aby dodać zakład</small>
            
            {result && result.type === 'success' && (
                <div className="mt-4 p-3 bg-emerald/20 text-emerald rounded-lg">
                    {result.message}
                </div>
            )}
          </div>
        </aside>
    );
  }

  return (
    <aside className="hidden xl:flex flex-col w-96 bg-secondary/50 backdrop-blur-xl border-l border-accent/10 min-h-[calc(100vh-80px)] sticky top-20">
      <div className="p-5 border-b border-accent/10 flex justify-between items-center">
        <h3 className="font-bold text-xl tracking-wide text-white">Kupon</h3>
        <span className="bg-accent text-dark w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-dark">{bets.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
    </aside>
  );
};
