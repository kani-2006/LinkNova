/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: '#E2E8F0', // #E2E8F0 equivalent
        background: '#FFFFFF',
        foreground: '#0F172A',
        secondary: {
          DEFAULT: '#F8FAFC',
          foreground: '#64748B',
        },
        primary: {
          DEFAULT: '#4F46E5',
          hover: '#4338CA',
          foreground: '#FFFFFF',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 8px -1px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 10px 30px -4px rgba(79, 70, 229, 0.08), 0 4px 12px -2px rgba(79, 70, 229, 0.04)',
      },
    },
  },
  plugins: [],
}
