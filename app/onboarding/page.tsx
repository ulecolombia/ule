/**
 * ULE - ONBOARDING PAGE (PASO 1: DATOS PERSONALES)
 * Formulario multi-paso de onboarding con diseño Ule
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TipoDocumento } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect as Select } from '@/components/ui/select'
import { Card, CardBody } from '@/components/ui/card'
import { ProgressIndicator } from '@/components/onboarding/progress-indicator'
import { FormFieldWrapper } from '@/components/onboarding/form-field-wrapper'
import {
  departamentos,
  ciudadesPorDepartamento,
} from '@/lib/data/colombia-data'

// Schema de validación Zod para Paso 1
const paso1Schema = z.object({
  primerNombre: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(50, 'Máximo 50 caracteres'),
  segundoNombre: z
    .string()
    .max(50, 'Máximo 50 caracteres')
    .optional()
    .or(z.literal('')),
  primerApellido: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(50, 'Máximo 50 caracteres'),
  segundoApellido: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(50, 'Máximo 50 caracteres'),
  tipoDocumento: z.nativeEnum(TipoDocumento, {
    required_error: 'Tipo de documento requerido',
  }),
  numeroDocumento: z
    .string()
    .min(6, 'Mínimo 6 dígitos')
    .max(12, 'Máximo 12 dígitos')
    .regex(/^\d+$/, 'Solo números'),
  telefono: z
    .string()
    .length(10, 'Debe tener 10 dígitos')
    .regex(/^3\d{9}$/, 'Formato inválido (debe iniciar con 3)'),
  direccion: z.string().min(5, 'Dirección muy corta'),
  departamento: z.string().min(1, 'Selecciona un departamento'),
  ciudad: z.string().min(1, 'Selecciona una ciudad'),
})

type Paso1FormData = z.infer<typeof paso1Schema>

const STEPS = [
  { number: 1, title: 'Datos Personales' },
  { number: 2, title: 'Información Laboral' },
  { number: 3, title: 'Seguridad Social' },
  { number: 4, title: 'Confirmación' },
]

const DEFAULT_VALUES: Paso1FormData = {
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
  tipoDocumento: TipoDocumento.CC,
  numeroDocumento: '',
  telefono: '',
  direccion: '',
  departamento: '',
  ciudad: '',
}

export default function OnboardingPage() {
  const router = useRouter()
  const currentStep = 1
  const [isCheckingDocument, setIsCheckingDocument] = useState(false)
  const [documentError, setDocumentError] = useState<string | null>(null)
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('')
  const hasLoadedRef = useRef(false)

  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Paso1FormData>({
    resolver: zodResolver(paso1Schema),
    defaultValues: DEFAULT_VALUES,
  })

  // Cargar datos de localStorage SOLO UNA VEZ al montar
  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    try {
      const saved = localStorage.getItem('onboarding-step-1')
      if (saved) {
        const data = JSON.parse(saved) as Paso1FormData
        reset(data)
        setSelectedDepartamento(data.departamento || '')
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
  }, [reset])

  // Watch departamento para actualizar ciudades
  const watchDepartamento = watch('departamento')
  useEffect(() => {
    if (watchDepartamento !== selectedDepartamento) {
      setSelectedDepartamento(watchDepartamento)
      if (watchDepartamento) {
        setValue('ciudad', '')
      }
    }
  }, [watchDepartamento, selectedDepartamento, setValue])

  // Validar documento único con debounce
  const watchTipoDocumento = watch('tipoDocumento')
  const watchNumeroDocumento = watch('numeroDocumento')
  useEffect(() => {
    if (!watchNumeroDocumento || watchNumeroDocumento.length < 6) {
      setDocumentError(null)
      return
    }

    const timeout = setTimeout(async () => {
      setIsCheckingDocument(true)
      setDocumentError(null)

      try {
        const response = await fetch('/api/user/check-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipoDocumento: watchTipoDocumento,
            numeroDocumento: watchNumeroDocumento,
          }),
        })

        const data = await response.json()
        if (data.exists) {
          setDocumentError('Este documento ya está registrado')
        }
      } catch (error) {
        console.error('Error checking document:', error)
      } finally {
        setIsCheckingDocument(false)
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [watchTipoDocumento, watchNumeroDocumento])

  // Guardar en localStorage al enviar
  const onSubmit = async (data: Paso1FormData) => {
    if (documentError) return

    // Guardar en localStorage
    localStorage.setItem('onboarding-step-1', JSON.stringify(data))

    // Navegar a paso 2
    router.push('/onboarding/paso-2')
  }

  // Guardar al salir de la página (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const data = getValues()
      localStorage.setItem('onboarding-step-1', JSON.stringify(data))
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [getValues])

  const ciudadesDisponibles = selectedDepartamento
    ? ciudadesPorDepartamento[selectedDepartamento] || []
    : []

  return (
    <div className="bg-light-50 min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-primary">Ule</h1>
          </div>
          <h2 className="text-dark mb-2 text-3xl font-bold">
            Completa tu perfil
          </h2>
          <p className="text-dark-100">Paso 1 de 4: Datos Personales</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={STEPS.length}
            steps={STEPS}
          />
        </div>

        {/* Form Card */}
        <Card>
          <CardBody className="p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Nombres */}
              <div className="grid gap-6 sm:grid-cols-2">
                <FormFieldWrapper
                  label="Primer Nombre"
                  icon={
                    <span className="material-symbols-outlined text-base">
                      person
                    </span>
                  }
                  error={errors.primerNombre?.message}
                  required
                >
                  <Input
                    {...register('primerNombre')}
                    type="text"
                    placeholder="Juan"
                  />
                </FormFieldWrapper>

                <FormFieldWrapper
                  label="Segundo Nombre"
                  icon={
                    <span className="material-symbols-outlined text-base">
                      person
                    </span>
                  }
                  error={errors.segundoNombre?.message}
                >
                  <Input
                    {...register('segundoNombre')}
                    type="text"
                    placeholder="Carlos (opcional)"
                  />
                </FormFieldWrapper>
              </div>

              {/* Apellidos */}
              <div className="grid gap-6 sm:grid-cols-2">
                <FormFieldWrapper
                  label="Primer Apellido"
                  icon={
                    <span className="material-symbols-outlined text-base">
                      badge
                    </span>
                  }
                  error={errors.primerApellido?.message}
                  required
                >
                  <Input
                    {...register('primerApellido')}
                    type="text"
                    placeholder="González"
                  />
                </FormFieldWrapper>

                <FormFieldWrapper
                  label="Segundo Apellido"
                  icon={
                    <span className="material-symbols-outlined text-base">
                      badge
                    </span>
                  }
                  error={errors.segundoApellido?.message}
                  required
                >
                  <Input
                    {...register('segundoApellido')}
                    type="text"
                    placeholder="Pérez"
                  />
                </FormFieldWrapper>
              </div>

              {/* Tipo y Número de Documento */}
              <div className="grid gap-6 sm:grid-cols-2">
                <FormFieldWrapper
                  label="Tipo de Documento"
                  icon={
                    <span className="material-symbols-outlined text-base">
                      badge
                    </span>
                  }
                  error={errors.tipoDocumento?.message}
                  required
                >
                  <Select {...register('tipoDocumento')} className="w-full">
                    <option value={TipoDocumento.CC}>
                      CC - Cédula de Ciudadanía
                    </option>
                    <option value={TipoDocumento.CE}>
                      CE - Cédula de Extranjería
                    </option>
                    <option value={TipoDocumento.PEP}>
                      PEP - Permiso Especial de Permanencia
                    </option>
                    <option value={TipoDocumento.PASAPORTE}>
                      PASAPORTE - Pasaporte
                    </option>
                  </Select>
                </FormFieldWrapper>

                <FormFieldWrapper
                  label="Número de Documento"
                  icon={
                    <span className="material-symbols-outlined text-base">
                      fingerprint
                    </span>
                  }
                  error={documentError || errors.numeroDocumento?.message}
                  required
                >
                  <Input
                    {...register('numeroDocumento')}
                    type="text"
                    placeholder="1234567890"
                    disabled={isCheckingDocument}
                  />
                  {isCheckingDocument && (
                    <p className="text-dark-100 mt-1 text-xs">Verificando...</p>
                  )}
                </FormFieldWrapper>
              </div>

              {/* Teléfono */}
              <FormFieldWrapper
                label="Teléfono"
                icon={
                  <span className="material-symbols-outlined text-base">
                    phone
                  </span>
                }
                error={errors.telefono?.message}
                required
              >
                <Input
                  {...register('telefono')}
                  type="tel"
                  placeholder="(+57) 300 123 4567"
                  maxLength={10}
                />
              </FormFieldWrapper>

              {/* Dirección */}
              <FormFieldWrapper
                label="Dirección"
                icon={
                  <span className="material-symbols-outlined text-base">
                    home
                  </span>
                }
                error={errors.direccion?.message}
                required
              >
                <Input
                  {...register('direccion')}
                  type="text"
                  placeholder="Calle 123 # 45-67"
                />
              </FormFieldWrapper>

              {/* Departamento y Ciudad */}
              <div className="grid gap-6 sm:grid-cols-2">
                <FormFieldWrapper
                  label="Departamento"
                  icon={
                    <span className="material-symbols-outlined text-base">
                      map
                    </span>
                  }
                  error={errors.departamento?.message}
                  required
                >
                  <Select {...register('departamento')}>
                    <option value="">Seleccionar departamento</option>
                    {departamentos.map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </Select>
                </FormFieldWrapper>

                <FormFieldWrapper
                  label="Ciudad"
                  icon={
                    <span className="material-symbols-outlined text-base">
                      location_city
                    </span>
                  }
                  error={errors.ciudad?.message}
                  required
                >
                  <Select
                    {...register('ciudad')}
                    disabled={!selectedDepartamento}
                  >
                    <option value="">
                      {selectedDepartamento
                        ? 'Seleccionar ciudad'
                        : 'Primero selecciona departamento'}
                    </option>
                    {ciudadesDisponibles.map((ciudad) => (
                      <option key={ciudad} value={ciudad}>
                        {ciudad}
                      </option>
                    ))}
                  </Select>
                </FormFieldWrapper>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !!documentError || isCheckingDocument
                  }
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined mr-2 animate-spin text-base">
                        progress_activity
                      </span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      Siguiente
                      <span className="material-symbols-outlined ml-2 text-base">
                        arrow_forward
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Helper Text */}
        <p className="text-dark-100 mt-6 text-center text-sm">
          Tu información está segura y protegida. Los datos se guardan
          automáticamente.
        </p>
      </div>
    </div>
  )
}
