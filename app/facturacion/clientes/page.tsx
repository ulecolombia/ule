/**
 * ULE - PÁGINA DE GESTIÓN DE CLIENTES
 * Sistema completo de CRUD de clientes para facturación
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  useClientes,
  useClientesStats,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
} from '@/hooks/use-clientes'
import { Header } from '@/components/layout/Header'
import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { formatearNumeroDocumento } from '@/lib/utils/facturacion-utils'
import { ClienteModal } from '@/components/facturacion/cliente-modal'

export default function ClientesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [tipoDocumento, setTipoDocumento] = useState('TODOS')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<any>(null)

  // SWR hooks
  const { clientes, pagination, isLoading, mutate } = useClientes(
    page,
    limit,
    searchDebounced,
    tipoDocumento
  )
  const { stats } = useClientesStats()

  // Debounce búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search)
      setPage(1) // Reset a página 1 al buscar
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Handlers
  const handleCreate = () => {
    setModalMode('create')
    setSelectedCliente(null)
    setIsModalOpen(true)
  }

  const handleEdit = (cliente: any) => {
    setModalMode('edit')
    setSelectedCliente(cliente)
    setIsModalOpen(true)
  }

  const handleDelete = (cliente: any) => {
    setClienteToDelete(cliente)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!clienteToDelete) return

    try {
      await eliminarCliente(clienteToDelete.id)
      toast.success('Cliente eliminado exitosamente')
      mutate()
      setIsDeleteModalOpen(false)
      setClienteToDelete(null)
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar cliente')
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      if (modalMode === 'create') {
        await crearCliente(data)
        toast.success('Cliente creado exitosamente')
      } else {
        await actualizarCliente(selectedCliente!.id, data)
        toast.success('Cliente actualizado exitosamente')
      }

      mutate()
      setIsModalOpen(false)
      setSelectedCliente(null)
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar cliente')
    }
  }

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
            <span className="font-medium text-primary">Clientes</span>
          </div>

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-dark text-3xl font-bold">
                Gestión de Clientes
              </h1>
              <p className="text-dark-100">
                Administra tu lista de clientes para facturación
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <Button
                onClick={handleCreate}
                className="flex items-center gap-2"
              >
                <span className="material-symbols-outlined">add</span>
                Nuevo Cliente
              </Button>

              {/* Menú de navegación de Facturación */}
              <div className="relative flex items-center">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      router.push(e.target.value)
                    }
                  }}
                  defaultValue=""
                  className="text-dark h-[42px] cursor-pointer appearance-none rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 pr-8 text-sm font-medium shadow-sm transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="" disabled>
                    Ir a
                  </option>
                  <option value="/facturacion/nueva">
                    Nueva Factura Electrónica
                  </option>
                  <option value="/facturacion/facturas">Mis Facturas</option>
                </select>
                <span className="material-symbols-outlined text-dark-100 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-lg">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardBody>
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <span className="material-symbols-outlined text-2xl text-primary">
                      group
                    </span>
                  </div>
                  <div>
                    <p className="text-dark-100 text-sm">Total Clientes</p>
                    <p className="text-dark text-2xl font-bold">
                      {stats?.totalClientes || 0}
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
                    <p className="text-dark-100 text-sm">Activos Este Mes</p>
                    <p className="text-dark text-2xl font-bold">
                      {stats?.clientesActivosMes || 0}
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
                      person_add
                    </span>
                  </div>
                  <div>
                    <p className="text-dark-100 text-sm">Nuevos Este Mes</p>
                    <p className="text-dark text-2xl font-bold">
                      {stats?.clientesNuevosMes || 0}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Búsqueda y Filtros */}
          <Card className="mb-6">
            <CardBody>
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1">
                  <div className="relative">
                    <span className="material-symbols-outlined text-dark-100 absolute left-3 top-1/2 -translate-y-1/2">
                      search
                    </span>
                    <Input
                      type="text"
                      placeholder="Buscar por nombre o documento..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={tipoDocumento}
                  onChange={(e) => {
                    setTipoDocumento(e.target.value)
                    setPage(1)
                  }}
                  className="border-light-200 rounded-lg border px-4 py-2"
                >
                  <option value="TODOS">Todos los documentos</option>
                  <option value="CC">CC - Cédula</option>
                  <option value="NIT">NIT - Empresa</option>
                  <option value="CE">CE - Extranjería</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>
            </CardBody>
          </Card>

          {/* Tabla de Clientes */}
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
              ) : clientes.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-dark-100 mx-auto mb-4 text-6xl">
                    person_off
                  </span>
                  <h3 className="text-dark mb-2 text-lg font-semibold">
                    {search
                      ? 'No se encontraron clientes'
                      : 'No tienes clientes todavía'}
                  </h3>
                  <p className="text-dark-100 mb-4">
                    {search
                      ? 'Intenta con otros términos de búsqueda'
                      : 'Crea tu primer cliente para empezar a facturar'}
                  </p>
                  <Button onClick={search ? () => setSearch('') : handleCreate}>
                    {search ? 'Limpiar búsqueda' : 'Crear primer cliente'}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-light-200 border-b bg-gray-50">
                          <th className="text-dark px-4 py-3 text-left text-sm font-semibold">
                            Cliente
                          </th>
                          <th className="text-dark px-4 py-3 text-left text-sm font-semibold">
                            Documento
                          </th>
                          <th className="text-dark px-4 py-3 text-left text-sm font-semibold">
                            Contacto
                          </th>
                          <th className="text-dark px-4 py-3 text-left text-sm font-semibold">
                            Ciudad
                          </th>
                          <th className="text-dark px-4 py-3 text-center text-sm font-semibold">
                            Facturas
                          </th>
                          <th className="text-dark px-4 py-3 text-right text-sm font-semibold">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientes.map((cliente) => (
                          <tr
                            key={cliente.id}
                            className="border-light-200 border-b transition-colors hover:bg-gray-50"
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-dark font-semibold">
                                  {cliente.nombre}
                                </p>
                                <Badge variant="default" className="mt-1">
                                  {cliente.tipoDocumento}
                                </Badge>
                              </div>
                            </td>
                            <td className="text-dark-100 px-4 py-3">
                              {formatearNumeroDocumento(
                                cliente.numeroDocumento,
                                cliente.tipoDocumento
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm">
                                <p className="text-dark">
                                  {cliente.email || '—'}
                                </p>
                                <p className="text-dark-100">
                                  {cliente.telefono || '—'}
                                </p>
                              </div>
                            </td>
                            <td className="text-dark-100 px-4 py-3 text-sm">
                              {cliente.ciudad || '—'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="info">
                                {cliente._count.facturas}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(cliente)}
                                  className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                                  title="Editar"
                                >
                                  <span className="material-symbols-outlined text-xl">
                                    edit
                                  </span>
                                </button>
                                <button
                                  onClick={() => handleDelete(cliente)}
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
      <ClienteModal
        mode={modalMode}
        cliente={selectedCliente}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedCliente(null)
        }}
        onSuccess={handleSubmit}
      />

      {/* Modal de Confirmación de Eliminación */}
      {isDeleteModalOpen && clienteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="text-dark mb-4 text-xl font-bold">
              ¿Eliminar cliente?
            </h2>
            <p className="text-dark-100 mb-4">
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong>{clienteToDelete.nombre}</strong>? Esta acción no se puede
              deshacer.
            </p>
            {clienteToDelete._count.facturas > 0 && (
              <div className="mb-4 rounded-lg bg-warning-light/20 p-3 text-sm text-warning-text-light">
                <span className="material-symbols-outlined mr-2 align-middle">
                  warning
                </span>
                Este cliente tiene {clienteToDelete._count.facturas} factura(s)
                asociada(s)
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setClienteToDelete(null)
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
