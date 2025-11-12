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
  const proximosEventos = eventos
    .filter((e) => isFuture(e.start) || isToday(e.start))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 10)

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-dark mb-4">
        Próximos Eventos
      </h3>

      {proximosEventos.length === 0 ? (
        <div className="py-8 text-center">
          <span className="material-symbols-outlined text-6xl text-dark-100 mb-2">
            event_busy
          </span>
          <p className="text-dark-100">No hay eventos próximos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proximosEventos.map((evento) => (
            <div
              key={evento.resource.id}
              onClick={() => onSelectEvento(evento)}
              className="rounded-lg bg-light-50 p-3 cursor-pointer transition-all hover:bg-light-100 hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-medium text-sm text-dark">
                  {evento.title}
                </h4>
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: evento.resource.color }}
                />
              </div>
              <p className="text-xs text-dark-100 mb-1">
                {formatearFecha(evento.start)}
              </p>
              {evento.resource.descripcion && (
                <p className="text-xs text-dark-100 line-clamp-2">
                  {evento.resource.descripcion}
                </p>
              )}
              {evento.resource.completado && (
                <Badge variant="success" className="mt-2">
                  Completado
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
