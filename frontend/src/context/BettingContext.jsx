import React, { createContext, useContext, useState } from 'react';

const BettingContext = createContext();

export const useBetting = () => {
    const context = useContext(BettingContext);
    if (!context) {
        throw new Error('useBetting must be used within a BettingProvider');
    }
    return context;
};

export const BettingProvider = ({ children }) => {
    const [bets, setBets] = useState([]);

    const addBet = (newBet) => {
        // newBet structure: { matchId, courseId, type, ratio, matchName, selectionName }
        setBets((prevBets) => {
            // Check if bet from this match already exists
            const existingBetIndex = prevBets.findIndex(b => b.matchId === newBet.matchId);
            
            if (existingBetIndex >= 0) {
                // If clicking same odd again, remove it (toggle)
                if (prevBets[existingBetIndex].courseId === newBet.courseId) {
                    return prevBets.filter((_, i) => i !== existingBetIndex);
                }
                // If clicking different odd from same match, replace it
                const updatedBets = [...prevBets];
                updatedBets[existingBetIndex] = newBet;
                return updatedBets;
            }
            
            return [...prevBets, newBet];
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
