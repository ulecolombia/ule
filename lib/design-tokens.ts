/**
 * ULE - DESIGN TOKENS
 * Sistema de tokens de diseño para consistencia visual
 */

export const designTokens = {
  // Colores
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

  // Espaciado (base 4px)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    base: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',
  },

  // Border radius
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },

  // Sombras
  shadows: {
    soft: '0 2px 8px rgba(0, 0, 0, 0.08)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.12)',
    large: '0 8px 32px rgba(0, 0, 0, 0.16)',
    xl: '0 12px 48px rgba(0, 0, 0, 0.20)',
  },

  // Transiciones
  transitions: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  // Tipografía
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  // Z-index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const

export type DesignTokens = typeof designTokens
