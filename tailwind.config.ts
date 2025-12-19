import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(0 0% 3%)',
        foreground: 'hsl(0 0% 98%)',
        border: 'hsl(0 0% 14%)',
        input: 'hsl(0 0% 14%)',
        ring: 'hsl(262 83% 58%)',
        primary: {
          DEFAULT: 'hsl(262 83% 58%)',
          foreground: 'hsl(0 0% 98%)',
        },
        secondary: {
          DEFAULT: 'hsl(0 0% 14%)',
          foreground: 'hsl(0 0% 98%)',
        },
        muted: {
          DEFAULT: 'hsl(0 0% 14%)',
          foreground: 'hsl(0 0% 63%)',
        },
        accent: {
          DEFAULT: 'hsl(0 0% 14%)',
          foreground: 'hsl(0 0% 98%)',
        },
        card: {
          DEFAULT: 'hsl(0 0% 3%)',
          foreground: 'hsl(0 0% 98%)',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)',
      },
    },
  },
  plugins: [],
}

export default config
