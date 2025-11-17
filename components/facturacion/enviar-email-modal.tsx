/**
 * ULE - MODAL PARA ENVIAR FACTURA POR EMAIL
 * Modal completo con templates, vista previa y adjuntos
 */

'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { EmailPreview } from './email-preview'
import {
  templatePersonalizado,
  templateFormal,
  templateAmigable,
  type FacturaTemplateData,
} from '@/lib/templates/email-templates'
import {
  formatCurrency,
  formatDate,
  isValidEmail,
  parseEmailList,
  EMAIL_CONSTRAINTS,
} from '@/lib/utils/format'

interface EnviarEmailModalProps {
  isOpen: boolean
  onClose: () => void
  factura: {
    id: string
    numeroFactura: string
    fecha: Date
    fechaEmision: Date | null
    fechaVencimiento?: Date | null
    total: number
    subtotal?: number
    totalIva?: number
    cufe?: string | null
    terminosPago?: string | null
    notas?: string | null
    cliente: {
      nombre: string
      email: string | null
    }
  } | null
  onEnviar: (
    facturaId: string,
    destinatario: string,
    cc: string[],
    asunto: string,
    mensaje: string,
    adjuntarPdf: boolean,
    adjuntarXml: boolean
  ) => Promise<void>
}

export function EnviarEmailModal({
  isOpen,
  onClose,
  factura,
  onEnviar,
}: EnviarEmailModalProps) {
  const [activeTab, setActiveTab] = useState<'formulario' | 'vista-previa'>(
    'formulario'
  )
  const [destinatario, setDestinatario] = useState('')
  const [cc, setCc] = useState('')
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [adjuntarPdf, setAdjuntarPdf] = useState(true)
  const [adjuntarXml, setAdjuntarXml] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Preparar datos para templates
  const getTemplateData = (): FacturaTemplateData => {
    if (!factura) {
      return {
        numeroFactura: '',
        clienteNombre: '',
        fecha: new Date(),
        total: 0,
      }
    }

    return {
      numeroFactura: factura.numeroFactura,
      clienteNombre: factura.cliente.nombre,
      fecha: factura.fecha,
      fechaVencimiento: factura.fechaVencimiento,
      total: factura.total,
      subtotal: factura.subtotal,
      iva: factura.totalIva,
      cufe: factura.cufe,
      terminosPago: factura.terminosPago,
      notas: factura.notas,
    }
  }

  // FIX: Inicializar valores solo una vez cuando el modal abre (previene race conditions)
  useEffect(() => {
    if (factura && isOpen && !initialized) {
      setDestinatario(factura.cliente.email || '')
      setCc('')
      setAsunto(
        `Factura Electrónica ${factura.numeroFactura} - ${formatDate(factura.fecha)}`
      )
      setMensaje(templatePersonalizado(getTemplateData(), 'Tu Empresa'))
      setAdjuntarPdf(true)
      setAdjuntarXml(true)
      setError(null)
      setSuccess(false)
      setActiveTab('formulario')
      setInitialized(true)
    }
  }, [factura, isOpen, initialized])

  const handleClose = () => {
    if (!isLoading) {
      setDestinatario('')
      setCc('')
      setAsunto('')
      setMensaje('')
      setError(null)
      setSuccess(false)
      setInitialized(false) // FIX: Resetear flag para permitir re-inicialización
      onClose()
    }
  }

  const handleTemplateChange = (template: string) => {
    const data = getTemplateData()

    switch (template) {
      case 'formal':
        setMensaje(templateFormal(data, 'Tu Empresa'))
        break
      case 'amigable':
        setMensaje(templateAmigable(data, 'Tu Empresa'))
        break
      case 'personalizado':
        setMensaje(templatePersonalizado(data, 'Tu Empresa'))
        break
      default:
        break
    }
  }

  const handleEnviar = async () => {
    if (!factura) return

    // Validaciones
    if (!destinatario.trim()) {
      setError('El email del destinatario es requerido')
      return
    }

    // FIX: Usar validador centralizado
    if (!isValidEmail(destinatario)) {
      setError('El email del destinatario no es válido')
      return
    }

    if (!asunto.trim()) {
      setError('El asunto es requerido')
      return
    }

    if (asunto.trim().length < EMAIL_CONSTRAINTS.ASUNTO_MIN) {
      setError(
        `El asunto debe tener al menos ${EMAIL_CONSTRAINTS.ASUNTO_MIN} caracteres`
      )
      return
    }

    if (asunto.trim().length > EMAIL_CONSTRAINTS.ASUNTO_MAX) {
      setError(
        `El asunto no puede exceder ${EMAIL_CONSTRAINTS.ASUNTO_MAX} caracteres`
      )
      return
    }

    if (!mensaje.trim()) {
      setError('El mensaje es requerido')
      return
    }

    if (mensaje.trim().length < EMAIL_CONSTRAINTS.MENSAJE_MIN) {
      setError(
        `El mensaje debe tener al menos ${EMAIL_CONSTRAINTS.MENSAJE_MIN} caracteres`
      )
      return
    }

    if (mensaje.trim().length > EMAIL_CONSTRAINTS.MENSAJE_MAX) {
      setError(
        `El mensaje no puede exceder ${EMAIL_CONSTRAINTS.MENSAJE_MAX} caracteres`
      )
      return
    }

    // FIX: Validar CC emails correctamente
    const ccEmails: string[] = []
    if (cc.trim()) {
      const { valid, invalid } = parseEmailList(cc)

      if (invalid.length > 0) {
        setError(`Emails CC inválidos: ${invalid.join(', ')}`)
        return
      }

      ccEmails.push(...valid)
    }

    try {
      setIsLoading(true)
      setError(null)

      await onEnviar(
        factura.id,
        destinatario.trim(),
        ccEmails,
        asunto.trim(),
        mensaje.trim(),
        adjuntarPdf,
        adjuntarXml
      )

      setSuccess(true)
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar email')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !factura) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Enviar Factura por Email
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Factura {factura.numeroFactura} - {factura.cliente.nombre}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('formulario')}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'formulario'
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Formulario
            </button>
            <button
              onClick={() => setActiveTab('vista-previa')}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'vista-previa'
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Vista Previa
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {success ? (
            // Success state
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/20">
                <span className="material-symbols-outlined text-4xl text-teal-600 dark:text-teal-400">
                  check_circle
                </span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
                ¡Email enviado exitosamente!
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                La factura ha sido enviada a {destinatario}
              </p>
            </div>
          ) : activeTab === 'formulario' ? (
            // Formulario tab
            <div className="space-y-4">
              {/* Template selector */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Template de email
                </label>
                <Select
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  defaultValue="personalizado"
                >
                  <option value="personalizado">
                    Personalizado (Estándar)
                  </option>
                  <option value="formal">Formal (Empresarial)</option>
                  <option value="amigable">Amigable (Casual)</option>
                </Select>
              </div>

              {/* Destinatario */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Destinatario *
                </label>
                <Input
                  type="email"
                  value={destinatario}
                  onChange={(e) => setDestinatario(e.target.value)}
                  placeholder="cliente@email.com"
                  disabled={isLoading}
                />
              </div>

              {/* CC */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  CC (opcional)
                </label>
                <Input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="email1@empresa.com, email2@empresa.com"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Separa múltiples emails con comas
                </p>
              </div>

              {/* Asunto */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Asunto *
                </label>
                <Input
                  type="text"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Asunto del email"
                  disabled={isLoading}
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {asunto.length} / 200 caracteres
                </p>
              </div>

              {/* Mensaje */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Mensaje *
                </label>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  disabled={isLoading}
                  rows={12}
                  maxLength={2000}
                  className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {mensaje.length} / 2000 caracteres
                </p>
              </div>

              {/* Adjuntos */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Archivos adjuntos
                </label>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={adjuntarPdf}
                      onChange={(e) => setAdjuntarPdf(e.target.checked)}
                      disabled={isLoading}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Adjuntar PDF de la factura
                    </span>
                    <span className="rounded bg-teal-50 px-2 py-0.5 text-xs text-teal-600 dark:bg-teal-900/20 dark:text-teal-400">
                      Recomendado
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={adjuntarXml}
                      onChange={(e) => setAdjuntarXml(e.target.checked)}
                      disabled={isLoading}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Adjuntar XML (formato DIAN)
                    </span>
                  </label>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <span className="material-symbols-outlined text-lg">
                    error
                  </span>
                  {error}
                </div>
              )}
            </div>
          ) : (
            // Vista previa tab
            <EmailPreview
              destinatario={destinatario}
              cc={cc}
              asunto={asunto}
              mensaje={mensaje}
              adjuntarPdf={adjuntarPdf}
              adjuntarXml={adjuntarXml}
              numeroFactura={factura.numeroFactura}
            />
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex flex-shrink-0 items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setActiveTab('vista-previa')}
                disabled={isLoading}
              >
                <span className="material-symbols-outlined mr-2">
                  visibility
                </span>
                Vista Previa
              </Button>
              <Button
                onClick={handleEnviar}
                disabled={isLoading || !destinatario || !asunto || !mensaje}
                className="bg-teal-600 text-white hover:bg-teal-700"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined mr-2 animate-spin">
                      progress_activity
                    </span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined mr-2">send</span>
                    Enviar Email
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
