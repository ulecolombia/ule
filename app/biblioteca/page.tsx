/**
 * ULE - BIBLIOTECA DE ARCHIVOS UNIFICADA V2
 * Sistema centralizado con documentos automáticos y manuales
 */

'use client'

import { useEffect, useState, useRef } from 'react'
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
  const [initialLoading, setInitialLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const [vistaActual, setVistaActual] = useState<
    'todos' | 'pila' | 'facturas' | 'otros'
  >('todos')
  const [anioFiltro, setAnioFiltro] = useState<number>(new Date().getFullYear())
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS')

  // Estado para subida de archivos
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [tipoDocumento, setTipoDocumento] = useState<string>('FACTURA_RECIBIDA')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado para selección y eliminación de documentos
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)

  // Estado para exportación
  const [exporting, setExporting] = useState(false)

  // ============================================
  // FETCH DOCUMENTOS
  // ============================================

  const fetchDocumentos = async () => {
    // Solo mostrar skeleton en carga inicial
    if (initialLoading) {
      setInitialLoading(true)
    } else {
      // Fade out antes de cargar
      setFadeOut(true)
      setFetching(true)
      // Esperar un poco para que se vea el fade
      await new Promise((resolve) => setTimeout(resolve, 150))
    }

    try {
      const params = new URLSearchParams()
      if (anioFiltro > 0) params.append('anio', anioFiltro.toString())
      if (categoriaFiltro !== 'TODAS')
        params.append('categoria', categoriaFiltro)

      // Filtrar por tipo según vista
      if (vistaActual === 'pila') {
        params.append('tipo', 'COMPROBANTE_PILA')
      } else if (vistaActual === 'facturas') {
        // Facturas incluye tanto emitidas como recibidas
        // Se manejará en el backend
        params.append('categoria', 'FACTURACION,GASTOS')
      } else if (vistaActual === 'otros') {
        // Otros incluye certificados, contratos y otros archivos
        params.append('categoria', 'OTROS,CERTIFICACIONES,CONTRATOS')
      }

      const response = await fetch(
        `/api/biblioteca/documentos?${params.toString()}`
      )

      if (response.ok) {
        const data = await response.json()
        setDocumentos(data.documentos || [])
        setEstadisticas(data.estadisticas || null)

        // Fade in después de cargar
        if (!initialLoading) {
          await new Promise((resolve) => setTimeout(resolve, 50))
          setFadeOut(false)
        }
      } else {
        toast.error('Error al cargar documentos')
        setFadeOut(false)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar documentos')
      setFadeOut(false)
    } finally {
      setInitialLoading(false)
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchDocumentos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vistaActual, anioFiltro, categoriaFiltro])

  // ============================================
  // SUBIDA DE ARCHIVOS
  // ============================================

  const handleFileUpload = async (file: File) => {
    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos PDF o JPG')
      return
    }

    // Validar tamaño (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('El archivo excede el tamaño máximo de 10MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tipo', tipoDocumento)

      const response = await fetch('/api/biblioteca/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir archivo')
      }

      toast.success('Archivo subido exitosamente')

      // Cerrar modal y recargar documentos
      setModalOpen(false)
      await fetchDocumentos()
    } catch (error) {
      console.error('Error al subir archivo:', error)
      toast.error(
        error instanceof Error ? error.message : 'Error al subir archivo'
      )
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileUpload(files[0])
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileUpload(files[0])
    }
    // Limpiar el input para permitir subir el mismo archivo de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  // ============================================
  // SELECCIÓN Y ELIMINACIÓN
  // ============================================

  const toggleSelectDoc = (docId: string) => {
    setSelectedDocs((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(docId)) {
        newSet.delete(docId)
      } else {
        newSet.add(docId)
      }
      return newSet
    })
  }

  const selectAllDocs = () => {
    const allDocIds = documentos.map((doc) => doc.id)
    setSelectedDocs(new Set(allDocIds))
  }

  const deselectAllDocs = () => {
    setSelectedDocs(new Set())
  }

  const handleDeleteSingle = async (docId: string, docName: string) => {
    if (
      !confirm(
        `¿Estás seguro que quieres eliminar "${docName}"?\n\nUna vez eliminado, no podrás recuperar el documento.`
      )
    ) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/biblioteca/documentos/${docId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar documento')
      }

      toast.success('Documento eliminado exitosamente')
      await fetchDocumentos()
    } catch (error) {
      console.error('Error al eliminar documento:', error)
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar documento'
      )
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedDocs.size === 0) return

    if (
      !confirm(
        `¿Estás seguro que quieres eliminar ${selectedDocs.size} documento${selectedDocs.size > 1 ? 's' : ''}?\n\nUna vez eliminados, no podrás recuperar los documentos.`
      )
    ) {
      return
    }

    setDeleting(true)

    try {
      // Eliminar cada documento seleccionado
      const deletePromises = Array.from(selectedDocs).map((docId) =>
        fetch(`/api/biblioteca/documentos/${docId}`, {
          method: 'DELETE',
        })
      )

      const results = await Promise.all(deletePromises)

      const failed = results.filter((r) => !r.ok)
      if (failed.length > 0) {
        throw new Error(`${failed.length} documento(s) no se pudieron eliminar`)
      }

      toast.success(
        `${selectedDocs.size} documento${selectedDocs.size > 1 ? 's' : ''} eliminado${selectedDocs.size > 1 ? 's' : ''} exitosamente`
      )

      // Limpiar selección, salir del modo selección y recargar
      setSelectedDocs(new Set())
      setSelectionMode(false)
      await fetchDocumentos()
    } catch (error) {
      console.error('Error al eliminar documentos:', error)
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar documentos'
      )
    } finally {
      setDeleting(false)
    }
  }

  const toggleSelectionMode = () => {
    if (selectionMode) {
      // Salir del modo selección
      setSelectedDocs(new Set())
      setSelectionMode(false)
    } else {
      // Entrar al modo selección
      setSelectionMode(true)
    }
  }

  // ============================================
  // EXPORTACIÓN A ZIP
  // ============================================

  const handleExportZip = async () => {
    if (documentos.length === 0) {
      toast.error('No hay documentos para exportar')
      return
    }

    setExporting(true)

    try {
      const response = await fetch('/api/biblioteca/export', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Error al exportar documentos')
      }

      // Descargar el archivo ZIP
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `documentos-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Documentos exportados exitosamente')
    } catch (error) {
      console.error('Error al exportar documentos:', error)
      toast.error(
        error instanceof Error ? error.message : 'Error al exportar documentos'
      )
    } finally {
      setExporting(false)
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

  // Formatear período para mostrar
  const formatearPeriodo = (periodo: string) => {
    if (!periodo || periodo === 'Sin período') return 'Sin período'

    // Formato: "2025-01" -> "Enero 2025"
    const [anio, mes] = periodo.split('-')
    if (!anio || !mes) return periodo

    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ]

    const mesNum = parseInt(mes)
    const nombreMes = meses[mesNum - 1] || mes

    return `${nombreMes} ${anio}`
  }

  // Iconos por tipo
  const getIcono = (tipo: string) => {
    const iconos: Record<string, string> = {
      COMPROBANTE_PILA: '💰',
      FACTURA_EMITIDA: '📄',
      FACTURA_RECIBIDA: '🧾',
      CERTIFICADO: '📜',
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
      CERTIFICACIONES: 'bg-yellow-100 text-yellow-700',
      CONTRATOS: 'bg-purple-100 text-purple-700',
      DECLARACION_RENTA: 'bg-red-100 text-red-700',
      OTROS: 'bg-gray-100 text-gray-700',
    }
    return colores[categoria] || 'bg-gray-100 text-gray-700'
  }

  // Formatear tamaño con nombre completo de unidad (para estadísticas)
  const formatearTamanoCompleto = (bytes: number) => {
    if (bytes === 0) return { valor: '0', unidad: 'Bytes' }
    if (bytes < 1024)
      return { valor: bytes.toString(), unidad: bytes === 1 ? 'Byte' : 'Bytes' }
    if (bytes < 1024 * 1024) {
      return { valor: (bytes / 1024).toFixed(2), unidad: 'Kilobytes' }
    }
    if (bytes < 1024 * 1024 * 1024) {
      return { valor: (bytes / (1024 * 1024)).toFixed(2), unidad: 'Megabytes' }
    }
    return {
      valor: (bytes / (1024 * 1024 * 1024)).toFixed(2),
      unidad: 'Gigabytes',
    }
  }

  // Formatear tamaño compacto (para lista de documentos)
  const formatearTamano = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    if (bytes < 1024) return `${bytes} ${bytes === 1 ? 'Byte' : 'Bytes'}`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  // ============================================
  // RENDER
  // ============================================

  if (initialLoading) {
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
      <div className="bg-light-50 relative min-h-screen">
        <div className="relative mx-auto max-w-7xl p-6">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-dark mb-2 text-3xl font-bold">
                Biblioteca de Archivos
              </h1>
              <p className="text-dark-100">
                Todos tus documentos organizados en un solo lugar
              </p>
            </div>

            {/* Botón Exportar ZIP */}
            {documentos.length > 0 && (
              <button
                onClick={handleExportZip}
                disabled={exporting}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xl">
                  {exporting ? 'hourglass_empty' : 'folder_zip'}
                </span>
                <span className="hidden sm:inline">
                  {exporting ? 'Exportando...' : 'Exportar ZIP'}
                </span>
              </button>
            )}
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
                <p className="text-dark-100 text-sm">Este Mes</p>
                <p className="text-dark text-2xl font-bold">
                  {
                    documentos.filter(
                      (d) => d.mes === new Date().getMonth() + 1
                    ).length
                  }
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-dark-100 text-sm">Este Año</p>
                <p className="text-dark text-2xl font-bold">
                  {documentos.filter((d) => d.anio === anioFiltro).length}
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-dark-100 mb-1 text-sm">Espacio Usado</p>
                <p className="text-dark text-2xl font-bold">
                  {formatearTamanoCompleto(estadisticas.tamanioTotal).valor}{' '}
                  <span className="text-dark-100 text-lg font-medium">
                    {formatearTamanoCompleto(estadisticas.tamanioTotal).unidad}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Pestañas de Vista */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between gap-4">
              <div className="relative flex flex-1 flex-wrap gap-2 rounded-lg bg-white p-1 shadow-sm">
                {fetching && (
                  <div className="absolute -top-1 right-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </div>
                )}
                <button
                  onClick={() => setVistaActual('todos')}
                  disabled={fetching}
                  className={`flex-1 rounded-md px-4 py-2 font-medium transition-colors ${
                    vistaActual === 'todos'
                      ? 'bg-primary text-white'
                      : 'text-dark-100 hover:bg-light-100'
                  } ${fetching ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  📚 Todos
                </button>
                <button
                  onClick={() => setVistaActual('pila')}
                  disabled={fetching}
                  className={`flex-1 rounded-md px-4 py-2 font-medium transition-colors ${
                    vistaActual === 'pila'
                      ? 'bg-primary text-white'
                      : 'text-dark-100 hover:bg-light-100'
                  } ${fetching ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  💰 PILA
                </button>
                <button
                  onClick={() => setVistaActual('facturas')}
                  disabled={fetching}
                  className={`flex-1 rounded-md px-4 py-2 font-medium transition-colors ${
                    vistaActual === 'facturas'
                      ? 'bg-primary text-white'
                      : 'text-dark-100 hover:bg-light-100'
                  } ${fetching ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  📄 Facturas
                </button>
                <button
                  onClick={() => setVistaActual('otros')}
                  disabled={fetching}
                  className={`flex-1 rounded-md px-4 py-2 font-medium transition-colors ${
                    vistaActual === 'otros'
                      ? 'bg-primary text-white'
                      : 'text-dark-100 hover:bg-light-100'
                  } ${fetching ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  🧾 Otros
                </button>
              </div>

              {/* Botón de acción */}
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
              >
                <span className="material-symbols-outlined text-xl">
                  upload_file
                </span>
                <span className="hidden sm:inline">Subir Archivo</span>
              </button>
            </div>
          </div>

          {/* Barra de acciones de selección */}
          {selectionMode && (
            <div className="mb-4 rounded-lg border-2 border-primary bg-primary/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-dark font-medium">
                    {selectedDocs.size > 0
                      ? `${selectedDocs.size} documento${selectedDocs.size > 1 ? 's' : ''} seleccionado${selectedDocs.size > 1 ? 's' : ''}`
                      : 'Modo selección activo'}
                  </span>
                  {selectedDocs.size > 0 && (
                    <button
                      onClick={deselectAllDocs}
                      className="text-dark-100 hover:text-dark text-sm transition-colors"
                    >
                      Deseleccionar todos
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={toggleSelectionMode}
                    className="text-dark flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 font-medium shadow-sm transition-all hover:bg-gray-300"
                  >
                    <span className="material-symbols-outlined text-xl">
                      close
                    </span>
                    Cancelar
                  </button>
                  {selectedDocs.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      disabled={deleting}
                      className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white shadow-sm transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-xl">
                        delete
                      </span>
                      {deleting ? 'Eliminando...' : 'Eliminar seleccionados'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botón "Seleccionar todos" en modo selección */}
          {selectionMode && documentos.length > 0 && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={selectAllDocs}
                className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Seleccionar todos
              </button>
            </div>
          )}

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
                    <option value="CERTIFICACIONES">Certificaciones</option>
                    <option value="CONTRATOS">Contratos</option>
                    <option value="OTROS">Otros</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Lista de Documentos */}
          <div
            className={`transition-all duration-200 ease-in-out ${
              fadeOut ? 'opacity-0' : 'opacity-100'
            }`}
          >
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
                            {formatearPeriodo(periodo)}
                          </h3>
                          <span className="text-dark-100 text-sm">
                            {docs.length} documento
                            {docs.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="divide-light-100 divide-y">
                        {docs.map((doc) => (
                          <div
                            key={doc.id}
                            className={`px-6 py-4 transition-colors ${
                              selectedDocs.has(doc.id)
                                ? 'bg-primary/5'
                                : 'hover:bg-light-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex flex-1 items-center space-x-4">
                                {/* Checkbox - Solo en modo selección */}
                                {selectionMode && (
                                  <input
                                    type="checkbox"
                                    checked={selectedDocs.has(doc.id)}
                                    onChange={() => toggleSelectDoc(doc.id)}
                                    className="h-5 w-5 cursor-pointer rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                                  />
                                )}

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
                                <button
                                  onClick={() => {
                                    if (!selectionMode) {
                                      // Activar modo selección y seleccionar este documento
                                      setSelectionMode(true)
                                      setSelectedDocs(new Set([doc.id]))
                                    }
                                  }}
                                  disabled={deleting}
                                  className={`rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                    selectionMode
                                      ? 'text-gray-400'
                                      : 'text-red-600 hover:bg-red-50'
                                  }`}
                                  title={
                                    selectionMode
                                      ? 'Usa los checkboxes para seleccionar'
                                      : 'Eliminar documento'
                                  }
                                >
                                  <span className="material-symbols-outlined">
                                    delete
                                  </span>
                                </button>
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
      </div>

      {/* Modal de Subida de Archivos */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !uploading && setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="border-light-200 flex items-center justify-between border-b p-6">
              <h2 className="text-dark text-xl font-semibold">Subir Archivo</h2>
              <button
                onClick={() => !uploading && setModalOpen(false)}
                disabled={uploading}
                className="text-dark-100 hover:bg-light-100 rounded-lg p-2 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              {/* Selector de tipo de documento */}
              <div className="mb-6">
                <label className="text-dark mb-3 block text-sm font-medium">
                  ¿Qué tipo de documento vas a subir?
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setTipoDocumento('FACTURA_RECIBIDA')}
                    className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                      tipoDocumento === 'FACTURA_RECIBIDA'
                        ? 'border-primary bg-primary/5'
                        : 'border-light-200 hover:border-primary/30'
                    }`}
                  >
                    <span className="text-2xl">📥</span>
                    <div className="flex-1">
                      <div className="text-dark font-medium">
                        Factura Recibida
                      </div>
                      <div className="text-dark-100 text-xs">
                        Gastos y proveedores
                      </div>
                    </div>
                    {tipoDocumento === 'FACTURA_RECIBIDA' && (
                      <span className="material-symbols-outlined text-primary">
                        check_circle
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoDocumento('CERTIFICADO')}
                    className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                      tipoDocumento === 'CERTIFICADO'
                        ? 'border-primary bg-primary/5'
                        : 'border-light-200 hover:border-primary/30'
                    }`}
                  >
                    <span className="text-2xl">📜</span>
                    <div className="flex-1">
                      <div className="text-dark font-medium">Certificados</div>
                      <div className="text-dark-100 text-xs">
                        Laborales, ingresos, etc.
                      </div>
                    </div>
                    {tipoDocumento === 'CERTIFICADO' && (
                      <span className="material-symbols-outlined text-primary">
                        check_circle
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoDocumento('CONTRATO')}
                    className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                      tipoDocumento === 'CONTRATO'
                        ? 'border-primary bg-primary/5'
                        : 'border-light-200 hover:border-primary/30'
                    }`}
                  >
                    <span className="text-2xl">📝</span>
                    <div className="flex-1">
                      <div className="text-dark font-medium">Contrato</div>
                      <div className="text-dark-100 text-xs">
                        Laborales o comerciales
                      </div>
                    </div>
                    {tipoDocumento === 'CONTRATO' && (
                      <span className="material-symbols-outlined text-primary">
                        check_circle
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoDocumento('OTRO')}
                    className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                      tipoDocumento === 'OTRO'
                        ? 'border-primary bg-primary/5'
                        : 'border-light-200 hover:border-primary/30'
                    }`}
                  >
                    <span className="text-2xl">📄</span>
                    <div className="flex-1">
                      <div className="text-dark font-medium">Otro</div>
                      <div className="text-dark-100 text-xs">
                        Cualquier otro documento
                      </div>
                    </div>
                    {tipoDocumento === 'OTRO' && (
                      <span className="material-symbols-outlined text-primary">
                        check_circle
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div
                onDrop={handleDrop}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onClick={openFileDialog}
                className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-all ${
                  dragActive
                    ? 'scale-[1.02] border-primary bg-primary/5'
                    : 'border-light-200 hover:bg-light-50 hover:border-primary/50'
                } ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <div className="p-8 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-full bg-primary/10 p-4">
                      <span className="material-symbols-outlined text-5xl text-primary">
                        {uploading ? 'hourglass_empty' : 'upload_file'}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-dark mb-2 text-lg font-semibold">
                    {uploading
                      ? 'Subiendo archivo...'
                      : dragActive
                        ? '¡Suelta el archivo aquí!'
                        : 'Arrastra tu archivo aquí'}
                  </h3>

                  <p className="text-dark-100 mb-4 text-sm">
                    {uploading
                      ? 'Por favor espera...'
                      : 'O haz clic para seleccionar un archivo'}
                  </p>

                  <div className="text-dark-100 flex flex-wrap justify-center gap-2 text-xs">
                    <span className="bg-light-100 rounded-full px-3 py-1">
                      📄 PDF
                    </span>
                    <span className="bg-light-100 rounded-full px-3 py-1">
                      🖼️ JPG
                    </span>
                    <span className="bg-light-100 rounded-full px-3 py-1">
                      📏 Máx. 10MB
                    </span>
                  </div>

                  {uploading && (
                    <div className="mt-4 flex justify-center">
                      <div className="bg-light-200 h-1 w-48 overflow-hidden rounded-full">
                        <div className="h-full w-full animate-pulse bg-primary"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Información adicional */}
              <div className="bg-light-50 mt-4 rounded-lg p-4">
                <p className="text-dark-100 text-sm">
                  <span className="text-dark font-medium">ℹ️ Nota:</span>{' '}
                  {tipoDocumento === 'FACTURA_RECIBIDA'
                    ? 'Este documento se guardará en la sección "Facturas" como factura recibida.'
                    : 'Este documento se guardará en la sección "Otros".'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
