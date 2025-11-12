/**
 * ULE - COMPONENTE DE ESTADÍSTICAS DE CHAT
 * Dashboard de métricas de uso de IA
 */

'use client'

import { useEstadisticasChat } from '@/hooks/use-conversaciones-swr'
import { Card } from '@/components/ui/card'
import {
  MessageSquare,
  Zap,
  TrendingUp,
  Clock,
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Componente principal de estadísticas
 */
export function EstadisticasChat() {
  const { estadisticas, isLoading, isError } = useEstadisticasChat()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (isError || !estadisticas) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Error al cargar estadísticas</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Conversaciones"
          value={estadisticas.totalConversaciones}
          icon={<MessageSquare className="w-5 h-5" />}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />

        <StatCard
          title="Consultas totales"
          value={estadisticas.totalConsultas}
          icon={<TrendingUp className="w-5 h-5" />}
          color="text-green-600"
          bgColor="bg-green-50"
        />

        <StatCard
          title="Consultas este mes"
          value={estadisticas.consultasMes}
          icon={<Zap className="w-5 h-5" />}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />

        <StatCard
          title="Tokens usados"
          value={estadisticas.tokensUsadosTotal.toLocaleString('es-CO')}
          icon={<Clock className="w-5 h-5" />}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Promedio de mensajes</p>
          <p className="text-2xl font-bold text-gray-900">
            {estadisticas.promedioMensajesPorConversacion}
          </p>
          <p className="text-xs text-gray-500 mt-1">por conversación</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Promedio de tokens</p>
          <p className="text-2xl font-bold text-gray-900">
            {estadisticas.promedioTokensPorConsulta}
          </p>
          <p className="text-xs text-gray-500 mt-1">por consulta</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Última actividad</p>
          <p className="text-2xl font-bold text-gray-900">
            {estadisticas.ultimaActividad
              ? formatDistanceToNow(new Date(estadisticas.ultimaActividad), {
                  addSuffix: true,
                  locale: es,
                })
              : 'Sin actividad'}
          </p>
        </Card>
      </div>

      {/* Conversaciones recientes */}
      {estadisticas.conversacionesRecientes.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Conversaciones recientes
          </h3>
          <div className="space-y-3">
            {estadisticas.conversacionesRecientes.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {conv.titulo}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {conv.mensajesCount} mensajes •{' '}
                    {formatDistanceToNow(new Date(conv.updatedAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Gráfico de uso de últimos 7 días */}
      {estadisticas.usoUltimos7Dias.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Uso de los últimos 7 días
          </h3>
          <div className="space-y-2">
            {estadisticas.usoUltimos7Dias.map((dia, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-24 text-sm text-gray-600">
                  {new Date(dia.fecha).toLocaleDateString('es-CO', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min((dia.consultas / 10) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                      {dia.consultas}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

/**
 * Componente de tarjeta de estadística
 */
function StatCard({
  title,
  value,
  icon,
  color,
  bgColor,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  bgColor: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">{title}</p>
        <div className={`${bgColor} ${color} p-2 rounded-lg`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </Card>
  )
}
