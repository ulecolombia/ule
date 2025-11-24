/**
 * ULE - PÁGINA DE NUEVA FACTURA
 * Formulario completo para crear facturas electrónicas
 * Cumple con normativa colombiana DIAN
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Header } from '@/components/layout/Header'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ItemsTable } from '@/components/facturacion/items-table'
import { VistaPreviaWrapper } from '@/components/facturacion/vista-previa-wrapper'
import { ClienteModal } from '@/components/facturacion/cliente-modal'
import { AutocompleteCliente } from '@/components/facturacion/autocomplete-cliente'
import { ModalConfirmarEmision } from '@/components/facturacion/modal-confirmar-emision'

import { useClientes } from '@/hooks/use-clientes'
import { useDebounce } from '@/hooks/use-debounce'
import {
  crearFacturaSchema,
  METODOS_PAGO,
  CrearFacturaInput,
  EmisorFacturaInput,
} from '@/lib/validations/factura'
import { calcularTotalesFactura } from '@/lib/utils/facturacion-utils'

const STORAGE_KEY = 'ule_factura_borrador'

export default function NuevaFacturaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const esPlantilla = searchParams?.get('plantilla') === 'true'
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false)
  const [modalConfirmOpen, setModalConfirmOpen] = useState(false)

  // Estado del emisor
  const [emisorData, setEmisorData] = useState<EmisorFacturaInput | null>(null)
  const [editarEmisor, setEditarEmisor] = useState(false)
  const [emisorOverride, setEmisorOverride] = useState<
    Partial<EmisorFacturaInput>
  >({})
  const [responsableIVA, setResponsableIVA] = useState(false)

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
    mode: 'onSubmit', // Solo validar al enviar, no mientras escribe
    defaultValues: {
      clienteId: '',
      fecha: new Date(),
      metodoPago: 'TRANSFERENCIA',
      items: [
        {
          descripcion: '',
          cantidad: 1,
          unidad: 'UND',
          valorUnitario: '',
          aplicaIVA: false,
          porcentajeIVA: 0,
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

  // Observar todos los datos del formulario para la vista previa
  const formData = useWatch({
    control,
  })

  // Aplicar debounce para mejorar performance de la vista previa
  const debouncedFormData = useDebounce(formData, 300)

  // Calcular totales
  const totales = calcularTotalesFactura(watchItems || [])

  // Cliente seleccionado
  const clienteSeleccionado =
    watchClienteId && watchClienteId !== ''
      ? clientes.find((c) => c.id === watchClienteId)
      : undefined

  /**
   * Validar información tributaria del usuario
   * Redirigir al perfil si no está completa
   */
  useEffect(() => {
    const verificarInfoTributaria = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (!response.ok) return

        const { user } = await response.json()

        // Verificar que tenga info tributaria mínima
        if (!user.regimenTributario || !user.razonSocial) {
          toast.error(
            'Por favor completa tu información tributaria antes de emitir facturas',
            { duration: 5000 }
          )
          router.push('/perfil')
          return
        }

        // Pre-cargar datos del emisor desde perfil tributario
        setEmisorData({
          razonSocial: user.razonSocial || user.nombre || '',
          documento: user.numeroDocumento || '',
          direccion: user.direccion || '',
          ciudad: user.ciudad || '',
          telefono: user.telefono || '',
          email: user.emailFacturacion || user.email || '',
        })

        // Guardar si es responsable de IVA
        setResponsableIVA(user.responsableIVA || false)
      } catch (error) {
        console.error('Error verificando info tributaria:', error)
      }
    }

    verificarInfoTributaria()
  }, [router])

  /**
   * Cargar plantilla desde factura clonada
   */
  useEffect(() => {
    if (esPlantilla) {
      const plantilla = localStorage.getItem('factura-plantilla')
      const numeroOriginal = localStorage.getItem('factura-plantilla-numero')

      if (plantilla) {
        try {
          const datos = JSON.parse(plantilla)

          // Pre-llenar formulario con datos de la plantilla
          reset({
            clienteId: datos.clienteId || '',
            fecha: new Date(), // Fecha actual, no la original
            metodoPago: datos.metodoPago || 'TRANSFERENCIA',
            items: datos.items || [],
            notas: datos.notas || '',
            terminos: datos.terminos || '',
            estado: 'BORRADOR',
          })

          toast.info(`📋 Usando Factura ${numeroOriginal} como plantilla`, {
            description: 'Ajusta los datos y emite cuando estés listo',
            duration: 5000,
          })

          // Limpiar localStorage
          localStorage.removeItem('factura-plantilla')
          localStorage.removeItem('factura-plantilla-numero')
        } catch (error) {
          console.error('Error cargando plantilla:', error)
          toast.error('Error al cargar plantilla')
        }
      }
    }
  }, [esPlantilla, reset])

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
          metodoPago: borrador.metodoPago || 'TRANSFERENCIA',
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
   * Solo requiere validación mínima
   */
  const guardarBorrador = async () => {
    // Validación mínima: al menos 1 ítem con descripción
    const items = watch('items')

    if (!items || items.length === 0) {
      toast.error('Debes agregar al menos un ítem para guardar el borrador')
      return
    }

    const tieneDescripcion = items.some(
      (item) => item.descripcion && item.descripcion.trim().length > 0
    )
    if (!tieneDescripcion) {
      toast.error('Al menos un ítem debe tener descripción')
      return
    }

    setIsSubmitting(true)
    try {
      const data = {
        clienteId: watch('clienteId'),
        fecha: watch('fecha'),
        metodoPago: watch('metodoPago'),
        items: watch('items'),
        notas: watch('notas'),
        terminos: watch('terminos'),
        estado: 'BORRADOR',
      }

      const response = await fetch('/api/facturacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
   * Preparar emisión - valida y abre modal de confirmación
   */
  const prepararEmision = async () => {
    // Validar formulario completo
    const isValid = await handleSubmit(() => {})()

    if (!isValid || Object.keys(errors).length > 0) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    // Abrir modal de confirmación
    setModalConfirmOpen(true)
  }

  /**
   * Emitir factura (después de confirmación)
   */
  const emitirFactura = async () => {
    setIsSubmitting(true)
    try {
      // Primero guardar como borrador
      const data = {
        clienteId: watch('clienteId'),
        fecha: watch('fecha'),
        metodoPago: watch('metodoPago'),
        items: watch('items'),
        notas: watch('notas'),
        terminos: watch('terminos'),
        estado: 'BORRADOR',
      }

      const saveDraftResponse = await fetch('/api/facturacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!saveDraftResponse.ok) {
        const error = await saveDraftResponse.json()
        throw new Error(error.error || 'Error al preparar factura')
      }

      const draftResult = await saveDraftResponse.json()
      const facturaId = draftResult.factura.id

      // Luego emitir la factura
      const emitResponse = await fetch('/api/facturacion/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facturaId }),
      })

      if (!emitResponse.ok) {
        const error = await emitResponse.json()
        throw new Error(error.error || 'Error al emitir factura')
      }

      const result = await emitResponse.json()
      toast.success(
        `Factura ${result.factura.numeroFactura} emitida exitosamente`,
        {
          description: 'Se ha generado el PDF y XML de la factura',
          duration: 5000,
        }
      )
      limpiarBorradorLocal()

      // Redirigir a detalle de factura
      router.push(`/facturacion/facturas/${result.factura.id}`)
    } catch (error: any) {
      console.error('Error al emitir factura:', error)
      toast.error(error.message || 'Error al emitir factura')
    } finally {
      setIsSubmitting(false)
      setModalConfirmOpen(false)
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
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-dark text-3xl font-bold">
                Nueva Factura Electrónica
              </h1>
              <p className="text-dark-100">
                Completa el formulario para crear una nueva factura
              </p>
            </div>

            {/* Menú de navegación de Facturación */}
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    router.push(e.target.value)
                  }
                }}
                defaultValue=""
                className="text-dark cursor-pointer appearance-none rounded-lg border-2 border-gray-200 bg-white px-4 py-2 pr-8 text-sm font-medium shadow-sm transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="" disabled>
                  Ir a
                </option>
                <option value="/facturacion/facturas">Mis Facturas</option>
                <option value="/facturacion/clientes">Clientes</option>
              </select>
              <span className="material-symbols-outlined text-dark-100 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-lg">
                expand_more
              </span>
            </div>
          </div>

          {/* Layout principal */}
          <div className="flex flex-col gap-6 2xl:flex-row">
            {/* Columna izquierda - Formulario (60%) */}
            <div className="flex-1 space-y-6">
              {/* Información del emisor */}
              <Card>
                <CardBody>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-dark text-xl font-semibold">
                      Información del Emisor
                    </h2>
                    <button
                      type="button"
                      onClick={() => setEditarEmisor(!editarEmisor)}
                      className="flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80"
                    >
                      <span className="material-symbols-outlined text-base">
                        {editarEmisor ? 'check' : 'edit'}
                      </span>
                      {editarEmisor ? 'Guardar' : 'Editar para esta factura'}
                    </button>
                  </div>

                  {emisorData ? (
                    editarEmisor ? (
                      /* Modo edición */
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Input
                            label="Razón Social *"
                            placeholder="Nombre o razón social"
                            value={
                              emisorOverride.razonSocial ??
                              emisorData.razonSocial
                            }
                            onChange={(e) =>
                              setEmisorOverride({
                                ...emisorOverride,
                                razonSocial: e.target.value,
                              })
                            }
                            icon={
                              <span className="material-symbols-outlined">
                                business
                              </span>
                            }
                          />
                          <Input
                            label="Documento *"
                            placeholder="Número de documento"
                            value={
                              emisorOverride.documento ?? emisorData.documento
                            }
                            onChange={(e) =>
                              setEmisorOverride({
                                ...emisorOverride,
                                documento: e.target.value,
                              })
                            }
                            icon={
                              <span className="material-symbols-outlined">
                                badge
                              </span>
                            }
                          />
                        </div>
                        <Input
                          label="Dirección *"
                          placeholder="Dirección fiscal"
                          value={
                            emisorOverride.direccion ?? emisorData.direccion
                          }
                          onChange={(e) =>
                            setEmisorOverride({
                              ...emisorOverride,
                              direccion: e.target.value,
                            })
                          }
                          icon={
                            <span className="material-symbols-outlined">
                              location_on
                            </span>
                          }
                        />
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <Input
                            label="Ciudad *"
                            placeholder="Ciudad"
                            value={emisorOverride.ciudad ?? emisorData.ciudad}
                            onChange={(e) =>
                              setEmisorOverride({
                                ...emisorOverride,
                                ciudad: e.target.value,
                              })
                            }
                            icon={
                              <span className="material-symbols-outlined">
                                location_city
                              </span>
                            }
                          />
                          <Input
                            label="Teléfono *"
                            placeholder="10 dígitos"
                            value={
                              emisorOverride.telefono ?? emisorData.telefono
                            }
                            onChange={(e) =>
                              setEmisorOverride({
                                ...emisorOverride,
                                telefono: e.target.value,
                              })
                            }
                            icon={
                              <span className="material-symbols-outlined">
                                phone
                              </span>
                            }
                          />
                          <Input
                            label="Email *"
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={emisorOverride.email ?? emisorData.email}
                            onChange={(e) =>
                              setEmisorOverride({
                                ...emisorOverride,
                                email: e.target.value,
                              })
                            }
                            icon={
                              <span className="material-symbols-outlined">
                                email
                              </span>
                            }
                          />
                        </div>
                        <div className="rounded-lg bg-warning-light/20 p-3 text-sm text-warning-text-light">
                          <span className="material-symbols-outlined mr-2 align-middle text-base">
                            info
                          </span>
                          Los cambios solo aplican para esta factura. Para
                          actualizar permanentemente, edita tu{' '}
                          <a href="/perfil" className="underline">
                            perfil tributario
                          </a>
                          .
                        </div>
                      </div>
                    ) : (
                      /* Modo lectura */
                      <div className="rounded-lg bg-gray-50 p-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div>
                            <p className="text-dark-100 text-xs">
                              Razón Social
                            </p>
                            <p className="text-dark font-semibold">
                              {emisorOverride.razonSocial ||
                                emisorData.razonSocial}
                            </p>
                          </div>
                          <div>
                            <p className="text-dark-100 text-xs">Documento</p>
                            <p className="text-dark font-semibold">
                              {emisorOverride.documento || emisorData.documento}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-dark-100 text-xs">Dirección</p>
                            <p className="text-dark font-semibold">
                              {emisorOverride.direccion || emisorData.direccion}
                            </p>
                          </div>
                          <div>
                            <p className="text-dark-100 text-xs">Ciudad</p>
                            <p className="text-dark font-semibold">
                              {emisorOverride.ciudad || emisorData.ciudad}
                            </p>
                          </div>
                          <div>
                            <p className="text-dark-100 text-xs">Teléfono</p>
                            <p className="text-dark font-semibold">
                              {emisorOverride.telefono || emisorData.telefono}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-dark-100 text-xs">Email</p>
                            <p className="text-dark font-semibold">
                              {emisorOverride.email || emisorData.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    /* Loading state */
                    <div className="animate-pulse space-y-4">
                      <div className="h-10 rounded-lg bg-gray-200"></div>
                      <div className="h-10 rounded-lg bg-gray-200"></div>
                      <div className="h-10 rounded-lg bg-gray-200"></div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Información del cliente */}
              <Card>
                <CardBody>
                  <h2 className="text-dark mb-4 text-xl font-semibold">
                    Información del Cliente
                  </h2>

                  <div className="space-y-4">
                    {/* Selector de cliente con autocomplete */}
                    <AutocompleteCliente
                      onSelect={(cliente) => {
                        setValue('clienteId', cliente.id, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        })
                      }}
                      onClear={() => {
                        setValue('clienteId', '', {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        })
                      }}
                      onNuevoCliente={() => setIsClienteModalOpen(true)}
                      selectedClienteId={watchClienteId}
                      error={errors.clienteId?.message}
                    />

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
                    setValue={setValue}
                    errors={errors}
                    control={control}
                    responsableIVA={responsableIVA}
                  />
                </CardBody>
              </Card>

              {/* Notas adicionales */}
              <Card>
                <CardBody>
                  <h2 className="text-dark mb-4 text-xl font-semibold">
                    Notas Adicionales
                  </h2>

                  <div>
                    <label className="text-dark mb-2 block text-sm font-medium">
                      Agrega información relevante sobre esta factura
                    </label>
                    <textarea
                      {...register('notas')}
                      rows={4}
                      placeholder="Ej: Pago a 30 días, descuentos especiales, incluye transporte, etc."
                      className="border-light-200 hover:border-light-300 w-full resize-none rounded-lg border px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="text-dark-100 mt-1 text-xs">
                      Opcional - Máximo 500 caracteres
                    </p>
                    {errors.notas && (
                      <p className="text-error mt-1 text-sm">
                        {errors.notas.message}
                      </p>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Columna derecha - Vista Previa */}
            <div className="hidden 2xl:block 2xl:w-[550px] 2xl:flex-shrink-0">
              {/* Vista Previa con Wrapper Responsive */}
              <VistaPreviaWrapper
                key={watchClienteId || 'no-cliente'}
                data={debouncedFormData as Partial<CrearFacturaInput>}
                numeroFactura="PREVIEW-001"
                emisor={{
                  razonSocial:
                    emisorOverride.razonSocial || emisorData?.razonSocial,
                  documento: emisorOverride.documento || emisorData?.documento,
                  direccion: emisorOverride.direccion || emisorData?.direccion,
                  ciudad: emisorOverride.ciudad || emisorData?.ciudad,
                  telefono: emisorOverride.telefono || emisorData?.telefono,
                  email: emisorOverride.email || emisorData?.email,
                }}
                cliente={
                  clienteSeleccionado
                    ? {
                        nombre: clienteSeleccionado.nombre,
                        numeroDocumento: clienteSeleccionado.numeroDocumento,
                        tipoDocumento: clienteSeleccionado.tipoDocumento,
                        email: clienteSeleccionado.email || undefined,
                        telefono: clienteSeleccionado.telefono || undefined,
                        direccion: clienteSeleccionado.direccion || undefined,
                        ciudad: clienteSeleccionado.ciudad || undefined,
                      }
                    : undefined
                }
              />
            </div>
          </div>

          {/* Botones de acción (sticky bottom) - FUERA del flex container */}
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
              onClick={guardarBorrador}
              disabled={isSubmitting}
              className="flex-1 lg:flex-initial"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <span className="material-symbols-outlined mr-2 animate-spin">
                    progress_activity
                  </span>
                  Guardando...
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="material-symbols-outlined mr-2">save</span>
                  Guardar Borrador
                </div>
              )}
            </Button>

            <Button
              type="button"
              onClick={prepararEmision}
              disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-primary/90 lg:flex-initial"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <span className="material-symbols-outlined mr-2 animate-spin">
                    progress_activity
                  </span>
                  Procesando...
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="material-symbols-outlined mr-2">send</span>
                  Emitir Factura
                </div>
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

      {/* Modal de confirmación de emisión */}
      <ModalConfirmarEmision
        open={modalConfirmOpen}
        onClose={() => setModalConfirmOpen(false)}
        onConfirm={emitirFactura}
        datosFactura={{
          clienteNombre: clienteSeleccionado?.nombre,
          total: totales.total,
          itemsCount: watchItems?.length || 0,
        }}
        loading={isSubmitting}
      />
    </>
  )
}
