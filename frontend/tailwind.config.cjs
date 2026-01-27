/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#0f1923',
        'secondary': '#1a2c38',
        'accent': '#9B7EBD',
        'light': '#b0bec5',
        'dark': '#0a0e13',
        'slate': '#64748b',
        'emerald': '#9B7EBD',
        'amber': '#ffb800',
        'indigo': '#5865f2',
        'rose': '#ff3864',
        'purple': '#9333ea',
        'blue': '#1e9eff',
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
          '0%': { borderColor: '#00ff88', boxShadow: '0 0 15px rgba(0, 255, 136, 0.3)' },
          '100%': { borderColor: '#715A5A', boxShadow: 'none' },
        },
        flashRed: {
          '0%': { borderColor: '#ff0055', boxShadow: '0 0 15px rgba(255, 0, 85, 0.3)' },
          '100%': { borderColor: '#715A5A', boxShadow: 'none' },
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
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        glitchRed: {
          '0%, 100%': { transform: 'translate(0)' },
          '33%': { transform: 'translate(-4px, 0)' },
          '66%': { transform: 'translate(4px, 0)' },
        },
        glitchCyan: {
          '0%, 100%': { transform: 'translate(0)' },
          '33%': { transform: 'translate(4px, 0)' },
          '66%': { transform: 'translate(-4px, 0)' },
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
        typing: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
}
