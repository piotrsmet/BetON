import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { SlotBanner } from './components/SlotBanner';
import { MatchList } from './components/MatchList';
import { Betslip } from './components/Betslip';
import { CouponHistory } from './components/CouponHistory';
import { MatchDetails } from './components/MatchDetails';

export const Dashboard = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-[#05070a] text-white selection:bg-accent/30 overflow-x-hidden">
      {/* Background ambient light */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-live/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          username={user?.username} 
          balance={user?.balance} 
          onLogout={onLogout}
        />
        
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={
              <div className="space-y-8 animate-fade-in">
                <SlotBanner />
                <MatchList />
              </div>
            } />
            <Route path="/match/:id" element={<div className="animate-fade-in"><MatchDetails /></div>} />
            <Route path="/coupons" element={<div className="animate-fade-in"><CouponHistory /></div>} />
          </Routes>
        </main>
      </div>

      {/* Floating Betslip */}
      <Betslip />
    </div>
  );
};
