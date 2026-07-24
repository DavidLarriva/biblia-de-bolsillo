/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0A0A0A',
        'bg-elevated': '#181816',
        'bg-elevated-2': '#202020',
        'border-subtle': '#2A2A26',
        'text-primary': '#EDEDED',
        'text-secondary': '#9A968C',
        'text-muted': '#6E6B64',
        accent: '#C9A66B',
        'accent-text': '#241C0F',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        voice: ['Lora', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
