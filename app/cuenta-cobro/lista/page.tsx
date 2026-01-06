/**
 * ULE - PÁGINA DE LISTADO DE CUENTAS DE COBRO
 * Historial y gestión de cuentas de cobro
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

import { Header } from '@/components/layout/Header'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useCuentasCobro,
  useEstadisticasCuentaCobro,
  marcarComoPagada,
  eliminarCuentaCobro,
  EstadoCuentaCobro,
} from '@/hooks/use-cuentas-cobro'
import { formatearMoneda } from '@/lib/utils/cuenta-cobro-utils'

const ESTADOS_FILTRO = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'BORRADOR', label: 'Borradores' },
  { value: 'EMITIDA', label: 'Emitidas' },
  { value: 'ENVIADA', label: 'Enviadas' },
  { value: 'PAGADA', label: 'Pagadas' },
  { value: 'VENCIDA', label: 'Vencidas' },
  { value: 'ANULADA', label: 'Anuladas' },
]

const ESTADO_COLORS: Record<EstadoCuentaCobro, { bg: string; text: string }> = {
  BORRADOR: { bg: 'bg-gray-100', text: 'text-gray-700' },
  EMITIDA: { bg: 'bg-blue-100', text: 'text-blue-700' },
  ENVIADA: { bg: 'bg-purple-100', text: 'text-purple-700' },
  PAGADA: { bg: 'bg-green-100', text: 'text-green-700' },
  VENCIDA: { bg: 'bg-red-100', text: 'text-red-700' },
  ANULADA: { bg: 'bg-gray-100', text: 'text-gray-500' },
}

export default function ListaCuentasCobroPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS')
  const [searchInput, setSearchInput] = useState('')

  const { cuentas, pagination, isLoading, mutate } = useCuentasCobro(
    page,
    10,
    search,
    estadoFiltro
  )
  const { estadisticas } = useEstadisticasCuentaCobro()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleMarcarPagada = async (id: string) => {
    try {
      const result = await marcarComoPagada(id)
      if (result.success) {
        toast.success('Cuenta marcada como pagada')
        mutate()
      } else {
        toast.error(result.error || 'Error al marcar como pagada')
      }
    } catch {
      toast.error('Error al marcar como pagada')
    }
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este borrador?')) return

    try {
      const result = await eliminarCuentaCobro(id)
      if (result.success) {
        toast.success('Borrador eliminado')
        mutate()
      } else {
        toast.error(result.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      <Header />

      <main className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="text-dark-100 mb-4 flex items-center gap-2 text-sm">
            <Link
              href="/dashboard"
              className="transition-colors hover:text-primary"
            >
              Inicio
            </Link>
            <span className="material-symbols-outlined text-base">
              chevron_right
            </span>
            <span className="text-dark">Cuentas de Cobro</span>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-dark mb-2 flex items-center text-3xl font-bold">
                <span className="material-symbols-outlined mr-3 text-4xl text-primary">
                  request_quote
                </span>
                Cuentas de Cobro
              </h1>
              <p className="text-dark-100">
                Gestiona tus cuentas de cobro como persona natural
              </p>
            </div>
            <Button onClick={() => router.push('/cuenta-cobro/nueva')}>
              <span className="material-symbols-outlined mr-2 text-lg">
                add
              </span>
              Nueva cuenta de cobro
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-light-200 border-2">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <span className="material-symbols-outlined text-xl text-primary">
                      description
                    </span>
                  </div>
                  <div>
                    <p className="text-dark text-2xl font-bold">
                      {estadisticas.resumen.totalCuentas}
                    </p>
                    <p className="text-dark-100 text-sm">Total cuentas</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border-light-200 border-2">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-green-100 p-3">
                    <span className="material-symbols-outlined text-xl text-green-600">
                      paid
                    </span>
                  </div>
                  <div>
                    <p className="text-dark text-2xl font-bold">
                      {formatearMoneda(estadisticas.montos.totalCobrado)}
                    </p>
                    <p className="text-dark-100 text-sm">Total cobrado</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border-light-200 border-2">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-100 p-3">
                    <span className="material-symbols-outlined text-xl text-amber-600">
                      pending
                    </span>
                  </div>
                  <div>
                    <p className="text-dark text-2xl font-bold">
                      {formatearMoneda(estadisticas.montos.totalPendiente)}
                    </p>
                    <p className="text-dark-100 text-sm">Pendiente de cobro</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border-light-200 border-2">
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-100 p-3">
                    <span className="material-symbols-outlined text-xl text-blue-600">
                      calendar_month
                    </span>
                  </div>
                  <div>
                    <p className="text-dark text-2xl font-bold">
                      {formatearMoneda(estadisticas.montos.totalMes)}
                    </p>
                    <p className="text-dark-100 text-sm">Este mes</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="border-light-200 mb-6 border-2">
          <CardBody className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <span className="material-symbols-outlined text-dark-100 absolute left-3 top-1/2 -translate-y-1/2">
                    search
                  </span>
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Buscar por número o cliente..."
                    className="pl-10"
                  />
                </div>
              </form>

              <div className="flex flex-wrap gap-2">
                {ESTADOS_FILTRO.map((estado) => (
                  <button
                    key={estado.value}
                    onClick={() => {
                      setEstadoFiltro(estado.value)
                      setPage(1)
                    }}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      estadoFiltro === estado.value
                        ? 'bg-primary text-white'
                        : 'bg-light-50 text-dark-100 hover:bg-light-200'
                    }`}
                  >
                    {estado.label}
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Lista de cuentas */}
        <Card className="border-light-200 border-2">
          <CardBody className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <span className="material-symbols-outlined text-dark-100 animate-spin text-4xl">
                  progress_activity
                </span>
              </div>
            ) : cuentas.length === 0 ? (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-dark-100 mb-4 text-5xl">
                  description
                </span>
                <h3 className="text-dark mb-2 text-lg font-semibold">
                  No hay cuentas de cobro
                </h3>
                <p className="text-dark-100 mb-4">
                  {search || estadoFiltro !== 'TODOS'
                    ? 'No se encontraron resultados con los filtros aplicados'
                    : 'Crea tu primera cuenta de cobro'}
                </p>
                {!search && estadoFiltro === 'TODOS' && (
                  <Button onClick={() => router.push('/cuenta-cobro/nueva')}>
                    <span className="material-symbols-outlined mr-2 text-lg">
                      add
                    </span>
                    Nueva cuenta de cobro
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Tabla */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-light-200 bg-light-50 border-b">
                        <th className="text-dark px-4 py-3 text-left text-sm font-semibold">
                          Número
                        </th>
                        <th className="text-dark px-4 py-3 text-left text-sm font-semibold">
                          Cliente
                        </th>
                        <th className="text-dark px-4 py-3 text-left text-sm font-semibold">
                          Fecha
                        </th>
                        <th className="text-dark px-4 py-3 text-right text-sm font-semibold">
                          Total
                        </th>
                        <th className="text-dark px-4 py-3 text-center text-sm font-semibold">
                          Estado
                        </th>
                        <th className="text-dark px-4 py-3 text-center text-sm font-semibold">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cuentas.map((cuenta) => (
                        <tr
                          key={cuenta.id}
                          className="border-light-200 hover:bg-light-50 border-b transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="text-dark font-medium">
                              {cuenta.numeroCuenta}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-dark font-medium">
                                {cuenta.clienteNombre}
                              </p>
                              <p className="text-dark-100 text-xs">
                                {cuenta.clienteDocumento}
                              </p>
                            </div>
                          </td>
                          <td className="text-dark-100 px-4 py-3 text-sm">
                            {formatFecha(cuenta.fecha)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-dark font-semibold">
                              {formatearMoneda(Number(cuenta.total))}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                ESTADO_COLORS[cuenta.estado]?.bg ||
                                'bg-gray-100'
                              } ${ESTADO_COLORS[cuenta.estado]?.text || 'text-gray-700'}`}
                            >
                              {cuenta.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {/* Ver detalles */}
                              <button
                                onClick={() =>
                                  router.push(`/cuenta-cobro/${cuenta.id}`)
                                }
                                className="hover:bg-light-200 text-dark-100 rounded-lg p-1.5 transition-colors hover:text-primary"
                                title="Ver detalles"
                              >
                                <span className="material-symbols-outlined text-lg">
                                  visibility
                                </span>
                              </button>

                              {/* Marcar como pagada */}
                              {['EMITIDA', 'ENVIADA', 'VENCIDA'].includes(
                                cuenta.estado
                              ) && (
                                <button
                                  onClick={() => handleMarcarPagada(cuenta.id)}
                                  className="text-dark-100 rounded-lg p-1.5 transition-colors hover:bg-green-100 hover:text-green-600"
                                  title="Marcar como pagada"
                                >
                                  <span className="material-symbols-outlined text-lg">
                                    paid
                                  </span>
                                </button>
                              )}

                              {/* Editar borrador */}
                              {cuenta.estado === 'BORRADOR' && (
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/cuenta-cobro/${cuenta.id}/editar`
                                    )
                                  }
                                  className="hover:bg-light-200 text-dark-100 rounded-lg p-1.5 transition-colors hover:text-primary"
                                  title="Editar"
                                >
                                  <span className="material-symbols-outlined text-lg">
                                    edit
                                  </span>
                                </button>
                              )}

                              {/* Eliminar borrador */}
                              {cuenta.estado === 'BORRADOR' && (
                                <button
                                  onClick={() => handleEliminar(cuenta.id)}
                                  className="text-dark-100 rounded-lg p-1.5 transition-colors hover:bg-red-100 hover:text-red-600"
                                  title="Eliminar"
                                >
                                  <span className="material-symbols-outlined text-lg">
                                    delete
                                  </span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {pagination.totalPages > 1 && (
                  <div className="border-light-200 flex items-center justify-between border-t px-4 py-3">
                    <p className="text-dark-100 text-sm">
                      Mostrando {(page - 1) * pagination.limit + 1} -{' '}
                      {Math.min(page * pagination.limit, pagination.total)} de{' '}
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
      </main>
    </div>
  )
}
