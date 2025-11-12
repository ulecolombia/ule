/**
 * ULE - COMPONENTE DE DASHBOARD DE ESTADÍSTICAS
 * Muestra 4 tarjetas con métricas principales
 */

'use client'

import { Card, CardBody } from '@/components/ui/card'

interface EstadisticasDashboardProps {
  totalFacturadoMes: number
  totalFacturadoAño: number
  facturasPendientes: number
  promedioFactura: number
  isLoading?: boolean
}

export function EstadisticasDashboard({
  totalFacturadoMes,
  totalFacturadoAño,
  facturasPendientes,
  promedioFactura,
  isLoading = false,
}: EstadisticasDashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const estadisticas = [
    {
      titulo: 'Total Facturado Mes',
      valor: formatCurrency(totalFacturadoMes),
      icono: 'calendar_today',
      color: 'bg-blue-50 text-blue-600',
      descripcion: 'Facturación del mes actual',
    },
    {
      titulo: 'Total Facturado Año',
      valor: formatCurrency(totalFacturadoAño),
      icono: 'trending_up',
      color: 'bg-teal-50 text-teal-600',
      descripcion: 'Facturación acumulada del año',
    },
    {
      titulo: 'Facturas Pendientes',
      valor: facturasPendientes.toString(),
      icono: 'draft',
      color: 'bg-orange-50 text-orange-600',
      descripcion: 'Borradores sin emitir',
    },
    {
      titulo: 'Promedio por Factura',
      valor: formatCurrency(promedioFactura),
      icono: 'analytics',
      color: 'bg-purple-50 text-purple-600',
      descripcion: 'Promedio del mes actual',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardBody>
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {estadisticas.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardBody>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-slate-600 font-medium mb-1">
                  {stat.titulo}
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {stat.valor}
                </h3>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}
              >
                <span className="material-symbols-outlined text-2xl">
                  {stat.icono}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">{stat.descripcion}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
