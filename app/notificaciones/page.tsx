/**
 * Página completa de Notificaciones
 * Vista detallada con filtros, paginación y acciones
 */

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Card, CardBody } from '@/components/ui/card'
import { toast } from 'sonner'

interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  tipo: string
  leido: boolean
  fechaEnvio: string
  aporte?: {
    id: string
    periodo: string
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
  hasPrevious: boolean
}

interface NotificacionesResponse {
  notificaciones: Notificacion[]
  pagination: PaginationInfo
  unreadCount: number
}

export default function NotificacionesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'no-leidas'>('todas')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotificaciones()
    }
  }, [status, filtroEstado, currentPage])

  const fetchNotificaciones = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      })

      if (filtroEstado === 'no-leidas') {
        params.append('unreadOnly', 'true')
      }

      const response = await fetch(`/api/notificaciones?${params}`)

      if (!response.ok) {
        throw new Error('Error al cargar notificaciones')
      }

      const data: NotificacionesResponse = await response.json()
      setNotificaciones(data.notificaciones)
      setPagination(data.pagination)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al cargar notificaciones'
      )
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLeida = async (notificacionId: string) => {
    try {
      const response = await fetch(`/api/notificaciones/${notificacionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leido: true }),
      })

      if (!response.ok) {
        throw new Error('Error al marcar como leída')
      }

      // Actualizar localmente
      setNotificaciones((prev) =>
        prev.map((n) =>
          n.id === notificacionId ? { ...n, leido: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))

      toast.success('Notificación marcada como leída')
    } catch (err) {
      toast.error('Error al marcar como leída')
    }
  }

  const eliminarNotificacion = async (notificacionId: string) => {
    try {
      const response = await fetch(`/api/notificaciones/${notificacionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar notificación')
      }

      // Actualizar localmente
      setNotificaciones((prev) =>
        prev.filter((n) => n.id !== notificacionId)
      )

      toast.success('Notificación eliminada')
    } catch (err) {
      toast.error('Error al eliminar notificación')
    }
  }

  const marcarTodasComoLeidas = async () => {
    try {
      const response = await fetch('/api/notificaciones/marcar-leidas', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Error al marcar todas como leídas')
      }

      // Recargar notificaciones
      fetchNotificaciones()
      toast.success('Todas las notificaciones marcadas como leídas')
    } catch (err) {
      toast.error('Error al marcar todas como leídas')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <>
        <Header userName={session?.user?.name} userEmail={session?.user?.email} />
        <div className="min-h-screen bg-light-50 p-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-dark-100">Cargando notificaciones...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!session) {
    return null
  }

  return (
    <>
      <Header userName={session.user.name} userEmail={session.user.email} />
      <div className="min-h-screen bg-light-50 p-6">
        <div className="mx-auto max-w-4xl">
          <Breadcrumbs />

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-dark">Notificaciones</h1>
              <p className="text-dark-100 mt-1">
                {unreadCount > 0
                  ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
                  : 'No tienes notificaciones sin leer'}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={marcarTodasComoLeidas}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-sm">
                  done_all
                </span>
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardBody className="py-3">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-dark">Mostrar:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFiltroEstado('todas')
                      setCurrentPage(1)
                    }}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      filtroEstado === 'todas'
                        ? 'bg-primary text-white'
                        : 'bg-light-100 text-dark-100 hover:bg-light-200'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => {
                      setFiltroEstado('no-leidas')
                      setCurrentPage(1)
                    }}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      filtroEstado === 'no-leidas'
                        ? 'bg-primary text-white'
                        : 'bg-light-100 text-dark-100 hover:bg-light-200'
                    }`}
                  >
                    No leídas
                    {unreadCount > 0 && (
                      <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Error */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardBody>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-600">
                    error
                  </span>
                  <p className="text-red-600">{error}</p>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Lista de notificaciones */}
          {notificaciones.length === 0 ? (
            <Card>
              <CardBody className="py-12 text-center">
                <span className="material-symbols-outlined mb-3 text-6xl text-dark-100">
                  notifications_off
                </span>
                <p className="text-dark">No hay notificaciones</p>
                <p className="text-sm text-dark-100 mt-1">
                  {filtroEstado === 'no-leidas'
                    ? 'No tienes notificaciones sin leer'
                    : 'Aquí aparecerán tus notificaciones importantes'}
                </p>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {notificaciones.map((notif) => (
                <Card
                  key={notif.id}
                  className={`transition-all ${
                    !notif.leido ? 'border-l-4 border-primary bg-blue-50/50' : ''
                  }`}
                >
                  <CardBody>
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                          !notif.leido ? 'bg-primary/10' : 'bg-light-100'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined ${
                            !notif.leido ? 'text-primary' : 'text-dark-100'
                          }`}
                        >
                          notifications
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3
                              className={`font-semibold ${
                                !notif.leido ? 'text-dark' : 'text-dark-100'
                              }`}
                            >
                              {notif.titulo}
                            </h3>
                            <p className="text-sm text-dark-100 mt-1">
                              {notif.mensaje}
                            </p>
                            <p className="text-xs text-dark-100 mt-2">
                              {new Date(notif.fechaEnvio).toLocaleDateString(
                                'es-CO',
                                {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </p>
                          </div>

                          {!notif.leido && (
                            <div className="flex h-2 w-2 flex-shrink-0">
                              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                            </div>
                          )}
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2 mt-3">
                          {!notif.leido && (
                            <button
                              onClick={() => marcarComoLeida(notif.id)}
                              className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                            >
                              <span className="material-symbols-outlined text-sm">
                                done
                              </span>
                              Marcar como leída
                            </button>
                          )}
                          <button
                            onClick={() => eliminarNotificacion(notif.id)}
                            className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                          >
                            <span className="material-symbols-outlined text-sm">
                              delete
                            </span>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          {/* Paginación */}
          {pagination && pagination.totalPages > 1 && (
            <Card className="mt-6">
              <CardBody className="py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-dark-100">
                    Página {pagination.page} de {pagination.totalPages} (
                    {pagination.total} total)
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => p - 1)}
                      disabled={!pagination.hasPrevious}
                      className="flex items-center gap-1 rounded-lg bg-light-100 px-3 py-2 text-sm font-medium text-dark transition-colors hover:bg-light-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-sm">
                        chevron_left
                      </span>
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={!pagination.hasMore}
                      className="flex items-center gap-1 rounded-lg bg-light-100 px-3 py-2 text-sm font-medium text-dark transition-colors hover:bg-light-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                      <span className="material-symbols-outlined text-sm">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
