/**
 * PÁGINA DE CALENDARIO TRIBUTARIO
 * Calendario interactivo con eventos tributarios y personalizados
 */

'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendario-styles.css'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModalEvento } from '@/components/calendario/modal-evento'
import { ListaProximosEventos } from '@/components/calendario/lista-proximos-eventos'
import { Header } from '@/components/layout/Header'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const locales = {
  es: es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay eventos en este rango.',
  showMore: (total: number) => `+ Ver más (${total})`,
}

export default function CalendarioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [eventos, setEventos] = useState<any[]>([])
  const [fecha, setFecha] = useState(new Date())
  const [vista, setVista] = useState<View>('month')
  const [eventoSeleccionado, setEventoSeleccionado] = useState<any>(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      cargarEventos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, status])

  const cargarEventos = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        mes: fecha.getMonth().toString(),
        año: fecha.getFullYear().toString(),
      })

      const response = await fetch(`/api/calendario/eventos?${params}`)
      const data = await response.json()

      const eventosFormateados = data.eventos.map((evento: any) => ({
        ...evento,
        start: new Date(evento.fecha),
        end: evento.fechaFin
          ? new Date(evento.fechaFin)
          : new Date(evento.fecha),
        title: evento.titulo,
        resource: evento,
      }))

      setEventos(eventosFormateados)
    } catch (error) {
      console.error('[Calendario] Error:', error)
      toast.error('Error al cargar eventos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectEvento = (evento: any) => {
    setEventoSeleccionado(evento.resource)
    setMostrarModal(true)
  }

  const handleSelectSlot = ({ start }: any) => {
    setEventoSeleccionado({
      fecha: start,
      tipo: 'EVENTO_PERSONAL',
      notificar: true,
    })
    setMostrarModal(true)
  }

  const handleExportarCalendario = async () => {
    try {
      const response = await fetch('/api/calendario/exportar')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'calendario-tributario.ics'
      a.click()

      toast.success('Calendario exportado', {
        description:
          'Importa el archivo .ics en Google Calendar o Apple Calendar',
      })
    } catch (error) {
      console.error('[Calendario] Error:', error)
      toast.error('Error al exportar calendario')
    }
  }

  const handleGenerarEventos = async () => {
    try {
      const añoActual = new Date().getFullYear()
      const response = await fetch('/api/calendario/generar-eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ año: añoActual + 1 }), // Generar para el próximo año
      })

      if (!response.ok) throw new Error('Error al generar eventos')

      toast.success('Eventos tributarios generados', {
        description: `Se han cargado las fechas importantes de ${añoActual + 1}`,
      })

      await cargarEventos()
    } catch (error) {
      console.error('[Calendario] Error:', error)
      toast.error('Error al generar eventos')
    }
  }

  const eventStyleGetter = (event: any) => {
    // Mapeo de colores según el tipo de evento
    const colorMap: Record<string, string> = {
      VENCIMIENTO_PILA: '#10B981', // emerald-500 - PILA
      DECLARACION_RENTA: '#EF4444', // red-500 - Declaraciones
      DECLARACION_IVA: '#EF4444',
      DECLARACION_RETEFUENTE: '#F59E0B', // amber-500
      PAGO_IMPUESTOS: '#8B5CF6', // purple-500 - Pagos
      ACTUALIZACION_SMMLV: '#3B82F6', // blue-500 - Actualizaciones
      RENOVACION_RUT: '#06B6D4', // cyan-500 - Actualizaciones
      EVENTO_PERSONAL: '#6B7280', // gray-500 - Personales
      OTRO: '#6B7280',
    }

    const style: any = {
      backgroundColor:
        event.resource.color || colorMap[event.resource.tipo] || '#059669',
      borderRadius: '6px',
      opacity: 0.9,
      color: 'white',
      border: 'none',
      display: 'block',
      fontSize: '0.813rem',
      fontWeight: '500',
      padding: '3px 7px',
    }

    if (event.resource.completado) {
      style.opacity = 0.5
      style.textDecoration = 'line-through'
      style.filter = 'grayscale(0.5)'
    }

    return { style }
  }

  if (status === 'loading' || isLoading) {
    return (
      <>
        <Header
          userName={session?.user?.name}
          userEmail={session?.user?.email}
        />
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
            <h2 className="text-dark mb-2 text-xl font-semibold">
              Cargando calendario...
            </h2>
            <p className="text-dark-100 text-sm">
              Preparando tus eventos y fechas importantes
            </p>
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="text-dark-100 mb-6 flex items-center gap-2 text-sm">
            <span className="cursor-pointer transition-colors hover:text-primary">
              Inicio
            </span>
            <span className="material-symbols-outlined text-xs">
              chevron_right
            </span>
            <span className="text-dark font-medium">Calendario Tributario</span>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-primary/10 p-3">
                  <span className="material-symbols-outlined text-3xl text-primary">
                    calendar_month
                  </span>
                </div>
                <div>
                  <h1 className="text-dark text-3xl font-bold tracking-tight">
                    Calendario Tributario
                  </h1>
                  <p className="text-dark-100 mt-1 text-base">
                    Gestiona fechas importantes, declaraciones y eventos
                    personalizados
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEventoSeleccionado(null)
                    setMostrarModal(true)
                  }}
                  className="flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  <span className="hidden sm:inline">Nuevo Evento</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportarCalendario}
                  className="flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                >
                  <span className="material-symbols-outlined text-lg">
                    download
                  </span>
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Leyenda con mejor diseño */}
          <Card className="border-light-200 mb-6 bg-white shadow-sm">
            <div className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-dark-100 text-lg">
                    palette
                  </span>
                  <h3 className="text-dark text-sm font-semibold">
                    Tipos de eventos
                  </h3>
                </div>
                {eventos.length === 0 && (
                  <Button
                    size="sm"
                    onClick={handleGenerarEventos}
                    className="flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">
                      auto_fix_high
                    </span>
                    <span className="hidden sm:inline">
                      Generar Eventos {new Date().getFullYear() + 1}
                    </span>
                    <span className="sm:hidden">Generar</span>
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <div
                  className="group flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 transition-all hover:bg-emerald-100"
                  title="Aportes a seguridad social (Salud, Pensión, ARL) - Vence día 10 de cada mes"
                >
                  <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-emerald-700">
                    PILA - Seguridad Social
                  </span>
                  <span className="material-symbols-outlined text-xs text-emerald-600 opacity-50 group-hover:opacity-100">
                    info
                  </span>
                </div>
                <div
                  className="group flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 transition-all hover:bg-red-100"
                  title="Declaración de renta anual como persona natural"
                >
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-red-700">
                    Declaraciones de Renta
                  </span>
                  <span className="material-symbols-outlined text-xs text-red-600 opacity-50 group-hover:opacity-100">
                    info
                  </span>
                </div>
                <div
                  className="group flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 transition-all hover:bg-purple-100"
                  title="Pagos de impuestos según tu régimen tributario"
                >
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm font-medium text-purple-700">
                    Pagos de Impuestos
                  </span>
                  <span className="material-symbols-outlined text-xs text-purple-600 opacity-50 group-hover:opacity-100">
                    info
                  </span>
                </div>
                <div
                  className="group flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 transition-all hover:bg-blue-100"
                  title="Actualizaciones importantes (SMMLV, RUT, etc.)"
                >
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-blue-700">
                    Actualizaciones
                  </span>
                  <span className="material-symbols-outlined text-xs text-blue-600 opacity-50 group-hover:opacity-100">
                    info
                  </span>
                </div>
                <div
                  className="group flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 transition-all hover:bg-gray-100"
                  title="Eventos personalizados que tú creates"
                >
                  <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Mis Eventos
                  </span>
                  <span className="material-symbols-outlined text-xs text-gray-600 opacity-50 group-hover:opacity-100">
                    info
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Calendario Principal */}
            <div className="lg:col-span-2">
              <Card className="border-light-200 overflow-hidden shadow-md">
                <div className="border-light-200 border-b bg-gradient-to-r from-primary/5 to-primary/10 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-dark flex items-center gap-2 text-lg font-semibold">
                      <span className="material-symbols-outlined text-primary">
                        event_note
                      </span>
                      Vista de Calendario
                    </h2>
                    <div className="text-dark-100 flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-sm">
                        info
                      </span>
                      <span>Haz clic en un día para crear un evento</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-5">
                  <Calendar
                    localizer={localizer}
                    events={eventos}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 650 }}
                    onSelectEvent={handleSelectEvento}
                    onSelectSlot={handleSelectSlot}
                    selectable
                    views={['month', 'week', 'day', 'agenda']}
                    view={vista}
                    onView={setVista}
                    date={fecha}
                    onNavigate={setFecha}
                    messages={messages}
                    eventPropGetter={eventStyleGetter}
                    culture="es"
                  />
                </div>
              </Card>
            </div>

            {/* Sidebar - Próximos Eventos */}
            <div className="space-y-6">
              <ListaProximosEventos
                eventos={eventos}
                onSelectEvento={handleSelectEvento}
              />

              {/* Info Card */}
              <Card className="border-light-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600">
                      lightbulb
                    </span>
                    <h3 className="text-dark font-semibold">Consejo</h3>
                  </div>
                  <p className="text-dark-100 text-sm leading-relaxed">
                    Sincroniza tu calendario con Google Calendar o Apple
                    Calendar exportando el archivo .ics
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Modal de evento */}
          <ModalEvento
            evento={eventoSeleccionado}
            isOpen={mostrarModal}
            onClose={() => {
              setMostrarModal(false)
              setEventoSeleccionado(null)
            }}
            onSuccess={cargarEventos}
          />
        </div>
      </div>
    </>
  )
}
