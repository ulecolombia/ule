/**
 * ULE - ONBOARDING PASO 3: SEGURIDAD SOCIAL
 * Tercer paso del formulario multi-paso de onboarding
 * Validación dinámica según normativa colombiana (SMMLV 2025)
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardBody } from '@/components/ui/card'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { TooltipProvider, InfoTooltip } from '@/components/ui/tooltip'
import { InfoBanner } from '@/components/ui/info-banner'
import { ProgressIndicator } from '@/components/onboarding/progress-indicator'
import { FormFieldWrapper } from '@/components/onboarding/form-field-wrapper'
import {
  EPS_COLOMBIA,
  FONDOS_PENSION,
  ARL_COLOMBIA,
  NIVELES_RIESGO,
  SMMLV_2025,
} from '@/lib/data/entidades-seguridad-social'
import { cn } from '@/lib/utils'

// Schema dinámico que depende de ingresoMensualPromedio del paso 2
const createPaso3Schema = (ingresoMensual: number) => {
  const requiereAfiliacion = ingresoMensual > SMMLV_2025

  return z
    .object({
      entidadSalud: z.string().min(1, 'Selecciona una EPS'),
      fechaAfiliacionSalud: z.string().optional(),
      needsHealthRegistration: z.boolean().optional(),

      entidadPension: z.string().min(1, 'Selecciona un fondo de pensión'),
      fechaAfiliacionPension: z.string().optional(),
      needsPensionRegistration: z.boolean().optional(),

      arl: z.string().optional(),
      nivelRiesgo: z.enum(['I', 'II', 'III', 'IV', 'V']).optional(),
      fechaAfiliacionArl: z.string().optional(),
    })
    .refine(
      (data) => {
        if (requiereAfiliacion && data.entidadSalud === 'NO_AFILIADO') {
          return false
        }
        return true
      },
      {
        message:
          'Debes estar afiliado a una EPS si tus ingresos superan 1 SMMLV',
        path: ['entidadSalud'],
      }
    )
    .refine(
      (data) => {
        if (requiereAfiliacion && data.entidadPension === 'NO_AFILIADO') {
          return false
        }
        return true
      },
      {
        message:
          'Debes estar afiliado a un fondo de pensión si tus ingresos superan 1 SMMLV',
        path: ['entidadPension'],
      }
    )
    .refine(
      (data) => {
        if (data.arl && data.arl !== 'NO_AFILIADO' && !data.nivelRiesgo) {
          return false
        }
        return true
      },
      {
        message: 'Debes seleccionar el nivel de riesgo si tienes ARL',
        path: ['nivelRiesgo'],
      }
    )
}

type Paso3FormData = {
  entidadSalud: string
  fechaAfiliacionSalud?: string
  needsHealthRegistration?: boolean
  entidadPension: string
  fechaAfiliacionPension?: string
  needsPensionRegistration?: boolean
  arl?: string
  nivelRiesgo?: 'I' | 'II' | 'III' | 'IV' | 'V'
  fechaAfiliacionArl?: string
}

const STEPS = [
  { number: 1, title: 'Datos Personales' },
  { number: 2, title: 'Información Laboral' },
  { number: 3, title: 'Seguridad Social' },
  { number: 4, title: 'Confirmación' },
]

const DEFAULT_VALUES: Paso3FormData = {
  entidadSalud: '',
  entidadPension: '',
  arl: '',
}

export default function OnboardingPaso3Page() {
  const router = useRouter()
  const currentStep = 3
  const [ingresoMensual, setIngresoMensual] = useState(0)
  const hasLoadedRef = useRef(false)

  // Recuperar ingreso del paso 2
  useEffect(() => {
    const paso2Data = localStorage.getItem('onboarding-step-2')
    if (paso2Data) {
      const data = JSON.parse(paso2Data)
      setIngresoMensual(data.ingresoMensualPromedio || 0)
    }
  }, [])

  // React Hook Form con schema dinámico
  const schema = createPaso3Schema(ingresoMensual)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Paso3FormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  // Cargar datos de localStorage SOLO UNA VEZ al montar
  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    try {
      const saved = localStorage.getItem('onboarding-step-3')
      if (saved) {
        const data = JSON.parse(saved) as Paso3FormData
        reset(data)
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
  }, [reset])

  // Watch para mostrar campos condicionales
  const watchEntidadSalud = watch('entidadSalud')
  const watchEntidadPension = watch('entidadPension')
  const watchArl = watch('arl')

  const showFechaAfiliacionSalud =
    watchEntidadSalud && watchEntidadSalud !== 'NO_AFILIADO'
  const showFechaAfiliacionPension =
    watchEntidadPension && watchEntidadPension !== 'NO_AFILIADO'
  const showNivelRiesgo = watchArl && watchArl !== 'NO_AFILIADO'
  const showFechaAfiliacionArl = watchArl && watchArl !== 'NO_AFILIADO'

  const showMandatoryWarning = ingresoMensual > SMMLV_2025
  const showHealthWarning = watchEntidadSalud === 'NO_AFILIADO'
  const showPensionWarning = watchEntidadPension === 'NO_AFILIADO'
  const showArlInfo = watchArl === 'NO_AFILIADO'

  // Guardar en localStorage al enviar
  const onSubmit = async (data: Paso3FormData) => {
    localStorage.setItem('onboarding-step-3', JSON.stringify(data))
    router.push('/onboarding/paso-4')
  }

  const handleBack = () => {
    const currentData = getValues()
    localStorage.setItem('onboarding-step-3', JSON.stringify(currentData))
    router.push('/onboarding/paso-2')
  }

  const handleWantHealthRegistration = () => {
    setValue('needsHealthRegistration', true)
  }

  const handleWantPensionRegistration = () => {
    setValue('needsPensionRegistration', true)
  }

  // Guardar al salir de la página
  useEffect(() => {
    const handleBeforeUnload = () => {
      const data = getValues()
      localStorage.setItem('onboarding-step-3', JSON.stringify(data))
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [getValues])

  // Fecha máxima (hoy)
  const today = new Date().toISOString().split('T')[0]

  // Opciones para selects
  const epsOptions = EPS_COLOMBIA.map((eps) => ({
    value: eps.value,
    label: eps.label,
  }))

  const pensionOptions = FONDOS_PENSION.map((fondo) => ({
    value: fondo.value,
    label: fondo.label,
  }))

  const arlOptions = ARL_COLOMBIA.map((arl) => ({
    value: arl.value,
    label: arl.label,
  }))

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
            <p className="text-dark-100">Paso 3 de 4: Seguridad Social</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <ProgressIndicator
              currentStep={currentStep}
              totalSteps={STEPS.length}
              steps={STEPS}
            />
          </div>

          {/* Banner Informativo Superior - Ingresos > SMMLV */}
          {showMandatoryWarning && (
            <div className="mb-6">
              <InfoBanner
                type="success"
                message={
                  <>
                    ✓ Tus ingresos superan 1 SMMLV (
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                    }).format(SMMLV_2025)}
                    ). La afiliación a salud y pensión es obligatoria.
                  </>
                }
              />
            </div>
          )}

          {/* Form Card */}
          <Card>
            <CardBody className="p-6 sm:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* SECCIÓN A: SALUD (EPS) */}
                <div className="space-y-4">
                  <h3 className="text-dark flex items-center gap-2 text-lg font-semibold">
                    <span className="material-symbols-outlined text-primary">
                      medical_services
                    </span>
                    Entidad Promotora de Salud (EPS)
                  </h3>

                  {/* EPS Actual */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <label className="text-dark text-sm font-medium">
                        EPS Actual
                        <span className="text-error ml-1">*</span>
                      </label>
                      <InfoTooltip
                        content="Entidad que administra tu plan de salud obligatorio"
                        side="right"
                      />
                    </div>

                    <Controller
                      name="entidadSalud"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          options={epsOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecciona tu EPS"
                          icon={
                            <span className="material-symbols-outlined text-base">
                              medical_services
                            </span>
                          }
                        />
                      )}
                    />

                    {errors.entidadSalud && (
                      <p className="text-error mt-2 flex items-center gap-1 text-sm">
                        <span className="material-symbols-outlined text-base">
                          error
                        </span>
                        {errors.entidadSalud.message}
                      </p>
                    )}
                  </div>

                  {/* Fecha de Afiliación a Salud */}
                  {showFechaAfiliacionSalud && (
                    <FormFieldWrapper
                      label="Fecha de Afiliación a EPS"
                      icon={
                        <span className="material-symbols-outlined text-base">
                          calendar_today
                        </span>
                      }
                      error={errors.fechaAfiliacionSalud?.message}
                    >
                      <Input
                        {...register('fechaAfiliacionSalud')}
                        type="date"
                        max={today}
                      />
                    </FormFieldWrapper>
                  )}

                  {/* Banner de advertencia - No afiliado a salud */}
                  {showHealthWarning && (
                    <InfoBanner
                      type="warning"
                      message="⚠️ Importante: En Colombia, la afiliación a salud es obligatoria. Si no estás afiliado, debes hacerlo lo antes posible. Podemos ayudarte con este proceso."
                      action={{
                        label: 'Quiero afiliarme',
                        onClick: handleWantHealthRegistration,
                      }}
                    />
                  )}
                </div>

                <div className="border-light-200 border-t" />

                {/* SECCIÓN B: PENSIÓN */}
                <div className="space-y-4">
                  <h3 className="text-dark flex items-center gap-2 text-lg font-semibold">
                    <span className="material-symbols-outlined text-primary">
                      savings
                    </span>
                    Fondo de Pensiones
                  </h3>

                  {/* Fondo de Pensión Actual */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <label className="text-dark text-sm font-medium">
                        Fondo de Pensión Actual
                        <span className="text-error ml-1">*</span>
                      </label>
                      <InfoTooltip
                        content="Fondo que administra tu ahorro para pensión"
                        side="right"
                      />
                    </div>

                    <Controller
                      name="entidadPension"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          options={pensionOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecciona tu fondo de pensión"
                          icon={
                            <span className="material-symbols-outlined text-base">
                              savings
                            </span>
                          }
                        />
                      )}
                    />

                    {errors.entidadPension && (
                      <p className="text-error mt-2 flex items-center gap-1 text-sm">
                        <span className="material-symbols-outlined text-base">
                          error
                        </span>
                        {errors.entidadPension.message}
                      </p>
                    )}
                  </div>

                  {/* Fecha de Afiliación a Pensión */}
                  {showFechaAfiliacionPension && (
                    <FormFieldWrapper
                      label="Fecha de Afiliación a Pensión"
                      icon={
                        <span className="material-symbols-outlined text-base">
                          calendar_today
                        </span>
                      }
                      error={errors.fechaAfiliacionPension?.message}
                    >
                      <Input
                        {...register('fechaAfiliacionPension')}
                        type="date"
                        max={today}
                      />
                    </FormFieldWrapper>
                  )}

                  {/* Banner de advertencia - No afiliado a pensión */}
                  {showPensionWarning && (
                    <InfoBanner
                      type="warning"
                      message="⚠️ Importante: La cotización a pensión es obligatoria para ingresos superiores a 1 SMMLV. Te recomendamos afiliarte pronto."
                      action={{
                        label: 'Quiero afiliarme',
                        onClick: handleWantPensionRegistration,
                      }}
                    />
                  )}
                </div>

                <div className="border-light-200 border-t" />

                {/* SECCIÓN C: ARL */}
                <div className="space-y-4">
                  <h3 className="text-dark flex items-center gap-2 text-lg font-semibold">
                    <span className="material-symbols-outlined text-primary">
                      health_and_safety
                    </span>
                    Administradora de Riesgos Laborales (ARL)
                  </h3>

                  {/* ARL Actual */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <label className="text-dark text-sm font-medium">
                        ARL Actual
                      </label>
                      <InfoTooltip
                        content="Aseguradora que cubre riesgos laborales y accidentes de trabajo"
                        side="right"
                      />
                    </div>

                    <Controller
                      name="arl"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          options={arlOptions}
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Selecciona tu ARL (opcional)"
                          icon={
                            <span className="material-symbols-outlined text-base">
                              health_and_safety
                            </span>
                          }
                        />
                      )}
                    />
                  </div>

                  {/* Nivel de Riesgo */}
                  {showNivelRiesgo && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <label className="text-dark text-sm font-medium">
                          Nivel de Riesgo
                          <span className="text-error ml-1">*</span>
                        </label>
                        <InfoTooltip
                          content="El nivel de riesgo determina el porcentaje de cotización a la ARL"
                          side="right"
                        />
                      </div>

                      <div className="space-y-2">
                        {NIVELES_RIESGO.map((nivel) => (
                          <Controller
                            key={nivel.value}
                            name="nivelRiesgo"
                            control={control}
                            render={({ field }) => (
                              <label
                                className={cn(
                                  'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-all',
                                  field.value === nivel.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-light-200 hover:border-primary/50'
                                )}
                              >
                                <input
                                  type="radio"
                                  value={nivel.value}
                                  checked={field.value === nivel.value}
                                  onChange={() => field.onChange(nivel.value)}
                                  className="sr-only"
                                />
                                <div
                                  className={cn(
                                    'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2',
                                    field.value === nivel.value
                                      ? 'border-primary bg-primary'
                                      : 'border-light-300 bg-white'
                                  )}
                                >
                                  {field.value === nivel.value && (
                                    <div className="h-2 w-2 rounded-full bg-white" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-dark font-medium">
                                    {nivel.label}
                                  </p>
                                  <p className="text-dark-100 text-sm">
                                    {nivel.description}
                                  </p>
                                </div>
                              </label>
                            )}
                          />
                        ))}
                      </div>

                      {errors.nivelRiesgo && (
                        <p className="text-error mt-2 flex items-center gap-1 text-sm">
                          <span className="material-symbols-outlined text-base">
                            error
                          </span>
                          {errors.nivelRiesgo.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Fecha de Afiliación a ARL */}
                  {showFechaAfiliacionArl && (
                    <FormFieldWrapper
                      label="Fecha de Afiliación a ARL"
                      icon={
                        <span className="material-symbols-outlined text-base">
                          calendar_today
                        </span>
                      }
                      error={errors.fechaAfiliacionArl?.message}
                    >
                      <Input
                        {...register('fechaAfiliacionArl')}
                        type="date"
                        max={today}
                      />
                    </FormFieldWrapper>
                  )}

                  {/* Banner informativo - No afiliado a ARL */}
                  {showArlInfo && (
                    <InfoBanner
                      type="info"
                      message="ℹ️ Nota: La ARL es obligatoria para trabajadores dependientes. Para contratos OPS, puede ser opcional según el contrato."
                    />
                  )}
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
    </TooltipProvider>
  )
}
