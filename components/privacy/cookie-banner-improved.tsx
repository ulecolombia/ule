'use client'

/**
 * COOKIE BANNER - Mejorado
 * Banner de consentimiento de cookies con configuración detallada
 *
 * Características:
 * - Modal de configuración granular
 * - Descripción detallada de cada tipo de cookie
 * - Integración con Google Analytics
 * - Cumple con Ley 1581 de 2012 y preparado para GDPR
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export function CookieBannerImproved() {
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState({
    esenciales: true, // Siempre true, no editable
    analiticas: false,
    marketing: false,
    personalizacion: false,
  })

  useEffect(() => {
    // Verificar si ya dio consentimiento
    const hasConsent = document.cookie.includes('cookie-consent=true')

    if (!hasConsent) {
      // Mostrar banner después de 1 segundo
      setTimeout(() => setIsVisible(true), 1000)
    }
  }, [])

  const handleAcceptAll = async () => {
    const allAccepted = {
      esenciales: true,
      analiticas: true,
      marketing: true,
      personalizacion: true,
    }

    await savePreferences(allAccepted)
    setIsVisible(false)
  }

  const handleAcceptEssential = async () => {
    await savePreferences({
      esenciales: true,
      analiticas: false,
      marketing: false,
      personalizacion: false,
    })
    setIsVisible(false)
  }

  const handleSaveCustom = async () => {
    await savePreferences(preferences)
    setShowSettings(false)
    setIsVisible(false)
  }

  const savePreferences = async (prefs: typeof preferences) => {
    try {
      await fetch('/api/privacy/cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })

      // Inicializar servicios basados en preferencias
      if (prefs.analiticas) {
        initializeAnalytics()
      }
      if (prefs.marketing) {
        initializeMarketing()
      }
      if (prefs.personalizacion) {
        initializePersonalization()
      }
    } catch (error) {
      console.error('Error guardando preferencias:', error)
    }
  }

  const initializeAnalytics = () => {
    // Inicializar Google Analytics o similar
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
      // @ts-ignore
      window.gtag?.('consent', 'update', {
        analytics_storage: 'granted',
      })
    }
  }

  const initializeMarketing = () => {
    // Inicializar píxeles de marketing
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.gtag?.('consent', 'update', {
        ad_storage: 'granted',
      })
    }
  }

  const initializePersonalization = () => {
    // Inicializar servicios de personalización
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.gtag?.('consent', 'update', {
        personalization_storage: 'granted',
      })
    }
  }

  if (!isVisible) return null

  return (
    <>
      {/* Banner Principal */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500">
        <Card className="max-w-4xl mx-auto p-6 shadow-2xl border-2">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icono */}
            <div className="flex-shrink-0 text-4xl">
              🍪
            </div>

            {/* Contenido */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                Usamos cookies para mejorar tu experiencia
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Utilizamos cookies esenciales para el funcionamiento de la plataforma,
                y cookies opcionales para analítica y personalización. Puedes elegir
                qué cookies aceptar.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Al hacer clic en &quot;Aceptar todas&quot;, aceptas el almacenamiento de cookies
                en tu dispositivo. Consulta nuestra{' '}
                <a
                  href="/politica-cookies"
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  Política de Cookies
                </a>
                {' '}y{' '}
                <a
                  href="/politica-privacidad"
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  Política de Privacidad
                </a>
                .
              </p>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button
                onClick={handleAcceptAll}
                className="w-full sm:w-auto"
              >
                Aceptar todas
              </Button>
              <Button
                onClick={handleAcceptEssential}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Solo esenciales
              </Button>
              <Button
                onClick={() => setShowSettings(true)}
                variant="ghost"
                className="w-full sm:w-auto"
              >
                Personalizar
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal de Configuración */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preferencias de Cookies</DialogTitle>
            <DialogDescription>
              Elige qué tipos de cookies quieres permitir
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Esenciales */}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={true}
                    disabled
                    className="mt-1"
                  />
                  <div>
                    <h4 className="font-semibold">Cookies Esenciales</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Necesarias para el funcionamiento básico de la plataforma.
                      No se pueden desactivar.
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      <strong>Ejemplos:</strong> Sesión de usuario, autenticación,
                      preferencias de idioma.
                    </div>
                  </div>
                </div>
                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  Siempre activas
                </span>
              </div>
            </div>

            {/* Analíticas */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={preferences.analiticas}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, analiticas: !!checked })
                  }
                  className="mt-1"
                />
                <div>
                  <h4 className="font-semibold">Cookies Analíticas</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Nos ayudan a entender cómo usas la plataforma para mejorarla.
                    Los datos son anónimos y agregados.
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    <strong>Ejemplos:</strong> Google Analytics, estadísticas de uso,
                    páginas más visitadas.
                  </div>
                </div>
              </div>
            </div>

            {/* Marketing */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, marketing: !!checked })
                  }
                  className="mt-1"
                />
                <div>
                  <h4 className="font-semibold">Cookies de Marketing</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Permiten mostrar publicidad relevante y medir la efectividad
                    de campañas.
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    <strong>Ejemplos:</strong> Facebook Pixel, Google Ads,
                    seguimiento de conversiones.
                  </div>
                </div>
              </div>
            </div>

            {/* Personalización */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={preferences.personalizacion}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, personalizacion: !!checked })
                  }
                  className="mt-1"
                />
                <div>
                  <h4 className="font-semibold">Cookies de Personalización</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Permiten recordar tus preferencias y personalizar tu experiencia.
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    <strong>Ejemplos:</strong> Tema oscuro/claro, configuración de
                    dashboard, preferencias de notificaciones.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-2 justify-end border-t pt-4">
            <Button
              onClick={() => setShowSettings(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveCustom}>
              Guardar Preferencias
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
