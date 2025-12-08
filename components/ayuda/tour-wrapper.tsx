/**
 * TOUR WRAPPER
 * Componente wrapper para tours guiados con react-joyride
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'
import { usePathname } from 'next/navigation'

interface TourWrapperProps {
  steps: Step[]
  tourKey: string
  onComplete?: () => void
}

export function TourWrapper({ steps, tourKey, onComplete }: TourWrapperProps) {
  const [run, setRun] = useState(false)
  const pathname = usePathname()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup global al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    const verificarTour = async () => {
      try {
        // Crear nuevo AbortController para esta request
        abortControllerRef.current = new AbortController()

        const response = await fetch(
          `/api/onboarding/verificar-tour?tour=${tourKey}`,
          { signal: abortControllerRef.current.signal }
        )
        const data = await response.json()

        if (!data.visto) {
          // Esperar 1 segundo para que la página cargue
          timeoutRef.current = setTimeout(() => {
            setRun(true)
          }, 1000)
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error al verificar tour:', error)
        }
      }
    }

    verificarTour()

    // Cleanup específico de este useEffect
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [pathname, tourKey])

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false)

      // Marcar tour como completado
      try {
        await fetch('/api/onboarding/completar-tour', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tourKey }),
        })

        if (onComplete) {
          onComplete()
        }
      } catch (error) {
        console.error('Error al completar tour:', error)
      }
    }
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar tour',
      }}
      styles={{
        options: {
          primaryColor: '#14B8A6',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
        },
        buttonNext: {
          backgroundColor: '#14B8A6',
          borderRadius: 6,
        },
        buttonBack: {
          color: '#666',
        },
      }}
    />
  )
}
