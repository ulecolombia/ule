/**
 * INDICADOR DE PROGRESO
 * Muestra el progreso de configuración del usuario
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

interface Paso {
  titulo: string
  completado: boolean
  url: string
}

interface ProgresoData {
  porcentaje: number
  pasosPendientes: Paso[]
  completados: number
  total: number
}

export function IndicadorProgreso() {
  const [progreso, setProgreso] = useState<ProgresoData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarProgreso()
  }, [])

  const cargarProgreso = async () => {
    try {
      const response = await fetch('/api/onboarding/progreso')
      const data = await response.json()
      setProgreso(data)
    } catch (error) {
      console.error('Error al cargar progreso:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
        <div className="h-2 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  // No mostrar si no hay progreso o está completo al 100%
  if (!progreso || progreso.porcentaje === 100) return null

  return (
    <Card className="p-6 border-2 border-primary">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">Completa tu configuración</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {progreso.porcentaje}% completado
          </p>
        </div>
        <span className="material-symbols-outlined text-primary text-3xl">
          task_alt
        </span>
      </div>

      <Progress value={progreso.porcentaje} className="mb-4" />

      <div className="space-y-3">
        {progreso.pasosPendientes.map((paso, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div className="flex items-center">
              <span className="material-symbols-outlined text-gray-400 mr-3">
                {paso.completado ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span className="text-sm">{paso.titulo}</span>
            </div>
            {!paso.completado && (
              <Button size="sm" variant="ghost" asChild>
                <Link href={paso.url}>
                  Completar
                  <span className="material-symbols-outlined text-sm ml-1">
                    arrow_forward
                  </span>
                </Link>
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
