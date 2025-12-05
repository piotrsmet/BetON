import React, { useState, useEffect } from 'react';
import { LoginScreen } from './features/auth/LoginScreen';
import { RegisterScreen } from './features/auth/RegisterScreen';
import { Dashboard } from './features/dashboard/Dashboard';
import { apiClient } from './api/client';
import { Loader } from './components/ui/Loader';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen('dashboard');
      setTimeout(() => setIsTransitioning(false), 100);
    }, 400);
  };

  const handleLogout = async () => {
    setIsTransitioning(true);
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout failed', error);
    }
    setTimeout(() => {
      setUser(null);
      setCurrentScreen('login');
      setTimeout(() => setIsTransitioning(false), 100);
    }, 400);
  };

  if (isCheckingSession) {
    return (
      <div className="app-loader">
        <Loader />
      </div>
    );
  }

  return (
    <div className="app relative overflow-hidden">
      <div 
        className={`transition-opacity duration-500 ease-in-out ${
          isTransitioning 
            ? 'opacity-0' 
            : 'opacity-100'
        }`}
      >
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
    </div>
  );
}

export default App;
