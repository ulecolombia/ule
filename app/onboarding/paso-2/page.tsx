/**
 * ULE - ONBOARDING PASO 2: INFORMACIÓN LABORAL
 * Segundo paso del formulario multi-paso de onboarding
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TipoContrato } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardBody } from '@/components/ui/card'
import { MoneyInput } from '@/components/ui/currency-input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { TooltipProvider, InfoTooltip } from '@/components/ui/tooltip'
import { ProgressIndicator } from '@/components/onboarding/progress-indicator'
import { FormFieldWrapper } from '@/components/onboarding/form-field-wrapper'
import { CIIUSearchModal } from '@/components/onboarding/ciiu-search-modal'
import { PROFESIONES_COMUNES } from '@/lib/data/profesiones'
import { CODIGOS_CIIU } from '@/lib/data/codigos-ciiu'

// Schema de validación Zod para Paso 2
// tipoContrato siempre es OPS (único tipo válido para independientes)
const paso2Schema = z.object({
  tipoContrato: z.enum([TipoContrato.OPS]),
  profesion: z
    .string()
    .min(3, 'La profesión debe tener al menos 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  actividadEconomica: z
    .string()
    .regex(/^\d{4}$/, 'Selecciona un código CIIU válido'),
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

// OPS es el único tipo de contrato para trabajadores independientes en Ule
// Los otros tipos (Directo, Término Fijo, Indefinido) no aplican porque
// en esos casos el empleador liquida la seguridad social

const DEFAULT_VALUES: Paso2FormData = {
  tipoContrato: TipoContrato.OPS,
  profesion: '',
  actividadEconomica: '',
  numeroContratos: 1,
  ingresoMensualPromedio: 0,
}

export default function OnboardingPaso2Page() {
  const router = useRouter()
  const currentStep = 2
  const [showCIIUModal, setShowCIIUModal] = useState(false)
  const [showOtraProfesion, setShowOtraProfesion] = useState(false)
  const hasLoadedRef = useRef(false)

  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Paso2FormData>({
    resolver: zodResolver(paso2Schema),
    defaultValues: DEFAULT_VALUES,
  })

  // Cargar datos de localStorage SOLO UNA VEZ al montar
  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    try {
      const saved = localStorage.getItem('onboarding-step-2')
      if (saved) {
        const data = JSON.parse(saved) as Paso2FormData
        reset(data)

        // Verificar si tiene profesión personalizada
        if (
          data.profesion &&
          !PROFESIONES_COMUNES.includes(data.profesion as any)
        ) {
          setShowOtraProfesion(true)
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
  }, [reset])

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

  // Guardar en localStorage al enviar
  const onSubmit = async (data: Paso2FormData) => {
    localStorage.setItem('onboarding-step-2', JSON.stringify(data))
    router.push('/onboarding/paso-3')
  }

  const handleBack = () => {
    // Guardar datos actuales antes de salir
    const currentData = getValues()
    localStorage.setItem('onboarding-step-2', JSON.stringify(currentData))
    router.push('/onboarding')
  }

  const handleCIIUSelect = (codigo: string) => {
    setValue('actividadEconomica', codigo)
  }

  // Guardar al salir de la página
  useEffect(() => {
    const handleBeforeUnload = () => {
      const data = getValues()
      localStorage.setItem('onboarding-step-2', JSON.stringify(data))
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [getValues])

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
  const watchActividadEconomica = watch('actividadEconomica')
  const selectedCIIU = CODIGOS_CIIU.find(
    (item) => item.codigo === watchActividadEconomica
  )

  return (
    <TooltipProvider delayDuration={200}>
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
                {/* Tipo de Contrato - Informativo (siempre OPS) */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <span className="material-symbols-outlined text-primary">
                        description
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-dark font-semibold">
                          Tipo de Contrato
                        </h3>
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                          OPS
                        </span>
                      </div>
                      <p className="text-dark-100 mt-1 text-sm font-medium">
                        Orden de Prestación de Servicios
                      </p>
                      <p className="text-dark-200 mt-2 text-sm">
                        Contrato por servicios específicos sin vínculo laboral.
                        Como trabajador independiente, eres responsable de
                        liquidar tu propia seguridad social.
                      </p>
                    </div>
                  </div>
                  {/* Campo oculto para mantener el valor en el formulario */}
                  <input
                    type="hidden"
                    {...register('tipoContrato')}
                    value={TipoContrato.OPS}
                  />
                </div>

                {/* Profesión */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <label className="text-dark text-sm font-medium">
                      Profesión
                      <span className="text-error ml-1">*</span>
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
                    <p className="text-error mt-2 flex items-center gap-1 text-sm">
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
                    <label className="text-dark text-sm font-medium">
                      Actividad Económica (Código CIIU)
                      <span className="text-error ml-1">*</span>
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
                    <p className="text-dark-100 mt-2 text-xs">
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
                    <p className="text-error mt-2 flex items-center gap-1 text-sm">
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
                      <label className="text-dark text-sm font-medium">
                        Número de Contratos Activos
                        <span className="text-error ml-1">*</span>
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
                      />
                    </FormFieldWrapper>
                  </div>

                  {/* Ingreso Mensual Promedio */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <label className="text-dark text-sm font-medium">
                        Ingreso Mensual Promedio
                        <span className="text-error ml-1">*</span>
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

                    <p className="text-dark-100 mt-2 text-xs">
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
          <p className="text-dark-100 mt-6 text-center text-sm">
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
