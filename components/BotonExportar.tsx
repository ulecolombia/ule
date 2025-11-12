/**
 * COMPONENTE DE BOTÓN EXPORTAR
 * Botón reutilizable con dropdown para exportar datos en múltiples formatos
 */

'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface OpcionExportacion {
  formato: string
  label: string
  icono: string
  descripcion?: string
}

interface BotonExportarProps {
  tipo: 'pila' | 'facturas'
  filtros?: Record<string, any>
  opciones?: OpcionExportacion[]
  className?: string
}

/**
 * Opciones predeterminadas por tipo de exportación
 */
const OPCIONES_PREDETERMINADAS: Record<string, OpcionExportacion[]> = {
  pila: [
    {
      formato: 'excel',
      label: 'Excel',
      icono: 'table_chart',
      descripcion: 'Formato con estilos y colores',
    },
    {
      formato: 'csv',
      label: 'CSV',
      icono: 'description',
      descripcion: 'Formato simple para importar',
    },
    {
      formato: 'pdf',
      label: 'PDF',
      icono: 'picture_as_pdf',
      descripcion: 'Reporte imprimible',
    },
  ],
  facturas: [
    {
      formato: 'excel',
      label: 'Excel',
      icono: 'table_chart',
      descripcion: 'Resumen de facturas',
    },
    {
      formato: 'csv',
      label: 'CSV',
      icono: 'description',
      descripcion: 'Datos para contabilidad',
    },
    {
      formato: 'zip',
      label: 'ZIP',
      icono: 'folder_zip',
      descripcion: 'Todas las facturas PDF',
    },
  ],
}

/**
 * Componente de botón para exportar datos
 */
export function BotonExportar({
  tipo,
  filtros = {},
  opciones,
  className = '',
}: BotonExportarProps) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [exportando, setExportando] = useState(false)

  const opcionesMenu = opciones || OPCIONES_PREDETERMINADAS[tipo] || []

  /**
   * Maneja la exportación de datos
   */
  const handleExportar = async (formato: string) => {
    setMenuAbierto(false)
    setExportando(true)

    const toastId = toast.loading(`Generando archivo ${formato.toUpperCase()}...`)

    try {
      const endpoint =
        tipo === 'pila' ? '/api/exportar/pila' : '/api/exportar/facturas'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formato,
          ...filtros,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al generar exportación')
      }

      const data = await response.json()

      // Descargar el archivo automáticamente
      const link = document.createElement('a')
      link.href = data.exportacion.url
      link.download = data.exportacion.fileName
      link.click()

      toast.success('Exportación generada correctamente', {
        id: toastId,
        description: `El archivo ${formato.toUpperCase()} se descargó exitosamente`,
      })
    } catch (error) {
      console.error('[BotonExportar] Error:', error)
      toast.error('Error al generar exportación', {
        id: toastId,
        description:
          error instanceof Error ? error.message : 'Intenta nuevamente',
      })
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="relative inline-block">
      {/* Botón principal */}
      <button
        type="button"
        onClick={() => setMenuAbierto(!menuAbierto)}
        disabled={exportando}
        className={`flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <span className="material-symbols-outlined text-xl">
          {exportando ? 'sync' : 'download'}
        </span>
        <span>{exportando ? 'Exportando...' : 'Exportar'}</span>
        {!exportando && (
          <span className="material-symbols-outlined text-xl">
            {menuAbierto ? 'expand_less' : 'expand_more'}
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      {menuAbierto && !exportando && (
        <>
          {/* Overlay para cerrar al hacer click fuera */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setMenuAbierto(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-lg border border-light-200 bg-white shadow-lg">
            <div className="p-2">
              <p className="mb-2 px-2 text-xs font-medium text-dark-100">
                Selecciona el formato:
              </p>
              {opcionesMenu.map((opcion) => (
                <button
                  key={opcion.formato}
                  type="button"
                  onClick={() => handleExportar(opcion.formato)}
                  className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-light-50"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <span className="material-symbols-outlined text-primary">
                      {opcion.icono}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-dark">{opcion.label}</p>
                    {opcion.descripcion && (
                      <p className="text-xs text-dark-100">
                        {opcion.descripcion}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer informativo */}
            <div className="border-t border-light-200 bg-light-50 p-3">
              <p className="text-xs text-dark-100">
                <span className="material-symbols-outlined text-sm align-middle">
                  info
                </span>{' '}
                Los archivos estarán disponibles por 24 horas
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
