/**
 * ULE - AUTORIZACIÓN DE GESTIÓN DE INFORMACIÓN
 * Consentimiento previo, expreso e informado
 * Cumplimiento Ley 1581 de 2012
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

      toast.success('¡Autorización registrada!')
      await updateSession({ autorizacionPILACompleta: true })
      setTimeout(() => router.push('/dashboard'), 800)
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al registrar')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isChecking) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      {/* Header compacto */}
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <Logo size="sm" />
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            <div className="h-1 w-4 rounded-full bg-primary" />
            <div className="h-1 w-4 rounded-full bg-primary" />
            <div className="h-1 w-4 rounded-full bg-primary" />
          </div>
          <span className="text-[11px] text-gray-400">3/3</span>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-md px-4 py-5">
          {/* Título */}
          <div className="mb-5">
            <h1 className="text-lg font-semibold text-gray-900">
              Autorización de datos
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {nombreUsuario}, autoriza el tratamiento de tu información
            </p>
          </div>

          {/* Card principal */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50">
            {/* Header card */}
            <div className="flex items-center gap-2.5 rounded-t-xl border-b border-gray-200 bg-white px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <span className="material-symbols-outlined text-base text-primary">
                  verified_user
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Consentimiento Informado
                </p>
                <p className="text-[11px] text-gray-400">Ley 1581 de 2012</p>
              </div>
            </div>

            {/* Contenido legal */}
            <div className="px-4 py-4">
              <p className="text-[13px] leading-relaxed text-gray-600">
                Autorizo a{' '}
                <span className="font-medium text-gray-800">
                  ULE COLOMBIA S.A.S.
                </span>{' '}
                de manera libre, voluntaria y expresa para:
              </p>

              {/* Lista compacta */}
              <ul className="mt-3 space-y-2">
                {[
                  {
                    icon: 'payments',
                    text: 'Gestionar liquidación y pago de aportes PILA',
                  },
                  {
                    icon: 'person_add',
                    text: 'Crear mi registro como aportante independiente',
                  },
                  {
                    icon: 'search',
                    text: 'Consultar historial de pagos y certificados',
                  },
                  {
                    icon: 'share',
                    text: 'Transferir datos a operadores autorizados',
                  },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="material-symbols-outlined mt-0.5 text-[15px] text-primary">
                      {item.icon}
                    </span>
                    <span className="text-[13px] text-gray-600">
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Nota legal */}
              <p className="mt-4 text-[11px] leading-relaxed text-gray-400">
                Declaro ser mayor de edad y conocer mis derechos: acceso,
                actualización, rectificación, supresión y revocación ante la
                SIC.
              </p>
            </div>

            {/* Checkbox */}
            <div className="rounded-b-xl border-t border-gray-200 bg-white px-4 py-3">
              <button
                type="button"
                onClick={() => setAcepta(!acepta)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                  acepta
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                    acepta ? 'border-primary bg-primary' : 'border-gray-300'
                  }`}
                >
                  {acepta && (
                    <span className="material-symbols-outlined text-sm text-white">
                      check
                    </span>
                  )}
                </div>
                <span className="text-[13px] font-medium text-gray-700">
                  Acepto la autorización de tratamiento de datos
                </span>
              </button>
            </div>
          </div>

          {/* Links legales */}
          <div className="mt-4 flex justify-center gap-4 text-[12px]">
            <a
              href="/legal/politica-privacidad"
              target="_blank"
              className="text-gray-400 underline-offset-2 hover:underline"
            >
              Política de privacidad
            </a>
            <span className="text-gray-300">•</span>
            <a
              href="/legal/terminos-condiciones"
              target="_blank"
              className="text-gray-400 underline-offset-2 hover:underline"
            >
              Términos
            </a>
          </div>
        </div>
      </main>

      {/* Footer con botones */}
      <footer className="border-t border-gray-100 bg-white px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto flex max-w-md gap-3">
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            disabled={isSubmitting}
            className="h-11 flex-1 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!acepta || isSubmitting}
            className={`flex h-11 flex-[1.4] items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium text-white transition-all ${
              acepta ? 'bg-primary hover:bg-primary/90' : 'bg-gray-300'
            }`}
          >
            {isSubmitting ? (
              <span className="material-symbols-outlined animate-spin text-base">
                progress_activity
              </span>
            ) : (
              <>
                Autorizar
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-gray-300">
          Información protegida y cifrada
        </p>
      </footer>

      {/* Modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <span className="material-symbols-outlined text-2xl text-amber-600">
                warning
              </span>
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              ¿Cancelar autorización?
            </h3>
            <p className="mt-1 text-[13px] text-gray-500">
              No podrás gestionar tu seguridad social sin esta autorización.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="h-10 flex-1 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-600"
              >
                Volver
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="h-10 flex-1 rounded-lg bg-red-50 text-[13px] font-medium text-red-600"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
