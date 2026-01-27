import React, { useState } from 'react';
import Snowfall from 'react-snowfall';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
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
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-dark via-primary to-secondary overflow-hidden">
      <Snowfall 
        color="#ffffff"
        snowflakeCount={200}
        radius={[0.5, 3.0]}
        speed={[0.5, 3.0]}
        wind={[-0.5, 2.0]}
        style={{
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          zIndex: 1,
        }}
      />
      
      {/* Snow pile at bottom - only top part visible */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -bottom-8 left-0 right-0 h-24 bg-white/20 rounded-t-[100%] blur-sm"></div>
        <div className="absolute -bottom-4 left-0 right-0 h-20 bg-white/30 rounded-t-[100%]"></div>
      </div>
      
      <div className="z-10 w-full max-w-md px-4">
        <div className="bg-secondary/90 backdrop-blur-xl rounded-2xl p-10 shadow-2xl border border-accent/20">
          <h1 className="text-5xl font-black text-center mb-2 bg-gradient-to-r from-accent via-emerald to-accent bg-clip-text text-transparent">
            BetON
          </h1>
          <p className="text-center text-light/60 mb-8 font-medium">Your winning starts here</p>
          
          {error && (
            <div className="bg-rose/20 border border-rose/50 text-rose px-4 py-3 rounded-xl mb-4 text-center text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="username" className="text-sm font-semibold text-light">
                Nazwa użytkownika
              </label>
              <input 
                type="text" 
                id="username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Wpisz nazwę użytkownika"
                className="px-4 py-3 rounded-xl border border-primary bg-dark text-white transition-all focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                required 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-semibold text-light">
                Hasło
              </label>
              <input 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="px-4 py-3 rounded-xl border border-primary bg-dark text-white transition-all focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                required 
              />
            </div>

            <div className="flex justify-center mt-4">
              {isLoading ? (
                <Loader />
              ) : (
                <Button type="submit" variant="primary" className="bg-gradient-to-r from-accent to-emerald hover:from-emerald hover:to-accent text-dark shadow-lg hover:shadow-accent/50 transition-all font-bold text-base w-full py-3.5 rounded-xl">
                  Zaloguj się →
                </Button>
              )}
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <button 
              className="text-light/60 hover:text-accent hover:underline transition-all font-medium"
              onClick={onSwitchToRegister}
            >
              Nie masz konta? <span className="text-accent font-semibold">Zarejestruj się</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
