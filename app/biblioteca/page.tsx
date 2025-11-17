/**
 * ULE - BIBLIOTECA DE ARCHIVOS UNIFICADA
 * Centraliza todos los documentos: comprobantes PILA, facturas y archivos mensuales
 */

'use client'

import { useEffect, useState, Fragment } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { formatearMoneda, formatearPeriodo } from '@/lib/calculadora-pila'

// ==============================================
// INTERFACES
// ==============================================

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
  tipo: 'PILA' // Añadimos tipo para identificar
}

interface Factura {
  id: string
  numeroFactura: string
  fechaEmision: string
  fechaVencimiento: string
  subtotal: number
  iva: number
  total: number
  estado: string
  pdfUrl: string | null
  xmlUrl: string | null
  cliente: {
    nombre: string
    identificacion: string
  }
  tipo: 'FACTURA' // Añadimos tipo para identificar
}

type Documento = (Aporte | Factura) & {
  tipo: 'PILA' | 'FACTURA'
  mes: number
  anio: number
}

interface DocumentosPorMes {
  [key: string]: Documento[]
}

// ==============================================
// COMPONENTE PRINCIPAL
// ==============================================

export default function BibliotecaPage() {
  const { data: session } = useSession()
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS')
  const [filtroAnio, setFiltroAnio] = useState<number>(new Date().getFullYear())
  const [mesAbierto, setMesAbierto] = useState<string | null>(null)

  // ==============================================
  // FETCH DATA
  // ==============================================

  useEffect(() => {
    fetchTodosDocumentos()
  }, [])

  const fetchTodosDocumentos = async () => {
    setLoading(true)
    try {
      // Fetch comprobantes PILA y facturas en paralelo
      const [resComprobantes, resFacturas] = await Promise.all([
        fetch('/api/pila/comprobantes'),
        fetch('/api/facturacion/facturas?limit=1000'), // Traer todas
      ])

      const comprobantes: Aporte[] = resComprobantes.ok
        ? (await resComprobantes.json()).comprobantes || []
        : []

      const facturas: Factura[] = resFacturas.ok
        ? (await resFacturas.json()).facturas || []
        : []

      // Combinar y normalizar ambos tipos de documentos
      const todosDocumentos: Documento[] = [
        ...comprobantes.map((c) => ({ ...c, tipo: 'PILA' as const })),
        ...facturas.map((f) => {
          const fecha = new Date(f.fechaEmision)
          return {
            ...f,
            tipo: 'FACTURA' as const,
            mes: fecha.getMonth() + 1,
            anio: fecha.getFullYear(),
          }
        }),
      ]

      setDocumentos(todosDocumentos)
    } catch (error) {
      console.error('Error al cargar documentos:', error)
      toast.error('Error al cargar documentos', {
        description: 'No se pudieron cargar todos los archivos',
      })
    } finally {
      setLoading(false)
    }
  }

  // ==============================================
  // FILTRADO Y AGRUPACIÓN
  // ==============================================

  const documentosFiltrados = documentos.filter((doc) => {
    const cumpleTipo = filtroTipo === 'TODOS' || doc.tipo === filtroTipo
    const cumpleAnio = filtroAnio === 0 || doc.anio === filtroAnio
    return cumpleTipo && cumpleAnio
  })

  const documentosPorMes = documentosFiltrados.reduce((acc, doc) => {
    const key = `${doc.anio}-${doc.mes.toString().padStart(2, '0')}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(doc)
    return acc
  }, {} as DocumentosPorMes)

  const mesesOrdenados = Object.keys(documentosPorMes).sort((a, b) =>
    b.localeCompare(a)
  )

  // ==============================================
  // ESTADÍSTICAS
  // ==============================================

  const totalPILA = documentos
    .filter((d) => d.tipo === 'PILA' && d.anio === filtroAnio)
    .reduce((sum, d) => sum + (d as Aporte).total, 0)

  const totalFacturas = documentos
    .filter((d) => d.tipo === 'FACTURA' && d.anio === filtroAnio)
    .reduce((sum, d) => sum + (d as Factura).total, 0)

  const totalDocumentos = documentosFiltrados.length

  const aniosDisponibles = Array.from(
    new Set(documentos.map((d) => d.anio))
  ).sort((a, b) => b - a)

  // ==============================================
  // RENDERIZADO
  // ==============================================

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-1/3 rounded bg-gray-200"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 rounded bg-gray-200"></div>
            <div className="h-32 rounded bg-gray-200"></div>
            <div className="h-32 rounded bg-gray-200"></div>
          </div>
          <div className="h-96 rounded bg-gray-200"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header userName={session?.user?.name} userEmail={session?.user?.email} />

      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-dark mb-3 flex items-center gap-3 text-3xl font-bold tracking-tight">
              <span className="material-symbols-outlined text-4xl text-primary">
                folder_open
              </span>
              Biblioteca de Archivos
            </h1>
            <p className="text-dark-100 font-medium">
              Todos tus documentos: comprobantes PILA, facturas electrónicas y
              archivos mensuales
            </p>
          </div>

          {/* Estadísticas */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="border-light-200 rounded-lg border-2 bg-white p-6 transition-colors hover:border-primary">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-dark-100 text-sm font-medium">
                  PILA {filtroAnio}
                </span>
                <span className="material-symbols-outlined text-2xl text-primary">
                  calculate
                </span>
              </div>
              <p className="text-dark text-2xl font-bold">
                {formatearMoneda(totalPILA)}
              </p>
              <p className="text-dark-100 mt-1 text-xs">
                {
                  documentos.filter(
                    (d) => d.tipo === 'PILA' && d.anio === filtroAnio
                  ).length
                }{' '}
                comprobantes
              </p>
            </div>

            <div className="border-light-200 rounded-lg border-2 bg-white p-6 transition-colors hover:border-primary">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-dark-100 text-sm font-medium">
                  Facturas {filtroAnio}
                </span>
                <span className="material-symbols-outlined text-2xl text-primary">
                  receipt_long
                </span>
              </div>
              <p className="text-dark text-2xl font-bold">
                {formatearMoneda(totalFacturas)}
              </p>
              <p className="text-dark-100 mt-1 text-xs">
                {
                  documentos.filter(
                    (d) => d.tipo === 'FACTURA' && d.anio === filtroAnio
                  ).length
                }{' '}
                facturas
              </p>
            </div>

            <div className="border-light-200 rounded-lg border-2 bg-white p-6 transition-colors hover:border-primary">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-dark-100 text-sm font-medium">
                  Total Documentos
                </span>
                <span className="material-symbols-outlined text-2xl text-primary">
                  folder_open
                </span>
              </div>
              <p className="text-dark text-2xl font-bold">{totalDocumentos}</p>
              <p className="text-dark-100 mt-1 text-xs">
                {filtroTipo === 'TODOS' ? 'Todos los tipos' : filtroTipo}
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="border-light-200 mb-6 rounded-lg border-2 bg-white p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  Tipo de Documento
                </label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="border-light-200 w-full rounded-lg border-2 px-4 py-2 transition-colors focus:border-primary focus:outline-none"
                >
                  <option value="TODOS">Todos los documentos</option>
                  <option value="PILA">Comprobantes PILA</option>
                  <option value="FACTURA">Facturas Electrónicas</option>
                </select>
              </div>

              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  Año
                </label>
                <select
                  value={filtroAnio}
                  onChange={(e) => setFiltroAnio(parseInt(e.target.value))}
                  className="border-light-200 w-full rounded-lg border-2 px-4 py-2 transition-colors focus:border-primary focus:outline-none"
                >
                  <option value={0}>Todos los años</option>
                  {aniosDisponibles.map((anio) => (
                    <option key={anio} value={anio}>
                      {anio}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={fetchTodosDocumentos}
                  className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary/90"
                >
                  Actualizar
                </button>
              </div>

              <div className="flex items-end gap-2">
                <Link
                  href="/pila/comprobantes"
                  className="flex-1 rounded-lg border-2 border-primary px-4 py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  Ver solo PILA
                </Link>
                <Link
                  href="/facturacion/facturas"
                  className="flex-1 rounded-lg border-2 border-primary px-4 py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  Ver solo Facturas
                </Link>
              </div>
            </div>
          </div>

          {/* Lista de documentos por mes */}
          {mesesOrdenados.length === 0 ? (
            <div className="border-light-200 rounded-lg border-2 bg-white p-12 text-center">
              <span className="material-symbols-outlined text-dark-100 mb-4 text-6xl">
                folder_off
              </span>
              <h3 className="text-dark mb-2 text-xl font-semibold">
                No hay documentos
              </h3>
              <p className="text-dark-100 mb-6">
                {filtroTipo !== 'TODOS' ||
                filtroAnio !== new Date().getFullYear()
                  ? 'No se encontraron documentos con los filtros aplicados'
                  : 'Comienza creando tu primera liquidación PILA o factura'}
              </p>
              <div className="flex justify-center gap-4">
                <Link
                  href="/pila/liquidar"
                  className="rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90"
                >
                  Liquidar PILA
                </Link>
                <Link
                  href="/facturacion/nueva"
                  className="rounded-lg border-2 border-primary px-6 py-3 font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  Nueva Factura
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {mesesOrdenados.map((mesKey) => {
                const [anio = '2025', mes = '01'] = mesKey.split('-')
                const documentosDelMes = documentosPorMes[mesKey] || []
                const isAbierto = mesAbierto === mesKey

                const pilaCount = documentosDelMes.filter(
                  (d) => d.tipo === 'PILA'
                ).length
                const facturaCount = documentosDelMes.filter(
                  (d) => d.tipo === 'FACTURA'
                ).length

                return (
                  <div
                    key={mesKey}
                    className="border-light-200 overflow-hidden rounded-lg border-2 bg-white transition-colors hover:border-primary"
                  >
                    {/* Header del acordeón */}
                    <button
                      onClick={() => setMesAbierto(isAbierto ? null : mesKey)}
                      className="hover:bg-light-50 flex w-full items-center justify-between px-6 py-4 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-3xl text-primary">
                          folder_open
                        </span>
                        <div className="text-left">
                          <h3 className="text-dark font-semibold">
                            {formatearPeriodo(parseInt(mes), parseInt(anio))}
                          </h3>
                          <p className="text-dark-100 text-sm">
                            {documentosDelMes.length} documento(s): {pilaCount}{' '}
                            PILA, {facturaCount} Facturas
                          </p>
                        </div>
                      </div>
                      <span
                        className={`material-symbols-outlined text-dark-100 transition-transform ${
                          isAbierto ? 'rotate-180' : ''
                        }`}
                      >
                        expand_more
                      </span>
                    </button>

                    {/* Contenido del acordeón */}
                    {isAbierto && (
                      <div className="border-light-200 border-t-2">
                        {documentosDelMes.map((doc) => {
                          if (doc.tipo === 'PILA') {
                            const aporte = doc as Aporte
                            return (
                              <div
                                key={`pila-${aporte.id}`}
                                className="border-light-100 hover:bg-light-50 border-b px-6 py-4 transition-colors last:border-b-0"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-1 items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                      <span className="material-symbols-outlined text-primary">
                                        calculate
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="mb-1 flex items-center gap-2">
                                        <h4 className="text-dark font-semibold">
                                          Comprobante PILA - {aporte.periodo}
                                        </h4>
                                        <span
                                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                            aporte.estado === 'PAGADO'
                                              ? 'bg-success-light text-success-text-light'
                                              : aporte.estado === 'VENCIDO'
                                                ? 'bg-error-light text-error-text-light'
                                                : 'bg-warning-light text-warning-text-light'
                                          }`}
                                        >
                                          {aporte.estado}
                                        </span>
                                      </div>
                                      <div className="text-dark-100 flex gap-4 text-sm">
                                        <span>
                                          IBC: {formatearMoneda(aporte.ibc)}
                                        </span>
                                        <span>
                                          Total:{' '}
                                          <strong className="text-dark">
                                            {formatearMoneda(aporte.total)}
                                          </strong>
                                        </span>
                                        {aporte.fechaPago && (
                                          <span>
                                            Pagado:{' '}
                                            {new Date(
                                              aporte.fechaPago
                                            ).toLocaleDateString('es-CO')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {aporte.estado === 'PAGADO' &&
                                      aporte.comprobantePDF && (
                                        <>
                                          <button
                                            onClick={() =>
                                              window.open(
                                                aporte.comprobantePDF!,
                                                '_blank'
                                              )
                                            }
                                            className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                                            title="Ver PDF"
                                          >
                                            <span className="material-symbols-outlined">
                                              visibility
                                            </span>
                                          </button>
                                          <button
                                            onClick={() => {
                                              const link =
                                                document.createElement('a')
                                              link.href = aporte.comprobantePDF!
                                              link.download = `comprobante-pila-${aporte.periodo}.pdf`
                                              link.click()
                                            }}
                                            className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                                            title="Descargar PDF"
                                          >
                                            <span className="material-symbols-outlined">
                                              download
                                            </span>
                                          </button>
                                        </>
                                      )}
                                    {aporte.estado === 'PENDIENTE' && (
                                      <Link
                                        href={`/pila/liquidar?aporte=${aporte.id}`}
                                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                                      >
                                        Ir a pagar
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          } else {
                            const factura = doc as Factura
                            return (
                              <div
                                key={`factura-${factura.id}`}
                                className="border-light-100 hover:bg-light-50 border-b px-6 py-4 transition-colors last:border-b-0"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-1 items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                      <span className="material-symbols-outlined text-primary">
                                        receipt_long
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="mb-1 flex items-center gap-2">
                                        <h4 className="text-dark font-semibold">
                                          Factura #{factura.numeroFactura}
                                        </h4>
                                        <span
                                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                            factura.estado === 'PAGADA'
                                              ? 'bg-success-light text-success-text-light'
                                              : factura.estado === 'VENCIDA'
                                                ? 'bg-error-light text-error-text-light'
                                                : factura.estado === 'ANULADA'
                                                  ? 'bg-dark-100/20 text-dark-100'
                                                  : 'bg-warning-light text-warning-text-light'
                                          }`}
                                        >
                                          {factura.estado}
                                        </span>
                                      </div>
                                      <div className="text-dark-100 flex gap-4 text-sm">
                                        <span>
                                          Cliente: {factura.cliente.nombre}
                                        </span>
                                        <span>
                                          Total:{' '}
                                          <strong className="text-dark">
                                            {formatearMoneda(factura.total)}
                                          </strong>
                                        </span>
                                        <span>
                                          Emisión:{' '}
                                          {new Date(
                                            factura.fechaEmision
                                          ).toLocaleDateString('es-CO')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {factura.pdfUrl && (
                                      <>
                                        <button
                                          onClick={() =>
                                            window.open(
                                              factura.pdfUrl!,
                                              '_blank'
                                            )
                                          }
                                          className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                                          title="Ver PDF"
                                        >
                                          <span className="material-symbols-outlined">
                                            visibility
                                          </span>
                                        </button>
                                        <button
                                          onClick={() => {
                                            const link =
                                              document.createElement('a')
                                            link.href = factura.pdfUrl!
                                            link.download = `factura-${factura.numeroFactura}.pdf`
                                            link.click()
                                          }}
                                          className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                                          title="Descargar PDF"
                                        >
                                          <span className="material-symbols-outlined">
                                            download
                                          </span>
                                        </button>
                                      </>
                                    )}
                                    {factura.xmlUrl && (
                                      <button
                                        onClick={() => {
                                          const link =
                                            document.createElement('a')
                                          link.href = factura.xmlUrl!
                                          link.download = `factura-${factura.numeroFactura}.xml`
                                          link.click()
                                        }}
                                        className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                                        title="Descargar XML"
                                      >
                                        <span className="material-symbols-outlined">
                                          code
                                        </span>
                                      </button>
                                    )}
                                    <Link
                                      href={`/facturacion/facturas/${factura.id}`}
                                      className="rounded-lg border-2 border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                                    >
                                      Ver detalles
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            )
                          }
                        })}
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
