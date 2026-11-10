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
        /**
         * Course palette — copied 1:1 from the React Native
         * `assets/components/helpers/courseApi.js` `courseColors` map.
         *
         * These were missing, so `bg-course`, `text-course`, `text-course-ink`,
         * `border-course-border`, … compiled to NOTHING. The company header
         * band lost its blue background (white "Course Management" on a white
         * page), the white "Add Course" button vanished, and the worker's
         * "Browse Courses" card rendered as an empty white box with invisible
         * white text. `text` in RN is `ink` here because `text` is already a
         * Tailwind utility prefix.
         */
        course: {
          DEFAULT: '#1565C0', // courseColors.primary
          dark: '#0D47A1', // courseColors.dark
          pale: '#EAF3FF', // courseColors.pale
          background: '#F7FAFF', // courseColors.background
          ink: '#172033', // courseColors.text
          muted: '#64748B', // courseColors.muted
          border: '#D9E5F3', // courseColors.border
          success: '#16865C', // courseColors.success
          warning: '#C47A00', // courseColors.warning
          danger: '#C62828', // courseColors.danger
        },
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
