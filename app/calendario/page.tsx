/**
 * PÁGINA DE CALENDARIO TRIBUTARIO
 * Calendario interactivo con eventos tributarios y personalizados
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
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
        end: evento.fechaFin ? new Date(evento.fechaFin) : new Date(evento.fecha),
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
        description: 'Importa el archivo .ics en Google Calendar o Apple Calendar',
      })
    } catch (error) {
      console.error('[Calendario] Error:', error)
      toast.error('Error al exportar calendario')
    }
  }

  const eventStyleGetter = (event: any) => {
    const style: any = {
      backgroundColor: event.resource.color || '#4472C4',
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block',
    }

    if (event.resource.completado) {
      style.opacity = 0.5
      style.textDecoration = 'line-through'
    }

    return { style }
  }

  if (status === 'loading' || isLoading) {
    return (
      <>
        <Header userName={session?.user?.name} userEmail={session?.user?.email} />
        <div className="flex min-h-screen items-center justify-center bg-light-50">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-dark-100">Cargando calendario...</p>
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
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-dark">
                Calendario Tributario
              </h1>
              <p className="text-dark-100">
                Mantén el control de todas tus fechas importantes
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEventoSeleccionado(null)
                  setMostrarModal(true)
                }}
                className="flex items-center gap-2"
              >
                <span className="material-symbols-outlined">add</span>
                Nuevo Evento
              </Button>
              <Button
                variant="outline"
                onClick={handleExportarCalendario}
                className="flex items-center gap-2"
              >
                <span className="material-symbols-outlined">download</span>
                Exportar
              </Button>
            </div>
          </div>

          {/* Leyenda */}
          <Card className="mb-6 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-dark">
                Tipos de eventos:
              </span>
              <Badge style={{ backgroundColor: '#10B981' }}>PILA</Badge>
              <Badge style={{ backgroundColor: '#EF4444' }}>Declaraciones</Badge>
              <Badge style={{ backgroundColor: '#8B5CF6' }}>Pagos</Badge>
              <Badge style={{ backgroundColor: '#3B82F6' }}>Actualizaciones</Badge>
              <Badge style={{ backgroundColor: '#6B7280' }}>Personales</Badge>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Calendario */}
            <div className="lg:col-span-2">
              <Card className="p-4">
                <Calendar
                  localizer={localizer}
                  events={eventos}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 600 }}
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
              </Card>
            </div>

            {/* Lista de próximos eventos */}
            <div>
              <ListaProximosEventos
                eventos={eventos}
                onSelectEvento={handleSelectEvento}
              />
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
