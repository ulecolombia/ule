/**
 * ULE - AUTORIZACIÓN DE GESTIÓN DE INFORMACIÓN
 * Consentimiento previo, expreso e informado
 * Cumplimiento Ley 1581 de 2012
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'

export default function AutorizacionPILAPage() {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  const [acepta, setAcepta] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const nombreUsuario = session?.user?.name?.split(' ')[0] || 'Usuario'

  const handleSubmit = async () => {
    if (!acepta) {
      toast.error('Debes aceptar la autorización para continuar')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch('/api/autorizacion-pila', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autorizaGestionPILA: true,
          autorizaCrearAportante: true,
          autorizaConsultarInfo: true,
          autorizaCompartirDatos: true,
          aceptaTodo: true,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al registrar autorización')
      }

      toast.success('¡Autorización registrada correctamente!')
      await updateSession({ autorizacionPILACompleta: true })

      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (error) {
      console.error('Error:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al registrar autorización'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmCancel = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="from-light-50 min-h-screen bg-gradient-to-br via-white to-primary/5">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <Logo size="md" />
          </div>

          <div className="mb-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="material-symbols-outlined text-sm">
                verified_user
              </span>
              Paso final
            </span>
          </div>

          <h1 className="text-dark mb-2 text-2xl font-bold sm:text-3xl">
            Autorización de Tratamiento de Datos
          </h1>
          <p className="text-dark-100 text-base">
            {nombreUsuario}, necesitamos tu consentimiento para gestionar tu
            información
          </p>
        </div>

        {/* Contenido de autorización */}
        <div className="border-light-200 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="border-light-100 mb-6 flex items-center gap-3 border-b pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <span className="material-symbols-outlined text-xl text-primary">
                security
              </span>
            </div>
            <div>
              <h2 className="text-dark font-semibold">
                Consentimiento Previo, Expreso e Informado
              </h2>
              <p className="text-dark-100 text-sm">
                Ley 1581 de 2012 - Protección de Datos Personales
              </p>
            </div>
          </div>

          {/* Texto de autorización */}
          <div className="prose prose-sm text-dark-100 max-w-none">
            <p className="mb-4 leading-relaxed">
              Yo, en calidad de titular de los datos, de manera{' '}
              <strong className="text-dark">
                libre, voluntaria, previa, expresa e informada
              </strong>
              , autorizo a{' '}
              <strong className="text-dark">ULE COLOMBIA S.A.S.</strong> (NIT
              901.903.414-4) para:
            </p>

            <div className="bg-light-50 mb-4 rounded-lg p-4">
              <ul className="mb-0 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined mt-0.5 text-base text-primary">
                    check_circle
                  </span>
                  <span>
                    <strong className="text-dark">Gestionar</strong> la
                    liquidación y pago de mis aportes al Sistema de Seguridad
                    Social Integral (salud, pensión y riesgos laborales) a
                    través de operadores de información PILA autorizados.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined mt-0.5 text-base text-primary">
                    check_circle
                  </span>
                  <span>
                    <strong className="text-dark">Crear y administrar</strong>{' '}
                    mi registro como aportante independiente ante las
                    plataformas de operadores de información.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined mt-0.5 text-base text-primary">
                    check_circle
                  </span>
                  <span>
                    <strong className="text-dark">Consultar y almacenar</strong>{' '}
                    información relacionada con mis aportes, historial de pagos,
                    estados de cuenta y certificados de afiliación.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined mt-0.5 text-base text-primary">
                    check_circle
                  </span>
                  <span>
                    <strong className="text-dark">Transferir</strong> mis datos
                    personales a operadores PILA, entidades del sistema de
                    seguridad social, y proveedores tecnológicos necesarios para
                    la prestación del servicio.
                  </span>
                </li>
              </ul>
            </div>

            <p className="mb-4 text-sm leading-relaxed">
              Declaro que soy mayor de edad, que la información proporcionada es
              verídica, y que conozco mis derechos como titular de datos
              personales: acceso, actualización, rectificación, supresión,
              revocación y presentación de quejas ante la SIC.
            </p>

            <p className="mb-0 text-sm leading-relaxed">
              Esta autorización podrá ser revocada en cualquier momento desde mi
              perfil en la plataforma o mediante solicitud a través de los
              canales de contacto disponibles en Ule.
            </p>
          </div>

          {/* Checkbox de aceptación */}
          <div className="border-light-100 mt-6 border-t pt-6">
            <div
              onClick={() => setAcepta(!acepta)}
              className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-all ${
                acepta
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-light-200 hover:border-light-300'
              }`}
            >
              <div
                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                  acepta
                    ? 'border-primary bg-primary text-white'
                    : 'border-light-300 bg-white'
                }`}
              >
                {acepta && (
                  <span className="material-symbols-outlined text-base">
                    check
                  </span>
                )}
              </div>
              <span className="text-dark font-medium">
                He leído, entiendo y acepto esta autorización de tratamiento de
                datos personales
              </span>
            </div>
          </div>

          {/* Links a documentos legales */}
          <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <a
              href="/legal/politica-privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-base">
                article
              </span>
              Política de Protección de Datos
            </a>
            <a
              href="/legal/terminos-condiciones"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-base">gavel</span>
              Términos y Condiciones
            </a>
          </div>
        </div>

        {/* Botones */}
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCancelModal(true)}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!acepta || isSubmitting}
            className={`flex-1 ${!acepta ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined mr-2 animate-spin text-lg">
                  sync
                </span>
                Procesando...
              </>
            ) : (
              <>
                Autorizar y Continuar
                <span className="material-symbols-outlined ml-2 text-lg">
                  arrow_forward
                </span>
              </>
            )}
          </Button>
        </div>

        {/* Nota de seguridad */}
        <div className="text-dark-100 mt-6 flex items-center justify-center gap-2 text-xs">
          <span className="material-symbols-outlined text-sm">encrypted</span>
          Tu información está protegida y cifrada
        </div>
      </div>

      {/* Modal de cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                <span className="material-symbols-outlined text-3xl text-amber-600">
                  warning
                </span>
              </div>
              <h3 className="text-dark mb-2 text-lg font-semibold">
                ¿Cancelar autorización?
              </h3>
              <p className="text-dark-100 mb-6 text-sm">
                Sin esta autorización no podrás gestionar tu seguridad social
                desde Ule. Podrás completar este paso más adelante.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1"
                >
                  Volver
                </Button>
                <Button
                  variant="outline"
                  onClick={confirmCancel}
                  className="border-error text-error hover:bg-error/10 flex-1"
                >
                  Salir
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
