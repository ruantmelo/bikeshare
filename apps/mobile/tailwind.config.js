/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF8400',
        },
        background: {
          app: '#F2F3F0',
          map: '#E8ECE6',
        },
        border: {
          default: '#CBCCC9',
          map: '#D7DBD3',
        },
        text: {
          primary: '#111111',
          muted: '#666666',
          placeholder: '#9A9B97',
          danger: '#B45309',
        },
        control: {
          secondary: '#E7E8E5',
          selected: '#E7E8E4',
          iconTint: '#FFF2E3',
        },
        map: {
          road: '#F7F6F1',
          park: '#D9E6D5',
          parkAlt: '#DDE8D8',
          parkDeep: '#D6E2CF',
          parkSoft: '#E2E9DE',
          tree: '#B7C5B2',
        },
      },
    },
  },
  plugins: [],
};
