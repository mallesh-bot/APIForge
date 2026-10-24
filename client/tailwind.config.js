/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forge: {
          bg: '#0b0f17',       // Main deep backdrop
          sidebar: '#0d131f',  // Sidebar surface
          card: '#111827',     // Panel surface
          input: '#1a2234',    // Input fields
          border: '#1f293d',   // Subtle borders
          hover: '#182235',    // Hover highlights
          accent: '#06b6d4',   // Primary Cyan
          accentHover: '#0891b2',
          muted: '#94a3b8',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
