/**
 * Banner de Alertas Importantes para el Dashboard
 * Muestra notificaciones críticas como pagos próximos a vencer, perfil incompleto, etc.
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardBody } from '@/components/ui/card'

interface Alerta {
  id: string
  tipo: 'error' | 'warning' | 'info'
  titulo: string
  descripcion: string
  icono: string
  accion?: {
    texto: string
    href: string
  }
  dismissible?: boolean
}

interface AlertasResponse {
  alertas: Alerta[]
}

const ESTILOS_ALERTA = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    title: 'text-red-800',
    text: 'text-red-700',
    button: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    title: 'text-yellow-800',
    text: 'text-yellow-700',
    button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-800',
    text: 'text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
}

export function AlertasBanner() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [alertasDismissed, setAlertasDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchAlertas()
  }, [])

  const fetchAlertas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/alertas')

      if (!response.ok) {
        throw new Error('Error al cargar alertas')
      }

      const data: AlertasResponse = await response.json()
      setAlertas(data.alertas)
    } catch (error) {
      console.error('Error al cargar alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissAlerta = (alertaId: string) => {
    setAlertasDismissed((prev) => new Set(prev).add(alertaId))
  }

  const alertasVisibles = alertas.filter(
    (alerta) => !alertasDismissed.has(alerta.id)
  )

  if (loading || alertasVisibles.length === 0) {
    return null
  }

  return (
    <div className="mb-6 space-y-3">
      {alertasVisibles.map((alerta) => {
        const estilos = ESTILOS_ALERTA[alerta.tipo]

        return (
          <Card
            key={alerta.id}
            className={`${estilos.bg} ${estilos.border} border-l-4`}
          >
            <CardBody className="py-3">
              <div className="flex items-start gap-3">
                <span
                  className={`material-symbols-outlined ${estilos.icon} flex-shrink-0`}
                >
                  {alerta.icono}
                </span>

                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold ${estilos.title}`}>
                    {alerta.titulo}
                  </h3>
                  <p className={`text-sm ${estilos.text} mt-1`}>
                    {alerta.descripcion}
                  </p>

                  {alerta.accion && (
                    <Link
                      href={alerta.accion.href}
                      className={`mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${estilos.button}`}
                    >
                      {alerta.accion.texto}
                      <span className="material-symbols-outlined text-sm">
                        arrow_forward
                      </span>
                    </Link>
                  )}
                </div>

                {alerta.dismissible && (
                  <button
                    onClick={() => dismissAlerta(alerta.id)}
                    className={`flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-black/10 ${estilos.icon}`}
                    aria-label="Cerrar alerta"
                  >
                    <span className="material-symbols-outlined text-lg">
                      close
                    </span>
                  </button>
                )}
              </div>
            </CardBody>
          </Card>
        )
      })}
    </div>
  )
}
