/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        accent: {
          light: '#00ff88',
          DEFAULT: '#22ff44',
          dark: '#00cc44',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-green': 'pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'matrix-rain': 'matrix-rain 3s linear infinite',
        'hologram-flicker': 'hologram-flicker 2s ease-in-out infinite',
        'data-flow': 'data-flow 4s linear infinite',
        'neural-pulse': 'neural-pulse 3s ease-in-out infinite',
        'cyber-glow': 'cyber-glow 3s ease-in-out infinite alternate',
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #22ff44, 0 0 10px #22ff44, 0 0 15px #22ff44' },
          '100%': { boxShadow: '0 0 10px #22ff44, 0 0 20px #22ff44, 0 0 30px #22ff44' },
        },
        'pulse-green': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        'cyber-glow': {          '0%': { 
            boxShadow: '0 0 5px #22ff44, 0 0 10px #22ff44, 0 0 15px #22ff44, inset 0 0 5px #22ff44' 
          },
          '100%': { 
            boxShadow: '0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 30px #00ff88, inset 0 0 10px #00ff88' 
          },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
      }
    },
  },
  plugins: [],
}
