import React, { useEffect, useState } from 'react';

export const WinAnimation = ({ onComplete }) => {
  const [particles, setParticles] = useState([]);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Generate confetti particles
    const confetti = Array.from({ length: 150 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      color: ['#715A5A', '#D3DAD9', '#FFD700', '#FF1493', '#00FF00'][Math.floor(Math.random() * 5)]
    }));
    setParticles(confetti);

    // Show text after a moment
    setTimeout(() => setShowText(true), 300);

    // Auto complete after animation
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      {/* Confetti particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 rounded-sm animate-[fall_linear_forwards]"
          style={{
            left: `${particle.left}%`,
            top: '-10%',
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}

      {/* Center text animation */}
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center animate-[bounce_1s_ease-in-out_3]">
            <h1 className="text-8xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text drop-shadow-[0_0_20px_rgba(255,215,0,0.8)] animate-pulse">
              WITAMY!
            </h1>
            <p className="text-3xl font-bold text-white mt-4 drop-shadow-lg animate-[wiggle_1s_ease-in-out_infinite]">
              🎉 Zalogowano pomyślnie! 🎉
            </p>
            <div className="flex gap-4 justify-center mt-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="text-6xl animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  💰
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fireworks effect (circles expanding) */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`firework-${i}`}
          className="absolute w-2 h-2 rounded-full bg-yellow-400"
          style={{
            left: `${20 + i * 10}%`,
            top: `${30 + (i % 2) * 40}%`,
            animation: `firework 1.5s ease-out ${i * 0.2}s`,
          }}
        />
      ))}

      {/* Gold coins falling */}
      {[...Array(30)].map((_, i) => (
        <div
          key={`coin-${i}`}
          className="absolute text-4xl animate-[coinFall_3s_linear_forwards]"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10%',
            animationDelay: `${Math.random() * 1}s`,
          }}
        >
          💰
        </div>
      ))}
    </div>
  );
};
