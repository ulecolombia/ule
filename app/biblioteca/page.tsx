/**
 * ULE - BIBLIOTECA DE ARCHIVOS UNIFICADA
 * Centraliza todos los documentos: comprobantes PILA, facturas y archivos mensuales
 */

'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
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
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-3 text-3xl font-bold text-dark tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-primary">
              folder_open
            </span>
            Biblioteca de Archivos
          </h1>
          <p className="text-dark-100 font-medium">
            Todos tus documentos: comprobantes PILA, facturas electrónicas y archivos mensuales
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border-2 border-light-200 p-6 hover:border-primary transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-dark-100">
                PILA {filtroAnio}
              </span>
              <span className="material-symbols-outlined text-2xl text-primary">
                calculate
              </span>
            </div>
            <p className="text-2xl font-bold text-dark">
              {formatearMoneda(totalPILA)}
            </p>
            <p className="text-xs text-dark-100 mt-1">
              {documentos.filter((d) => d.tipo === 'PILA' && d.anio === filtroAnio).length} comprobantes
            </p>
          </div>

          <div className="bg-white rounded-lg border-2 border-light-200 p-6 hover:border-primary transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-dark-100">
                Facturas {filtroAnio}
              </span>
              <span className="material-symbols-outlined text-2xl text-primary">
                receipt_long
              </span>
            </div>
            <p className="text-2xl font-bold text-dark">
              {formatearMoneda(totalFacturas)}
            </p>
            <p className="text-xs text-dark-100 mt-1">
              {documentos.filter((d) => d.tipo === 'FACTURA' && d.anio === filtroAnio).length} facturas
            </p>
          </div>

          <div className="bg-white rounded-lg border-2 border-light-200 p-6 hover:border-primary transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-dark-100">
                Total Documentos
              </span>
              <span className="material-symbols-outlined text-2xl text-primary">
                folder_open
              </span>
            </div>
            <p className="text-2xl font-bold text-dark">{totalDocumentos}</p>
            <p className="text-xs text-dark-100 mt-1">
              {filtroTipo === 'TODOS' ? 'Todos los tipos' : filtroTipo}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg border-2 border-light-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Tipo de Documento
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-4 py-2 border-2 border-light-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
              >
                <option value="TODOS">Todos los documentos</option>
                <option value="PILA">Comprobantes PILA</option>
                <option value="FACTURA">Facturas Electrónicas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Año
              </label>
              <select
                value={filtroAnio}
                onChange={(e) => setFiltroAnio(parseInt(e.target.value))}
                className="w-full px-4 py-2 border-2 border-light-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
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
                className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Actualizar
              </button>
            </div>

            <div className="flex items-end gap-2">
              <Link
                href="/pila/comprobantes"
                className="flex-1 border-2 border-primary text-primary py-2 px-4 rounded-lg hover:bg-primary hover:text-white transition-colors font-medium text-center text-sm"
              >
                Ver solo PILA
              </Link>
              <Link
                href="/facturacion/facturas"
                className="flex-1 border-2 border-primary text-primary py-2 px-4 rounded-lg hover:bg-primary hover:text-white transition-colors font-medium text-center text-sm"
              >
                Ver solo Facturas
              </Link>
            </div>
          </div>
        </div>

        {/* Lista de documentos por mes */}
        {mesesOrdenados.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-light-200 p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-dark-100 mb-4">
              folder_off
            </span>
            <h3 className="text-xl font-semibold text-dark mb-2">
              No hay documentos
            </h3>
            <p className="text-dark-100 mb-6">
              {filtroTipo !== 'TODOS' || filtroAnio !== new Date().getFullYear()
                ? 'No se encontraron documentos con los filtros aplicados'
                : 'Comienza creando tu primera liquidación PILA o factura'}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/pila/liquidar"
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Liquidar PILA
              </Link>
              <Link
                href="/facturacion/nueva"
                className="border-2 border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition-colors font-medium"
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

              const pilaCount = documentosDelMes.filter((d) => d.tipo === 'PILA').length
              const facturaCount = documentosDelMes.filter((d) => d.tipo === 'FACTURA').length

              return (
                <div
                  key={mesKey}
                  className="bg-white rounded-lg border-2 border-light-200 overflow-hidden hover:border-primary transition-colors"
                >
                  {/* Header del acordeón */}
                  <button
                    onClick={() => setMesAbierto(isAbierto ? null : mesKey)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-light-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-3xl text-primary">
                        folder_open
                      </span>
                      <div className="text-left">
                        <h3 className="font-semibold text-dark">
                          {formatearPeriodo(parseInt(mes), parseInt(anio))}
                        </h3>
                        <p className="text-sm text-dark-100">
                          {documentosDelMes.length} documento(s): {pilaCount} PILA, {facturaCount} Facturas
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
                    <div className="border-t-2 border-light-200">
                      {documentosDelMes.map((doc) => {
                        if (doc.tipo === 'PILA') {
                          const aporte = doc as Aporte
                          return (
                            <div
                              key={`pila-${aporte.id}`}
                              className="px-6 py-4 border-b border-light-100 last:border-b-0 hover:bg-light-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <span className="material-symbols-outlined text-primary">
                                      calculate
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-dark">
                                        Comprobante PILA - {aporte.periodo}
                                      </h4>
                                      <span
                                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${
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
                                    <div className="flex gap-4 text-sm text-dark-100">
                                      <span>IBC: {formatearMoneda(aporte.ibc)}</span>
                                      <span>Total: <strong className="text-dark">{formatearMoneda(aporte.total)}</strong></span>
                                      {aporte.fechaPago && (
                                        <span>
                                          Pagado: {new Date(aporte.fechaPago).toLocaleDateString('es-CO')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {aporte.estado === 'PAGADO' && aporte.comprobantePDF && (
                                    <>
                                      <button
                                        onClick={() => window.open(aporte.comprobantePDF!, '_blank')}
                                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        title="Ver PDF"
                                      >
                                        <span className="material-symbols-outlined">visibility</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          const link = document.createElement('a')
                                          link.href = aporte.comprobantePDF!
                                          link.download = `comprobante-pila-${aporte.periodo}.pdf`
                                          link.click()
                                        }}
                                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        title="Descargar PDF"
                                      >
                                        <span className="material-symbols-outlined">download</span>
                                      </button>
                                    </>
                                  )}
                                  {aporte.estado === 'PENDIENTE' && (
                                    <Link
                                      href={`/pila/liquidar?aporte=${aporte.id}`}
                                      className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors font-medium"
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
                              className="px-6 py-4 border-b border-light-100 last:border-b-0 hover:bg-light-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <span className="material-symbols-outlined text-primary">
                                      receipt_long
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-dark">
                                        Factura #{factura.numeroFactura}
                                      </h4>
                                      <span
                                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${
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
                                    <div className="flex gap-4 text-sm text-dark-100">
                                      <span>Cliente: {factura.cliente.nombre}</span>
                                      <span>Total: <strong className="text-dark">{formatearMoneda(factura.total)}</strong></span>
                                      <span>
                                        Emisión: {new Date(factura.fechaEmision).toLocaleDateString('es-CO')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {factura.pdfUrl && (
                                    <>
                                      <button
                                        onClick={() => window.open(factura.pdfUrl!, '_blank')}
                                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        title="Ver PDF"
                                      >
                                        <span className="material-symbols-outlined">visibility</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          const link = document.createElement('a')
                                          link.href = factura.pdfUrl!
                                          link.download = `factura-${factura.numeroFactura}.pdf`
                                          link.click()
                                        }}
                                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        title="Descargar PDF"
                                      >
                                        <span className="material-symbols-outlined">download</span>
                                      </button>
                                    </>
                                  )}
                                  {factura.xmlUrl && (
                                    <button
                                      onClick={() => {
                                        const link = document.createElement('a')
                                        link.href = factura.xmlUrl!
                                        link.download = `factura-${factura.numeroFactura}.xml`
                                        link.click()
                                      }}
                                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                      title="Descargar XML"
                                    >
                                      <span className="material-symbols-outlined">code</span>
                                    </button>
                                  )}
                                  <Link
                                    href={`/facturacion/facturas/${factura.id}`}
                                    className="px-4 py-2 border-2 border-primary text-primary text-sm rounded-lg hover:bg-primary hover:text-white transition-colors font-medium"
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
  )
}
