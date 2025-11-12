/**
 * ULE - ONBOARDING PASO 2: INFORMACIÓN LABORAL
 * Segundo paso del formulario multi-paso de onboarding
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TipoContrato } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardBody } from '@/components/ui/card'
import { RadioCard } from '@/components/ui/radio-card'
import { MoneyInput } from '@/components/ui/currency-input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { TooltipProvider, InfoTooltip } from '@/components/ui/tooltip'
import { ProgressIndicator } from '@/components/onboarding/progress-indicator'
import { FormFieldWrapper } from '@/components/onboarding/form-field-wrapper'
import { CIIUSearchModal } from '@/components/onboarding/ciiu-search-modal'
import { useOnboardingStorage } from '@/hooks/use-onboarding-storage'
import { PROFESIONES_COMUNES } from '@/lib/data/profesiones'
import { CODIGOS_CIIU } from '@/lib/data/codigos-ciiu'

// Schema de validación Zod para Paso 2
const paso2Schema = z.object({
  tipoContrato: z.nativeEnum(TipoContrato, {
    required_error: 'Selecciona un tipo de contrato',
  }),
  profesion: z
    .string()
    .min(3, 'La profesión debe tener al menos 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  actividadEconomica: z.string().regex(/^\d{4}$/, 'Selecciona un código CIIU válido'),
  numeroContratos: z
    .number({ invalid_type_error: 'Debe ser un número' })
    .int('Debe ser un número entero')
    .min(1, 'Debe tener al menos 1 contrato')
    .max(50, 'Máximo 50 contratos'),
  ingresoMensualPromedio: z
    .number({ invalid_type_error: 'Debe ser un número' })
    .min(1, 'El ingreso debe ser mayor a 0')
    .max(999999999, 'Valor demasiado alto'),
})

export type Paso2FormData = z.infer<typeof paso2Schema>

const STEPS = [
  { number: 1, title: 'Datos Personales' },
  { number: 2, title: 'Información Laboral' },
  { number: 3, title: 'Seguridad Social' },
  { number: 4, title: 'Confirmación' },
]

const TIPOS_CONTRATO = [
  {
    value: TipoContrato.OPS,
    label: 'OPS',
    description: 'Contrato por servicios específicos sin vínculo laboral',
  },
  {
    value: TipoContrato.DIRECTO,
    label: 'Contrato Directo',
    description: 'Contrato con vínculo laboral directo',
  },
  {
    value: TipoContrato.TERMINO_FIJO,
    label: 'Término Fijo',
    description: 'Contrato con fecha de finalización definida',
  },
  {
    value: TipoContrato.TERMINO_INDEFINIDO,
    label: 'Término Indefinido',
    description: 'Contrato sin fecha de finalización',
  },
]

export default function OnboardingPaso2Page() {
  const router = useRouter()
  const [currentStep] = useState(2)
  const [showCIIUModal, setShowCIIUModal] = useState(false)
  const [showOtraProfesion, setShowOtraProfesion] = useState(false)

  // Hook de localStorage
  const { value: formData, setValue: setFormData, isLoaded } = useOnboardingStorage<Paso2FormData>(
    'onboarding-step-2',
    {
      tipoContrato: TipoContrato.OPS,
      profesion: '',
      actividadEconomica: '',
      numeroContratos: 1,
      ingresoMensualPromedio: 0,
    }
  )

  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Paso2FormData>({
    resolver: zodResolver(paso2Schema),
    defaultValues: formData,
  })

  // Cargar datos guardados cuando el componente monte
  useEffect(() => {
    if (isLoaded) {
      setValue('tipoContrato', formData.tipoContrato)
      setValue('profesion', formData.profesion)
      setValue('actividadEconomica', formData.actividadEconomica)
      setValue('numeroContratos', formData.numeroContratos)
      setValue('ingresoMensualPromedio', formData.ingresoMensualPromedio)

      // Verificar si tiene profesión personalizada
      if (
        formData.profesion &&
        !PROFESIONES_COMUNES.includes(formData.profesion as any)
      ) {
        setShowOtraProfesion(true)
      }
    }
  }, [isLoaded, formData, setValue])

  // Watch para actualizar localStorage en tiempo real
  const watchedFields = watch()
  useEffect(() => {
    if (isLoaded) {
      setFormData(watchedFields)
    }
  }, [watchedFields, setFormData, isLoaded])

  // Watch profesión para mostrar input personalizado
  const watchProfesion = watch('profesion')
  useEffect(() => {
    if (watchProfesion === 'Otra (especificar)') {
      setShowOtraProfesion(true)
      setValue('profesion', '')
    } else if (PROFESIONES_COMUNES.includes(watchProfesion as any)) {
      setShowOtraProfesion(false)
    }
  }, [watchProfesion, setValue])

  const onSubmit = async (data: Paso2FormData) => {
    // Guardar en localStorage
    setFormData(data)

    // TODO: Navegar a paso 3
    console.log('Paso 2 completado:', data)
    // router.push('/onboarding/paso-3')
  }

  const handleBack = () => {
    // Guardar datos actuales
    const currentData = watch()
    setFormData(currentData)

    router.push('/onboarding')
  }

  const handleCIIUSelect = (codigo: string) => {
    setValue('actividadEconomica', codigo)
  }

  // Opciones para select de CIIU
  const ciiuOptions = CODIGOS_CIIU.map((item) => ({
    value: item.codigo,
    label: `${item.codigo} - ${item.descripcion}`,
  }))

  // Opciones para select de profesiones
  const profesionOptions = PROFESIONES_COMUNES.map((prof) => ({
    value: prof,
    label: prof,
  }))

  // Obtener descripción del código CIIU seleccionado
  const selectedCIIU = CODIGOS_CIIU.find(
    (item) => item.codigo === watch('actividadEconomica')
  )

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-light-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-primary">Ule</h1>
            </div>
            <h2 className="mb-2 text-3xl font-bold text-dark">
              Completa tu perfil
            </h2>
            <p className="text-dark-100">Paso 2 de 4: Información Laboral</p>
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
                {/* Tipo de Contrato */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <label className="text-sm font-medium text-dark">
                      Tipo de Contrato
                      <span className="ml-1 text-error">*</span>
                    </label>
                    <InfoTooltip
                      content="Selecciona el tipo de relación contractual que tienes actualmente"
                      side="right"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {TIPOS_CONTRATO.map((tipo) => (
                      <Controller
                        key={tipo.value}
                        name="tipoContrato"
                        control={control}
                        render={({ field }) => (
                          <RadioCard
                            name="tipoContrato"
                            value={tipo.value}
                            label={tipo.label}
                            description={tipo.description}
                            selected={field.value === tipo.value}
                            onChange={field.onChange}
                            icon={
                              <span className="material-symbols-outlined text-base">
                                description
                              </span>
                            }
                          />
                        )}
                      />
                    ))}
                  </div>

                  {errors.tipoContrato && (
                    <p className="mt-2 flex items-center gap-1 text-sm text-error">
                      <span className="material-symbols-outlined text-base">
                        error
                      </span>
                      {errors.tipoContrato.message}
                    </p>
                  )}
                </div>

                {/* Profesión */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <label className="text-sm font-medium text-dark">
                      Profesión
                      <span className="ml-1 text-error">*</span>
                    </label>
                    <InfoTooltip
                      content="Indica tu profesión u oficio principal"
                      side="right"
                    />
                  </div>

                  {!showOtraProfesion ? (
                    <Controller
                      name="profesion"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          options={profesionOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecciona tu profesión"
                          icon={
                            <span className="material-symbols-outlined text-base">
                              work
                            </span>
                          }
                        />
                      )}
                    />
                  ) : (
                    <FormFieldWrapper
                      label=""
                      icon={
                        <span className="material-symbols-outlined text-base">
                          work
                        </span>
                      }
                      error={errors.profesion?.message}
                    >
                      <Input
                        {...register('profesion')}
                        type="text"
                        placeholder="Escribe tu profesión"
                      />
                    </FormFieldWrapper>
                  )}

                  {errors.profesion && (
                    <p className="mt-2 flex items-center gap-1 text-sm text-error">
                      <span className="material-symbols-outlined text-base">
                        error
                      </span>
                      {errors.profesion.message}
                    </p>
                  )}
                </div>

                {/* Actividad Económica (Código CIIU) */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <label className="text-sm font-medium text-dark">
                      Actividad Económica (Código CIIU)
                      <span className="ml-1 text-error">*</span>
                    </label>
                    <InfoTooltip
                      content="Código que identifica tu actividad económica según la DIAN"
                      side="right"
                    />
                  </div>

                  <Controller
                    name="actividadEconomica"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={ciiuOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Busca tu código CIIU"
                        icon={
                          <span className="material-symbols-outlined text-base">
                            business_center
                          </span>
                        }
                      />
                    )}
                  />

                  {selectedCIIU && (
                    <p className="mt-2 text-xs text-dark-100">
                      <strong>Categoría:</strong> {selectedCIIU.categoria}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowCIIUModal(true)}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    ¿No encuentras tu código CIIU?
                  </button>

                  {errors.actividadEconomica && (
                    <p className="mt-2 flex items-center gap-1 text-sm text-error">
                      <span className="material-symbols-outlined text-base">
                        error
                      </span>
                      {errors.actividadEconomica.message}
                    </p>
                  )}
                </div>

                {/* Número de Contratos y Ingreso Mensual */}
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Número de Contratos */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <label className="text-sm font-medium text-dark">
                        Número de Contratos Activos
                        <span className="ml-1 text-error">*</span>
                      </label>
                      <InfoTooltip
                        content="¿Con cuántas empresas o clientes tienes contratos activos actualmente?"
                        side="top"
                      />
                    </div>

                    <FormFieldWrapper
                      label=""
                      icon={
                        <span className="material-symbols-outlined text-base">
                          contract
                        </span>
                      }
                      error={errors.numeroContratos?.message}
                    >
                      <Input
                        {...register('numeroContratos', {
                          valueAsNumber: true,
                        })}
                        type="number"
                        min="1"
                        max="50"
                        defaultValue="1"
                      />
                    </FormFieldWrapper>
                  </div>

                  {/* Ingreso Mensual Promedio */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <label className="text-sm font-medium text-dark">
                        Ingreso Mensual Promedio
                        <span className="ml-1 text-error">*</span>
                      </label>
                      <InfoTooltip
                        content="Ingresa el promedio de tus ingresos mensuales antes de deducciones. Esta información es confidencial y se usa para calcular tus aportes a seguridad social."
                        side="top"
                      />
                    </div>

                    <FormFieldWrapper
                      label=""
                      icon={
                        <span className="material-symbols-outlined text-base">
                          payments
                        </span>
                      }
                      error={errors.ingresoMensualPromedio?.message}
                    >
                      <Controller
                        name="ingresoMensualPromedio"
                        control={control}
                        render={({ field }) => (
                          <MoneyInput
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value ? parseFloat(value) : 0)
                            }}
                            placeholder="Ej: $2.500.000"
                          />
                        )}
                      />
                    </FormFieldWrapper>

                    <p className="mt-2 text-xs text-dark-100">
                      <strong>Nota:</strong> Este valor determina tu base de
                      cotización para PILA
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="w-full sm:w-auto"
                  >
                    <span className="material-symbols-outlined mr-2 text-base">
                      arrow_back
                    </span>
                    Atrás
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
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
          <p className="mt-6 text-center text-sm text-dark-100">
            Tu información está segura y protegida. Los datos se guardan
            automáticamente.
          </p>
        </div>
      </div>

      {/* CIIU Search Modal */}
      <CIIUSearchModal
        isOpen={showCIIUModal}
        onClose={() => setShowCIIUModal(false)}
        onSelect={handleCIIUSelect}
      />
    </TooltipProvider>
  )
}
