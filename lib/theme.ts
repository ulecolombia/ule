/**
 * ULE - CONFIGURACIÓN DEL TEMA
 * Utilidades para manejo del tema y modo oscuro
 */

import { designTokens } from './design-tokens'

export const theme = {
  ...designTokens,

  // Breakpoints para responsive design
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Container widths
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const

export type Theme = typeof theme
