/**
 * KBD Component - Muestra atajos de teclado con estilo
 */

'use client'

import { formatShortcut } from '@/hooks/use-keyboard-shortcuts'

interface KbdProps {
  keys: string
  ctrlOrCmd?: boolean
  alt?: boolean
  shift?: boolean
  className?: string
}

/**
 * Componente para mostrar atajos de teclado
 * Uso: <Kbd keys="k" ctrlOrCmd />
 */
export function Kbd({
  keys,
  ctrlOrCmd = false,
  alt = false,
  shift = false,
  className = '',
}: KbdProps) {
  const shortcut = formatShortcut(keys, ctrlOrCmd, alt, shift)

  return (
    <kbd
      className={`inline-flex items-center gap-1 rounded bg-light-100 px-2 py-1 text-xs font-mono text-dark-100 ${className}`}
    >
      {shortcut}
    </kbd>
  )
}
