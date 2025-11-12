/**
 * ULE - CARD DE TOTALES DE FACTURA
 * Muestra el desglose de subtotal, IVA y total de la factura
 */

'use client'

import { Card, CardBody } from '@/components/ui/card'
import { formatearMoneda } from '@/lib/utils/facturacion-utils'

interface TotalesCardProps {
  subtotal: number
  totalIva: number
  total: number
  className?: string
}

export function TotalesCard({
  subtotal,
  totalIva,
  total,
  className,
}: TotalesCardProps) {
  return (
    <Card className={className}>
      <CardBody>
        <h3 className="mb-4 text-lg font-semibold text-dark">
          Resumen de Totales
        </h3>

        <div className="space-y-3">
          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-dark-100">Subtotal:</span>
            <span className="text-base font-medium text-dark">
              {formatearMoneda(subtotal)}
            </span>
          </div>

          {/* IVA */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-dark-100">IVA:</span>
            <span className="text-base font-medium text-dark">
              {formatearMoneda(totalIva)}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-light-200"></div>

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-dark">Total:</span>
            <span className="text-2xl font-bold text-primary">
              {formatearMoneda(total)}
            </span>
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-4 rounded-lg bg-light-50 p-3">
          <p className="text-xs text-dark-100">
            Los valores incluyen todos los impuestos aplicables según la
            normativa colombiana (DIAN).
          </p>
        </div>
      </CardBody>
    </Card>
  )
}
