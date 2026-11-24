/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tecflix: {
          bg: '#080312',
          surface: '#120726',
          surfaceLight: '#1d0c3d',
          card: '#16092d',
          border: '#3b1875',
          neon: '#a855f7',
          glow: '#c084fc',
          accent: '#8b5cf6',
          electric: '#7e22ce',
          light: '#f3e8ff',
          muted: '#a89bc2'
        }
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.45)',
        'neon-cyan': '0 0 20px rgba(6, 182, 212, 0.45)',
        'neon-gold': '0 0 20px rgba(245, 158, 11, 0.45)',
        'neon-crimson': '0 0 20px rgba(239, 68, 68, 0.45)',
        'glow-lg': '0 0 35px rgba(168, 85, 247, 0.65)',
        'card-hover': '0 10px 30px -5px rgba(168, 85, 247, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow 2.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)' },
          '100%': { boxShadow: '0 0 30px rgba(192, 132, 252, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
