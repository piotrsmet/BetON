import React, { createContext, useContext, useState } from 'react';

const BettingContext = createContext();

export const useBetting = () => {
    const context = useContext(BettingContext);
    if (!context) {
        throw new Error('useBetting must be used within a BettingProvider');
    }
    return context;
};

// Rynki w których kursy się wykluczają (OVER/UNDER, YES/NO) - przy dodaniu nowego z tej samej pary podmieniamy.
// HTFT to zbiór 9 opcji - tu też wykluczamy (jeden wybór na mecz).
const EXCLUSIVE_RODZAJ = new Set(['1X2', 'OU_GOALS', 'BTTS', 'OU_CORNERS', 'OU_CARDS', 'OU_SOT', 'OU_OFFSIDES', 'HTFT']);

export const BettingProvider = ({ children }) => {
    const [bets, setBets] = useState([]);

    /**
     * newBet: { matchId, courseId, type, ratio, matchName, selectionName, rodzaj }
     * - klik na ten sam courseId -> usuwa (toggle)
     * - klik na inny courseId tego samego rynku (rodzaj) w tym samym meczu -> podmienia
     * - klik na inny rodzaj w tym samym meczu -> dodaje (bet builder)
     */
    const addBet = (newBet) => {
        setBets((prev) => {
            // Toggle dokładnie tego samego kursu
            const exact = prev.findIndex(b => b.courseId === newBet.courseId);
            if (exact >= 0) return prev.filter((_, i) => i !== exact);

            // Podmiana w obrębie tego samego rynku
            if (newBet.rodzaj && EXCLUSIVE_RODZAJ.has(newBet.rodzaj)) {
                const sameMarketIdx = prev.findIndex(b => b.matchId === newBet.matchId && b.rodzaj === newBet.rodzaj);
                if (sameMarketIdx >= 0) {
                    const next = [...prev];
                    next[sameMarketIdx] = newBet;
                    return next;
                }
            }

            return [...prev, newBet];
        });
    };

    const removeBet = (courseId) => {
        setBets(prev => prev.filter(b => b.courseId !== courseId));
    };

    const clearBets = () => setBets([]);

    return (
        <BettingContext.Provider value={{ bets, addBet, removeBet, clearBets }}>
            {children}
        </BettingContext.Provider>
    );
};
