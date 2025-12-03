/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#37353E',
        'secondary': '#44444E',
        'accent': '#715A5A',
        'light': '#D3DAD9',
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
        }
      }
    },
  },
  plugins: [],
}
