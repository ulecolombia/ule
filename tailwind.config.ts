import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00A19A',
          light: '#48C9B0',
          dark: '#008C85',
        },
        dark: {
          DEFAULT: '#1A1A1A',
          50: '#2D2D2D',
          100: '#404040',
        },
        light: {
          DEFAULT: '#FFFFFF',
          50: '#F5F5F5',
          100: '#E8E8E8',
        },
        accent: {
          DEFAULT: '#FF6B6B',
          light: '#FF8E8E',
        },
        success: '#00D09C',
        warning: '#FFB800',
        error: '#FF4757',
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '48': '48px',
        '64': '64px',
        '96': '96px',
      },
      borderRadius: {
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.08)',
        medium: '0 4px 16px rgba(0, 0, 0, 0.12)',
        large: '0 8px 32px rgba(0, 0, 0, 0.16)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
}

export default config
