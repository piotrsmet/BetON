import React, { useState } from 'react';
import { Header } from './components/Header';
import { SlotBanner } from './components/SlotBanner';
import { MatchList } from './components/MatchList';
import { Betslip } from './components/Betslip';
import { CouponHistory } from './components/CouponHistory';
import { MatchDetails } from './components/MatchDetails';

export const Dashboard = ({ user, onLogout }) => {
  const [view, setView] = useState('matches'); // 'matches' | 'coupons'
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  const handleMatchSelect = (id) => {
    setSelectedMatchId(id);
    setView('matches'); // Ensure we are in matches view
  };

  const handleBack = () => {
    setSelectedMatchId(null);
  };

  const renderContent = () => {
    if (view === 'coupons') return <CouponHistory />;
    if (selectedMatchId) return <MatchDetails matchId={selectedMatchId} onBack={handleBack} />;
    return <MatchList onMatchSelect={handleMatchSelect} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-primary to-secondary text-white">
      <Header username={user?.username} balance={user?.balance} onLogout={onLogout} />
      
      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar - Sports Menu */}
        <aside className="w-full lg:w-64 bg-secondary/50 backdrop-blur-xl border-r border-accent/10 p-4 lg:p-6 lg:sticky lg:top-20 lg:min-h-[calc(100vh-80px)]">
          <nav>
            <h3 className="text-xs text-light/50 mb-4 tracking-widest font-bold uppercase">Menu</h3>
            <ul className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              <li 
                onClick={() => { setView('matches'); setSelectedMatchId(null); }}
                className={`px-4 py-3 rounded-xl font-bold cursor-pointer shadow-lg whitespace-nowrap transition-all flex items-center gap-2 ${view === 'matches' && !selectedMatchId ? 'bg-gradient-to-r from-accent to-emerald text-dark hover:shadow-accent/50' : 'bg-white/5 hover:bg-white/10 text-white'}`}
              >
                <span>⚽</span> Premier League
              </li>
              <li 
                onClick={() => { setView('coupons'); setSelectedMatchId(null); }}
                className={`px-4 py-3 rounded-xl font-bold cursor-pointer shadow-lg whitespace-nowrap transition-all flex items-center gap-2 ${view === 'coupons' ? 'bg-gradient-to-r from-accent to-emerald text-dark hover:shadow-accent/50' : 'bg-white/5 hover:bg-white/10 text-white'}`}
              >
                <span>📜</span> Moje Kupony
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-full overflow-hidden">
          {!selectedMatchId && view === 'matches' && <SlotBanner />}
          {renderContent()}
        </main>

        {/* Right Sidebar - Betslip */}
        <Betslip />
      </div>
    </div>
  );
};
