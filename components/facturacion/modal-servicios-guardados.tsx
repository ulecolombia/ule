/**
 * ULE - MODAL DE SERVICIOS GUARDADOS
 * Modal para seleccionar servicios frecuentes y agregarlos a la factura
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatearMoneda } from '@/lib/utils/facturacion-utils'

interface ServicioFrecuente {
  id: string
  descripcion: string
  valorUnitario: number
  unidad: string
  aplicaIVA: boolean
  porcentajeIVA: number
  categoria?: string
  vecesUtilizado: number
}

interface ModalServiciosGuardadosProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (servicio: ServicioFrecuente) => void
}

export function ModalServiciosGuardados({
  isOpen,
  onClose,
  onSelect,
}: ModalServiciosGuardadosProps) {
  const [servicios, setServicios] = useState<ServicioFrecuente[]>([])
  const [loading, setLoading] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    if (isOpen) {
      cargarServicios()
    }
  }, [isOpen])

  const cargarServicios = async () => {
    setLoading(true)
    try {
      // Cargar los servicios más usados (sin límite de paginación)
      const response = await fetch('/api/servicios-frecuentes?limit=50')
      if (!response.ok) throw new Error('Error al cargar servicios')

      const data = await response.json()
      setServicios(data.servicios || [])
    } catch (error) {
      console.error('Error cargando servicios:', error)
    } finally {
      setLoading(false)
    }
  }

  const serviciosFiltrados = busqueda.trim()
    ? servicios.filter(
        (s) =>
          s.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
          s.categoria?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : servicios

  const handleSelect = (servicio: ServicioFrecuente) => {
    onSelect(servicio)
    setBusqueda('')
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-light-200 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-dark text-xl font-bold">
                Servicios Guardados
              </h2>
              <p className="text-dark-100 text-sm">
                Selecciona un servicio para agregarlo a la factura
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-dark-100 rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="border-light-200 border-b px-6 py-4">
          <div className="relative">
            <span className="material-symbols-outlined text-dark-100 absolute left-3 top-1/2 -translate-y-1/2 text-xl">
              search
            </span>
            <Input
              placeholder="Buscar por descripción o categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de servicios */}
        <div className="max-h-[450px] overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-gray-200"
                />
              ))}
            </div>
          ) : serviciosFiltrados.length === 0 ? (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-dark-100 mx-auto mb-4 block text-6xl">
                inventory_2
              </span>
              <p className="text-dark mb-2 text-lg font-semibold">
                {busqueda
                  ? 'No se encontraron servicios'
                  : 'No tienes servicios guardados'}
              </p>
              <p className="text-dark-100 text-sm">
                {busqueda
                  ? 'Intenta con otra búsqueda'
                  : 'Ve a "Mis Servicios" para crear tus primeros servicios frecuentes'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {serviciosFiltrados.map((servicio) => (
                <Card
                  key={servicio.id}
                  className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                  onClick={() => handleSelect(servicio)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <p className="text-dark truncate font-semibold">
                            {servicio.descripcion}
                          </p>
                          {servicio.categoria && (
                            <Badge variant="default" className="shrink-0">
                              {servicio.categoria}
                            </Badge>
                          )}
                        </div>

                        <div className="text-dark-100 flex flex-wrap items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-base">
                              payments
                            </span>
                            {formatearMoneda(Number(servicio.valorUnitario))}
                            <span className="text-xs">/ {servicio.unidad}</span>
                          </span>

                          {servicio.aplicaIVA && (
                            <Badge variant="success">
                              IVA {servicio.porcentajeIVA}%
                            </Badge>
                          )}

                          {servicio.vecesUtilizado > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-base">
                                trending_up
                              </span>
                              Usado {servicio.vecesUtilizado}{' '}
                              {servicio.vecesUtilizado === 1 ? 'vez' : 'veces'}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelect(servicio)
                        }}
                        className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                      >
                        Usar
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-light-200 border-t px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-dark-100 text-sm">
              {serviciosFiltrados.length} servicio
              {serviciosFiltrados.length !== 1 ? 's' : ''} disponible
              {serviciosFiltrados.length !== 1 ? 's' : ''}
            </p>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
