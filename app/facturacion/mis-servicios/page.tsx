/**
 * ULE - PÁGINA DE GESTIÓN DE SERVICIOS FRECUENTES
 * Sistema completo de CRUD de servicios que factura el usuario
 */

'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { ModalServicio } from '@/components/facturacion/modal-servicio'
import { formatCurrency } from '@/lib/utils/format'

interface ServicioFrecuente {
  id: string
  descripcion: string
  valorUnitario: number
  unidad: string
  aplicaIVA: boolean
  porcentajeIVA: number
  categoria?: string
  vecesUtilizado: number
  activo: boolean
  createdAt: string
  updatedAt: string
}

interface PaginationData {
  total: number
  page: number
  totalPages: number
}

export default function MisServiciosPage() {
  const { data: session } = useSession()
  const [servicios, setServicios] = useState<ServicioFrecuente[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedServicio, setSelectedServicio] =
    useState<ServicioFrecuente | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [servicioToDelete, setServicioToDelete] =
    useState<ServicioFrecuente | null>(null)

  // Cargar servicios
  const cargarServicios = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/servicios-frecuentes?page=${page}&limit=${limit}`
      )

      if (!response.ok) throw new Error('Error al cargar servicios')

      const data = await response.json()
      setServicios(data.servicios)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar servicios')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarServicios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Handlers
  const handleCreate = () => {
    setModalMode('create')
    setSelectedServicio(null)
    setIsModalOpen(true)
  }

  const handleEdit = (servicio: ServicioFrecuente) => {
    setModalMode('edit')
    setSelectedServicio(servicio)
    setIsModalOpen(true)
  }

  const handleDelete = (servicio: ServicioFrecuente) => {
    setServicioToDelete(servicio)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!servicioToDelete) return

    try {
      const response = await fetch(
        `/api/servicios-frecuentes/${servicioToDelete.id}`,
        { method: 'DELETE' }
      )

      const result = await response.json()

      if (result.success) {
        toast.success('Servicio eliminado exitosamente')
        cargarServicios()
        setIsDeleteModalOpen(false)
        setServicioToDelete(null)
      } else {
        toast.error(result.error || 'Error al eliminar servicio')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar servicio')
    }
  }

  // Calcular estadísticas
  const totalServicios = pagination?.total || 0
  const serviciosMasUsados = servicios.filter(
    (s) => s.vecesUtilizado > 0
  ).length
  const serviciosConIVA = servicios.filter((s) => s.aplicaIVA).length

  return (
    <>
      <Header userName={session?.user?.name} userEmail={session?.user?.email} />

      <div className="bg-light-50 min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumb */}
          <div className="text-dark-100 mb-4 flex items-center gap-2 text-sm">
            <span>Inicio</span>
            <span className="material-symbols-outlined text-base">
              chevron_right
            </span>
            <span>Facturación</span>
            <span className="material-symbols-outlined text-base">
              chevron_right
            </span>
            <span className="font-medium text-primary">Mis Servicios</span>
          </div>

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-dark text-3xl font-bold">Mis Servicios</h1>
              <p className="text-dark-100">
                Gestiona los servicios que facturas frecuentemente
              </p>
            </div>
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <span className="material-symbols-outlined">add</span>
              Nuevo Servicio
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <Card>
              <CardBody>
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <span className="material-symbols-outlined text-2xl text-primary">
                      inventory_2
                    </span>
                  </div>
                  <div>
                    <p className="text-dark-100 text-sm">Total Servicios</p>
                    <p className="text-dark text-2xl font-bold">
                      {totalServicios}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-success-light/50 p-3">
                    <span className="material-symbols-outlined text-2xl text-success-text-light">
                      trending_up
                    </span>
                  </div>
                  <div>
                    <p className="text-dark-100 text-sm">Más Usados</p>
                    <p className="text-dark text-2xl font-bold">
                      {serviciosMasUsados}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary-light/20 p-3">
                    <span className="material-symbols-outlined text-2xl text-primary">
                      receipt
                    </span>
                  </div>
                  <div>
                    <p className="text-dark-100 text-sm">Con IVA</p>
                    <p className="text-dark text-2xl font-bold">
                      {serviciosConIVA}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Tabla de Servicios */}
          <Card>
            <CardBody>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-lg bg-gray-200"
                    />
                  ))}
                </div>
              ) : servicios.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-dark-100 mx-auto mb-4 text-6xl">
                    inventory_2
                  </span>
                  <h3 className="text-dark mb-2 text-lg font-semibold">
                    No tienes servicios registrados
                  </h3>
                  <p className="text-dark-100 mb-4">
                    Crea tu primer servicio para agilizar la facturación
                  </p>
                  <Button onClick={handleCreate}>Crear primer servicio</Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-light-200 border-b bg-gray-50">
                          <th className="text-dark px-4 py-3 text-left text-sm font-semibold">
                            Servicio
                          </th>
                          <th className="text-dark px-4 py-3 text-left text-sm font-semibold">
                            Valor Unitario
                          </th>
                          <th className="text-dark px-4 py-3 text-left text-sm font-semibold">
                            Unidad
                          </th>
                          <th className="text-dark px-4 py-3 text-center text-sm font-semibold">
                            IVA
                          </th>
                          <th className="text-dark px-4 py-3 text-center text-sm font-semibold">
                            Veces Usado
                          </th>
                          <th className="text-dark px-4 py-3 text-right text-sm font-semibold">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {servicios.map((servicio) => (
                          <tr
                            key={servicio.id}
                            className="border-light-200 border-b transition-colors hover:bg-gray-50"
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-dark font-semibold">
                                  {servicio.descripcion}
                                </p>
                                {servicio.categoria && (
                                  <Badge variant="default" className="mt-1">
                                    {servicio.categoria}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="text-dark px-4 py-3">
                              {formatCurrency(Number(servicio.valorUnitario))}
                            </td>
                            <td className="text-dark-100 px-4 py-3">
                              {servicio.unidad}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {servicio.aplicaIVA ? (
                                <Badge variant="success">
                                  {servicio.porcentajeIVA}%
                                </Badge>
                              ) : (
                                <Badge variant="default">No aplica</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="info">
                                {servicio.vecesUtilizado}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(servicio)}
                                  className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                                  title="Editar"
                                >
                                  <span className="material-symbols-outlined text-xl">
                                    edit
                                  </span>
                                </button>
                                <button
                                  onClick={() => handleDelete(servicio)}
                                  className="text-danger hover:bg-danger/10 rounded-lg p-2 transition-colors"
                                  title="Eliminar"
                                >
                                  <span className="material-symbols-outlined text-xl">
                                    delete
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-dark-100 text-sm">
                        Mostrando {(page - 1) * limit + 1}-
                        {Math.min(page * limit, pagination.total)} de{' '}
                        {pagination.total}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          Anterior
                        </Button>
                        {[...Array(pagination.totalPages)].map((_, i) => (
                          <Button
                            key={i + 1}
                            variant={page === i + 1 ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setPage(i + 1)}
                          >
                            {i + 1}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page === pagination.totalPages}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Modal de Crear/Editar */}
      <ModalServicio
        mode={modalMode}
        servicio={selectedServicio}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedServicio(null)
        }}
        onSuccess={() => {
          cargarServicios()
          setIsModalOpen(false)
          setSelectedServicio(null)
        }}
      />

      {/* Modal de Confirmación de Eliminación */}
      {isDeleteModalOpen && servicioToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="text-dark mb-4 text-xl font-bold">
              ¿Eliminar servicio?
            </h2>
            <p className="text-dark-100 mb-4">
              ¿Estás seguro de que deseas eliminar{' '}
              <strong>{servicioToDelete.descripcion}</strong>? Esta acción no se
              puede deshacer.
            </p>
            {servicioToDelete.vecesUtilizado > 0 && (
              <div className="mb-4 rounded-lg bg-warning-light/20 p-3 text-sm text-warning-text-light">
                <span className="material-symbols-outlined mr-2 align-middle">
                  warning
                </span>
                Este servicio se ha usado {servicioToDelete.vecesUtilizado}{' '}
                {servicioToDelete.vecesUtilizado === 1 ? 'vez' : 'veces'}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setServicioToDelete(null)
                }}
              >
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                Sí, eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
