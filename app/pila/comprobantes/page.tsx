'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { formatearMoneda, formatearPeriodo } from '@/lib/calculadora-pila'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'

interface Aporte {
  id: string
  mes: number
  anio: number
  periodo: string
  ibc: number
  salud: number
  pension: number
  arl: number
  total: number
  estado: string
  fechaPago: string | null
  numeroComprobante: string | null
  comprobantePDF: string | null
  createdAt: string
}

interface ComprobantesPorMes {
  [key: string]: Aporte[]
}

export default function ComprobantesPage() {
  const [comprobantes, setComprobantes] = useState<Aporte[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAnio, setFiltroAnio] = useState<number>(new Date().getFullYear())
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [mesAbierto, setMesAbierto] = useState<string | null>(null)

  useEffect(() => {
    fetchComprobantes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchComprobantes = async () => {
    try {
      const response = await fetch('/api/pila/comprobantes')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setComprobantes(data.comprobantes || [])
    } catch (error) {
      console.error('Error al cargar comprobantes:', error)
      toast.error('Error al cargar comprobantes', {
        description: 'No se pudieron cargar los comprobantes',
        action: {
          label: 'Reintentar',
          onClick: () => {
            setLoading(true)
            fetchComprobantes()
          },
        },
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar comprobantes
  const comprobantesFiltrados = comprobantes.filter((c) => {
    const cumpleAnio = filtroAnio === 0 || c.anio === filtroAnio
    const cumpleEstado = filtroEstado === 'TODOS' || c.estado === filtroEstado
    return cumpleAnio && cumpleEstado
  })

  // Agrupar por mes/año
  const comprobantesPorMes = comprobantesFiltrados.reduce((acc, comp) => {
    const key = `${comp.anio}-${comp.mes.toString().padStart(2, '0')}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(comp)
    return acc
  }, {} as ComprobantesPorMes)

  // Ordenar meses (más reciente primero)
  const mesesOrdenados = Object.keys(comprobantesPorMes).sort((a, b) =>
    b.localeCompare(a)
  )

  // Calcular estadísticas
  const comprobantesPagados = comprobantes.filter((c) => c.estado === 'PAGADO')
  const totalPagadoAnio = comprobantesPagados
    .filter((c) => c.anio === filtroAnio)
    .reduce((sum, c) => sum + parseFloat(c.total.toString()), 0)
  const promedioMensual =
    totalPagadoAnio /
    (comprobantesPagados.filter((c) => c.anio === filtroAnio).length || 1)

  // Años disponibles
  const aniosDisponibles = Array.from(
    new Set(comprobantes.map((c) => c.anio))
  ).sort((a, b) => b - a)

  if (loading) {
    return (
      <>
        <Header />
        <div className="bg-light-50 min-h-screen p-6">
          <div className="mx-auto max-w-7xl">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-1/3 rounded bg-gray-200"></div>
              <div className="h-64 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="bg-light-50 min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumb */}
          <div className="text-dark-100 mb-4 flex items-center gap-2 text-sm">
            <span>Inicio</span>
            <span className="material-symbols-outlined text-base">
              chevron_right
            </span>
            <span>PILA</span>
            <span className="material-symbols-outlined text-base">
              chevron_right
            </span>
            <span className="font-medium text-primary">Comprobantes</span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-dark mb-2 text-3xl font-bold">
              Comprobantes PILA
            </h1>
            <p className="text-dark-100">
              Gestiona y consulta tus comprobantes de pago
            </p>
          </div>

          {/* Estadísticas */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-dark-100 text-sm">
                  Total Pagado {filtroAnio}
                </span>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-2xl font-bold text-teal-600">
                {formatearMoneda(totalPagadoAnio)}
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-dark-100 text-sm">Promedio Mensual</span>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {formatearMoneda(promedioMensual)}
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-dark-100 text-sm">Comprobantes</span>
                <span className="text-2xl">📄</span>
              </div>
              <p className="text-dark text-2xl font-bold">
                {
                  comprobantesPagados.filter((c) => c.anio === filtroAnio)
                    .length
                }
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  Año
                </label>
                <select
                  value={filtroAnio}
                  onChange={(e) => setFiltroAnio(parseInt(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-teal-500"
                >
                  <option value={0}>Todos los años</option>
                  {aniosDisponibles.map((anio) => (
                    <option key={anio} value={anio}>
                      {anio}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  Estado
                </label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="TODOS">Todos los estados</option>
                  <option value="PAGADO">Pagado</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="VENCIDO">Vencido</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={fetchComprobantes}
                  className="w-full rounded-lg bg-teal-500 py-2 text-white transition-colors hover:bg-teal-600"
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>

          {/* Lista de comprobantes por mes */}
          {mesesOrdenados.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow-sm">
              <span className="mb-4 block text-6xl">📭</span>
              <h3 className="text-dark mb-2 text-xl font-semibold">
                No hay comprobantes
              </h3>
              <p className="text-dark-100 mb-6">
                Aún no tienes comprobantes de pago registrados
              </p>
              <Link
                href="/pila/liquidar"
                className="inline-block rounded-lg bg-teal-500 px-6 py-3 text-white transition-colors hover:bg-teal-600"
              >
                Realizar Primera Liquidación
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {mesesOrdenados.map((mesKey) => {
                const [anio, mes] = mesKey.split('-')
                const comprobantesDelMes = comprobantesPorMes[mesKey] || []
                const isAbierto = mesAbierto === mesKey

                return (
                  <div
                    key={mesKey}
                    className="overflow-hidden rounded-lg bg-white shadow-sm"
                  >
                    {/* Header del acordeón */}
                    <button
                      onClick={() => setMesAbierto(isAbierto ? null : mesKey)}
                      className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl">📁</span>
                        <div className="text-left">
                          <h3 className="text-dark font-semibold">
                            {formatearPeriodo(
                              parseInt(mes || '1'),
                              parseInt(anio || '2025')
                            )}
                          </h3>
                          <p className="text-dark-100 text-sm">
                            {comprobantesDelMes.length} comprobante(s)
                          </p>
                        </div>
                      </div>
                      <svg
                        className={`h-6 w-6 transition-transform ${
                          isAbierto ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Contenido del acordeón */}
                    {isAbierto && (
                      <div className="border-t border-gray-200">
                        {comprobantesDelMes.map((comp) => (
                          <div
                            key={comp.id}
                            className="border-b border-gray-100 px-6 py-4 last:border-b-0 hover:bg-gray-50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="mb-2 flex items-center space-x-3">
                                  <h4 className="text-dark font-semibold">
                                    {comp.periodo}
                                  </h4>
                                  <span
                                    className={`rounded-full px-2 py-1 text-xs ${
                                      comp.estado === 'PAGADO'
                                        ? 'bg-green-100 text-green-700'
                                        : comp.estado === 'VENCIDO'
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-yellow-100 text-yellow-700'
                                    }`}
                                  >
                                    {comp.estado}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                                  <div>
                                    <span className="text-gray-600">IBC:</span>
                                    <p className="font-semibold">
                                      {formatearMoneda(comp.ibc)}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">
                                      Salud:
                                    </span>
                                    <p className="font-semibold">
                                      {formatearMoneda(comp.salud)}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">
                                      Pensión:
                                    </span>
                                    <p className="font-semibold">
                                      {formatearMoneda(comp.pension)}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">
                                      Total:
                                    </span>
                                    <p className="font-semibold text-teal-600">
                                      {formatearMoneda(comp.total)}
                                    </p>
                                  </div>
                                </div>

                                {comp.fechaPago && (
                                  <p className="mt-2 text-xs text-gray-500">
                                    Pagado el{' '}
                                    {new Date(
                                      comp.fechaPago
                                    ).toLocaleDateString('es-CO')}
                                  </p>
                                )}
                              </div>

                              {/* Acciones */}
                              <div className="ml-4 flex space-x-2">
                                {comp.estado === 'PAGADO' &&
                                  comp.comprobantePDF && (
                                    <>
                                      <button
                                        onClick={() =>
                                          window.open(
                                            comp.comprobantePDF!,
                                            '_blank'
                                          )
                                        }
                                        className="rounded-lg p-2 text-teal-600 transition-colors hover:bg-teal-50"
                                        title="Ver PDF"
                                      >
                                        <svg
                                          className="h-5 w-5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                          />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => {
                                          const link =
                                            document.createElement('a')
                                          link.href = comp.comprobantePDF!
                                          link.download = `comprobante-${comp.periodo}.pdf`
                                          link.click()
                                        }}
                                        className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                        title="Descargar PDF"
                                      >
                                        <svg
                                          className="h-5 w-5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                          />
                                        </svg>
                                      </button>
                                    </>
                                  )}
                                {comp.estado === 'PENDIENTE' && (
                                  <Link
                                    href={`/pila/liquidar?aporte=${comp.id}`}
                                    className="rounded-lg bg-teal-500 px-4 py-2 text-sm text-white transition-colors hover:bg-teal-600"
                                  >
                                    Ir a pagar
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
