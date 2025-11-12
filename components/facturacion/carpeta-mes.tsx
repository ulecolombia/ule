/**
 * ULE - COMPONENTE CARPETA DE MES
 * Accordion item para agrupar facturas por mes
 */

'use client'

import { useState } from 'react'
import { Card, CardBody } from '@/components/ui/card'
import { FacturaCard } from './factura-card'

interface FacturaResumen {
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

interface CarpetaMesProps {
  mes: string
  mesNumero: number
  año: number
  facturas: FacturaResumen[]
  totalMes: number
  cantidadFacturas: number
  onVerFactura: (facturaId: string) => void
  onAnularFactura: (facturaId: string) => void
  onEnviarEmail: (facturaId: string) => void
  onDescargarPDF: (pdfUrl: string, numeroFactura: string) => void
  onDescargarXML: (xmlUrl: string, numeroFactura: string) => void
}

export function CarpetaMes({
  mes,
  facturas,
  totalMes,
  cantidadFacturas,
  onVerFactura,
  onAnularFactura,
  onEnviarEmail,
  onDescargarPDF,
  onDescargarXML,
}: CarpetaMesProps) {
  const [isOpen, setIsOpen] = useState(true)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="mb-4">
      <Card>
        <CardBody className="p-0">
          {/* Header del mes (siempre visible) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Icono de carpeta */}
              <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-teal-600 text-2xl">
                  folder
                </span>
              </div>

              {/* Información del mes */}
              <div className="text-left">
                <h3 className="text-lg font-semibold text-slate-900">{mes}</h3>
                <p className="text-sm text-slate-600">
                  {cantidadFacturas}{' '}
                  {cantidadFacturas === 1 ? 'factura' : 'facturas'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Total del mes */}
              <div className="text-right hidden md:block">
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency(totalMes)}
                </p>
              </div>

              {/* Icono expand/collapse */}
              <span className="material-symbols-outlined text-slate-400">
                {isOpen ? 'expand_less' : 'expand_more'}
              </span>
            </div>
          </button>

          {/* Lista de facturas (colapsable) */}
          {isOpen && (
            <div className="border-t border-slate-200 bg-slate-50/50 p-4">
              {facturas.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">
                    description
                  </span>
                  <p className="text-slate-500">No hay facturas en este mes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {facturas.map((factura) => (
                    <FacturaCard
                      key={factura.id}
                      factura={factura}
                      onVer={() => onVerFactura(factura.id)}
                      onAnular={() => onAnularFactura(factura.id)}
                      onEnviarEmail={() => onEnviarEmail(factura.id)}
                      onDescargarPDF={() =>
                        factura.pdfUrl &&
                        onDescargarPDF(factura.pdfUrl, factura.numeroFactura)
                      }
                      onDescargarXML={() =>
                        factura.xmlUrl &&
                        onDescargarXML(factura.xmlUrl, factura.numeroFactura)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
