import React, { useState, useEffect } from 'react';
import { LoginScreen } from './features/auth/LoginScreen';
import { RegisterScreen } from './features/auth/RegisterScreen';
import { Dashboard } from './features/dashboard/Dashboard';
import { WinAnimation } from './components/layout/WinAnimation';
import { apiClient } from './api/client';
import { Loader } from './components/ui/Loader';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showWinAnimation, setShowWinAnimation] = useState(false);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const data = await apiClient.checkSession();
        if (data.isLoggedIn) {
          setUser(data);
          setCurrentScreen('dashboard');
        }
      } catch (error) {
        console.error('Session check failed', error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkUserSession();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowWinAnimation(true);
    // Delay showing dashboard until animation completes
    setTimeout(() => {
      setCurrentScreen('dashboard');
    }, 300);
  };

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout failed', error);
    }
    setUser(null);
    setCurrentScreen('login');
  };

  if (isCheckingSession) {
    return (
      <div className="app-loader">
        <Loader />
      </div>
    );
  }

  return (
    <div className="app">
      {showWinAnimation && (
        <WinAnimation onComplete={() => setShowWinAnimation(false)} />
      )}
      
      {currentScreen === 'login' && (
        <LoginScreen 
          onSwitchToRegister={() => setCurrentScreen('register')} 
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      
      {currentScreen === 'register' && (
        <RegisterScreen onSwitchToLogin={() => setCurrentScreen('login')} />
      )}

      {currentScreen === 'dashboard' && (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
