/**
 * ULE - COMPONENTE DE FILTROS AVANZADOS PARA FACTURAS
 * Barra de filtros con múltiples opciones
 */

'use client'

import { useState } from 'react'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FiltrosFacturas } from '@/hooks/use-facturas'

interface FiltrosFacturasProps {
  filtros: FiltrosFacturas
  onFiltrosChange: (filtros: FiltrosFacturas) => void
  clientes?: { id: string; nombre: string }[]
}

export function FiltrosFacturasComponent({
  filtros,
  onFiltrosChange,
  clientes = [],
}: FiltrosFacturasProps) {
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false)

  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    onFiltrosChange({
      ...filtros,
      estado: value
        ? (value as 'BORRADOR' | 'EMITIDA' | 'ANULADA' | 'VENCIDA')
        : null,
      page: 1,
    })
  }

  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltrosChange({
      ...filtros,
      clienteId: e.target.value || null,
      page: 1,
    })
  }

  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltrosChange({
      ...filtros,
      busqueda: e.target.value || null,
      page: 1,
    })
  }

  const handleMontoMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseFloat(e.target.value) : null
    onFiltrosChange({
      ...filtros,
      montoMin: value,
      page: 1,
    })
  }

  const handleMontoMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseFloat(e.target.value) : null
    onFiltrosChange({
      ...filtros,
      montoMax: value,
      page: 1,
    })
  }

  const handleFechaDesdeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltrosChange({
      ...filtros,
      fechaDesde: e.target.value ? new Date(e.target.value) : null,
      page: 1,
    })
  }

  const handleFechaHastaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltrosChange({
      ...filtros,
      fechaHasta: e.target.value ? new Date(e.target.value) : null,
      page: 1,
    })
  }

  const limpiarFiltros = () => {
    onFiltrosChange({
      estado: null,
      fechaDesde: null,
      fechaHasta: null,
      clienteId: null,
      montoMin: null,
      montoMax: null,
      busqueda: null,
      page: 1,
      limit: 50,
    })
  }

  const hayFiltrosActivos =
    filtros.estado ||
    filtros.fechaDesde ||
    filtros.fechaHasta ||
    filtros.clienteId ||
    filtros.montoMin ||
    filtros.montoMax ||
    filtros.busqueda

  return (
    <Card className="mb-6">
      <CardBody>
        {/* Filtros principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Búsqueda por número */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Buscar por número
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Ej: FV-2025-001"
                value={filtros.busqueda || ''}
                onChange={handleBusquedaChange}
                className="pl-10"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Estado
            </label>
            <Select value={filtros.estado || ''} onChange={handleEstadoChange}>
              <option value="">Todos los estados</option>
              <option value="BORRADOR">Borrador</option>
              <option value="EMITIDA">Emitida</option>
              <option value="ANULADA">Anulada</option>
              <option value="VENCIDA">Vencida</option>
            </Select>
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cliente
            </label>
            <Select
              value={filtros.clienteId || ''}
              onChange={handleClienteChange}
            >
              <option value="">Todos los clientes</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </Select>
          </div>

          {/* Botón filtros avanzados */}
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
              className="w-full"
            >
              <span className="material-symbols-outlined text-lg mr-2">
                {mostrarFiltrosAvanzados ? 'expand_less' : 'expand_more'}
              </span>
              Filtros avanzados
            </Button>
          </div>
        </div>

        {/* Filtros avanzados (colapsable) */}
        {mostrarFiltrosAvanzados && (
          <div className="border-t border-slate-200 pt-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Fecha desde */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha desde
                </label>
                <Input
                  type="date"
                  value={
                    filtros.fechaDesde
                      ? filtros.fechaDesde.toISOString().split('T')[0]
                      : ''
                  }
                  onChange={handleFechaDesdeChange}
                />
              </div>

              {/* Fecha hasta */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha hasta
                </label>
                <Input
                  type="date"
                  value={
                    filtros.fechaHasta
                      ? filtros.fechaHasta.toISOString().split('T')[0]
                      : ''
                  }
                  onChange={handleFechaHastaChange}
                />
              </div>

              {/* Monto mínimo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Monto mínimo
                </label>
                <Input
                  type="number"
                  placeholder="$ 0"
                  value={filtros.montoMin || ''}
                  onChange={handleMontoMinChange}
                  min={0}
                  step={1000}
                />
              </div>

              {/* Monto máximo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Monto máximo
                </label>
                <Input
                  type="number"
                  placeholder="$ 999999999"
                  value={filtros.montoMax || ''}
                  onChange={handleMontoMaxChange}
                  min={0}
                  step={1000}
                />
              </div>
            </div>
          </div>
        )}

        {/* Botón limpiar filtros */}
        {hayFiltrosActivos && (
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={limpiarFiltros} size="sm">
              <span className="material-symbols-outlined text-lg mr-1">
                clear_all
              </span>
              Limpiar filtros
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
