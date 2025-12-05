import React from 'react';
import { Header } from './components/Header';
import { SlotBanner } from './components/SlotBanner';
import { MatchList } from './components/MatchList';

export const Dashboard = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-primary to-secondary text-white">
      <Header username={user?.username} balance={user?.balance} onLogout={onLogout} />
      
      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar - Sports Menu */}
        <aside className="w-full lg:w-64 bg-secondary/50 backdrop-blur-xl border-r border-accent/10 p-4 lg:p-6 lg:sticky lg:top-20 lg:min-h-[calc(100vh-80px)]">
          <nav>
            <h3 className="text-xs text-light/50 mb-4 tracking-widest font-bold uppercase">Sporty</h3>
            <ul className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              <li className="px-4 py-3 rounded-xl bg-gradient-to-r from-accent to-emerald text-dark font-bold cursor-pointer shadow-lg hover:shadow-accent/50 whitespace-nowrap transition-all">
                ⚽ Premier League
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-full overflow-hidden">
          <SlotBanner />
          <MatchList />
        </main>

        {/* Right Sidebar - Betslip (Hidden on mobile, shown on xl) */}
        <aside className="hidden xl:block w-96 bg-secondary/50 backdrop-blur-xl border-l border-accent/10 min-h-[calc(100vh-80px)] sticky top-20">
          <div className="p-5 border-b border-accent/10 flex justify-between items-center">
            <h3 className="font-bold text-xl tracking-wide text-white">Kupon</h3>
            <span className="bg-accent text-dark w-8 h-8 rounded-full flex items-center justify-center text-sm font-black">0</span>
          </div>
          
          <div className="flex flex-col items-center justify-center text-light/40 text-center p-8 h-[calc(100%-200px)]">
            <div className="text-7xl mb-6 opacity-20">🎫</div>
            <p className="font-semibold text-lg mb-2 text-light/60">Twój kupon jest pusty</p>
            <small className="text-sm mt-1">Kliknij na kurs, aby dodać zakład</small>
          </div>
        </aside>
      </div>
    </div>
  );
};
