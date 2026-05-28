/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark': '#0B0E14',
        'primary': '#111827',
        'secondary': '#1A2235',
        'surface': '#232D40',
        'accent': '#F0B90B',
        'accent-hover': '#D4A20A',
        'sakura': '#E8A0BF',
        'sakura-dark': '#6B2D5B',
        'win': '#22C55E',
        'lose': '#EF4444',
        'live': '#F43F5E',
        'info': '#3B82F6',
        'light': '#CBD5E1',
        'muted': '#64748B',
        'amber': '#FBBF24',
        'indigo': '#5865F2',
        'purple': '#A855F7',
      },
      keyframes: {
        shine: {
          '0%': { left: '-100%' },
          '20%': { left: '200%' },
          '100%': { left: '200%' },
        },
        marquee: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '20px 0' },
        },
        flashGreen: {
          '0%': { borderColor: '#22C55E', boxShadow: '0 0 15px rgba(34, 197, 94, 0.3)' },
          '100%': { borderColor: 'transparent', boxShadow: 'none' },
        },
        flashRed: {
          '0%': { borderColor: '#EF4444', boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)' },
          '100%': { borderColor: 'transparent', boxShadow: 'none' },
        },
        fall: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: 0 },
        },
        firework: {
          '0%': { transform: 'scale(1)', opacity: 1 },
          '50%': { transform: 'scale(30)', opacity: 0.5 },
          '100%': { transform: 'scale(50)', opacity: 0 },
        },
        coinFall: {
          '0%': { transform: 'translateY(0) rotateY(0deg)', opacity: 1 },
          '100%': { transform: 'translateY(100vh) rotateY(1080deg)', opacity: 0.5 },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideInFromTop: {
          '0%': { opacity: 0, transform: 'translateY(-50px) scale(0.95)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        slideInFromBottom: {
          '0%': { opacity: 0, transform: 'translateY(50px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        zoomIn: {
          '0%': { opacity: 0, transform: 'scale(0.8)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        expandRing: {
          '0%': { width: '0', height: '0', opacity: 1 },
          '100%': { width: '800px', height: '800px', opacity: 0 },
        },
        explode: {
          '0%': { 
            transform: 'translate(-50%, -50%) translate(0, 0) scale(1)',
            opacity: 1 
          },
          '100%': { 
            transform: 'translate(-50%, -50%) translate(calc(cos(var(--angle)) * var(--distance)), calc(sin(var(--angle)) * var(--distance))) scale(0)',
            opacity: 0 
          },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(240, 185, 11, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(240, 185, 11, 0.6)' },
        },
      }
    },
  },
  plugins: [],
}
