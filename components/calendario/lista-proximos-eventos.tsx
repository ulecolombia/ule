/**
 * LISTA DE PRÓXIMOS EVENTOS
 * Muestra los próximos 10 eventos del calendario
 */

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatearFecha } from '@/lib/utils/format'
import { isFuture, isToday } from 'date-fns'

interface ListaProximosEventosProps {
  eventos: any[]
  onSelectEvento: (evento: any) => void
}

export function ListaProximosEventos({
  eventos,
  onSelectEvento,
}: ListaProximosEventosProps) {
  // Obtener eventos futuros y de hoy
  const eventosFuturos = eventos
    .filter((e) => isFuture(e.start) || isToday(e.start))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 10)

  // Si hay pocos eventos futuros, complementar con eventos pasados recientes
  let proximosEventos = eventosFuturos
  if (eventosFuturos.length < 5) {
    const eventosPasados = eventos
      .filter((e) => !isFuture(e.start) && !isToday(e.start))
      .sort((a, b) => b.start.getTime() - a.start.getTime()) // Orden descendente
      .slice(0, 10 - eventosFuturos.length)

    proximosEventos = [...eventosFuturos, ...eventosPasados].slice(0, 10)
  }

  const tieneEventosFuturos = eventosFuturos.length > 0

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-dark text-lg font-semibold">
          {tieneEventosFuturos ? 'Próximos Eventos' : 'Eventos Recientes'}
        </h3>
        {proximosEventos.length > 0 && (
          <span className="text-dark-100 text-xs">
            {tieneEventosFuturos
              ? `${eventosFuturos.length} próximos`
              : `${proximosEventos.length} eventos`}
          </span>
        )}
      </div>

      {proximosEventos.length === 0 ? (
        <div className="py-8 text-center">
          <span className="material-symbols-outlined text-dark-100 mb-3 text-6xl">
            event_busy
          </span>
          <p className="text-dark mb-1 font-medium">No hay eventos próximos</p>
          {eventos.length === 0 && (
            <p className="text-dark-100 text-sm">
              Haz clic en &quot;Generar Eventos&quot; para cargar las fechas
              tributarias
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {proximosEventos.map((evento) => {
            const esFuturo = isFuture(evento.start) || isToday(evento.start)
            return (
              <div
                key={evento.resource.id}
                onClick={() => onSelectEvento(evento)}
                className={`cursor-pointer rounded-lg p-3 transition-all hover:shadow-md ${
                  esFuturo
                    ? 'bg-light-50 hover:bg-light-100'
                    : 'bg-gray-50 opacity-75 hover:bg-gray-100'
                }`}
              >
                <div className="mb-1 flex items-start justify-between">
                  <div className="flex flex-1 items-center gap-2">
                    <h4 className="text-dark text-sm font-medium">
                      {evento.title}
                    </h4>
                    {!esFuturo && (
                      <span className="text-xs text-gray-500">(pasado)</span>
                    )}
                  </div>
                  <div
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: evento.resource.color }}
                  />
                </div>
                <p className="text-dark-100 mb-1 text-xs">
                  {formatearFecha(evento.start)}
                </p>
                {evento.resource.descripcion && (
                  <p className="text-dark-100 line-clamp-2 text-xs">
                    {evento.resource.descripcion}
                  </p>
                )}
                {evento.resource.completado && (
                  <Badge variant="success" className="mt-2">
                    Completado
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
