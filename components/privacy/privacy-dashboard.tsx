'use client'

/**
 * PRIVACY DASHBOARD
 * Panel de gestión de privacidad del usuario
 *
 * Funciones:
 * - Ver y gestionar consentimientos
 * - Exportar datos personales
 * - Solicitar eliminación de cuenta
 * - Gestionar preferencias de cookies
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { TipoConsentimiento } from '@prisma/client'

interface Consentimiento {
  tipo: TipoConsentimiento
  otorgado: boolean
  version: string
  createdAt: Date
}

interface Exportacion {
  id: string
  estado: string
  archivoUrl: string | null
  archivoExpira: Date | null
  tamanoBytes: number | null
  createdAt: Date
}

export function PrivacyDashboard() {
  const [consentimientos, setConsentimientos] = useState<Consentimiento[]>([])
  const [exportaciones, setExportaciones] = useState<Exportacion[]>([])
  const [isLoadingConsent, setIsLoadingConsent] = useState(false)
  const [isLoadingExport, setIsLoadingExport] = useState(false)
  const [activeTab, setActiveTab] = useState<
    'consentimientos' | 'exportacion' | 'eliminacion'
  >('consentimientos')

  useEffect(() => {
    cargarConsentimientos()
    cargarExportaciones()
  }, [])

  const cargarConsentimientos = async () => {
    try {
      const response = await fetch('/api/privacy/consent')
      if (!response.ok) throw new Error('Error al cargar consentimientos')

      const data = await response.json()
      setConsentimientos(data.consentimientos || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar consentimientos')
    }
  }

  const cargarExportaciones = async () => {
    try {
      const response = await fetch('/api/privacy/export')
      if (!response.ok) throw new Error('Error al cargar exportaciones')

      const data = await response.json()
      setExportaciones(data.exportaciones || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar exportaciones')
    }
  }

  const solicitarExportacion = async () => {
    setIsLoadingExport(true)

    try {
      const response = await fetch('/api/privacy/export', {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Error al solicitar exportación')

      const data = await response.json()
      toast.success(data.message)

      // Recargar exportaciones
      await cargarExportaciones()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al solicitar exportación')
    } finally {
      setIsLoadingExport(false)
    }
  }

  const revocarConsentimiento = async (tipo: TipoConsentimiento) => {
    setIsLoadingConsent(true)

    try {
      const response = await fetch(`/api/privacy/consent?tipo=${tipo}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Error al revocar consentimiento')

      toast.success('Consentimiento revocado')
      await cargarConsentimientos()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al revocar consentimiento')
    } finally {
      setIsLoadingConsent(false)
    }
  }

  const formatearTipoConsentimiento = (tipo: string): string => {
    const tipos: Record<string, string> = {
      TERMINOS_CONDICIONES: 'Términos y Condiciones',
      POLITICA_PRIVACIDAD: 'Política de Privacidad',
      TRATAMIENTO_DATOS_PERSONALES: 'Tratamiento de Datos Personales',
      COOKIES_ESENCIALES: 'Cookies Esenciales',
      COOKIES_ANALITICAS: 'Cookies Analíticas',
      COOKIES_MARKETING: 'Cookies de Marketing',
      COOKIES_PERSONALIZACION: 'Cookies de Personalización',
      NOTIFICACIONES_EMAIL: 'Notificaciones por Email',
      NOTIFICACIONES_PUSH: 'Notificaciones Push',
      COMPARTIR_DATOS_TERCEROS: 'Compartir Datos con Terceros',
      MARKETING_DIRECTO: 'Marketing Directo',
      TRANSFERENCIA_INTERNACIONAL: 'Transferencia Internacional',
    }
    return tipos[tipo] || tipo
  }

  const formatearEstado = (estado: string): string => {
    const estados: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      PROCESANDO: 'Procesando',
      COMPLETADA: 'Completada',
      ERROR: 'Error',
    }
    return estados[estado] || estado
  }

  const formatearTamano = (bytes: number | null): string => {
    if (!bytes) return '-'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Privacidad y Datos Personales</h1>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab('consentimientos')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'consentimientos'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Consentimientos
        </button>
        <button
          onClick={() => setActiveTab('exportacion')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'exportacion'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Exportar Datos
        </button>
        <button
          onClick={() => setActiveTab('eliminacion')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'eliminacion'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Eliminar Cuenta
        </button>
      </div>

      {/* Consentimientos */}
      {activeTab === 'consentimientos' && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Aquí puedes ver y gestionar todos los consentimientos que has
              otorgado según la Ley 1581 de 2012.
            </p>
          </div>

          <div className="space-y-2">
            {consentimientos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No se encontraron consentimientos
              </p>
            ) : (
              consentimientos.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {formatearTipoConsentimiento(c.tipo)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Versión: {c.version} •{' '}
                      {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        c.otorgado
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {c.otorgado ? 'Otorgado' : 'Revocado'}
                    </span>
                    {c.otorgado &&
                      !['TERMINOS_CONDICIONES', 'POLITICA_PRIVACIDAD'].includes(
                        c.tipo
                      ) && (
                        <Button
                          onClick={() => revocarConsentimiento(c.tipo)}
                          variant="outline"
                          size="sm"
                          disabled={isLoadingConsent}
                        >
                          Revocar
                        </Button>
                      )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Exportación de Datos */}
      {activeTab === 'exportacion' && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Derecho a la portabilidad de datos (Art. 8 Ley 1581 de 2012).
              Puedes descargar una copia de todos tus datos personales en
              formato JSON.
            </p>
            <Button
              onClick={solicitarExportacion}
              disabled={isLoadingExport}
              size="sm"
            >
              {isLoadingExport
                ? 'Procesando...'
                : '📦 Solicitar Exportación'}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Exportaciones Recientes</h3>
            {exportaciones.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay exportaciones disponibles
              </p>
            ) : (
              exportaciones.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(exp.createdAt).toLocaleDateString()} -{' '}
                      {new Date(exp.createdAt).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Tamaño: {formatearTamano(exp.tamanoBytes)} • Estado:{' '}
                      {formatearEstado(exp.estado)}
                    </p>
                  </div>
                  {exp.archivoUrl && exp.estado === 'COMPLETADA' && (
                    <Button asChild size="sm">
                      <a href={exp.archivoUrl} download>
                        Descargar
                      </a>
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Eliminación de Cuenta */}
      {activeTab === 'eliminacion' && (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
              ⚠️ Eliminar Cuenta Permanentemente
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              Esta acción es irreversible. Todos tus datos serán eliminados
              después de un periodo de gracia de 30 días.
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1 mb-3">
              <li>Se eliminarán todos tus datos personales</li>
              <li>Se borrarán todas tus facturas y aportes</li>
              <li>No podrás recuperar tu cuenta</li>
              <li>Tienes 30 días para cancelar la solicitud</li>
            </ul>
            <Button variant="destructive" size="sm">
              Solicitar Eliminación de Cuenta
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
