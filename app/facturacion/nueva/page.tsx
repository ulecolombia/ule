/**
 * ULE - PÁGINA DE NUEVA FACTURA
 * Formulario completo para crear facturas electrónicas
 * Cumple con normativa colombiana DIAN
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Header } from '@/components/layout/Header'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { ItemsTable } from '@/components/facturacion/items-table'
import { TotalesCard } from '@/components/facturacion/totales-card'
import { FacturaPreview } from '@/components/facturacion/factura-preview'
import { ClienteModal } from '@/components/facturacion/cliente-modal'

import { useClientes } from '@/hooks/use-clientes'
import {
  crearFacturaSchema,
  METODOS_PAGO,
  CrearFacturaInput,
} from '@/lib/validations/factura'
import { calcularTotalesFactura } from '@/lib/utils/facturacion-utils'

const STORAGE_KEY = 'ule_factura_borrador'

export default function NuevaFacturaPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false)

  // Obtener clientes
  const { clientes, mutate: mutateClientes } = useClientes(1, 999, '', 'TODOS')

  // Formulario
  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<CrearFacturaInput>({
    resolver: zodResolver(crearFacturaSchema),
    defaultValues: {
      clienteId: '',
      fecha: new Date(),
      metodoPago: 'EFECTIVO',
      items: [
        {
          descripcion: '',
          cantidad: 1,
          valorUnitario: '',
          iva: 19,
        },
      ],
      notas: '',
      terminos: '',
      estado: 'BORRADOR',
    },
  })

  // useFieldArray para items dinámicos
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  // Watch para calcular totales en tiempo real
  const watchItems = watch('items')
  const watchClienteId = watch('clienteId')
  const watchFecha = watch('fecha')
  const watchNotas = watch('notas')
  const watchTerminos = watch('terminos')

  // Calcular totales
  const totales = calcularTotalesFactura(watchItems || [])

  // Cliente seleccionado
  const clienteSeleccionado = clientes.find((c) => c.id === watchClienteId)

  /**
   * Guardar borrador en localStorage
   */
  const guardarBorradorLocal = () => {
    const data = {
      clienteId: watchClienteId,
      fecha: watchFecha,
      metodoPago: watch('metodoPago'),
      items: watchItems,
      notas: watchNotas,
      terminos: watchTerminos,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  /**
   * Recuperar borrador de localStorage
   */
  const recuperarBorradorLocal = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    try {
      return JSON.parse(stored)
    } catch (error) {
      console.error('Error al recuperar borrador:', error)
      return null
    }
  }

  /**
   * Limpiar borrador de localStorage
   */
  const limpiarBorradorLocal = () => {
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Auto-save cada 30 segundos
   */
  useEffect(() => {
    if (!isDirty) return

    const interval = setInterval(() => {
      guardarBorradorLocal()
      console.log('[Auto-save] Borrador guardado')
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [isDirty, watchClienteId, watchItems, watchNotas, watchTerminos])

  /**
   * Recuperar borrador al cargar la página
   */
  useEffect(() => {
    const borrador = recuperarBorradorLocal()
    if (borrador) {
      const confirmar = window.confirm(
        `Se encontró un borrador guardado el ${format(
          new Date(borrador.timestamp),
          "dd/MM/yyyy 'a las' HH:mm",
          { locale: es }
        )}. ¿Deseas recuperarlo?`
      )

      if (confirmar) {
        reset({
          clienteId: borrador.clienteId || '',
          fecha: borrador.fecha ? new Date(borrador.fecha) : new Date(),
          metodoPago: borrador.metodoPago || 'EFECTIVO',
          items: borrador.items || [],
          notas: borrador.notas || '',
          terminos: borrador.terminos || '',
          estado: 'BORRADOR',
        })
        toast.success('Borrador recuperado exitosamente')
      } else {
        limpiarBorradorLocal()
      }
    }
  }, [])

  /**
   * Prevenir salir con cambios sin guardar
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  /**
   * Guardar borrador en servidor
   */
  const guardarBorrador = async (data: CrearFacturaInput) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/facturacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          estado: 'BORRADOR',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar borrador')
      }

      const result = await response.json()
      toast.success('Borrador guardado exitosamente')
      limpiarBorradorLocal()

      const continuar = window.confirm(
        '¿Deseas continuar editando o ir a la lista de facturas?'
      )
      if (!continuar) {
        router.push('/facturacion/facturas')
      }
    } catch (error: any) {
      console.error('Error al guardar borrador:', error)
      toast.error(error.message || 'Error al guardar borrador')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Emitir factura
   */
  const emitirFactura = async (data: CrearFacturaInput) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/facturacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          estado: 'EMITIDA',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al emitir factura')
      }

      const result = await response.json()
      toast.success('Factura emitida exitosamente')
      limpiarBorradorLocal()

      // Redirigir a detalle de factura
      router.push(`/facturacion/facturas/${result.factura.id}`)
    } catch (error: any) {
      console.error('Error al emitir factura:', error)
      toast.error(error.message || 'Error al emitir factura')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handler para crear cliente inline
   */
  const handleClienteCreado = async (data: any) => {
    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear cliente')
      }

      const result = await response.json()
      toast.success('Cliente creado exitosamente')

      // Revalidar lista de clientes
      await mutateClientes()

      // Seleccionar el nuevo cliente
      setValue('clienteId', result.cliente.id)
      setIsClienteModalOpen(false)
    } catch (error: any) {
      console.error('Error al crear cliente:', error)
      toast.error(error.message || 'Error al crear cliente')
      throw error
    }
  }

  return (
    <>
      <Header userName={session?.user?.name} userEmail={session?.user?.email} />

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
            <span className="font-medium text-primary">Nueva Factura</span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-dark text-3xl font-bold">
              Nueva Factura Electrónica
            </h1>
            <p className="text-dark-100">
              Completa el formulario para crear una nueva factura
            </p>
          </div>

          {/* Layout principal */}
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Columna izquierda - Formulario (60%) */}
            <div className="flex-1 space-y-6">
              {/* Información del cliente */}
              <Card>
                <CardBody>
                  <h2 className="text-dark mb-4 text-xl font-semibold">
                    Información del Cliente
                  </h2>

                  <div className="space-y-4">
                    {/* Selector de cliente */}
                    <div>
                      <label className="text-dark mb-2 block text-sm font-medium">
                        Cliente *
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <SearchableSelect
                            options={clientes.map((c) => ({
                              value: c.id,
                              label: `${c.nombre} - ${c.numeroDocumento}`,
                            }))}
                            value={watchClienteId}
                            onChange={(value) => setValue('clienteId', value)}
                            placeholder="Buscar cliente..."
                            icon={
                              <span className="material-symbols-outlined">
                                person
                              </span>
                            }
                          />
                          {errors.clienteId && (
                            <p className="text-error mt-1.5 text-sm">
                              {errors.clienteId.message}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsClienteModalOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined">add</span>
                          Nuevo
                        </Button>
                      </div>
                    </div>

                    {/* Fecha */}
                    <Input
                      label="Fecha de Emisión *"
                      type="date"
                      {...register('fecha', {
                        valueAsDate: true,
                      })}
                      error={errors.fecha?.message}
                      icon={
                        <span className="material-symbols-outlined">
                          calendar_today
                        </span>
                      }
                    />

                    {/* Método de pago */}
                    <Select
                      label="Método de Pago *"
                      {...register('metodoPago')}
                      error={errors.metodoPago?.message}
                      icon={
                        <span className="material-symbols-outlined">
                          payments
                        </span>
                      }
                    >
                      {METODOS_PAGO.map((metodo) => (
                        <option key={metodo.value} value={metodo.value}>
                          {metodo.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </CardBody>
              </Card>

              {/* Items de la factura */}
              <Card>
                <CardBody>
                  <h2 className="text-dark mb-4 text-xl font-semibold">
                    Ítems de la Factura
                  </h2>

                  <ItemsTable
                    fields={fields}
                    register={register}
                    append={append}
                    remove={remove}
                    watch={watch}
                    errors={errors}
                    control={control}
                  />
                </CardBody>
              </Card>

              {/* Notas y términos */}
              <Card>
                <CardBody>
                  <h2 className="text-dark mb-4 text-xl font-semibold">
                    Información Adicional
                  </h2>

                  <div className="space-y-4">
                    {/* Notas */}
                    <div>
                      <label className="text-dark mb-2 block text-sm font-medium">
                        Notas Adicionales
                      </label>
                      <textarea
                        {...register('notas')}
                        rows={3}
                        placeholder="Ej: Pago a 30 días, descuentos especiales, etc."
                        className="border-light-200 hover:border-light-300 w-full resize-none rounded-lg border px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <p className="text-dark-100 mt-1 text-xs">
                        Máximo 500 caracteres
                      </p>
                      {errors.notas && (
                        <p className="text-error mt-1 text-sm">
                          {errors.notas.message}
                        </p>
                      )}
                    </div>

                    {/* Términos */}
                    <div>
                      <label className="text-dark mb-2 block text-sm font-medium">
                        Términos y Condiciones
                      </label>
                      <textarea
                        {...register('terminos')}
                        rows={3}
                        placeholder="Ej: Esta factura se rige por las leyes colombianas..."
                        className="border-light-200 hover:border-light-300 w-full resize-none rounded-lg border px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <p className="text-dark-100 mt-1 text-xs">
                        Máximo 300 caracteres
                      </p>
                      {errors.terminos && (
                        <p className="text-error mt-1 text-sm">
                          {errors.terminos.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Columna derecha - Preview y totales (40%) */}
            <div className="w-full space-y-6 lg:w-[400px]">
              {/* Totales */}
              <TotalesCard
                subtotal={totales.subtotal}
                totalIva={totales.totalIva}
                total={totales.total}
              />

              {/* Toggle preview en mobile */}
              <div className="lg:hidden">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full"
                >
                  <span className="material-symbols-outlined mr-2">
                    {showPreview ? 'visibility_off' : 'visibility'}
                  </span>
                  {showPreview ? 'Ocultar' : 'Ver'} Vista Previa
                </Button>
              </div>

              {/* Preview (siempre visible en desktop, toggle en mobile) */}
              <div className={`${showPreview ? 'block' : 'hidden'} lg:block`}>
                <Card>
                  <CardBody className="p-0">
                    <div className="max-h-[600px] overflow-auto">
                      <FacturaPreview
                        cliente={clienteSeleccionado}
                        fecha={watchFecha}
                        items={watchItems || []}
                        subtotal={totales.subtotal}
                        totalIva={totales.totalIva}
                        total={totales.total}
                        notas={watchNotas}
                        terminos={watchTerminos}
                      />
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>

          {/* Botones de acción (sticky bottom) */}
          <div className="border-light-200 sticky bottom-0 z-10 mt-6 flex gap-3 rounded-lg border bg-white p-4 shadow-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/facturacion/facturas')}
              disabled={isSubmitting}
              className="flex-1 lg:flex-initial"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit(guardarBorrador)}
              disabled={isSubmitting}
              className="flex-1 lg:flex-initial"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined mr-2 animate-spin">
                    progress_activity
                  </span>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-2">save</span>
                  Guardar Borrador
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleSubmit(emitirFactura)}
              disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-primary/90 lg:flex-initial"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined mr-2 animate-spin">
                    progress_activity
                  </span>
                  Emitiendo...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-2">send</span>
                  Emitir Factura
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de crear cliente */}
      <ClienteModal
        mode="create"
        isOpen={isClienteModalOpen}
        onClose={() => setIsClienteModalOpen(false)}
        onSuccess={handleClienteCreado}
      />
    </>
  )
}
