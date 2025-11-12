/**
 * ULE - COMPONENTE TOP 5 CLIENTES
 * Lista de los 5 clientes con mayor facturación
 */

'use client'

import { Card, CardBody, CardHeader } from '@/components/ui/card'

interface TopClientesProps {
  clientes: {
    clienteId: string
    clienteNombre: string
    totalFacturado: number
    cantidadFacturas: number
  }[]
  isLoading?: boolean
}

export function TopClientes({ clientes, isLoading = false }: TopClientesProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900">Top 5 Clientes</h3>
          <p className="text-sm text-slate-600">Mayor facturación del año</p>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    )
  }

  // Si no hay clientes
  if (!clientes || clientes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900">Top 5 Clientes</h3>
          <p className="text-sm text-slate-600">Mayor facturación del año</p>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-2">
              person_off
            </span>
            <p className="text-slate-500">No hay datos de clientes</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  // Colores para badges de ranking
  const rankingColors = [
    'bg-yellow-100 text-yellow-800 border-yellow-300', // 1ro - Oro
    'bg-slate-100 text-slate-700 border-slate-300', // 2do - Plata
    'bg-orange-100 text-orange-700 border-orange-300', // 3ro - Bronce
    'bg-blue-100 text-blue-700 border-blue-300', // 4to
    'bg-purple-100 text-purple-700 border-purple-300', // 5to
  ]

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-slate-900">Top 5 Clientes</h3>
        <p className="text-sm text-slate-600">Mayor facturación del año</p>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {clientes.map((cliente, index) => (
            <div
              key={cliente.clienteId}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {/* Número de ranking */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${rankingColors[index]}`}
              >
                {index + 1}
              </div>

              {/* Información del cliente */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">
                  {cliente.clienteNombre}
                </p>
                <p className="text-sm text-slate-600">
                  {cliente.cantidadFacturas}{' '}
                  {cliente.cantidadFacturas === 1 ? 'factura' : 'facturas'}
                </p>
              </div>

              {/* Total facturado */}
              <div className="text-right">
                <p className="font-bold text-slate-900">
                  {formatCurrency(cliente.totalFacturado)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
