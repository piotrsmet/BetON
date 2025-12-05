import React, { useEffect, useState } from 'react';

export const LoginAnimation = ({ onComplete }) => {
  const [particles, setParticles] = useState([]);
  const [rings, setRings] = useState([]);
  const [logoScale, setLogoScale] = useState(0);

  useEffect(() => {
    // Purple particles explosion
    const particlesArray = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      angle: (i / 50) * 360,
      delay: Math.random() * 0.2,
      distance: 200 + Math.random() * 300,
      duration: 1.2 + Math.random() * 0.8,
      size: 4 + Math.random() * 8,
    }));
    setParticles(particlesArray);

    // Expanding rings
    const ringsArray = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      delay: i * 0.15,
    }));
    setRings(ringsArray);

    // Logo scale animation
    setTimeout(() => setLogoScale(1), 100);

    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-primary overflow-hidden">
      {/* Expanding rings */}
      {rings.map((ring) => (
        <div
          key={ring.id}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent animate-[expandRing_1.5s_ease-out_forwards]"
          style={{
            animationDelay: `${ring.delay}s`,
          }}
        />
      ))}

      {/* Purple particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute top-1/2 left-1/2 rounded-full bg-accent animate-[explodeParticle_ease-out_forwards]"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            '--angle': `${particle.angle}deg`,
            '--distance': `${particle.distance}px`,
            boxShadow: '0 0 20px rgba(155, 126, 189, 0.8)',
          }}
        />
      ))}

      {/* Center logo/text */}
      <div 
        className="relative z-10 text-center transition-all duration-700"
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoScale,
        }}
      >
        <div className="text-7xl md:text-8xl font-black mb-6 bg-gradient-to-r from-accent via-purple-400 to-accent bg-clip-text text-transparent animate-pulse">
          BetON
        </div>
        <div className="px-8 py-4 bg-accent/20 backdrop-blur-lg rounded-2xl border-2 border-accent shadow-[0_0_40px_rgba(155,126,189,0.5)]">
          <p className="text-2xl md:text-3xl font-bold text-accent animate-pulse">
            BE BE BE BETON!!
          </p>
        </div>
      </div>

      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/30 rounded-full blur-[120px] animate-pulse" />
    </div>
  );
};
