/**
 * ULE - COMPONENTE TARJETA DE FACTURA
 * Tarjeta individual de factura con todas las acciones
 */

'use client'

import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface FacturaCardProps {
  factura: {
    id: string
    numeroFactura: string
    fecha: Date
    fechaEmision: Date | null
    estado: string
    total: number
    subtotal: number
    totalIva: number
    cliente: {
      id: string
      nombre: string
      email: string | null
      numeroDocumento: string | null
    }
    cufe: string | null
    pdfUrl: string | null
    xmlUrl: string | null
  }
  onVer: () => void
  onAnular: () => void
  onEnviarEmail: () => void
  onDescargarPDF: () => void
  onDescargarXML: () => void
}

export function FacturaCard({
  factura,
  onVer,
  onAnular,
  onEnviarEmail,
  onDescargarPDF,
  onDescargarXML,
}: FacturaCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Badge de estado
  const getEstadoBadge = () => {
    const estados = {
      BORRADOR: {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        icon: 'draft',
        label: 'Borrador',
      },
      EMITIDA: {
        bg: 'bg-teal-100',
        text: 'text-teal-700',
        icon: 'check_circle',
        label: 'Emitida',
      },
      ANULADA: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: 'cancel',
        label: 'Anulada',
      },
      VENCIDA: {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        icon: 'warning',
        label: 'Vencida',
      },
    }

    const estado = estados[factura.estado as keyof typeof estados] || estados.BORRADOR

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${estado.bg} ${estado.text}`}
      >
        <span className="material-symbols-outlined text-sm">{estado.icon}</span>
        {estado.label}
      </span>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Columna 1: Número y estado */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-slate-400 text-xl">
                description
              </span>
              <span className="font-mono font-semibold text-slate-900">
                {factura.numeroFactura}
              </span>
            </div>
            {getEstadoBadge()}
          </div>

          {/* Columna 2: Cliente y fecha */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate mb-1">
              {factura.cliente.nombre}
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  calendar_today
                </span>
                {formatDate(factura.fecha)}
              </span>
              {factura.cliente.numeroDocumento && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">badge</span>
                  {factura.cliente.numeroDocumento}
                </span>
              )}
            </div>
          </div>

          {/* Columna 3: Total */}
          <div className="text-left md:text-right">
            <p className="text-sm text-slate-600 mb-1">Total</p>
            <p className="text-xl font-bold text-slate-900">
              {formatCurrency(factura.total)}
            </p>
          </div>

          {/* Columna 4: Acciones */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Ver */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onVer}
              title="Ver detalles"
            >
              <span className="material-symbols-outlined">visibility</span>
            </Button>

            {/* Descargar PDF */}
            {factura.pdfUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDescargarPDF}
                title="Descargar PDF"
              >
                <span className="material-symbols-outlined">picture_as_pdf</span>
              </Button>
            )}

            {/* Descargar XML */}
            {factura.xmlUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDescargarXML}
                title="Descargar XML"
              >
                <span className="material-symbols-outlined">code</span>
              </Button>
            )}

            {/* Enviar email */}
            {factura.estado === 'EMITIDA' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEnviarEmail}
                title="Enviar por email"
              >
                <span className="material-symbols-outlined">email</span>
              </Button>
            )}

            {/* Anular */}
            {factura.estado === 'EMITIDA' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAnular}
                title="Anular factura"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <span className="material-symbols-outlined">cancel</span>
              </Button>
            )}
          </div>
        </div>

        {/* CUFE (solo si existe) */}
        {factura.cufe && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span className="font-mono truncate">CUFE: {factura.cufe}</span>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
