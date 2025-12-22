/**
 * ULE - LOGO COMPONENT
 * Logo oficial de Ule con la U asimétrica característica
 * El brazo izquierdo de la U es más corto que el derecho
 */

import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  iconOnly?: boolean
}

// Colores oficiales de la marca Ule (del tailwind.config.ts)
const BRAND_COLORS = {
  teal: '#14B8A6', // Color primario (teal-500) - igual que en tailwind
  textDark: '#1E293B', // Color del texto "ule" (slate-800, igual que text-light)
}

/**
 * Icono SVG de Ule - La U asimétrica distintiva
 * El brazo izquierdo es más corto que el derecho (característico de la marca)
 */
function UleIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Ule icon"
    >
      {/* Fondo redondeado teal */}
      <rect width="100" height="100" rx="14" fill={BRAND_COLORS.teal} />
      {/*
        U asimétrica característica de Ule:
        - Brazo DERECHO ligeramente más alto (Y=16)
        - Brazo IZQUIERDO un poco más corto (Y=24) - diferencia sutil
        - U más ancha/gruesa - grosor ~22px
        - Bien estructurada
      */}
      <path
        d="
          M 15 24
          L 15 55
          C 15 73, 30 86, 50 86
          C 70 86, 85 73, 85 55
          L 85 16
          L 63 16
          L 63 55
          C 63 64, 58 70, 50 70
          C 42 70, 37 64, 37 55
          L 37 24
          Z
        "
        fill="white"
      />
    </svg>
  )
}

/**
 * Texto "ule" en el estilo de marca
 */
function UleText({ size }: { size: 'sm' | 'md' | 'lg' | 'xl' }) {
  const textSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  }

  return (
    <span
      className={cn('font-bold tracking-tight', textSizes[size])}
      style={{ color: BRAND_COLORS.textDark }}
    >
      ule
    </span>
  )
}

export function Logo({ size = 'md', className, iconOnly = false }: LogoProps) {
  // Tamaños del icono en píxeles (aumentados)
  const iconSizes = {
    sm: 32,
    md: 42,
    lg: 56,
    xl: 72,
  }

  // Espaciado entre icono y texto
  const gapSizes = {
    sm: 'gap-2',
    md: 'gap-2.5',
    lg: 'gap-3',
    xl: 'gap-4',
  }

  // Padding interno del contenedor pill (aumentado)
  const paddingSizes = {
    sm: 'px-2.5 py-1.5',
    md: 'px-3.5 py-2',
    lg: 'px-5 py-2.5',
    xl: 'px-6 py-3',
  }

  const iconSize = iconSizes[size]

  if (iconOnly) {
    return (
      <div className={cn('flex items-center', className)}>
        <UleIcon size={iconSize} />
      </div>
    )
  }

  // Logo completo con borde pill negro
  return (
    <div
      className={cn(
        'flex items-center rounded-full border-2 border-gray-900',
        gapSizes[size],
        paddingSizes[size],
        className
      )}
    >
      <UleIcon size={iconSize} />
      <UleText size={size} />
    </div>
  )
}

/**
 * Exportar el icono por separado para uso en PWA, favicon, etc.
 */
export { UleIcon }
