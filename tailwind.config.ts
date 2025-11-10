import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#14B8A6', // Turquesa principal (teal-500)
        'primary-dark': '#0F766E', // Hover/estados activos (teal-700)
        'primary-light': '#5EEAD4', // Backgrounds sutiles (teal-300)
        'background-light': '#F8FAFC', // Fondo claro (slate-50)
        'background-dark': '#0F172A', // Fondo oscuro (slate-900)
        'card-light': '#FFFFFF', // Cards modo claro
        'card-dark': '#1E293B', // Cards modo oscuro (slate-800)
        'text-light': '#1E293B', // Texto principal claro (slate-800)
        'text-dark': '#E2E8F0', // Texto principal oscuro (slate-200)
        'subtext-light': '#64748B', // Texto secundario claro (slate-500)
        'subtext-dark': '#94A3B8', // Texto secundario oscuro (slate-400)
        'success-light': '#D1FAE5', // Fondo success claro (emerald-100)
        'success-dark': '#065F46', // Fondo success oscuro (emerald-800)
        'success-text-light': '#065F46', // Texto success claro
        'success-text-dark': '#A7F3D0', // Texto success oscuro
        'warning-light': '#FEF3C7', // Fondo warning claro (amber-100)
        'warning-dark': '#92400E', // Fondo warning oscuro (amber-800)
        'warning-text-light': '#92400E', // Texto warning claro
        'warning-text-dark': '#FCD34D', // Texto warning oscuro
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.08)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        medium: '0 4px 16px rgba(0, 0, 0, 0.12)',
        large: '0 8px 32px rgba(0, 0, 0, 0.16)',
      },
    },
  },
  plugins: [],
}

export default config
