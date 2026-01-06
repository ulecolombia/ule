/**
 * ULE - LAYOUT DE FACTURACIÓN
 * Verifica si el usuario tiene habilitada la facturación electrónica
 * Si no la tiene, muestra el componente de solicitud
 */

'use client'

import { useSession } from 'next-auth/react'
import { useFacturacionStatus } from '@/hooks/use-facturacion-status'
import { SolicitudFacturacion } from '@/components/facturacion/solicitud-facturacion'
import { Header } from '@/components/layout/Header'

export default function FacturacionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status: sessionStatus } = useSession()
  const {
    habilitada,
    yaSolicito,
    fechaSolicitud,
    userName,
    userEmail,
    isLoading,
  } = useFacturacionStatus()

  // Mostrar loading mientras se verifica la sesión o el estado de facturación
  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <span className="material-icons-outlined animate-spin text-4xl text-gray-400">
              progress_activity
            </span>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando...</p>
          </div>
        </div>
      </div>
    )
  }

  // Si no tiene facturación habilitada, mostrar el componente de solicitud
  if (!habilitada) {
    return (
      <SolicitudFacturacion
        userName={userName || session?.user?.name || ''}
        userEmail={userEmail || session?.user?.email || ''}
        yaSolicito={yaSolicito}
        fechaSolicitud={fechaSolicitud}
      />
    )
  }

  // Si tiene facturación habilitada, mostrar el contenido normal
  return <>{children}</>
}
