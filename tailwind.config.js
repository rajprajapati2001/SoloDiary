/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        digital: ['DigitalDismay', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};
