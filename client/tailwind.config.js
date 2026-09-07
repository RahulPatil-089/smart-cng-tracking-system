/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cng: { 50: '#effcf5', 100: '#d8f8e5', 500: '#16a34a', 600: '#15803d', 700: '#166534' },
        ink: '#10251b'
      }
    }
  },
  plugins: []
};
