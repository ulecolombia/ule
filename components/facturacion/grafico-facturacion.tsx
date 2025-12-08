/**
 * ULE - COMPONENTE DE GRÁFICO DE FACTURACIÓN
 * Gráfico de barras con facturación mensual usando Recharts
 */

'use client'

import { Card, CardBody, CardHeader } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface GraficoFacturacionProps {
  datos: {
    mes: string
    total: number
  }[]
  isLoading?: boolean
}

// Tooltip personalizado
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: { mes: string; total: number }
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  const firstPayload = payload?.[0]
  if (active && firstPayload) {
    const value = firstPayload.value
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
        <p className="text-sm font-medium text-slate-900">
          {firstPayload.payload.mes}
        </p>
        <p className="text-lg font-bold text-teal-600">
          {new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value)}
        </p>
      </div>
    )
  }
  return null
}

export function GraficoFacturacion({
  datos,
  isLoading = false,
}: GraficoFacturacionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900">
            Facturación Mensual
          </h3>
          <p className="text-sm text-slate-600">Últimos 6 meses</p>
        </CardHeader>
        <CardBody>
          <div className="flex h-72 items-center justify-center">
            <div className="h-full w-full animate-pulse rounded bg-slate-100"></div>
          </div>
        </CardBody>
      </Card>
    )
  }

  // Si no hay datos
  if (!datos || datos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900">
            Facturación Mensual
          </h3>
          <p className="text-sm text-slate-600">Últimos 6 meses</p>
        </CardHeader>
        <CardBody>
          <div className="flex h-72 items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined mb-2 text-5xl text-slate-300">
                bar_chart
              </span>
              <p className="text-slate-500">No hay datos disponibles</p>
            </div>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-slate-900">
          Facturación Mensual
        </h3>
        <p className="text-sm text-slate-600">Últimos 6 meses</p>
      </CardHeader>
      <CardBody>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={datos}
              margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="mes"
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Bar
                dataKey="total"
                fill="#14B8A6"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  )
}
