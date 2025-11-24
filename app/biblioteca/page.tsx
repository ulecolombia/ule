/**
 * ULE - BIBLIOTECA DE ARCHIVOS UNIFICADA V2
 * Sistema centralizado con documentos automáticos y manuales
 */

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Header } from '@/components/layout/Header'
import { formatearMoneda } from '@/lib/calculadora-pila'

// ============================================
// INTERFACES
// ============================================

interface Documento {
  id: string
  tipo: string
  categoria: string
  nombre: string
  rutaArchivo: string
  tipoMIME: string
  tamanoBytes: number
  periodo: string | null
  mes: number | null
  anio: number | null
  etiquetas: string[]
  descripcion: string | null
  createdAt: string
  updatedAt: string
}

interface Estadisticas {
  total: number
  porTipo: Array<{ tipo: string; _count: number }>
  porCategoria: Array<{ categoria: string; _count: number }>
  tamanioTotal: number
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function BibliotecaPage() {
  const { data: session } = useSession()
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [vistaActual, setVistaActual] = useState<
    'todos' | 'pila' | 'facturas' | 'otros'
  >('todos')
  const [anioFiltro, setAnioFiltro] = useState<number>(new Date().getFullYear())
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS')

  // ============================================
  // FETCH DOCUMENTOS
  // ============================================

  useEffect(() => {
    fetchDocumentos()
  }, [vistaActual, anioFiltro, categoriaFiltro])

  const fetchDocumentos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (anioFiltro > 0) params.append('anio', anioFiltro.toString())
      if (categoriaFiltro !== 'TODAS')
        params.append('categoria', categoriaFiltro)

      // Filtrar por tipo según vista
      if (vistaActual === 'pila') {
        params.append('tipo', 'COMPROBANTE_PILA')
      } else if (vistaActual === 'facturas') {
        params.append('tipo', 'FACTURA_EMITIDA')
      } else if (vistaActual === 'otros') {
        params.append('tipo', 'FACTURA_RECIBIDA')
      }

      const response = await fetch(
        `/api/biblioteca/documentos?${params.toString()}`
      )

      if (response.ok) {
        const data = await response.json()
        setDocumentos(data.documentos || [])
        setEstadisticas(data.estadisticas || null)
      } else {
        toast.error('Error al cargar documentos')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar documentos')
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  // Agrupar documentos por período
  const documentosPorPeriodo = documentos.reduce(
    (acc, doc) => {
      const key = doc.periodo || 'Sin período'
      if (!acc[key]) acc[key] = []
      acc[key].push(doc)
      return acc
    },
    {} as Record<string, Documento[]>
  )

  const periodos = Object.keys(documentosPorPeriodo).sort((a, b) =>
    b.localeCompare(a)
  )

  // Iconos por tipo
  const getIcono = (tipo: string) => {
    const iconos: Record<string, string> = {
      COMPROBANTE_PILA: '💰',
      FACTURA_EMITIDA: '📄',
      FACTURA_RECIBIDA: '🧾',
      CERTIFICADO: '🎓',
      CONTRATO: '📋',
      OTRO: '📎',
    }
    return iconos[tipo] || '📁'
  }

  // Color por categoría
  const getColorCategoria = (categoria: string) => {
    const colores: Record<string, string> = {
      SEGURIDAD_SOCIAL: 'bg-blue-100 text-blue-700',
      FACTURACION: 'bg-green-100 text-green-700',
      GASTOS: 'bg-orange-100 text-orange-700',
      INGRESOS: 'bg-teal-100 text-teal-700',
      CONTRATOS: 'bg-purple-100 text-purple-700',
      DECLARACION_RENTA: 'bg-red-100 text-red-700',
      OTROS: 'bg-gray-100 text-gray-700',
    }
    return colores[categoria] || 'bg-gray-100 text-gray-700'
  }

  // Formatear tamaño
  const formatearTamano = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-7xl p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/3 rounded bg-gray-200"></div>
            <div className="h-64 rounded bg-gray-200"></div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="bg-light-50 min-h-screen">
        <div className="mx-auto max-w-7xl p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-dark mb-2 text-3xl font-bold">
              Biblioteca de Archivos
            </h1>
            <p className="text-dark-100">
              Todos tus documentos organizados en un solo lugar
            </p>
          </div>

          {/* Estadísticas */}
          {estadisticas && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-dark-100 text-sm">Total Documentos</p>
                <p className="text-dark text-2xl font-bold">
                  {estadisticas.total}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-dark-100 text-sm">Espacio Usado</p>
                <p className="text-dark text-2xl font-bold">
                  {formatearTamano(estadisticas.tamanioTotal)}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-dark-100 text-sm">Este Año</p>
                <p className="text-dark text-2xl font-bold">
                  {documentos.filter((d) => d.anio === anioFiltro).length}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-dark-100 text-sm">Este Mes</p>
                <p className="text-dark text-2xl font-bold">
                  {
                    documentos.filter(
                      (d) => d.mes === new Date().getMonth() + 1
                    ).length
                  }
                </p>
              </div>
            </div>
          )}

          {/* Pestañas de Vista */}
          <div className="mb-6 flex flex-wrap gap-2 rounded-lg bg-white p-1 shadow-sm">
            <button
              onClick={() => setVistaActual('todos')}
              className={`flex-1 rounded-md px-4 py-2 font-medium transition-colors ${
                vistaActual === 'todos'
                  ? 'bg-primary text-white'
                  : 'text-dark-100 hover:bg-light-100'
              }`}
            >
              📚 Todos
            </button>
            <button
              onClick={() => setVistaActual('pila')}
              className={`flex-1 rounded-md px-4 py-2 font-medium transition-colors ${
                vistaActual === 'pila'
                  ? 'bg-primary text-white'
                  : 'text-dark-100 hover:bg-light-100'
              }`}
            >
              💰 PILA
            </button>
            <button
              onClick={() => setVistaActual('facturas')}
              className={`flex-1 rounded-md px-4 py-2 font-medium transition-colors ${
                vistaActual === 'facturas'
                  ? 'bg-primary text-white'
                  : 'text-dark-100 hover:bg-light-100'
              }`}
            >
              📄 Facturas
            </button>
            <button
              onClick={() => setVistaActual('otros')}
              className={`flex-1 rounded-md px-4 py-2 font-medium transition-colors ${
                vistaActual === 'otros'
                  ? 'bg-primary text-white'
                  : 'text-dark-100 hover:bg-light-100'
              }`}
            >
              🧾 Otros
            </button>
          </div>

          {/* Filtros */}
          <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  Año
                </label>
                <select
                  value={anioFiltro}
                  onChange={(e) => setAnioFiltro(parseInt(e.target.value))}
                  className="border-light-200 w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-primary"
                >
                  <option value={0}>Todos los años</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                  <option value={2023}>2023</option>
                </select>
              </div>

              {vistaActual === 'todos' && (
                <div>
                  <label className="text-dark mb-2 block text-sm font-medium">
                    Categoría
                  </label>
                  <select
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    className="border-light-200 w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-primary"
                  >
                    <option value="TODAS">Todas las categorías</option>
                    <option value="SEGURIDAD_SOCIAL">Seguridad Social</option>
                    <option value="FACTURACION">Facturación</option>
                    <option value="GASTOS">Gastos</option>
                    <option value="DECLARACION_RENTA">
                      Declaración de Renta
                    </option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Lista de Documentos */}
          {periodos.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow-sm">
              <span className="mb-4 block text-6xl">📭</span>
              <h3 className="text-dark mb-2 text-xl font-semibold">
                No hay documentos
              </h3>
              <p className="text-dark-100 mb-6">
                Aún no tienes documentos en esta vista
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {periodos.map((periodo) => {
                const docs = documentosPorPeriodo[periodo]

                return (
                  <div
                    key={periodo}
                    className="overflow-hidden rounded-lg bg-white shadow-sm"
                  >
                    <div className="border-light-200 bg-light-50 border-b px-6 py-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-dark font-semibold">
                          📁 {periodo}
                        </h3>
                        <span className="text-dark-100 text-sm">
                          {docs.length} documento{docs.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="divide-light-100 divide-y">
                      {docs.map((doc) => (
                        <div
                          key={doc.id}
                          className="hover:bg-light-50 px-6 py-4 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-1 items-center space-x-4">
                              <span className="text-3xl">
                                {getIcono(doc.tipo)}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center space-x-2">
                                  <h4 className="text-dark truncate font-semibold">
                                    {doc.nombre}
                                  </h4>
                                  <span
                                    className={`rounded-full px-2 py-1 text-xs ${getColorCategoria(doc.categoria)}`}
                                  >
                                    {doc.categoria.replace('_', ' ')}
                                  </span>
                                </div>

                                {doc.etiquetas.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {doc.etiquetas.map((etiqueta, idx) => (
                                      <span
                                        key={idx}
                                        className="text-dark-100 rounded bg-gray-100 px-2 py-0.5 text-xs"
                                      >
                                        {etiqueta}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <p className="text-dark-100 mt-1 text-xs">
                                  {new Date(doc.createdAt).toLocaleDateString(
                                    'es-CO'
                                  )}{' '}
                                  • {formatearTamano(doc.tamanoBytes)}
                                </p>
                              </div>
                            </div>

                            {/* Acciones */}
                            <div className="ml-4 flex space-x-2">
                              <button
                                onClick={() =>
                                  window.open(doc.rutaArchivo, '_blank')
                                }
                                className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                                title="Ver documento"
                              >
                                <span className="material-symbols-outlined">
                                  visibility
                                </span>
                              </button>
                              <a
                                href={doc.rutaArchivo}
                                download={doc.nombre}
                                className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                title="Descargar"
                              >
                                <span className="material-symbols-outlined">
                                  download
                                </span>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
