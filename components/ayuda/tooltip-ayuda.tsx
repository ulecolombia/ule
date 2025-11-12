/**
 * TOOLTIP DE AYUDA
 * Tooltips contextuales para explicar términos complejos
 */

'use client'

import Tippy from '@tippyjs/react'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light.css'

interface TooltipAyudaProps {
  contenido: string | React.ReactNode
  children: React.ReactElement
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export function TooltipAyuda({
  contenido,
  children,
  placement = 'top',
}: TooltipAyudaProps) {
  return (
    <Tippy
      content={contenido}
      placement={placement}
      theme="light"
      arrow={true}
      interactive={true}
      maxWidth={300}
    >
      <span className="inline-flex items-center">
        {children}
        <span className="material-symbols-outlined text-sm text-gray-400 hover:text-primary ml-1 cursor-help">
          help
        </span>
      </span>
    </Tippy>
  )
}
