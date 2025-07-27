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
          50: '#f0f4f8',
          100: '#e1e9f2',
          200: '#c3d4e6',
          300: '#a5bed9',
          400: '#87a9cc',
          500: '#6994bf',
          600: '#5779a3',
          700: '#456187',
          800: '#34496b',
          900: '#2c3e50',
          950: '#1a2533'
        },
        heritage: {
          50: '#f7f5f3',
          100: '#f0ebe7',
          200: '#e0d6ce',
          300: '#d1c2b5',
          400: '#c1ad9c',
          500: '#b29983',
          600: '#a3856a',
          700: '#947051',
          800: '#8b7355',
          900: '#6b5a43'
        },
        accent: {
          50: '#fef7f0',
          100: '#fdede0',
          200: '#fbd8c1',
          300: '#f9c4a2',
          400: '#f7af83',
          500: '#f59b64',
          600: '#e67e22',
          700: '#d17307',
          800: '#b86506',
          900: '#9f5604'
        }
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'body': ['Inter', 'sans-serif']
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      },
      animation: {
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scale-in': 'scale-in 0.2s ease-out'
      }
    },
  },
  plugins: [],
}