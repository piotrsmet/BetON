import React, { useEffect, useState } from 'react';

export const WinAnimation = ({ onComplete }) => {
  const [banknotes, setBanknotes] = useState([]);
  const [coins, setCoins] = useState([]);
  const [dollarSigns, setDollarSigns] = useState([]);
  const [explosions, setExplosions] = useState([]);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    // Falling banknotes
    const banknotesArray = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 3 + Math.random() * 2,
      rotation: Math.random() * 360,
      currency: ['💵', '💶', '💷', '💴'][Math.floor(Math.random() * 4)],
      size: 40 + Math.random() * 30,
    }));
    setBanknotes(banknotesArray);

    // Spinning coins
    const coinsArray = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2.5 + Math.random() * 1.5,
      size: 25 + Math.random() * 25,
    }));
    setCoins(coinsArray);

    // Dollar signs explosion
    const dollarsArray = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      angle: (i / 30) * 360,
      delay: Math.random() * 0.3,
      distance: 150 + Math.random() * 350,
      duration: 1.5 + Math.random() * 1,
      size: 30 + Math.random() * 40,
    }));
    setDollarSigns(dollarsArray);

    // Golden explosions
    const explosionsArray = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: 20 + (i * 10),
      top: 20 + ((i % 3) * 30),
      delay: i * 0.2,
    }));
    setExplosions(explosionsArray);

    // Money counter animation
    let count = 0;
    const counterInterval = setInterval(() => {
      count += 347;
      if (count > 100000) count = 100000;
      setCounter(count);
    }, 50);

    const timer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearInterval(counterInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-900 via-yellow-900 to-green-900 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      {/* Falling Banknotes */}
      {banknotes.map((note) => (
        <div
          key={note.id}
          className="absolute animate-[coinFall_linear_forwards]"
          style={{
            left: `${note.left}%`,
            top: '-10%',
            fontSize: `${note.size}px`,
            animationDelay: `${note.delay}s`,
            animationDuration: `${note.duration}s`,
            transform: `rotate(${note.rotation}deg)`,
            filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))',
          }}
        >
          {note.currency}
        </div>
      ))}

      {/* Spinning Gold Coins */}
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="absolute animate-[coinFall_linear_forwards]"
          style={{
            left: `${coin.left}%`,
            top: '-10%',
            fontSize: `${coin.size}px`,
            animationDelay: `${coin.delay}s`,
            animationDuration: `${coin.duration}s`,
            filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))',
          }}
        >
          🪙
        </div>
      ))}

      {/* Dollar Signs Explosion */}
      {dollarSigns.map((dollar) => (
        <div
          key={dollar.id}
          className="absolute top-1/2 left-1/2 font-black text-yellow-400 animate-[explode_ease-out_forwards]"
          style={{
            fontSize: `${dollar.size}px`,
            animationDelay: `${dollar.delay}s`,
            animationDuration: `${dollar.duration}s`,
            '--angle': `${dollar.angle}deg`,
            '--distance': `${dollar.distance}px`,
            textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4)',
          }}
        >
          💰
        </div>
      ))}

      {/* Golden Fireworks */}
      {explosions.map((exp) => (
        <div
          key={exp.id}
          className="absolute w-4 h-4 bg-yellow-400 rounded-full animate-[firework_ease-out_forwards]"
          style={{
            left: `${exp.left}%`,
            top: `${exp.top}%`,
            animationDelay: `${exp.delay}s`,
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.9), 0 0 60px rgba(255, 215, 0, 0.6)',
          }}
        />
      ))}

      {/* Center Content */}
      <div className="relative z-10 text-center px-8">
        {/* Money Counter */}
        <div className="mb-8 animate-[zoomIn_0.6s_ease-out]">
          <div className="text-8xl md:text-9xl mb-4 animate-bounce">
            💵
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-8 py-6 border-4 border-yellow-500 shadow-[0_0_40px_rgba(255,215,0,0.6)]">
            <p className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">WYGRANA!</p>
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 animate-pulse">
              ${counter.toLocaleString()}
            </h1>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl px-6 py-4 border-2 border-green-500 animate-[slideInFromBottom_0.8s_ease-out]">
          <p className="text-2xl md:text-4xl font-bold text-white flex items-center justify-center gap-3">
            <span className="animate-pulse">🎰</span>
            <span className="text-green-400">Witaj w BetON!</span>
            <span className="animate-pulse">🎰</span>
          </p>
        </div>

        {/* Slot Machine Icons */}
        <div className="flex justify-center gap-4 mt-6">
          {['🎲', '🃏', '🏆', '💎', '⚽'].map((icon, i) => (
            <div
              key={i}
              className="text-5xl md:text-6xl animate-bounce"
              style={{
                animationDelay: `${i * 0.1}s`,
                filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))',
              }}
            >
              {icon}
            </div>
          ))}
        </div>
      </div>

      {/* Corner Money Stacks */}
      <div className="absolute top-8 left-8 text-6xl animate-bounce" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))' }}>💰</div>
      <div className="absolute top-8 right-8 text-6xl animate-bounce" style={{ animationDelay: '0.2s', filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))' }}>💰</div>
      <div className="absolute bottom-8 left-8 text-6xl animate-bounce" style={{ animationDelay: '0.4s', filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))' }}>💰</div>
      <div className="absolute bottom-8 right-8 text-6xl animate-bounce" style={{ animationDelay: '0.6s', filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))' }}>💰</div>

      {/* Golden Glow Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-yellow-500/5 via-transparent to-yellow-500/5 animate-pulse" />
    </div>
  );
};
