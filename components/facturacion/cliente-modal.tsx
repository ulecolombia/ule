/**
 * ULE - MODAL DE CREAR/EDITAR CLIENTE
 * Modal completo con react-hook-form + zod para gestión de clientes
 */

'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClienteSchema } from '@/lib/validations/cliente'
import { validarDocumento } from '@/hooks/use-clientes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect as Select } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  departamentos,
  ciudadesPorDepartamento,
} from '@/lib/data/colombia-data'
import { ClienteConCount } from '@/hooks/use-clientes'

interface ClienteModalProps {
  mode: 'create' | 'edit'
  cliente?: ClienteConCount | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: any) => void
}

export function ClienteModal({
  mode,
  cliente,
  isOpen,
  onClose,
  onSuccess,
}: ClienteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documentoError, setDocumentoError] = useState<string | null>(null)
  const [isValidatingDocumento, setIsValidatingDocumento] = useState(false)

  // Inicializar tipo de documento para schema dinámico
  const [tipoDocumentoActual, setTipoDocumentoActual] = useState<string>(
    cliente?.tipoDocumento || 'CC'
  )

  // Schema dinámico basado en tipo de documento
  const schema = createClienteSchema(tipoDocumentoActual)
  type ClienteFormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: cliente?.nombre || '',
      tipoDocumento: cliente?.tipoDocumento || 'CC',
      numeroDocumento: cliente?.numeroDocumento || '',
      email: cliente?.email || '',
      telefono: cliente?.telefono || '',
      direccion: cliente?.direccion || '',
      departamento: cliente?.departamento || '',
      ciudad: cliente?.ciudad || '',
      razonSocial: cliente?.razonSocial || '',
      nombreComercial: cliente?.nombreComercial || '',
      regimenTributario: cliente?.regimenTributario || undefined,
      responsabilidadFiscal: cliente?.responsabilidadFiscal || undefined,
    },
  })

  const tipoDocumento = watch('tipoDocumento')
  const departamento = watch('departamento')
  const numeroDocumento = watch('numeroDocumento')

  // Actualizar schema cuando cambia tipo de documento
  useEffect(() => {
    setTipoDocumentoActual(tipoDocumento)
  }, [tipoDocumento])

  // Reset ciudades cuando cambia departamento
  useEffect(() => {
    if (departamento && !cliente) {
      setValue('ciudad', '')
    }
  }, [departamento, setValue, cliente])

  // Validación de documento en tiempo real (con debounce)
  useEffect(() => {
    if (!numeroDocumento || numeroDocumento.length < 5) {
      setDocumentoError(null)
      return
    }

    const timer = setTimeout(async () => {
      try {
        setIsValidatingDocumento(true)
        const exists = await validarDocumento(
          numeroDocumento,
          mode === 'edit' ? cliente?.id : undefined
        )

        if (exists) {
          setDocumentoError('Ya existe un cliente con este documento')
        } else {
          setDocumentoError(null)
        }
      } catch (error) {
        console.error('Error validando documento:', error)
      } finally {
        setIsValidatingDocumento(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [numeroDocumento, mode, cliente?.id])

  // Reset form cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      reset({
        nombre: cliente?.nombre || '',
        tipoDocumento: cliente?.tipoDocumento || 'CC',
        numeroDocumento: cliente?.numeroDocumento || '',
        email: cliente?.email || '',
        telefono: cliente?.telefono || '',
        direccion: cliente?.direccion || '',
        departamento: cliente?.departamento || '',
        ciudad: cliente?.ciudad || '',
        razonSocial: cliente?.razonSocial || '',
        nombreComercial: cliente?.nombreComercial || '',
        regimenTributario: cliente?.regimenTributario || undefined,
        responsabilidadFiscal: cliente?.responsabilidadFiscal || undefined,
      })
      setDocumentoError(null)
    }
  }, [isOpen, cliente, reset])

  const onSubmit = async (data: ClienteFormData) => {
    if (documentoError) return

    setIsSubmitting(true)
    try {
      await onSuccess(data)
    } catch (error) {
      console.error('Error al guardar cliente:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const esEmpresa = tipoDocumento === 'NIT'
  const ciudadesDisponibles = departamento
    ? ciudadesPorDepartamento[departamento] || []
    : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-dark text-2xl font-bold">
              {mode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
            </h2>
            <p className="text-dark-100 text-sm">
              {mode === 'create'
                ? 'Completa la información del cliente'
                : 'Actualiza la información del cliente'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-dark-100 hover:bg-light-100 rounded-lg p-2 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* SECCIÓN: INFORMACIÓN BÁSICA */}
          <div>
            <h3 className="text-dark mb-4 text-lg font-semibold">
              Información Básica
            </h3>
            <div className="space-y-4">
              {/* Tipo de Documento */}
              <Select
                label="Tipo de Documento *"
                error={errors.tipoDocumento?.message}
                {...register('tipoDocumento')}
                icon={<span className="material-symbols-outlined">badge</span>}
              >
                <option value="CC">CC - Cédula de Ciudadanía</option>
                <option value="CE">CE - Cédula de Extranjería</option>
                <option value="NIT">NIT - Empresa</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="TI">TI - Tarjeta de Identidad</option>
                <option value="DIE">
                  DIE - Documento de Identificación Extranjero
                </option>
              </Select>

              {/* Número de Documento */}
              <div>
                <Input
                  label="Número de Documento *"
                  placeholder={
                    tipoDocumento === 'NIT'
                      ? 'Ej: 900123456-7'
                      : 'Ej: 1234567890'
                  }
                  error={
                    errors.numeroDocumento?.message ||
                    documentoError ||
                    undefined
                  }
                  icon={
                    <span className="material-symbols-outlined">
                      fingerprint
                    </span>
                  }
                  {...register('numeroDocumento')}
                />
                {isValidatingDocumento && (
                  <p className="text-dark-100 mt-1 text-xs">
                    Validando documento...
                  </p>
                )}
                {tipoDocumento === 'NIT' && (
                  <p className="text-dark-100 mt-1 text-xs">
                    Incluye el dígito de verificación (Ej: 900123456-7)
                  </p>
                )}
              </div>

              {/* Nombre / Razón Social */}
              <Input
                label={esEmpresa ? 'Razón Social *' : 'Nombre Completo *'}
                placeholder={
                  esEmpresa ? 'Ej: Empresa S.A.S.' : 'Ej: Juan Pérez García'
                }
                error={errors.nombre?.message}
                icon={<span className="material-symbols-outlined">person</span>}
                {...register('nombre')}
              />
            </div>
          </div>

          {/* SECCIÓN: INFORMACIÓN DE CONTACTO */}
          <div>
            <h3 className="text-dark mb-4 text-lg font-semibold">
              Información de Contacto
            </h3>
            <div className="space-y-4">
              {/* Email */}
              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="ejemplo@correo.com"
                error={errors.email?.message}
                icon={<span className="material-symbols-outlined">email</span>}
                {...register('email')}
              />

              {/* Teléfono */}
              <Input
                label="Teléfono"
                type="tel"
                placeholder="3001234567"
                error={errors.telefono?.message}
                icon={<span className="material-symbols-outlined">phone</span>}
                {...register('telefono')}
              />

              {/* Dirección */}
              <Input
                label="Dirección"
                placeholder="Calle 123 # 45-67"
                error={errors.direccion?.message}
                icon={<span className="material-symbols-outlined">home</span>}
                {...register('direccion')}
              />

              {/* Departamento */}
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  Departamento
                </label>
                <Controller
                  name="departamento"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={departamentos.map((dep) => ({
                        value: dep,
                        label: dep,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecciona un departamento"
                      icon={
                        <span className="material-symbols-outlined">map</span>
                      }
                    />
                  )}
                />
                {errors.departamento && (
                  <p className="text-error mt-1.5 text-sm">
                    {errors.departamento.message}
                  </p>
                )}
              </div>

              {/* Ciudad */}
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  Ciudad
                </label>
                <Controller
                  name="ciudad"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={ciudadesDisponibles.map((city) => ({
                        value: city,
                        label: city,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={
                        departamento
                          ? 'Selecciona una ciudad'
                          : 'Primero selecciona un departamento'
                      }
                      disabled={!departamento}
                      icon={
                        <span className="material-symbols-outlined">
                          location_city
                        </span>
                      }
                    />
                  )}
                />
                {errors.ciudad && (
                  <p className="text-error mt-1.5 text-sm">
                    {errors.ciudad.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN: INFORMACIÓN FISCAL (Solo para NIT) */}
          {esEmpresa && (
            <div>
              <h3 className="text-dark mb-4 text-lg font-semibold">
                Información Fiscal
              </h3>
              <div className="space-y-4">
                {/* Nombre Comercial */}
                <Input
                  label="Nombre Comercial"
                  placeholder="Ej: Mi Tienda"
                  error={errors.nombreComercial?.message}
                  icon={
                    <span className="material-symbols-outlined">
                      storefront
                    </span>
                  }
                  {...register('nombreComercial')}
                />

                {/* Régimen Tributario */}
                <Select
                  label="Régimen Tributario"
                  error={errors.regimenTributario?.message}
                  {...register('regimenTributario')}
                  icon={
                    <span className="material-symbols-outlined">
                      account_balance
                    </span>
                  }
                >
                  <option value="">Selecciona un régimen</option>
                  <option value="SIMPLIFICADO">Simplificado</option>
                  <option value="COMUN">Común</option>
                  <option value="SIMPLE">Régimen Simple</option>
                  <option value="ORDINARIO">Ordinario</option>
                </Select>

                {/* Responsabilidad Fiscal */}
                <Select
                  label="Responsabilidad Fiscal"
                  error={errors.responsabilidadFiscal?.message}
                  {...register('responsabilidadFiscal')}
                  icon={
                    <span className="material-symbols-outlined">
                      description
                    </span>
                  }
                >
                  <option value="">Selecciona una responsabilidad</option>
                  <option value="O-13">O-13 - Gran Contribuyente</option>
                  <option value="O-15">O-15 - Autoretenedor</option>
                  <option value="O-23">O-23 - Agente de Retención IVA</option>
                  <option value="O-47">
                    O-47 - Régimen Simple de Tributación
                  </option>
                  <option value="R-99-PN">R-99-PN - No Responsable</option>
                </Select>
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="border-light-200 flex justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || !!documentoError || isValidatingDocumento
              }
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin">
                    progress_activity
                  </span>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  {mode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
