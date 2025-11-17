/**
 * ULE - SISTEMA DE Z-INDEX CENTRALIZADO
 * Previene conflictos de capas y mantiene consistencia visual
 */

export const Z_INDEX = {
  // Base layers (0-9)
  base: 0,

  // Content layers (10-19)
  stickyContent: 10,
  actionBar: 10,

  // Interactive elements (20-39)
  dropdown: 20,
  tooltip: 25,
  previewButton: 30,

  // Navigation (40-49)
  header: 40,
  sidebar: 45,

  // Overlays (50-59)
  overlay: 50,
  autocomplete: 50,

  // Modals and dialogs (60-69)
  modal: 60,
  dialog: 65,

  // Toasts and notifications (70-79)
  toast: 70,
  notification: 75,

  // Critical alerts (80-99)
  alert: 80,
  cookieBanner: 90,
} as const

export type ZIndexLevel = (typeof Z_INDEX)[keyof typeof Z_INDEX]

/**
 * Genera clase de Tailwind para z-index
 */
export function getZIndexClass(level: keyof typeof Z_INDEX): string {
  const value = Z_INDEX[level]

  // Tailwind solo tiene z-0, z-10, z-20, z-30, z-40, z-50
  // Para valores personalizados, usar style inline o agregar a tailwind.config
  if (value <= 10) return 'z-10'
  if (value <= 20) return 'z-20'
  if (value <= 30) return 'z-30'
  if (value <= 40) return 'z-40'
  if (value <= 50) return 'z-50'
  return 'z-50'
}
