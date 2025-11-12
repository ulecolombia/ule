/**
 * ULE - THEME CONFIGURATION
 * Sistema de diseño centralizado con colores, tipografía y utilidades
 */

// ===================================
// COLORS - Paleta de colores Ule
// ===================================
export const COLORS = {
  // Colores principales
  primary: '#14B8A6', // Turquesa principal (teal-500)
  primaryDark: '#0F766E', // Hover/estados activos (teal-700)
  primaryLight: '#5EEAD4', // Backgrounds sutiles (teal-300)

  // Backgrounds
  backgroundLight: '#F8FAFC', // Fondo claro (slate-50)
  backgroundDark: '#0F172A', // Fondo oscuro (slate-900)

  // Cards
  cardLight: '#FFFFFF', // Cards modo claro
  cardDark: '#1E293B', // Cards modo oscuro (slate-800)

  // Texto
  textLight: '#1E293B', // Texto principal claro (slate-800)
  textDark: '#E2E8F0', // Texto principal oscuro (slate-200)
  subtextLight: '#64748B', // Texto secundario claro (slate-500)
  subtextDark: '#94A3B8', // Texto secundario oscuro (slate-400)

  // Estados - Success
  successLight: '#D1FAE5', // Fondo success claro (emerald-100)
  successDark: '#065F46', // Fondo success oscuro (emerald-800)
  successTextLight: '#065F46', // Texto success claro
  successTextDark: '#A7F3D0', // Texto success oscuro

  // Estados - Warning
  warningLight: '#FEF3C7', // Fondo warning claro (amber-100)
  warningDark: '#92400E', // Fondo warning oscuro (amber-800)
  warningTextLight: '#92400E', // Texto warning claro
  warningTextDark: '#FCD34D', // Texto warning oscuro
} as const

// ===================================
// TYPOGRAPHY - Configuración de fuentes
// ===================================
export const TYPOGRAPHY = {
  fontFamily: {
    display: ['Inter', 'sans-serif'],
    sans: ['Inter', 'sans-serif'],
  },
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const

// ===================================
// BUTTON STYLES - Estilos predefinidos para botones
// ===================================
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'default' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export const getButtonStyles = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md') => {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg focus:ring-primary',
    secondary: 'bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border border-subtext-light/20 hover:border-primary focus:ring-primary',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary',
    ghost: 'text-primary hover:bg-primary-light/20 focus:ring-primary',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md focus:ring-red-500',
    default: 'bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg focus:ring-primary',
    destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-md focus:ring-red-500',
  }

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`
}

// ===================================
// CARD STYLES - Estilos predefinidos para cards
// ===================================
export type CardVariant = 'default' | 'metric' | 'highlight'

export const getCardStyles = (variant: CardVariant = 'default') => {
  const baseStyles = 'bg-card-light dark:bg-card-dark rounded-lg shadow-md transition-all duration-200'

  const variantStyles: Record<CardVariant, string> = {
    default: 'p-6',
    metric: 'p-6 hover:shadow-lg hover:scale-[1.02]',
    highlight: 'p-6 border-2 border-primary shadow-lg',
  }

  return `${baseStyles} ${variantStyles[variant]}`
}

// ===================================
// BADGE STYLES - Estilos predefinidos para badges
// ===================================
export type BadgeVariant = 'success' | 'warning' | 'info' | 'neutral' | 'danger' | 'default' | 'secondary' | 'outline'

export const getBadgeStyles = (variant: BadgeVariant = 'neutral') => {
  const baseStyles = 'text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1'

  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-success-light dark:bg-success-dark text-success-text-light dark:text-success-text-dark',
    warning: 'bg-warning-light dark:bg-warning-dark text-warning-text-light dark:text-warning-text-dark',
    info: 'bg-primary-light/30 dark:bg-primary-dark/30 text-primary-dark dark:text-primary-light',
    neutral: 'bg-subtext-light/10 dark:bg-subtext-dark/10 text-subtext-light dark:text-subtext-dark',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    default: 'bg-primary text-white',
    secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
    outline: 'border border-gray-300 bg-transparent text-gray-700 dark:text-gray-300',
  }

  return `${baseStyles} ${variantStyles[variant]}`
}

// ===================================
// SPACING - Sistema de espaciado
// ===================================
export const SPACING = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
} as const

// ===================================
// BORDER RADIUS - Sistema de bordes redondeados
// ===================================
export const BORDER_RADIUS = {
  default: '1rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const

// ===================================
// SHADOWS - Sistema de sombras
// ===================================
export const SHADOWS = {
  soft: '0 2px 8px rgba(0, 0, 0, 0.08)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  medium: '0 4px 16px rgba(0, 0, 0, 0.12)',
  large: '0 8px 32px rgba(0, 0, 0, 0.16)',
} as const

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Combina clases CSS condicionales
 */
export const cn = (...classes: (string | boolean | undefined | null)[]) => {
  return classes.filter(Boolean).join(' ')
}

/**
 * Obtiene el color del tema basado en el modo
 */
export const getThemeColor = (lightColor: string, darkColor: string, isDark: boolean) => {
  return isDark ? darkColor : lightColor
}
