/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'surface': '#101010',
        'primary': '#00AFFF',
        'subtext': '#A0A0A0',
        'danger': '#FF4D4D',
      },
    },
  },
  plugins: [],
}
