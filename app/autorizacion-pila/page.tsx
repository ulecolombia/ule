/**
 * ULE - AUTORIZACIÓN DE GESTIÓN DE INFORMACIÓN
 * Consentimiento previo, expreso e informado
 * Cumplimiento Ley 1581 de 2012
 *
 * UI/UX optimizado para móvil (Safari iOS)
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { Logo } from '@/components/ui/logo'

export default function AutorizacionPILAPage() {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  const [acepta, setAcepta] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  const nombreUsuario = session?.user?.name?.split(' ')[0] || 'Usuario'

  // Verificar en la BD si ya tiene autorización (sincronizar con sesión)
  useEffect(() => {
    const verificarAutorizacion = async () => {
      try {
        const response = await fetch('/api/autorizacion-pila')
        const data = await response.json()

        if (data.completa) {
          await updateSession({ autorizacionPILACompleta: true })
          toast.info('Ya tienes autorización PILA registrada')
          router.push('/dashboard')
          return
        }
      } catch (error) {
        console.error('Error verificando autorización:', error)
      } finally {
        setIsChecking(false)
      }
    }

    verificarAutorizacion()
  }, [router, updateSession])

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

  // Loading state con diseño mejorado
  if (isChecking) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-white to-slate-50">
        <div className="text-center">
          <div className="relative mx-auto mb-5 h-12 w-12">
            <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary"></div>
          </div>
          <p className="text-sm font-medium text-slate-500">
            Verificando autorización...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-white to-slate-50">
      {/* Header fijo con safe area */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="mx-auto max-w-lg">
          {/* Logo y progreso */}
          <div className="mb-4 flex items-center justify-between">
            <Logo size="sm" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">
                Paso 3 de 3
              </span>
              <div className="flex gap-1">
                <div className="h-1.5 w-6 rounded-full bg-primary"></div>
                <div className="h-1.5 w-6 rounded-full bg-primary"></div>
                <div className="h-1.5 w-6 rounded-full bg-primary"></div>
              </div>
            </div>
          </div>

          {/* Título */}
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Autorización de Datos
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {nombreUsuario}, necesitamos tu consentimiento
            </p>
          </div>
        </div>
      </header>

      {/* Contenido scrolleable */}
      <main className="flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto max-w-lg">
          {/* Card de consentimiento */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Header de la card */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <span className="material-symbols-outlined text-[22px] text-primary">
                  verified_user
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-900">
                  Consentimiento Informado
                </h2>
                <p className="text-xs text-slate-500">Ley 1581 de 2012</p>
              </div>
            </div>

            {/* Contenido de autorización */}
            <div className="px-5 py-5">
              <p className="text-sm leading-relaxed text-slate-600">
                Yo, en calidad de titular de los datos, de manera{' '}
                <strong className="text-slate-900">
                  libre, voluntaria, previa, expresa e informada
                </strong>
                , autorizo a{' '}
                <strong className="text-slate-900">ULE COLOMBIA S.A.S.</strong>{' '}
                para:
              </p>

              {/* Lista de permisos mejorada */}
              <div className="mt-5 space-y-3">
                {[
                  {
                    icon: 'payments',
                    title: 'Gestionar',
                    desc: 'La liquidación y pago de mis aportes al Sistema de Seguridad Social Integral.',
                  },
                  {
                    icon: 'person_add',
                    title: 'Crear y administrar',
                    desc: 'Mi registro como aportante independiente ante operadores PILA.',
                  },
                  {
                    icon: 'search',
                    title: 'Consultar y almacenar',
                    desc: 'Información de aportes, historial de pagos y certificados.',
                  },
                  {
                    icon: 'share',
                    title: 'Transferir',
                    desc: 'Mis datos a operadores PILA y entidades del sistema de seguridad social.',
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-xl bg-slate-50 p-3.5"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                      <span className="material-symbols-outlined text-lg text-primary">
                        {item.icon}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Declaración */}
              <p className="mt-5 text-xs leading-relaxed text-slate-500">
                Declaro que soy mayor de edad, que la información es verídica, y
                conozco mis derechos como titular: acceso, actualización,
                rectificación, supresión y revocación.
              </p>
            </div>

            {/* Checkbox de aceptación - Touch target grande */}
            <div className="border-t border-slate-100 px-5 py-5">
              <button
                type="button"
                onClick={() => setAcepta(!acepta)}
                className={`flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all active:scale-[0.98] ${
                  acepta
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                    acepta
                      ? 'border-primary bg-primary'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {acepta && (
                    <span className="material-symbols-outlined text-lg font-bold text-white">
                      check
                    </span>
                  )}
                </div>
                <span className="flex-1 text-sm font-medium leading-snug text-slate-700">
                  He leído, entiendo y acepto esta autorización de tratamiento
                  de datos personales
                </span>
              </button>
            </div>
          </div>

          {/* Links legales - Touch targets grandes */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-6">
            <a
              href="/legal/politica-privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5 active:bg-primary/10"
            >
              <span className="material-symbols-outlined text-lg">article</span>
              Política de Privacidad
            </a>
            <a
              href="/legal/terminos-condiciones"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5 active:bg-primary/10"
            >
              <span className="material-symbols-outlined text-lg">gavel</span>
              Términos y Condiciones
            </a>
          </div>
        </div>
      </main>

      {/* Footer sticky con safe area */}
      <footer className="sticky bottom-0 border-t border-slate-200 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mx-auto max-w-lg">
          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              disabled={isSubmitting}
              className="flex h-[52px] flex-1 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!acepta || isSubmitting}
              className={`flex h-[52px] flex-[1.5] items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] ${
                acepta
                  ? 'bg-primary hover:bg-primary/90'
                  : 'cursor-not-allowed bg-slate-300'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">
                    progress_activity
                  </span>
                  Procesando...
                </>
              ) : (
                <>
                  Autorizar
                  <span className="material-symbols-outlined text-lg">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Nota de seguridad */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <span className="material-symbols-outlined text-sm">lock</span>
            Tu información está protegida y cifrada
          </div>
        </div>
      </footer>

      {/* Modal Bottom Sheet */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="w-full max-w-md animate-[slideUp_0.3s_ease-out] rounded-t-3xl bg-white pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:rounded-2xl sm:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle del bottom sheet */}
            <div className="mb-4 flex justify-center sm:hidden">
              <div className="h-1 w-10 rounded-full bg-slate-300"></div>
            </div>

            <div className="px-6 text-center">
              {/* Icono */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
                <span className="material-symbols-outlined text-4xl text-amber-500">
                  warning
                </span>
              </div>

              {/* Contenido */}
              <h3 className="text-lg font-bold text-slate-900">
                ¿Cancelar autorización?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Sin esta autorización no podrás gestionar tu seguridad social
                desde Ule. Podrás completar este paso más adelante.
              </p>

              {/* Botones */}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={confirmCancel}
                  className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-red-200 bg-red-50 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 active:scale-[0.98]"
                >
                  Salir de Ule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyframes para animación del bottom sheet */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
