/**
 * ULE - ONBOARDING PASO 4
 * Información Adicional y Confirmación Final
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { SummaryCard, SummaryField } from '@/components/onboarding/summary-card'
import { TermsModal } from '@/components/onboarding/terms-modal'
import {
  formatCurrency,
  formatPhone,
  formatDocument,
  formatTipoContrato,
  formatEstadoCivil,
  formatTipoDocumento,
} from '@/lib/utils/format'

// Zod Schema
const paso4Schema = z.object({
  estadoCivil: z.enum(
    ['SOLTERO', 'CASADO', 'UNION_LIBRE', 'DIVORCIADO', 'VIUDO'],
    {
      required_error: 'Selecciona tu estado civil',
    }
  ),
  personasACargo: z.number().min(0, 'No puede ser negativo'),
  aceptaTerminos: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
  aceptaPoliticaPrivacidad: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar la política de privacidad',
  }),
  suscribirNewsletter: z.boolean().optional(),
})

type Paso4FormData = z.infer<typeof paso4Schema>

export default function OnboardingPaso4() {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [termsModalOpen, setTermsModalOpen] = useState(false)
  const [termsModalType, setTermsModalType] = useState<'terms' | 'privacy'>(
    'terms'
  )

  // Form data from previous steps
  const [paso1Data, setPaso1Data] = useState<any>(null)
  const [paso2Data, setPaso2Data] = useState<any>(null)
  const [paso3Data, setPaso3Data] = useState<any>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Paso4FormData>({
    resolver: zodResolver(paso4Schema),
    defaultValues: {
      personasACargo: 0,
      aceptaTerminos: false,
      aceptaPoliticaPrivacidad: false,
      suscribirNewsletter: false,
    },
  })

  const estadoCivil = watch('estadoCivil')
  const personasACargo = watch('personasACargo')
  const aceptaTerminos = watch('aceptaTerminos')
  const aceptaPoliticaPrivacidad = watch('aceptaPoliticaPrivacidad')
  const suscribirNewsletter = watch('suscribirNewsletter')

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      const paso1 = localStorage.getItem('onboarding-step-1')
      const paso2 = localStorage.getItem('onboarding-step-2')
      const paso3 = localStorage.getItem('onboarding-step-3')
      const paso4 = localStorage.getItem('onboarding-step-4')

      if (paso1) setPaso1Data(JSON.parse(paso1))
      if (paso2) setPaso2Data(JSON.parse(paso2))
      if (paso3) setPaso3Data(JSON.parse(paso3))

      // Restore paso 4 data if exists
      if (paso4) {
        const data = JSON.parse(paso4)
        if (data.estadoCivil) setValue('estadoCivil', data.estadoCivil)
        if (data.personasACargo !== undefined)
          setValue('personasACargo', data.personasACargo)
        if (data.suscribirNewsletter !== undefined)
          setValue('suscribirNewsletter', data.suscribirNewsletter)
      }
    }

    loadData()
  }, [setValue])

  // Save to localStorage on change
  useEffect(() => {
    if (estadoCivil) {
      const data = {
        estadoCivil,
        personasACargo: personasACargo || 0,
        suscribirNewsletter: suscribirNewsletter || false,
      }
      localStorage.setItem('onboarding-step-4', JSON.stringify(data))
    }
  }, [estadoCivil, personasACargo, suscribirNewsletter])

  const openTermsModal = (type: 'terms' | 'privacy') => {
    setTermsModalType(type)
    setTermsModalOpen(true)
  }

  const onSubmit = async (data: Paso4FormData) => {
    try {
      setIsSubmitting(true)

      // Validate that all previous steps data exists
      if (!paso1Data) {
        toast.error(
          'Faltan datos del Paso 1. Por favor completa todos los pasos.'
        )
        router.push('/onboarding/paso-1')
        return
      }
      if (!paso2Data) {
        toast.error(
          'Faltan datos del Paso 2. Por favor completa todos los pasos.'
        )
        router.push('/onboarding/paso-2')
        return
      }
      if (!paso3Data) {
        toast.error(
          'Faltan datos del Paso 3. Por favor completa todos los pasos.'
        )
        router.push('/onboarding/paso-3')
        return
      }

      // Combine all data from 4 steps
      const completeData = {
        // Paso 1 - Campos de nombre separados
        primerNombre: paso1Data?.primerNombre,
        segundoNombre: paso1Data?.segundoNombre || null,
        primerApellido: paso1Data?.primerApellido,
        segundoApellido: paso1Data?.segundoApellido,
        tipoDocumento: paso1Data?.tipoDocumento,
        numeroDocumento: paso1Data?.numeroDocumento,
        telefono: paso1Data?.telefono,
        direccion: paso1Data?.direccion,
        ciudad: paso1Data?.ciudad,
        departamento: paso1Data?.departamento,

        // Paso 2
        tipoContrato: paso2Data?.tipoContrato,
        profesion: paso2Data?.profesion,
        actividadEconomica: paso2Data?.actividadEconomica,
        numeroContratos: paso2Data?.numeroContratos,
        ingresoMensualPromedio: paso2Data?.ingresoMensualPromedio,

        // Paso 3
        entidadSalud: paso3Data?.entidadSalud,
        fechaAfiliacionSalud: paso3Data?.fechaAfiliacionSalud || undefined,
        entidadPension: paso3Data?.entidadPension,
        fechaAfiliacionPension: paso3Data?.fechaAfiliacionPension || undefined,
        arl: paso3Data?.arl || undefined,
        nivelRiesgoARL: paso3Data?.nivelRiesgoARL
          ? parseInt(paso3Data.nivelRiesgoARL)
          : undefined,
        fechaAfiliacionARL: paso3Data?.fechaAfiliacionARL || undefined,

        // Paso 4
        estadoCivil: data.estadoCivil,
        personasACargo: data.personasACargo,
        suscribirNewsletter: data.suscribirNewsletter || false,
      }

      console.log(
        '[Paso 4] Data being sent:',
        JSON.stringify(completeData, null, 2)
      )

      // POST to API
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeData),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('[Paso 4] API Error:', result)
        console.error(
          '[Paso 4] Validation details:',
          JSON.stringify(result.details, null, 2)
        )
        // Show each validation error
        result.details?.forEach((err: any, index: number) => {
          console.error(
            `Validation Error ${index + 1}:`,
            err.path.join('.'),
            '-',
            err.message
          )
        })
        throw new Error(result.error || 'Error al guardar perfil')
      }

      // Success!
      toast.success('¡Perfil completado exitosamente! 🎉')

      // Actualizar la sesión con perfilCompleto = true
      await updateSession({ perfilCompleto: true })

      // Clean localStorage
      localStorage.removeItem('onboarding-step-1')
      localStorage.removeItem('onboarding-step-2')
      localStorage.removeItem('onboarding-step-3')
      localStorage.removeItem('onboarding-step-4')

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (error) {
      console.error('[Paso 4] Error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar perfil'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Summary fields configurations
  const paso1Fields: SummaryField[] = [
    { key: 'primerNombre', label: 'Primer Nombre' },
    { key: 'segundoNombre', label: 'Segundo Nombre', format: (v) => v || '—' },
    { key: 'primerApellido', label: 'Primer Apellido' },
    { key: 'segundoApellido', label: 'Segundo Apellido' },
    {
      key: 'tipoDocumento',
      label: 'Documento',
      format: (value) =>
        formatDocument(formatTipoDocumento(value), paso1Data?.numeroDocumento),
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      format: formatPhone,
    },
    { key: 'direccion', label: 'Dirección' },
    { key: 'ciudad', label: 'Ciudad' },
    { key: 'departamento', label: 'Departamento' },
  ]

  const paso2Fields: SummaryField[] = [
    {
      key: 'tipoContrato',
      label: 'Tipo de contrato',
      format: formatTipoContrato,
    },
    { key: 'profesion', label: 'Profesión' },
    { key: 'actividadEconomica', label: 'Actividad económica' },
    {
      key: 'numeroContratos',
      label: 'Número de contratos',
      format: (value) => `${value} contrato${value !== 1 ? 's' : ''}`,
    },
    {
      key: 'ingresoMensualPromedio',
      label: 'Ingreso mensual promedio',
      format: formatCurrency,
    },
  ]

  const paso3Fields: SummaryField[] = [
    { key: 'entidadSalud', label: 'EPS' },
    {
      key: 'fechaAfiliacionSalud',
      label: 'Fecha afiliación salud',
      format: (value) =>
        value ? new Date(value).toLocaleDateString('es-CO') : 'No especificada',
    },
    { key: 'entidadPension', label: 'Fondo de pensión' },
    {
      key: 'fechaAfiliacionPension',
      label: 'Fecha afiliación pensión',
      format: (value) =>
        value ? new Date(value).toLocaleDateString('es-CO') : 'No especificada',
    },
    { key: 'arl', label: 'ARL' },
    {
      key: 'nivelRiesgoARL',
      label: 'Nivel de riesgo',
      format: (value) => (value ? `Nivel ${value}` : 'No especificado'),
    },
  ]

  return (
    <div className="bg-light-50 min-h-screen py-8">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-dark mb-2 text-3xl font-bold">
            Paso 4 de 4: Confirmación Final
          </h1>
          <p className="text-dark-100">
            Revisa tu información y completa tu perfil
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-dark text-sm font-medium">Progreso</span>
            <span className="text-sm font-medium text-primary">100%</span>
          </div>
          <div className="bg-light-200 h-2 overflow-hidden rounded-full">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Additional Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <span className="material-symbols-outlined text-primary">
                    family_restroom
                  </span>
                </div>
                <h2 className="text-dark text-xl font-semibold">
                  Información Adicional
                </h2>
              </div>
            </CardHeader>

            <CardBody>
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Estado Civil */}
                <div className="space-y-2">
                  <label
                    htmlFor="estadoCivil"
                    className="text-dark block text-sm font-medium"
                  >
                    Estado civil <span className="text-error">*</span>
                  </label>
                  <select
                    {...register('estadoCivil')}
                    id="estadoCivil"
                    className="border-light-300 text-dark w-full rounded-lg border bg-white px-4 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Selecciona...</option>
                    <option value="SOLTERO">Soltero/a</option>
                    <option value="CASADO">Casado/a</option>
                    <option value="UNION_LIBRE">Unión Libre</option>
                    <option value="DIVORCIADO">Divorciado/a</option>
                    <option value="VIUDO">Viudo/a</option>
                  </select>
                  {errors.estadoCivil && (
                    <p className="text-error flex items-center gap-1 text-sm">
                      <span className="material-symbols-outlined text-base">
                        error
                      </span>
                      {errors.estadoCivil.message}
                    </p>
                  )}
                </div>

                {/* Personas a Cargo */}
                <Input
                  label="Personas a cargo"
                  type="number"
                  {...register('personasACargo', { valueAsNumber: true })}
                  error={errors.personasACargo?.message}
                  required
                  min={0}
                  placeholder="0"
                />
              </div>
            </CardBody>
          </Card>

          {/* Terms and Privacy */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <span className="material-symbols-outlined text-primary">
                    gavel
                  </span>
                </div>
                <h2 className="text-dark text-xl font-semibold">
                  Términos y Condiciones
                </h2>
              </div>
            </CardHeader>

            <CardBody>
              <div className="space-y-4">
                {/* Términos */}
                <Checkbox
                  label={
                    <span>
                      He leído y acepto los{' '}
                      <button
                        type="button"
                        onClick={() => openTermsModal('terms')}
                        className="font-medium text-primary hover:underline"
                      >
                        Términos y Condiciones
                      </button>
                    </span>
                  }
                  checked={aceptaTerminos || false}
                  onChange={(checked) =>
                    setValue('aceptaTerminos', checked as true)
                  }
                  error={errors.aceptaTerminos?.message}
                  required
                  name="aceptaTerminos"
                />

                {/* Privacidad */}
                <Checkbox
                  label={
                    <span>
                      He leído y acepto la{' '}
                      <button
                        type="button"
                        onClick={() => openTermsModal('privacy')}
                        className="font-medium text-primary hover:underline"
                      >
                        Política de Privacidad
                      </button>{' '}
                      según Ley 1581 de 2012
                    </span>
                  }
                  checked={aceptaPoliticaPrivacidad || false}
                  onChange={(checked) =>
                    setValue('aceptaPoliticaPrivacidad', checked as true)
                  }
                  error={errors.aceptaPoliticaPrivacidad?.message}
                  required
                  name="aceptaPoliticaPrivacidad"
                />

                {/* Newsletter */}
                <Checkbox
                  label="Quiero recibir tips, actualizaciones y novedades de Ule (opcional)"
                  checked={suscribirNewsletter || false}
                  onChange={(checked) =>
                    setValue('suscribirNewsletter', checked)
                  }
                  name="suscribirNewsletter"
                />
              </div>
            </CardBody>
          </Card>

          {/* Summary Section */}
          <div>
            <h2 className="text-dark mb-6 text-2xl font-bold">
              Resumen de tu Información
            </h2>

            <div className="space-y-6">
              {/* Paso 1 Summary */}
              {paso1Data && (
                <SummaryCard
                  title="Datos Personales"
                  icon="person"
                  data={paso1Data}
                  onEdit={() => router.push('/onboarding/paso-1')}
                  fields={paso1Fields}
                />
              )}

              {/* Paso 2 Summary */}
              {paso2Data && (
                <SummaryCard
                  title="Información Laboral"
                  icon="work"
                  data={paso2Data}
                  onEdit={() => router.push('/onboarding/paso-2')}
                  fields={paso2Fields}
                />
              )}

              {/* Paso 3 Summary */}
              {paso3Data && (
                <SummaryCard
                  title="Seguridad Social"
                  icon="health_and_safety"
                  data={paso3Data}
                  onEdit={() => router.push('/onboarding/paso-3')}
                  fields={paso3Fields}
                />
              )}

              {/* Paso 4 Summary */}
              {estadoCivil && (
                <SummaryCard
                  title="Información Adicional"
                  icon="family_restroom"
                  data={{ estadoCivil, personasACargo }}
                  onEdit={() => {}}
                  fields={[
                    {
                      key: 'estadoCivil',
                      label: 'Estado civil',
                      format: formatEstadoCivil,
                    },
                    {
                      key: 'personasACargo',
                      label: 'Personas a cargo',
                      format: (value) =>
                        `${value} persona${value !== 1 ? 's' : ''}`,
                    },
                  ]}
                />
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/onboarding/paso-3')}
              disabled={isSubmitting}
              className="flex-1"
            >
              <span className="material-symbols-outlined mr-2">arrow_back</span>
              Anterior
            </Button>

            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined mr-2 animate-spin">
                    sync
                  </span>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-2">
                    check_circle
                  </span>
                  Completar Perfil
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Terms Modal */}
      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        type={termsModalType}
      />
    </div>
  )
}
