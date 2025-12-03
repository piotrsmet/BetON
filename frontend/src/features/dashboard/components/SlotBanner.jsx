import React, { useEffect, useState } from 'react';

export const SlotBanner = () => {
  const [activeItem, setActiveItem] = useState(0);
  
  const items = [
    { title: "JACKPOT", subtitle: "Wygraj 1,000,000 PLN", color: "#715A5A" },
    { title: "SUPER KURS", subtitle: "Real Madryt vs Barcelona", color: "#44444E" },
    { title: "BONUS", subtitle: "+100% do pierwszego depozytu", color: "#37353E" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveItem((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[240px] w-full overflow-hidden relative bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl mb-8 shadow-2xl border-2 border-accent/30">
      <div 
        className="h-full transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
        style={{ transform: `translateY(-${activeItem * 100}%)` }}
      >
        {items.map((item, index) => (
          <div 
            key={index} 
            className="h-[240px] flex flex-col items-center justify-center relative border-l-8 overflow-hidden"
            style={{ borderColor: item.color }}
          >
            <div 
              className="absolute inset-0 opacity-20 blur-[60px]" 
              style={{ background: item.color }}
            />
            <h2 className="text-6xl font-black text-white z-10 uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] animate-pulse tracking-wider mb-2">
              {item.title}
            </h2>
            <p className="text-2xl text-light z-10 mb-6 font-medium">{item.subtitle}</p>
            <button className="z-10 px-10 py-4 bg-white text-black rounded-full font-extrabold text-lg hover:scale-110 transition-transform shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:shadow-[0_0_35px_rgba(255,255,255,0.8)]">
              SPRAWDŹ TERAZ
            </button>
          </div>
        ))}
      </div>
      
      {/* Decorative lights */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[repeating-linear-gradient(90deg,#715A5A_0px,#715A5A_10px,transparent_10px,transparent_20px)] animate-[marquee_1s_linear_infinite]" />
      <div className="absolute bottom-0 left-0 w-full h-2 bg-[repeating-linear-gradient(90deg,#715A5A_0px,#715A5A_10px,transparent_10px,transparent_20px)] animate-[marquee_1s_linear_infinite_reverse]" />
    </div>
  );
};
