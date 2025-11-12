/**
 * COMPONENTE: GESTIÓN DE SESIONES
 *
 * Características:
 * - Lista de sesiones activas del usuario
 * - Información detallada: dispositivo, navegador, ubicación, IP
 * - Cerrar sesiones individuales
 * - Cerrar todas las sesiones excepto la actual
 * - Indicador visual de sesión actual
 */

'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Sesion {
  id: string
  dispositivo: string
  navegador: string
  sistemaOperativo: string
  ip: string
  pais?: string
  ciudad?: string
  esActual: boolean
  ultimaActividad: string
  createdAt: string
}

export function SessionManager() {
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sesionToRevoke, setSesionToRevoke] = useState<string | null>(null)
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false)

  useEffect(() => {
    cargarSesiones()
  }, [])

  const cargarSesiones = async () => {
    try {
      const response = await fetch('/api/auth/sessions', {
        headers: {
          'x-user-id': localStorage.getItem('userId') || '', // TODO: Usar autenticación real
        },
      })
      const data = await response.json()
      setSesiones(data.sesiones)
    } catch (error) {
      console.error('Error cargando sesiones:', error)
      toast.error('Error al cargar sesiones')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeSesion = async (sesionId: string) => {
    try {
      const response = await fetch(`/api/auth/sessions/${sesionId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': localStorage.getItem('userId') || '',
        },
      })

      if (!response.ok) {
        throw new Error('Error al cerrar sesión')
      }

      toast.success('Sesión cerrada exitosamente')
      cargarSesiones()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cerrar sesión')
    } finally {
      setSesionToRevoke(null)
    }
  }

  const handleRevokeAll = async () => {
    try {
      const response = await fetch('/api/auth/sessions/revoke-all', {
        method: 'POST',
        headers: {
          'x-user-id': localStorage.getItem('userId') || '',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error('Error al cerrar sesiones')
      }

      toast.success(data.message)
      cargarSesiones()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cerrar sesiones')
    } finally {
      setShowRevokeAllDialog(false)
    }
  }

  const getDeviceIcon = (dispositivo: string) => {
    if (dispositivo === 'mobile') return 'smartphone'
    if (dispositivo === 'tablet') return 'tablet'
    return 'computer'
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Sesiones Activas</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {sesiones.length} sesión(es) activa(s)
          </p>
        </div>
        {sesiones.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRevokeAllDialog(true)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar todas las demás
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sesiones.map((sesion) => (
          <Card
            key={sesion.id}
            className={`p-4 ${sesion.esActual ? 'border-primary border-2' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                {/* Icono de dispositivo */}
                <div className={`p-3 rounded-full ${
                  sesion.esActual
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {getDeviceIcon(sesion.dispositivo) === 'smartphone' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    )}
                    {getDeviceIcon(sesion.dispositivo) === 'tablet' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    )}
                    {getDeviceIcon(sesion.dispositivo) === 'computer' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    )}
                  </svg>
                </div>

                {/* Información */}
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h4 className="font-semibold">
                      {sesion.navegador} en {sesion.sistemaOperativo}
                    </h4>
                    {sesion.esActual && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-white rounded-full">
                        Sesión actual
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {sesion.ciudad && sesion.pais
                        ? `${sesion.ciudad}, ${sesion.pais}`
                        : sesion.ip}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Última actividad:{' '}
                      {formatDistanceToNow(new Date(sesion.ultimaActividad), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Iniciada:{' '}
                      {new Date(sesion.createdAt).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón cerrar sesión */}
              {!sesion.esActual && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSesionToRevoke(sesion.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Dialog confirmación cerrar sesión específica */}
      <AlertDialog open={!!sesionToRevoke} onOpenChange={() => setSesionToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar esta sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cerrará la sesión inmediatamente. El dispositivo deberá iniciar
              sesión nuevamente para acceder a tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sesionToRevoke && handleRevokeSesion(sesionToRevoke)}
              className="bg-red-600 hover:bg-red-700"
            >
              Cerrar Sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog confirmación cerrar todas las sesiones */}
      <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar todas las demás sesiones?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cerrará todas las sesiones activas excepto la actual.
              Todos los dispositivos deberán iniciar sesión nuevamente.
              <br /><br />
              <strong>Se cerrarán {sesiones.length - 1} sesión(es).</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAll}
              className="bg-red-600 hover:bg-red-700"
            >
              Cerrar Todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
