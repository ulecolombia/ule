'use client'

/**
 * COOKIE BANNER
 * Banner de aceptación de cookies según normativa
 *
 * Características:
 * - Aparece en primera visita
 * - Opciones granulares de cookies
 * - Guarda preferencias del usuario
 * - Cumple con Ley 1581 y preparado para GDPR
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CookiePreferences {
  cookiesEsenciales: boolean
  cookiesAnaliticas: boolean
  cookiesMarketing: boolean
  cookiesPersonalizacion: boolean
}

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    cookiesEsenciales: true, // Siempre true
    cookiesAnaliticas: false,
    cookiesMarketing: false,
    cookiesPersonalizacion: false,
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Verificar si ya se aceptaron cookies
    const cookiesAceptadas = localStorage.getItem('cookiesAceptadas')

    if (!cookiesAceptadas) {
      // Mostrar banner después de 1 segundo
      setTimeout(() => {
        setIsVisible(true)
      }, 1000)
    }
  }, [])

  const guardarPreferencias = async (aceptarTodas = false) => {
    setIsLoading(true)

    try {
      const prefsToSave = aceptarTodas
        ? {
            cookiesEsenciales: true,
            cookiesAnaliticas: true,
            cookiesMarketing: true,
            cookiesPersonalizacion: true,
          }
        : preferences

      const response = await fetch('/api/privacy/cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefsToSave),
      })

      if (!response.ok) {
        throw new Error('Error al guardar preferencias')
      }

      // Guardar en localStorage
      localStorage.setItem('cookiesAceptadas', 'true')
      localStorage.setItem('cookiePreferences', JSON.stringify(prefsToSave))

      // Ocultar banner
      setIsVisible(false)

      toast.success('Preferencias de cookies guardadas')
    } catch (error) {
      console.error('Error guardando preferencias:', error)
      toast.error('Error al guardar preferencias')
    } finally {
      setIsLoading(false)
    }
  }

  const rechazarOpcionales = async () => {
    await guardarPreferencias(false)
  }

  const aceptarTodas = async () => {
    await guardarPreferencias(true)
  }

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'cookiesEsenciales') return // No se pueden desactivar

    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto">
        {!showDetails ? (
          // Vista simplificada
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-medium mb-1">🍪 Este sitio utiliza cookies</p>
              <p>
                Usamos cookies para mejorar tu experiencia, analizar el tráfico
                y personalizar contenido. Al hacer clic en "Aceptar todas",
                aceptas nuestro uso de cookies.{' '}
                <a
                  href="/politica-privacidad"
                  className="underline hover:text-primary"
                  target="_blank"
                >
                  Más información
                </a>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setShowDetails(true)}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                Personalizar
              </Button>
              <Button
                onClick={rechazarOpcionales}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                Solo esenciales
              </Button>
              <Button
                onClick={aceptarTodas}
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Aceptar todas'}
              </Button>
            </div>
          </div>
        ) : (
          // Vista detallada
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Preferencias de Cookies
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {/* Cookies Esenciales */}
              <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input
                  type="checkbox"
                  id="esenciales"
                  checked={preferences.cookiesEsenciales}
                  disabled
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="esenciales"
                    className="font-medium text-sm cursor-pointer"
                  >
                    Cookies Esenciales{' '}
                    <span className="text-xs text-gray-500">(Requeridas)</span>
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Necesarias para el funcionamiento básico del sitio,
                    incluyendo autenticación y seguridad.
                  </p>
                </div>
              </div>

              {/* Cookies Analíticas */}
              <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input
                  type="checkbox"
                  id="analiticas"
                  checked={preferences.cookiesAnaliticas}
                  onChange={() => togglePreference('cookiesAnaliticas')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="analiticas"
                    className="font-medium text-sm cursor-pointer"
                  >
                    Cookies Analíticas
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Nos ayudan a entender cómo los visitantes interactúan con el
                    sitio, recopilando información anónima.
                  </p>
                </div>
              </div>

              {/* Cookies de Marketing */}
              <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={preferences.cookiesMarketing}
                  onChange={() => togglePreference('cookiesMarketing')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="marketing"
                    className="font-medium text-sm cursor-pointer"
                  >
                    Cookies de Marketing
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Se usan para mostrar anuncios relevantes y medir la
                    efectividad de campañas.
                  </p>
                </div>
              </div>

              {/* Cookies de Personalización */}
              <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input
                  type="checkbox"
                  id="personalizacion"
                  checked={preferences.cookiesPersonalizacion}
                  onChange={() => togglePreference('cookiesPersonalizacion')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="personalizacion"
                    className="font-medium text-sm cursor-pointer"
                  >
                    Cookies de Personalización
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Permiten recordar tus preferencias para ofrecerte una
                    experiencia más personalizada.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={rechazarOpcionales}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                Solo esenciales
              </Button>
              <Button
                onClick={() => guardarPreferencias(false)}
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Guardar preferencias'}
              </Button>
            </div>
          </div>
        )}

        {/* Información legal */}
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
          Al continuar navegando, aceptas nuestra{' '}
          <a
            href="/politica-cookies"
            className="underline hover:text-primary"
            target="_blank"
          >
            Política de Cookies
          </a>{' '}
          y{' '}
          <a
            href="/politica-privacidad"
            className="underline hover:text-primary"
            target="_blank"
          >
            Política de Privacidad
          </a>
          .
        </div>
      </div>
    </div>
  )
}
