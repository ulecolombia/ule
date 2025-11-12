'use client'

/**
 * PÁGINA - GESTIÓN DE PRIVACIDAD
 * Dashboard completo para que los usuarios ejerzan sus derechos según Ley 1581 de 2012
 */

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Consentimiento {
  id: string
  tipo: string
  otorgado: boolean
  version: string
  createdAt: string
  updatedAt: string
}

interface Exportacion {
  id: string
  estado: string
  fechaSolicitud: string
  fechaGenerado?: string
  archivoUrl?: string
  archivoExpira?: string
  tamanoBytes?: number
}

export default function PrivacidadPage() {
  const [consentimientos, setConsentimientos] = useState<Consentimiento[]>([])
  const [exportaciones, setExportaciones] = useState<Exportacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteMotivo, setDeleteMotivo] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      // Cargar consentimientos
      const consRes = await fetch('/api/privacy/consent')
      if (consRes.ok) {
        const consData = await consRes.json()
        setConsentimientos(consData.consentimientos || [])
      }

      // Cargar exportaciones
      const expRes = await fetch('/api/privacy/export')
      if (expRes.ok) {
        const expData = await expRes.json()
        setExportaciones(expData.solicitudes || [])
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar información de privacidad')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/privacy/export', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al solicitar exportación')
      }

      toast.success('Exportación solicitada. Te notificaremos cuando esté lista.')
      cargarDatos()
    } catch (error: any) {
      toast.error(error.message || 'Error al solicitar exportación')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'ELIMINAR MI CUENTA') {
      toast.error('Debes escribir "ELIMINAR MI CUENTA" para confirmar')
      return
    }

    try {
      const response = await fetch('/api/privacy/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivo: deleteMotivo,
          confirmacion: deleteConfirmation,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al solicitar eliminación')
      }

      toast.success(data.message)
      setShowDeleteDialog(false)
      setDeleteConfirmation('')
      setDeleteMotivo('')
    } catch (error: any) {
      toast.error(error.message || 'Error al solicitar eliminación')
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      TERMINOS_CONDICIONES: 'Términos y Condiciones',
      POLITICA_PRIVACIDAD: 'Política de Privacidad',
      TRATAMIENTO_DATOS_PERSONALES: 'Tratamiento de Datos Personales',
      TRATAMIENTO_DATOS_FINANCIEROS: 'Tratamiento de Datos Financieros',
      TRATAMIENTO_DATOS_SALUD: 'Tratamiento de Datos de Salud',
      COOKIES_ANALITICAS: 'Cookies Analíticas',
      COOKIES_MARKETING: 'Cookies de Marketing',
      COOKIES_PERSONALIZACION: 'Cookies de Personalización',
      COMUNICACIONES_COMERCIALES: 'Comunicaciones Comerciales',
      COMPARTIR_DATOS_TERCEROS: 'Compartir Datos con Terceros',
    }
    return labels[tipo] || tipo
  }

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      PROCESANDO: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      COMPLETADA: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      ERROR: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      EXPIRADA: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    }
    return colors[estado] || colors.PENDIENTE
  }

  const formatBytes = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Privacidad y Datos Personales</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gestiona tus datos personales y ejerce tus derechos según la Ley 1581 de 2012
        </p>
      </div>

      <Tabs defaultValue="derechos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="derechos">Mis Derechos</TabsTrigger>
          <TabsTrigger value="consentimientos">Consentimientos</TabsTrigger>
          <TabsTrigger value="exportar">Exportar Datos</TabsTrigger>
          <TabsTrigger value="eliminar">Eliminar Cuenta</TabsTrigger>
        </TabsList>

        {/* TAB: Mis Derechos */}
        <TabsContent value="derechos">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Derecho de Acceso */}
            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <span className="text-2xl">👁️</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Derecho de Acceso</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Conocer qué información tenemos sobre ti
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/perfil'}
                  >
                    Ver mi información
                  </Button>
                </div>
              </div>
            </Card>

            {/* Derecho de Rectificación */}
            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <span className="text-2xl">✏️</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Derecho de Rectificación</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Corregir datos inexactos o incompletos
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/perfil'}
                  >
                    Actualizar datos
                  </Button>
                </div>
              </div>
            </Card>

            {/* Derecho de Portabilidad */}
            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <span className="text-2xl">📥</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Derecho de Portabilidad</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Obtener una copia de todos tus datos
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportData}
                  >
                    Exportar datos
                  </Button>
                </div>
              </div>
            </Card>

            {/* Derecho al Olvido */}
            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                  <span className="text-2xl">🗑️</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Derecho al Olvido</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Solicitar la eliminación de tu cuenta
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Eliminar cuenta
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <span className="text-xl">ℹ️</span>
              <div>
                <h4 className="font-semibold mb-2">Marco Legal</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Tus derechos están protegidos por la <strong>Ley 1581 de 2012</strong> de
                  Colombia y el <strong>Decreto 1377 de 2013</strong>. Si consideras que no
                  se respetan tus derechos, puedes presentar una queja ante la{' '}
                  <a
                    href="https://www.sic.gov.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Superintendencia de Industria y Comercio
                  </a>.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB: Consentimientos */}
        <TabsContent value="consentimientos">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Historial de Consentimientos</h3>

            {consentimientos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-2 block">📋</span>
                <p>No hay consentimientos registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {consentimientos.map((cons) => (
                  <div
                    key={cons.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold">{getTipoLabel(cons.tipo)}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span>
                          Fecha: {format(new Date(cons.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </span>
                        <span>Versión: {cons.version}</span>
                      </div>
                    </div>
                    <Badge
                      variant={cons.otorgado ? "default" : "secondary"}
                      className={cons.otorgado ? 'bg-green-100 text-green-800' : ''}
                    >
                      {cons.otorgado ? 'Activo' : 'Revocado'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center">
                <span className="mr-2">❓</span>
                ¿Qué son los consentimientos?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cada vez que aceptas nuestros términos, políticas o autorizas el tratamiento
                de tus datos, queda registrado aquí con fecha y versión del documento aceptado.
                Puedes revocar estos consentimientos en cualquier momento contactándonos.
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* TAB: Exportar Datos */}
        <TabsContent value="exportar">
          <Card className="p-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <span className="text-3xl">☁️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Portabilidad de Datos</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Puedes solicitar una copia completa de todos tus datos personales en formato JSON.
                  El archivo incluirá: información personal, facturas, clientes, aportes PILA,
                  conversaciones con IA, y más.
                </p>
                <Button onClick={handleExportData}>
                  <span className="mr-2">📥</span>
                  Solicitar Exportación
                </Button>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4">Solicitudes de Exportación</h4>

              {exportaciones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-2 block">📂</span>
                  <p>No hay exportaciones solicitadas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exportaciones.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge className={getEstadoColor(exp.estado)}>
                            {exp.estado}
                          </Badge>
                          {exp.tamanoBytes && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatBytes(exp.tamanoBytes)} MB
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            Solicitado: {format(new Date(exp.fechaSolicitud), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                          </div>
                          {exp.fechaGenerado && (
                            <div>
                              Generado: {format(new Date(exp.fechaGenerado), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                            </div>
                          )}
                          {exp.archivoExpira && new Date(exp.archivoExpira) > new Date() && (
                            <div className="text-orange-600 dark:text-orange-400">
                              Expira: {format(new Date(exp.archivoExpira), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                            </div>
                          )}
                        </div>
                      </div>
                      {exp.estado === 'COMPLETADA' && exp.archivoUrl && exp.archivoExpira && new Date(exp.archivoExpira) > new Date() && (
                        <Button
                          size="sm"
                          onClick={() => window.open(exp.archivoUrl, '_blank')}
                        >
                          <span className="mr-2">📥</span>
                          Descargar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start">
                <span className="mr-2">ℹ️</span>
                <span>
                  <strong>Nota:</strong> Los archivos de exportación están disponibles por 7 días.
                  Después de ese tiempo deberás solicitar una nueva exportación. Solo puedes
                  solicitar una exportación cada 24 horas.
                </span>
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* TAB: Eliminar Cuenta */}
        <TabsContent value="eliminar">
          <Card className="p-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <span className="text-3xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">
                  Eliminar Cuenta Permanentemente
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Esta acción eliminará permanentemente tu cuenta y todos tus datos después de
                  un período de gracia de 30 días. Durante este tiempo, puedes cancelar la
                  solicitud si cambias de opinión.
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  ¿Qué se eliminará?
                </h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  <li>• Tu información personal y de contacto</li>
                  <li>• Todas tus facturas y clientes</li>
                  <li>• Historial de aportes PILA</li>
                  <li>• Conversaciones con el asesor de IA</li>
                  <li>• Documentos y comprobantes almacenados</li>
                  <li>• Configuraciones y preferencias</li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Proceso de eliminación
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                  <li>1. Solicitas la eliminación y recibes un email de confirmación</li>
                  <li>2. Confirmas haciendo clic en el enlace del email</li>
                  <li>3. Período de gracia de 30 días (puedes cancelar en cualquier momento)</li>
                  <li>4. Pasados los 30 días, tu cuenta se elimina permanentemente</li>
                  <li>5. Recibes un email final confirmando la eliminación</li>
                </ol>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center">
                  <span className="mr-2">ℹ️</span>
                  Antes de eliminar tu cuenta
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• Descarga una copia de tus datos si la necesitas</li>
                  <li>• Asegúrate de no tener obligaciones fiscales pendientes</li>
                  <li>• Guarda las facturas que necesites para tus declaraciones</li>
                  <li>• Esta acción es irreversible después del período de gracia</li>
                </ul>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full"
            >
              <span className="mr-2">🗑️</span>
              Solicitar Eliminación de Cuenta
            </Button>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Confirmación de Eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 dark:text-red-400 flex items-center">
              <span className="mr-2">⚠️</span>
              ¿Estás seguro de que quieres eliminar tu cuenta?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Esta es una acción seria que eliminará permanentemente todos tus datos después
                de 30 días. Te enviaremos un email de confirmación.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                    Motivo de eliminación (opcional)
                  </label>
                  <Textarea
                    value={deleteMotivo}
                    onChange={(e) => setDeleteMotivo(e.target.value)}
                    placeholder="Ayúdanos a mejorar contándonos por qué te vas..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                    Para confirmar, escribe: <span className="text-red-600 font-bold">ELIMINAR MI CUENTA</span>
                  </label>
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="ELIMINAR MI CUENTA"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                <p className="font-semibold mb-1">📧 Próximos pasos:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Recibirás un email de confirmación</li>
                  <li>Debes hacer clic en el enlace para confirmar</li>
                  <li>Tendrás 30 días para cancelar si cambias de opinión</li>
                  <li>Después de 30 días, la eliminación será permanente</li>
                </ol>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteConfirmation('')
              setDeleteMotivo('')
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteConfirmation !== 'ELIMINAR MI CUENTA'}
            >
              Solicitar Eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
