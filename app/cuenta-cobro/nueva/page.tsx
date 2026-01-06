/**
 * ULE - PÁGINA DE NUEVA CUENTA DE COBRO
 * Formulario para crear cuentas de cobro para personas naturales
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { toast } from 'sonner'

import { Header } from '@/components/layout/Header'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AutocompleteCliente } from '@/components/facturacion/autocomplete-cliente'
import { ClienteModal } from '@/components/facturacion/cliente-modal'
import { useClientes } from '@/hooks/use-clientes'
import { useDebounce } from '@/hooks/use-debounce'
import {
  calcularTotalesCuentaCobro,
  formatearMoneda,
} from '@/lib/utils/cuenta-cobro-utils'
import { ItemCuentaCobro } from '@/lib/validations/cuenta-cobro'

const STORAGE_KEY = 'ule_cuenta_cobro_borrador'

interface FormData {
  clienteId: string
  fecha: Date
  fechaVencimiento: Date | null
  items: ItemCuentaCobro[]
  notas: string
  conceptoServicio: string
  estado: 'BORRADOR' | 'EMITIDA'
}

export default function NuevaCuentaCobroPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false)
  const [modalConfirmOpen, setModalConfirmOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  // Obtener clientes
  const { clientes, mutate: mutateClientes } = useClientes(1, 999, '', 'TODOS')

  // Formulario
  const { register, watch, control, setValue } = useForm<FormData>({
    defaultValues: {
      clienteId: '',
      fecha: new Date(),
      fechaVencimiento: null,
      items: [
        {
          descripcion: '',
          cantidad: 1,
          valorUnitario: 0,
          total: 0,
        },
      ],
      notas: '',
      conceptoServicio: '',
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
  const debouncedItems = useDebounce(watchItems, 300)

  // Cargar perfil del usuario
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          setUserProfile(data.user)
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error)
      }
    }
    fetchProfile()
  }, [])

  // Calcular totales
  const totales = calcularTotalesCuentaCobro(debouncedItems || [])

  // Cliente seleccionado
  const clienteSeleccionado = clientes?.find((c) => c.id === watchClienteId)

  // Agregar nuevo item
  const agregarItem = () => {
    append({
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      total: 0,
    })
  }

  // Guardar borrador
  const guardarBorrador = async () => {
    const formData = watch()

    if (!formData.clienteId) {
      toast.error('Selecciona un cliente antes de guardar')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/cuenta-cobro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          estado: 'BORRADOR',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar')
      }

      toast.success('Borrador guardado correctamente')
      localStorage.removeItem(STORAGE_KEY)
      router.push('/cuenta-cobro/lista')
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar borrador')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Emitir cuenta de cobro
  const emitirCuenta = async () => {
    const formData = watch()

    if (!formData.clienteId) {
      toast.error('Selecciona un cliente')
      return
    }

    if (!formData.items || formData.items.length === 0) {
      toast.error('Agrega al menos un concepto')
      return
    }

    const itemsValidos = formData.items.filter(
      (item) => item.descripcion && item.valorUnitario > 0
    )

    if (itemsValidos.length === 0) {
      toast.error('Agrega al menos un concepto con descripción y valor')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/cuenta-cobro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: itemsValidos,
          estado: 'EMITIDA',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al emitir')
      }

      toast.success('Cuenta de cobro emitida correctamente')
      localStorage.removeItem(STORAGE_KEY)
      router.push('/cuenta-cobro/lista')
    } catch (error: any) {
      toast.error(error.message || 'Error al emitir cuenta de cobro')
    } finally {
      setIsSubmitting(false)
      setModalConfirmOpen(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      <Header />

      <main className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="text-dark-100 mb-4 flex items-center gap-2 text-sm">
            <Link
              href="/dashboard"
              className="transition-colors hover:text-primary"
            >
              Inicio
            </Link>
            <span className="material-symbols-outlined text-base">
              chevron_right
            </span>
            <Link
              href="/cuenta-cobro/lista"
              className="transition-colors hover:text-primary"
            >
              Cuentas de Cobro
            </Link>
            <span className="material-symbols-outlined text-base">
              chevron_right
            </span>
            <span className="text-dark">Nueva</span>
          </div>
          <h1 className="text-dark mb-2 flex items-center text-3xl font-bold">
            <span className="material-symbols-outlined mr-3 text-4xl text-primary">
              request_quote
            </span>
            Nueva Cuenta de Cobro
          </h1>
          <p className="text-dark-100">
            Crea una cuenta de cobro para tus servicios como persona natural
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Columna izquierda - Formulario */}
          <div className="space-y-6 lg:col-span-2">
            {/* Datos del emisor */}
            <Card className="border-light-200 border-2">
              <CardBody className="p-6">
                <h2 className="text-dark mb-4 flex items-center gap-2 font-semibold">
                  <span className="material-symbols-outlined text-primary">
                    person
                  </span>
                  Tus datos (Emisor)
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-dark mb-1.5 block text-sm font-medium">
                      Nombre completo
                    </label>
                    <Input
                      value={userProfile?.name || session?.user?.name || ''}
                      disabled
                      className="bg-light-50"
                    />
                  </div>
                  <div>
                    <label className="text-dark mb-1.5 block text-sm font-medium">
                      Documento
                    </label>
                    <Input
                      value={
                        userProfile?.numeroDocumento
                          ? `${userProfile.tipoDocumento || 'CC'} ${userProfile.numeroDocumento}`
                          : 'Sin documento'
                      }
                      disabled
                      className="bg-light-50"
                    />
                  </div>
                  <div>
                    <label className="text-dark mb-1.5 block text-sm font-medium">
                      Email
                    </label>
                    <Input
                      value={userProfile?.email || session?.user?.email || ''}
                      disabled
                      className="bg-light-50"
                    />
                  </div>
                  <div>
                    <label className="text-dark mb-1.5 block text-sm font-medium">
                      Teléfono
                    </label>
                    <Input
                      value={userProfile?.telefono || 'Sin teléfono'}
                      disabled
                      className="bg-light-50"
                    />
                  </div>
                </div>
                {(!userProfile?.numeroDocumento || !userProfile?.telefono) && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-amber-600">
                        warning
                      </span>
                      <div>
                        <p className="text-dark text-sm font-medium">
                          Completa tu perfil
                        </p>
                        <p className="text-dark-100 text-xs">
                          Para emitir cuentas de cobro necesitas tener tu
                          documento y teléfono registrados.
                        </p>
                        <Link
                          href="/perfil"
                          className="mt-1 inline-block text-xs text-primary hover:underline"
                        >
                          Ir a mi perfil →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Cliente */}
            <Card className="border-light-200 border-2">
              <CardBody className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-dark flex items-center gap-2 font-semibold">
                    <span className="material-symbols-outlined text-primary">
                      business
                    </span>
                    Cliente (a quien cobras)
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsClienteModalOpen(true)}
                  >
                    <span className="material-symbols-outlined mr-1 text-base">
                      add
                    </span>
                    Nuevo cliente
                  </Button>
                </div>

                <AutocompleteCliente
                  selectedClienteId={watchClienteId}
                  onSelect={(cliente) => setValue('clienteId', cliente.id)}
                  onNuevoCliente={() => setIsClienteModalOpen(true)}
                  onClear={() => setValue('clienteId', '')}
                />

                {clienteSeleccionado && (
                  <div
                    className="mt-4 rounded-lg p-4"
                    style={{ backgroundColor: '#F8F9FA' }}
                  >
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <span className="text-dark-100">Nombre:</span>{' '}
                        <span className="text-dark font-medium">
                          {clienteSeleccionado.nombre}
                        </span>
                      </div>
                      <div>
                        <span className="text-dark-100">Documento:</span>{' '}
                        <span className="text-dark font-medium">
                          {clienteSeleccionado.tipoDocumento}{' '}
                          {clienteSeleccionado.numeroDocumento}
                        </span>
                      </div>
                      {clienteSeleccionado.email && (
                        <div>
                          <span className="text-dark-100">Email:</span>{' '}
                          <span className="text-dark font-medium">
                            {clienteSeleccionado.email}
                          </span>
                        </div>
                      )}
                      {clienteSeleccionado.telefono && (
                        <div>
                          <span className="text-dark-100">Teléfono:</span>{' '}
                          <span className="text-dark font-medium">
                            {clienteSeleccionado.telefono}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Conceptos/Items */}
            <Card className="border-light-200 border-2">
              <CardBody className="p-6">
                <h2 className="text-dark mb-4 flex items-center gap-2 font-semibold">
                  <span className="material-symbols-outlined text-primary">
                    list_alt
                  </span>
                  Conceptos a cobrar
                </h2>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border-light-200 rounded-lg border p-4"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <span className="text-dark-100 text-sm font-medium">
                          Concepto {index + 1}
                        </span>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <span className="material-symbols-outlined text-lg">
                              delete
                            </span>
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4">
                        <div>
                          <label className="text-dark mb-1.5 block text-sm font-medium">
                            Descripción del servicio
                          </label>
                          <Input
                            {...register(`items.${index}.descripcion`)}
                            placeholder="Ej: Diseño de logo corporativo"
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div>
                            <label className="text-dark mb-1.5 block text-sm font-medium">
                              Cantidad
                            </label>
                            <Input
                              type="number"
                              min="1"
                              {...register(`items.${index}.cantidad`, {
                                valueAsNumber: true,
                              })}
                            />
                          </div>
                          <div>
                            <label className="text-dark mb-1.5 block text-sm font-medium">
                              Valor unitario
                            </label>
                            <Input
                              type="number"
                              min="0"
                              {...register(`items.${index}.valorUnitario`, {
                                valueAsNumber: true,
                              })}
                              placeholder="$0"
                            />
                          </div>
                          <div>
                            <label className="text-dark mb-1.5 block text-sm font-medium">
                              Total
                            </label>
                            <div className="bg-light-50 text-dark rounded-lg px-3 py-2 font-medium">
                              {formatearMoneda(
                                (watchItems[index]?.cantidad || 0) *
                                  (watchItems[index]?.valorUnitario || 0)
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={agregarItem}
                    className="w-full"
                  >
                    <span className="material-symbols-outlined mr-2 text-lg">
                      add
                    </span>
                    Agregar otro concepto
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Notas */}
            <Card className="border-light-200 border-2">
              <CardBody className="p-6">
                <h2 className="text-dark mb-4 flex items-center gap-2 font-semibold">
                  <span className="material-symbols-outlined text-primary">
                    notes
                  </span>
                  Notas adicionales
                </h2>
                <textarea
                  {...register('notas')}
                  placeholder="Observaciones, instrucciones de pago, etc."
                  className="border-light-200 text-dark placeholder:text-dark-100 w-full resize-none rounded-lg border bg-white
                           px-3 py-2
                           text-sm transition-colors focus:border-primary focus:outline-none
                           focus:ring-2 focus:ring-primary/20"
                  rows={3}
                />
              </CardBody>
            </Card>
          </div>

          {/* Columna derecha - Resumen y acciones */}
          <div className="space-y-6">
            {/* Resumen */}
            <Card className="border-light-200 sticky top-6 border-2">
              <CardBody className="p-6">
                <h2 className="text-dark mb-4 flex items-center gap-2 font-semibold">
                  <span className="material-symbols-outlined text-primary">
                    summarize
                  </span>
                  Resumen
                </h2>

                <div className="mb-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-100">Subtotal:</span>
                    <span className="text-dark font-medium">
                      {formatearMoneda(totales.subtotal)}
                    </span>
                  </div>
                  <div className="border-light-200 flex justify-between border-t pt-3">
                    <span className="text-dark font-semibold">
                      Total a cobrar:
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {formatearMoneda(totales.total)}
                    </span>
                  </div>
                </div>

                {/* Declaración */}
                <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-lg text-blue-600">
                      info
                    </span>
                    <p className="text-xs text-blue-800">
                      Al emitir esta cuenta de cobro, declaras que no eres
                      responsable del IVA según el Art. 437 del E.T.
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="space-y-3">
                  <Button
                    onClick={() => setModalConfirmOpen(true)}
                    disabled={isSubmitting || !watchClienteId}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined mr-2 animate-spin text-lg">
                          progress_activity
                        </span>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined mr-2 text-lg">
                          send
                        </span>
                        Emitir cuenta de cobro
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={guardarBorrador}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    <span className="material-symbols-outlined mr-2 text-lg">
                      save
                    </span>
                    Guardar borrador
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => router.push('/cuenta-cobro/lista')}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Info banco */}
            {userProfile?.nombreBanco && (
              <Card className="border-light-200 border-2">
                <CardBody className="p-4">
                  <h3 className="text-dark mb-2 flex items-center gap-2 text-sm font-medium">
                    <span className="material-symbols-outlined text-lg text-primary">
                      account_balance
                    </span>
                    Datos bancarios
                  </h3>
                  <div className="text-dark-100 space-y-1 text-xs">
                    <p>
                      <strong>Banco:</strong> {userProfile.nombreBanco}
                    </p>
                    <p>
                      <strong>Tipo:</strong> {userProfile.tipoCuenta}
                    </p>
                    <p>
                      <strong>Número:</strong> {userProfile.numeroCuenta}
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>

        {/* Modal de confirmación */}
        {modalConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="mx-4 w-full max-w-md">
              <CardBody className="p-6">
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <span className="material-symbols-outlined text-3xl text-primary">
                      task_alt
                    </span>
                  </div>
                  <h3 className="text-dark mb-2 text-xl font-bold">
                    ¿Emitir cuenta de cobro?
                  </h3>
                  <p className="text-dark-100 text-sm">
                    Vas a emitir una cuenta de cobro por{' '}
                    <strong className="text-primary">
                      {formatearMoneda(totales.total)}
                    </strong>
                    {clienteSeleccionado && (
                      <>
                        {' '}
                        a <strong>{clienteSeleccionado.nombre}</strong>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setModalConfirmOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={emitirCuenta} className="flex-1">
                    Sí, emitir
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Modal de cliente */}
        <ClienteModal
          mode="create"
          isOpen={isClienteModalOpen}
          onClose={() => setIsClienteModalOpen(false)}
          onSuccess={(nuevoCliente) => {
            mutateClientes()
            setValue('clienteId', nuevoCliente.id)
            setIsClienteModalOpen(false)
            toast.success('Cliente creado correctamente')
          }}
        />
      </main>
    </div>
  )
}
