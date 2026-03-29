export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Wine/Burgundy professional color palette
        'ibkr-navy': '#5a1a24',
        'ibkr-blue': '#8b3a47',
        'ibkr-light-blue': '#f5f0ee',
        'ibkr-dark': '#3a1115',
        'ibkr-gray-900': '#1a1d2e',
        'ibkr-gray-800': '#242738',
        'ibkr-gray-700': '#3a3f52',
        'ibkr-gray-600': '#4f5666',
        'ibkr-gray-500': '#6b7280',
        'ibkr-gray-400': '#9ca3af',
        'ibkr-gray-300': '#d1d5db',
        'ibkr-gray-200': '#e5e7eb',
        'ibkr-gray-100': '#f3f4f6',
        'ibkr-success': '#10b981',
        'ibkr-warning': '#f59e0b',
        'ibkr-danger': '#ef4444',
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'premium': '0 8px 16px -2px rgba(90, 26, 36, 0.1)',
        'outline': '0 0 0 1px rgba(90, 26, 36, 0.1)',
      },
      borderWidth: {
        '3': '3px',
      },
      borderColor: {
        'ibkr': '#e5e7eb',
      },
    },
  },
  plugins: [],
}
