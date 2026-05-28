import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginScreen } from './features/auth/LoginScreen';
import { RegisterScreen } from './features/auth/RegisterScreen';
import { Dashboard } from './features/dashboard/Dashboard';
import { LoginAnimation } from './components/layout/LoginAnimation';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { apiClient } from './api/client';
import { BettingProvider } from './context/BettingContext';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showLoginAnimation, setShowLoginAnimation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const data = await apiClient.checkSession();
        if (data.isLoggedIn) {
          setUser(data);
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
    setShowLoginAnimation(true);
  };

  const handleAnimationComplete = () => {
    setShowLoginAnimation(false);
    navigate('/', { replace: true });
  };

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout failed', error);
    }
    localStorage.removeItem('beton_token');
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <BettingProvider>
      <div className="app relative overflow-hidden">
        {showLoginAnimation && (
          <LoginAnimation onComplete={handleAnimationComplete} />
        )}
        
        <Routes>
          <Route 
            path="/login" 
            element={
              user && !showLoginAnimation 
                ? <Navigate to="/" replace /> 
                : <LoginScreen onLoginSuccess={handleLoginSuccess} />
            } 
          />
          <Route 
            path="/register" 
            element={
              user ? <Navigate to="/" replace /> : <RegisterScreen />
            } 
          />

          <Route element={<ProtectedRoute user={user} isCheckingSession={isCheckingSession} />}>
            <Route path="/*" element={<Dashboard user={user} onLogout={handleLogout} />} />
          </Route>
        </Routes>
      </div>
    </BettingProvider>
  );
}

export default App;
