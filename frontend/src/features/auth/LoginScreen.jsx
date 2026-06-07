import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Snowfall from 'react-snowfall';
import { Loader } from '../../components/ui/Loader';
import { apiClient } from '../../api/client';

export const LoginScreen = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.login(username, password);
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-dark">
      {/* Cherry Tree Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-screen transition-all duration-1000"
        style={{ backgroundImage: 'url(/cherry_bg.png)' }}
      />

      {/* Sakura gradient overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-sakura-dark/30 via-dark/60 to-dark/90" />
      
      {/* Cherry petals falling */}
      <Snowfall 
        color="#E8A0BF"
        snowflakeCount={120}
        radius={[1.5, 4.5]}
        speed={[0.5, 2.5]}
        wind={[1.5, 3.5]}
        style={{
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          zIndex: 1,
        }}
      />
      
      <div className="z-10 w-full max-w-md px-4">
        <div className="bg-secondary/80 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-2xl border border-surface/50">
          {/* Logo */}
          <h1 className="text-5xl font-black text-center mb-2 bg-gradient-to-r from-accent via-amber to-accent bg-clip-text text-transparent">
            BetON
          </h1>
          <p className="text-center text-muted mb-8 font-medium text-sm">Your winning starts here</p>
          
          {error && (
            <div className="bg-lose/15 border border-lose/40 text-lose px-4 py-3 rounded-xl mb-4 text-center text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="login-username" className="text-sm font-semibold text-light">
                Nazwa użytkownika
              </label>
              <input 
                type="text" 
                id="login-username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Wpisz nazwę użytkownika"
                className="px-4 py-3 rounded-xl border border-surface bg-dark/80 text-white transition-all focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-muted/60"
                required 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="login-password" className="text-sm font-semibold text-light">
                Hasło
              </label>
              <input 
                type="password" 
                id="login-password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="px-4 py-3 rounded-xl border border-surface bg-dark/80 text-white transition-all focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-muted/60"
                required 
              />
            </div>

            <div className="flex justify-center mt-2">
              {isLoading ? (
                <Loader />
              ) : (
                <button 
                  type="submit" 
                  className="w-full py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-accent to-amber text-dark shadow-lg hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Zaloguj się →
                </button>
              )}
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <button 
              className="text-muted hover:text-accent transition-all font-medium"
              onClick={() => navigate('/register')}
            >
              Nie masz konta? <span className="text-accent font-semibold">Zarejestruj się</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
