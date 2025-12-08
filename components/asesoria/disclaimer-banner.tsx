'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface DisclaimerBannerProps {
  variant?: 'default' | 'prominent' | 'subtle'
  showContactButton?: boolean
  className?: string
}

export function DisclaimerBanner({
  variant = 'default',
  showContactButton = false,
  className = '',
}: DisclaimerBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const variants = {
    default: 'border-warning bg-warning/10',
    prominent: 'border-red-500 bg-red-50 dark:bg-red-950',
    subtle: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
  }

  const icons = {
    default: 'warning',
    prominent: 'error',
    subtle: 'info',
  }

  const iconColors = {
    default: 'text-warning',
    prominent: 'text-red-600',
    subtle: 'text-blue-600',
  }

  return (
    <Alert variant="warning" className={`${variants[variant]} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-1 items-start space-x-3">
          <span className={`material-symbols-outlined ${iconColors[variant]}`}>
            {icons[variant]}
          </span>
          <div className="flex-1">
            <AlertDescription className="text-sm">
              <strong>Importante:</strong> Esta plataforma ofrece orientación
              educativa automatizada mediante inteligencia artificial. No
              constituye asesoría tributaria, contable o legal profesional
              certificada. Para casos complejos o decisiones importantes,
              consulta con un contador público, abogado tributarista u otro
              profesional certificado que pueda analizar tu situación
              específica.
              {showContactButton && (
                <>
                  {' '}
                  <Button
                    variant="ghost"
                    className="inline h-auto p-0 font-semibold underline"
                    onClick={() => (window.location.href = '/contacto')}
                  >
                    Solicitar asesoría profesional
                  </Button>
                </>
              )}
            </AlertDescription>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </Alert>
  )
}
