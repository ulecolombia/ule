/**
 * ULE - MODAL DE CONFIRMACIÓN DE EMISIÓN DE FACTURA
 * Modal de confirmación antes de emitir una factura electrónica
 */

'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'

interface ModalConfirmarEmisionProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  datosFactura: {
    clienteNombre?: string
    total?: number
    itemsCount?: number
  }
  loading: boolean
}

export function ModalConfirmarEmision({
  open,
  onClose,
  onConfirm,
  datosFactura,
  loading,
}: ModalConfirmarEmisionProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-500">
              warning
            </span>
            Confirmar Emisión de Factura
          </AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de emitir una factura electrónica. Por favor verifica
            los datos antes de continuar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Resumen de la factura */}
        <div className="space-y-3 py-4">
          <div className="space-y-2 rounded-lg bg-primary/5 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">
                {datosFactura.clienteNombre || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items:</span>
              <span className="font-medium">
                {datosFactura.itemsCount || 0}
              </span>
            </div>
            <div className="bg-border h-px"></div>
            <div className="flex justify-between">
              <span className="font-semibold">Total:</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(datosFactura.total || 0)}
              </span>
            </div>
          </div>

          {/* Advertencias */}
          <Alert variant="warning">
            <AlertDescription>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>
                  Una vez emitida, la factura{' '}
                  <strong>NO podrá modificarse</strong>
                </li>
                <li>Solo podrás anularla si es necesario</li>
                <li>Se generará el CUFE y se enviará a la DIAN</li>
                <li>El cliente recibirá la factura por email</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined mr-2 animate-spin text-base">
                  progress_activity
                </span>
                Emitiendo...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined mr-2 text-base">
                  check_circle
                </span>
                Sí, Emitir Factura
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
