import React, { useEffect, useState } from 'react';

export const SlotBanner = () => {
  const [activeItem, setActiveItem] = useState(0);
  
  const items = [
    { title: "JACKPOT", subtitle: "Wygraj 1,000,000 PLN 💎", gradient: "from-purple to-indigo", glowColor: "purple" },
    { title: "SUPER KURS", subtitle: "Real Madryt vs Barcelona ⚽", gradient: "from-blue to-indigo", glowColor: "blue" },
    { title: "BONUS", subtitle: "+100% do pierwszego depozytu 🎁", gradient: "from-accent to-emerald", glowColor: "accent" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveItem((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[180px] md:h-[220px] lg:h-[240px] w-full overflow-hidden relative bg-secondary/50 backdrop-blur-xl rounded-3xl mb-6 md:mb-8 shadow-2xl border border-accent/10">
      <div 
        className="h-full transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
        style={{ transform: `translateY(-${activeItem * 100}%)` }}
      >
        {items.map((item, index) => (
          <div 
            key={index} 
            className={`h-[180px] md:h-[220px] lg:h-[240px] flex flex-col items-center justify-center relative overflow-hidden px-4`}
          >
            <div 
              className={`absolute inset-0 opacity-10 bg-gradient-to-br ${item.gradient} blur-3xl`}
            />
            <h2 className={`text-3xl md:text-5xl lg:text-6xl font-black z-10 uppercase tracking-wider mb-2 text-center bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
              {item.title}
            </h2>
            <p className="text-base md:text-xl lg:text-2xl text-light/80 z-10 mb-4 md:mb-6 font-semibold text-center">{item.subtitle}</p>
            <button className={`z-10 px-6 md:px-8 lg:px-10 py-3 md:py-4 bg-gradient-to-r ${item.gradient} text-white rounded-full font-bold text-sm md:text-base lg:text-lg hover:scale-105 hover:shadow-2xl hover:shadow-${item.glowColor}/50 transition-all shadow-lg`}>
              Sprawdź teraz →
            </button>
          </div>
        ))}
      </div>
      
      {/* Animated gradient line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-purple to-blue animate-[marquee_3s_linear_infinite]" style={{ backgroundSize: '200% 100%' }} />
    </div>
  );
};
