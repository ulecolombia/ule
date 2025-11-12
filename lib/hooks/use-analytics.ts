/**
 * HOOK DE ANALYTICS
 * Tracking de eventos desde el frontend
 */

'use client'

import { useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Helper seguro para manejar sessionStorage
 * Funciona en SSR, modo incógnito, y con storage deshabilitado
 */
function getSessionId(): string {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return crypto.randomUUID()
    }

    let sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('sessionId', sessionId)
    }
    return sessionId
  } catch (error) {
    // Modo incógnito o storage deshabilitado
    console.warn('SessionStorage no disponible, usando ID temporal')
    return crypto.randomUUID()
  }
}

export function useAnalytics() {
  const pathname = usePathname()
  const sessionIdRef = useRef<string | null>(null)

  // Obtener sessionId una sola vez y cachear
  const getOrCreateSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = getSessionId()
    }
    return sessionIdRef.current
  }, [])

  const track = useCallback(
    async (evento: string, categoria: string, metadata?: any) => {
      try {
        const sessionId = getOrCreateSessionId()

        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evento,
            categoria,
            metadata: {
              ...metadata,
              pathname,
            },
            sessionId,
          }),
        })

        // También enviar a Google Analytics si está habilitado
        if (typeof window !== 'undefined' && (window as any).gtag) {
          ;(window as any).gtag('event', evento, {
            event_category: categoria,
            ...metadata,
          })
        }
      } catch (error) {
        console.error('Error tracking event:', error)
      }
    },
    [pathname, getOrCreateSessionId]
  )

  const trackPageView = useCallback(() => {
    track('page_view', 'NAVEGACION', { page: pathname })
  }, [pathname, track])

  const trackError = useCallback(
    async (error: Error, componente?: string, accion?: string) => {
      try {
        const sessionId = getOrCreateSessionId()

        await fetch('/api/analytics/error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mensaje: error.message,
            stack: error.stack,
            tipo: error.name,
            severidad: 'ERROR',
            url: typeof window !== 'undefined' ? window.location.href : '',
            componente,
            accion,
            sessionId,
          }),
        })
      } catch (err) {
        console.error('Error logging error:', err)
      }
    },
    [getOrCreateSessionId]
  )

  return {
    track,
    trackPageView,
    trackError,
  }
}
