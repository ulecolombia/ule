/**
 * Provider para Command Palette con atajos de teclado globales
 */

'use client'

import { useEffect } from 'react'
import { useCommandPalette } from '@/hooks/use-command-palette'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { CommandPalette } from './CommandPalette'

export function CommandPaletteProvider() {
  const { toggle } = useCommandPalette()

  // Inicializar todos los atajos de teclado
  useKeyboardShortcuts()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K o Cmd+K para abrir/cerrar Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [toggle])

  return <CommandPalette />
}
