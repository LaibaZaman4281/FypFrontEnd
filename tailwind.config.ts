import type { Config } from 'tailwindcss';

/**
 * Brand identity carried over 1:1 from the React Native StyleSheets
 * (assets/components/Auth/SignupScreen.js colour constants).
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1E64D3',
          dark: '#1650AE',
          light: '#EAF2FF',
          border: '#D8E6FF',
        },
        ink: '#0E1B4D',
        subtle: '#7C8CA6',
        muted: '#9BA9C0',
        line: '#E6EDF9',
        canvas: '#F6F9FF',
        success: '#00B14F',
        danger: '#DC2626',
        warn: '#B45309',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(14, 27, 77, 0.06)',
        pop: '0 12px 40px rgba(14, 27, 77, 0.16)',
      },
      maxWidth: {
        content: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
