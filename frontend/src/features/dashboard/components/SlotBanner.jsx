import React, { useEffect, useState } from 'react';

export const SlotBanner = () => {
  const [activeItem, setActiveItem] = useState(0);
  
  const items = [
    { title: "JACKPOT", subtitle: "Wygraj 1,000,000 PLN 🏆", gradient: "from-purple to-indigo", glowColor: "purple" },
    { title: "SUPER KURS", subtitle: "Real Madryt vs Barcelona ⚽", gradient: "from-info to-indigo", glowColor: "info" },
    { title: "BONUS", subtitle: "+100% do pierwszego depozytu 🎁", gradient: "from-accent to-accent-hover", glowColor: "accent" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveItem((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[200px] md:h-[260px] lg:h-[300px] w-full overflow-hidden relative bg-dark/60 backdrop-blur-2xl rounded-3xl mb-8 md:mb-10 shadow-[0_20px_50px_-12px_rgba(240,185,11,0.1)] border border-surface/50 group">
      {/* Decorative neon background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[100px] group-hover:bg-accent/30 transition-colors duration-1000" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple/10 rounded-full blur-[120px]" />
      
      <div 
        className="h-full transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
        style={{ transform: `translateY(-${activeItem * 100}%)` }}
      >
        {items.map((item, index) => (
          <div 
            key={index} 
            className={`h-[200px] md:h-[260px] lg:h-[300px] flex flex-col items-center justify-center relative overflow-hidden px-4 md:px-10`}
          >
            <div 
              className={`absolute inset-0 opacity-20 bg-gradient-to-br ${item.gradient} blur-3xl`}
            />
            <h2 className={`text-4xl md:text-6xl lg:text-7xl font-black z-10 uppercase tracking-tighter mb-2 md:mb-4 text-center bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent drop-shadow-2xl`}>
              {item.title}
            </h2>
            <p className="text-lg md:text-2xl lg:text-3xl text-white/90 z-10 mb-6 md:mb-8 font-bold text-center drop-shadow-md">{item.subtitle}</p>
            <button className={`z-10 px-8 md:px-12 py-3 md:py-4 bg-gradient-to-r ${item.gradient} text-white rounded-full font-black text-sm md:text-lg hover:scale-110 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 shadow-xl uppercase tracking-wider`}>
              Sprawdź teraz
            </button>
          </div>
        ))}
      </div>
      
      {/* Animated gradient line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-purple to-info animate-[marquee_3s_linear_infinite]" style={{ backgroundSize: '200% 100%' }} />

      {/* Dots indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {items.map((_, i) => (
          <button 
            key={i}
            onClick={() => setActiveItem(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === activeItem ? 'bg-accent w-6' : 'bg-muted/40 hover:bg-muted/60'}`}
          />
        ))}
      </div>
    </div>
  );
};
