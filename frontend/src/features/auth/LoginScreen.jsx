import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { BackgroundAnimation } from '../../components/layout/BackgroundAnimation';
import { apiClient } from '../../api/client';

export const LoginScreen = ({ onSwitchToRegister, onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

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
    <div className="min-h-screen flex items-center justify-center relative text-white">
      <BackgroundAnimation />
      
      <div className="z-10 w-full max-w-md px-4">
        <div className="bg-secondary/60 backdrop-blur-xl border border-light/20 rounded-2xl p-10 shadow-2xl">
          <h1 className="text-5xl font-bold text-center mb-2 bg-gradient-to-r from-white to-light bg-clip-text text-transparent">
            BetON
          </h1>
          <p className="text-center text-light/80 mb-8">Zbuduj swoją przyszłość</p>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-3 py-2 rounded-lg mb-4 text-center text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="username" className="text-sm font-medium text-light">
                Nazwa użytkownika
              </label>
              <input 
                type="text" 
                id="username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Wpisz nazwę użytkownika"
                className="px-3 py-2 rounded-lg border border-light/20 bg-black/20 text-white transition-all focus:outline-none focus:border-accent focus:bg-black/30"
                required 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-light">
                Hasło
              </label>
              <input 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="px-3 py-2 rounded-lg border border-light/20 bg-black/20 text-white transition-all focus:outline-none focus:border-accent focus:bg-black/30"
                required 
              />
            </div>

            <div className="flex justify-center mt-4">
              {isLoading ? (
                <Loader />
              ) : (
                <Button type="submit" variant="primary">
                  Zaloguj się
                </Button>
              )}
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <button 
              className="text-light/80 hover:text-light hover:underline transition-all"
              onClick={onSwitchToRegister}
            >
              Nie masz konta? Zarejestruj się
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
