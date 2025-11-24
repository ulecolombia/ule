/**
 * ULE - PÁGINA DE BIBLIOTECA DE FACTURAS
 * Lista completa de facturas con dashboard, filtros y acciones
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { EstadisticasDashboard } from '@/components/facturacion/estadisticas-dashboard'
import { GraficoFacturacion } from '@/components/facturacion/grafico-facturacion'
import { TopClientes } from '@/components/facturacion/top-clientes'
import { FiltrosFacturasComponent } from '@/components/facturacion/filtros-facturas'
import { CarpetaMes } from '@/components/facturacion/carpeta-mes'
import { AnularFacturaModal } from '@/components/facturacion/anular-factura-modal'
import { EnviarEmailModal } from '@/components/facturacion/enviar-email-modal'
import {
  useFacturas,
  useEstadisticas,
  FiltrosFacturas,
} from '@/hooks/use-facturas'

export default function FacturasPage() {
  const router = useRouter()

  // ==============================================
  // ESTADO
  // ==============================================

  const [filtros, setFiltros] = useState<FiltrosFacturas>({
    estado: null,
    fechaDesde: null,
    fechaHasta: null,
    clienteId: null,
    montoMin: null,
    montoMax: null,
    busqueda: null,
    page: 1,
    limit: 50,
  })

  const [facturaSeleccionadaAnular, setFacturaSeleccionadaAnular] =
    useState<any>(null)
  const [facturaSeleccionadaEmail, setFacturaSeleccionadaEmail] =
    useState<any>(null)

  // ==============================================
  // HOOKS
  // ==============================================

  const {
    facturasPorMes,
    pagination,
    isLoading: isLoadingFacturas,
    isError: isErrorFacturas,
    error: errorFacturas,
    mutate: mutateFacturas,
  } = useFacturas(filtros)

  const {
    estadisticas,
    isLoading: isLoadingEstadisticas,
    isError: isErrorEstadisticas,
    mutate: mutateEstadisticas,
  } = useEstadisticas()

  // ==============================================
  // HANDLERS
  // ==============================================

  const handleVerFactura = (facturaId: string) => {
    // En una versión completa, abrir modal de detalle o navegar a página de detalle
    router.push(`/facturacion/facturas/${facturaId}`)
  }

  const handleAnularFactura = async (facturaId: string, motivo: string) => {
    try {
      const res = await fetch('/api/facturacion/anular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facturaId, motivo }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al anular factura')
      }

      // Refrescar datos
      await mutateFacturas()
      await mutateEstadisticas()

      // Mostrar notificación de éxito
      alert('Factura anulada exitosamente')
    } catch (error) {
      throw error
    }
  }

  const handleEnviarEmail = async (
    facturaId: string,
    destinatario: string,
    asunto: string,
    mensaje: string,
    copiaUsuario: boolean
  ) => {
    try {
      const res = await fetch('/api/facturacion/enviar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facturaId,
          destinatario,
          asunto,
          mensaje,
          copiaUsuario,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar email')
      }

      // Mostrar notificación de éxito
      // En producción, usar toast notification
      alert(`Factura enviada exitosamente a ${destinatario}`)
    } catch (error) {
      throw error
    }
  }

  const handleDescargarPDF = (pdfUrl: string, numeroFactura: string) => {
    // Abrir PDF en nueva pestaña
    window.open(pdfUrl, '_blank')
  }

  const handleDescargarXML = (xmlUrl: string, numeroFactura: string) => {
    // Descargar XML
    const link = document.createElement('a')
    link.href = xmlUrl
    link.download = `factura-${numeroFactura}.xml`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClonarFactura = async (facturaId: string) => {
    try {
      // Obtener datos completos de la factura
      const res = await fetch(`/api/facturacion/facturas/${facturaId}`)

      if (!res.ok) {
        throw new Error('No se pudo cargar la factura')
      }

      const { factura } = await res.json()

      if (!factura) {
        alert('No se pudo cargar la factura')
        return
      }

      // Preparar plantilla (sin CUFE, número, estado, fecha de emisión)
      const plantilla = {
        clienteId: factura.clienteId,
        metodoPago: factura.metodoPago,
        items: factura.conceptos, // JSON de items
        notas: factura.notas || '',
        terminos: factura.terminos || '',
      }

      // Guardar en localStorage para nueva factura
      localStorage.setItem('factura-plantilla', JSON.stringify(plantilla))
      localStorage.setItem('factura-plantilla-numero', factura.numeroFactura)

      // Redirigir a nueva factura con query param
      router.push('/facturacion/nueva?plantilla=true')
    } catch (error) {
      console.error('Error clonando factura:', error)
      alert('Error al clonar factura')
    }
  }

  const handlePaginaChange = (nuevaPagina: number) => {
    setFiltros({ ...filtros, page: nuevaPagina })
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ==============================================
  // RENDER
  // ==============================================

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
            <span>Facturación</span>
            <span className="material-symbols-outlined text-base">
              chevron_right
            </span>
            <span className="font-medium text-primary">
              Biblioteca de Facturas
            </span>
          </div>

          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-dark mb-2 flex items-center gap-3 text-3xl font-bold tracking-tight">
                <span className="material-symbols-outlined text-4xl text-primary">
                  receipt_long
                </span>
                Biblioteca de Facturas
              </h1>
              <p className="text-dark-100 font-medium">
                Administra y consulta todas tus facturas electrónicas
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/facturacion/nueva')}
                className="bg-primary text-white transition-colors hover:bg-primary/90"
              >
                <span className="material-symbols-outlined mr-2">add</span>
                Nueva Factura
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
                  <option value="/facturacion/clientes">Clientes</option>
                </select>
                <span className="material-symbols-outlined text-dark-100 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-lg">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Dashboard de estadísticas */}
          <div className="mb-6">
            <EstadisticasDashboard
              totalFacturadoMes={estadisticas?.totalFacturadoMes || 0}
              totalFacturadoAño={estadisticas?.totalFacturadoAño || 0}
              facturasPendientes={estadisticas?.facturasPendientes || 0}
              promedioFactura={estadisticas?.promedioFactura || 0}
              isLoading={isLoadingEstadisticas}
            />
          </div>

          {/* Gráficos */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Gráfico de facturación (2/3) */}
            <div className="lg:col-span-2">
              <GraficoFacturacion
                datos={estadisticas?.facturacionMensual || []}
                isLoading={isLoadingEstadisticas}
              />
            </div>

            {/* Top 5 clientes (1/3) */}
            <div className="lg:col-span-1">
              <TopClientes
                clientes={estadisticas?.topClientes || []}
                isLoading={isLoadingEstadisticas}
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="mb-6">
            <FiltrosFacturasComponent
              filtros={filtros}
              onFiltrosChange={setFiltros}
              clientes={[]} // En producción, cargar lista de clientes
            />
          </div>

          {/* Error */}
          {isErrorFacturas && (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <span className="material-symbols-outlined text-2xl text-red-600">
                error
              </span>
              <div>
                <p className="font-semibold text-red-900">
                  Error al cargar facturas
                </p>
                <p className="text-sm text-red-700">{errorFacturas}</p>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoadingFacturas && (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined animate-spin text-5xl text-teal-600">
                progress_activity
              </span>
              <p className="mt-4 text-slate-600">Cargando facturas...</p>
            </div>
          )}

          {/* Facturas por mes */}
          {!isLoadingFacturas && !isErrorFacturas && (
            <>
              {facturasPorMes.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
                  <span className="material-symbols-outlined mb-4 text-6xl text-slate-300">
                    description
                  </span>
                  <h3 className="mb-2 text-xl font-semibold text-slate-900">
                    No hay facturas
                  </h3>
                  <p className="mb-6 text-slate-600">
                    {filtros.estado || filtros.busqueda || filtros.clienteId
                      ? 'No se encontraron facturas con los filtros aplicados'
                      : 'Comienza creando tu primera factura electrónica'}
                  </p>
                  <Button
                    onClick={() => router.push('/facturacion/nueva')}
                    className="bg-teal-600 text-white hover:bg-teal-700"
                  >
                    <span className="material-symbols-outlined mr-2">add</span>
                    Crear Primera Factura
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {facturasPorMes.map((carpeta) => (
                    <CarpetaMes
                      key={`${carpeta.año}-${carpeta.mesNumero}`}
                      mes={carpeta.mes}
                      mesNumero={carpeta.mesNumero}
                      año={carpeta.año}
                      facturas={carpeta.facturas}
                      totalMes={carpeta.totalMes}
                      cantidadFacturas={carpeta.cantidadFacturas}
                      onVerFactura={handleVerFactura}
                      onAnularFactura={(facturaId) => {
                        const factura = carpeta.facturas.find(
                          (f) => f.id === facturaId
                        )
                        if (factura) {
                          setFacturaSeleccionadaAnular(factura)
                        }
                      }}
                      onEnviarEmail={(facturaId) => {
                        const factura = carpeta.facturas.find(
                          (f) => f.id === facturaId
                        )
                        if (factura) {
                          setFacturaSeleccionadaEmail(factura)
                        }
                      }}
                      onDescargarPDF={handleDescargarPDF}
                      onDescargarXML={handleDescargarXML}
                      onClonarFactura={handleClonarFactura}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Paginación */}
          {!isLoadingFacturas && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-600">
                Mostrando página {pagination.page} de {pagination.totalPages} (
                {pagination.total} facturas en total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePaginaChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <span className="material-symbols-outlined">
                    chevron_left
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePaginaChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <span className="material-symbols-outlined">
                    chevron_right
                  </span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Anular Factura */}
      <AnularFacturaModal
        isOpen={!!facturaSeleccionadaAnular}
        onClose={() => setFacturaSeleccionadaAnular(null)}
        factura={facturaSeleccionadaAnular}
        onConfirmar={handleAnularFactura}
      />

      {/* Modal Enviar Email */}
      <EnviarEmailModal
        isOpen={!!facturaSeleccionadaEmail}
        onClose={() => setFacturaSeleccionadaEmail(null)}
        factura={facturaSeleccionadaEmail}
        onEnviar={handleEnviarEmail}
      />
    </>
  )
}
