/**
 * Hook para manejar atajos de teclado globales
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCommandPalette } from './use-command-palette'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  description: string
  action: () => void
}

/**
 * Atajos de teclado disponibles en la aplicación
 */
export const KEYBOARD_SHORTCUTS = {
  // Navegación
  SEARCH: {
    key: 'k',
    ctrlOrCmd: true,
    description: 'Abrir búsqueda global',
  },
  DASHBOARD: {
    key: 'h',
    ctrlOrCmd: true,
    description: 'Ir al Dashboard',
  },

  // Acciones rápidas
  NEW_INVOICE: {
    key: 'n',
    ctrlOrCmd: true,
    description: 'Nueva factura',
  },
  LIQUIDATE_PILA: {
    key: 'p',
    ctrlOrCmd: true,
    description: 'Liquidar PILA',
  },
  VIEW_PROFILE: {
    key: 'm',
    ctrlOrCmd: true,
    description: 'Ver perfil',
  },

  // Ayuda
  HELP: {
    key: '?',
    shiftKey: true,
    description: 'Mostrar atajos de teclado',
  },
} as const

/**
 * Hook principal para atajos de teclado
 */
export function useKeyboardShortcuts() {
  const router = useRouter()
  const { toggle: toggleCommandPalette } = useCommandPalette()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      // Ctrl/Cmd + K: Búsqueda global (manejado en CommandPaletteProvider)
      // Ya está implementado, no hacer nada aquí

      // Ctrl/Cmd + H: Dashboard
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault()
        router.push('/dashboard')
        return
      }

      // Ctrl/Cmd + N: Nueva factura (solo si no estamos en input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !isInput) {
        e.preventDefault()
        router.push('/facturacion/nueva')
        return
      }

      // Ctrl/Cmd + P: Liquidar PILA (solo si no estamos en input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p' && !isInput) {
        e.preventDefault()
        router.push('/pila')
        return
      }

      // Ctrl/Cmd + M: Ver perfil (solo si no estamos en input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'm' && !isInput) {
        e.preventDefault()
        router.push('/perfil')
        return
      }

      // Shift + ?: Mostrar ayuda de atajos (solo si no estamos en input)
      if (e.shiftKey && e.key === '?' && !isInput) {
        e.preventDefault()
        // Mostrar modal de ayuda (implementar después si se necesita)
        console.log('Mostrar modal de ayuda de atajos')
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [router, toggleCommandPalette])
}

/**
 * Formatea un atajo de teclado para mostrar
 * Ej: formatShortcut('k', true) => "Ctrl+K" o "⌘K" (en Mac)
 */
export function formatShortcut(
  key: string,
  ctrlOrCmd: boolean = false,
  alt: boolean = false,
  shift: boolean = false
): string {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent)
  const parts: string[] = []

  if (ctrlOrCmd) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }

  if (alt) {
    parts.push(isMac ? '⌥' : 'Alt')
  }

  if (shift) {
    parts.push(isMac ? '⇧' : 'Shift')
  }

  parts.push(key.toUpperCase())

  return parts.join(isMac ? '' : '+')
}
