'use client'

/**
 * PÁGINA - CONFIRMACIÓN DE ELIMINACIÓN DE CUENTA
 * Usuario confirma eliminación haciendo clic en enlace del email
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ConfirmDeletionPage({
  params,
}: {
  params: { token: string }
}) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    confirmarEliminacion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const confirmarEliminacion = async () => {
    try {
      const response = await fetch('/api/privacy/confirm-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al confirmar eliminación')
      }

      setStatus('success')
      setMessage(data.message || 'Eliminación confirmada exitosamente')

      // Cerrar sesión después de 5 segundos
      setTimeout(() => {
        router.push('/login')
      }, 5000)
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'Error al confirmar eliminación')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Confirmando eliminación...</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Por favor espera un momento
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⏰</span>
            </div>
            <h2 className="text-2xl font-bold mb-3">Eliminación Confirmada</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Período de Gracia de 30 Días</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Tu cuenta será eliminada permanentemente en 30 días. Durante este tiempo,
                puedes cancelar la eliminación iniciando sesión o contactándonos.
              </p>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Serás redirigido automáticamente en 5 segundos...
            </p>

            <Button onClick={() => router.push('/login')} className="w-full">
              Ir al Inicio de Sesión
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold mb-3">Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
            <Button onClick={() => router.push('/perfil/privacidad')} variant="outline">
              Volver a Privacidad
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}
