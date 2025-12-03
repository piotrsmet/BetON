import React from 'react';
import { Header } from './components/Header';
import { SlotBanner } from './components/SlotBanner';
import { MatchList } from './components/MatchList';

export const Dashboard = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-primary text-light">
      <Header username={user?.username} balance={user?.balance} onLogout={onLogout} />
      
      <div className="flex">
        {/* Left Sidebar - Sports Menu */}
        <aside className="hidden lg:block w-64 bg-secondary min-h-[calc(100vh-80px)] p-6 sticky top-20">
          <nav>
            <h3 className="text-sm text-light/60 mb-4 tracking-widest font-bold">LIGA</h3>
            <ul className="space-y-2">
              <li className="px-4 py-3 rounded-lg bg-gradient-to-r from-accent to-accent/70 text-white font-medium cursor-pointer shadow-lg">
                ⚽ Premier League
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <SlotBanner />
          <MatchList />
        </main>

        {/* Right Sidebar - Betslip */}
        <aside className="hidden xl:block w-96 bg-secondary min-h-[calc(100vh-80px)] sticky top-20">
          <div className="p-5 border-b-2 border-accent/20 flex justify-between items-center bg-gradient-to-r from-secondary to-secondary/80">
            <h3 className="font-bold text-xl tracking-wide">KUPON</h3>
            <span className="bg-accent text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">0</span>
          </div>
          
          <div className="flex flex-col items-center justify-center text-light/50 text-center p-8 h-[calc(100%-200px)]">
            <div className="text-7xl mb-6 opacity-30 animate-pulse">🎫</div>
            <p className="font-bold text-lg mb-2">Twój kupon jest pusty</p>
            <small className="text-sm mt-1">Kliknij na kurs, aby dodać zakład</small>
          </div>

          {/* Promocje */}
          <div className="p-5 border-t-2 border-accent/20 space-y-3">
            <div className="bg-gradient-to-br from-accent to-accent/70 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">💰</div>
              <p className="font-bold text-white text-sm mb-1">BONUS +50%</p>
              <small className="text-white/80 text-xs">Do wygranych AKO</small>
            </div>
            
            <div className="bg-gradient-to-br from-primary to-secondary rounded-xl p-4 border-2 border-accent/30">
              <div className="text-2xl mb-2">🎰</div>
              <p className="font-bold text-light text-sm mb-1">CASINO LIVE</p>
              <small className="text-light/60 text-xs">Graj na żywo z krupierem</small>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
