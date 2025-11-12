'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TopFAQ {
  id: string
  pregunta: string
  categoria: string
  vecesConsultada: number
}

interface ConsultaCategoria {
  categoria: string
  _sum: {
    vecesConsultada: number | null
  }
}

interface AnalyticsData {
  topFAQs: TopFAQ[]
  consultasPorCategoria: ConsultaCategoria[]
  tendencias: TopFAQ[]
  totalConsultas: number
}

export function AnalyticsFAQs() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    cargarAnalytics()
  }, [])

  const cargarAnalytics = async () => {
    try {
      const response = await fetch('/api/asesoria/faqs/analytics')
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
          progress_activity
        </span>
        <p className="text-gray-500 mt-2">Cargando analytics...</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          No hay datos disponibles
        </p>
      </Card>
    )
  }

  const maxConsultas = analytics.topFAQs[0]?.vecesConsultada || 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics de FAQs
        </h2>
        <Badge variant="info" className="text-lg px-4 py-2">
          {analytics.totalConsultas} consultas totales
        </Badge>
      </div>

      {/* Top FAQs */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="material-symbols-outlined text-primary mr-2">
            trending_up
          </span>
          Preguntas Más Consultadas
        </h3>
        <div className="space-y-2">
          {analytics.topFAQs.map((faq, index) => (
            <div
              key={faq.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {faq.pregunta}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {faq.categoria}
                  </Badge>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-lg font-semibold text-primary">
                  {faq.vecesConsultada}
                </p>
                <p className="text-xs text-gray-500">consultas</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Consultas por Categoría */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="material-symbols-outlined text-primary mr-2">
            category
          </span>
          Consultas por Categoría
        </h3>
        <div className="space-y-3">
          {analytics.consultasPorCategoria
            .sort((a, b) => (b._sum.vecesConsultada || 0) - (a._sum.vecesConsultada || 0))
            .map((cat) => {
              const consultas = cat._sum.vecesConsultada || 0
              const porcentaje = maxConsultas > 0 ? (consultas / maxConsultas) * 100 : 0

              return (
                <div key={cat.categoria}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {cat.categoria}
                    </span>
                    <span className="font-semibold text-primary">{consultas}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      </Card>

      {/* Tendencias Recientes */}
      {analytics.tendencias.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="material-symbols-outlined text-primary mr-2">
              whatshot
            </span>
            Tendencias (últimos 30 días)
          </h3>
          <div className="space-y-2">
            {analytics.tendencias.map((faq) => (
              <div
                key={faq.id}
                className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <span className="material-symbols-outlined text-orange-500">
                  local_fire_department
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {faq.pregunta}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {faq.categoria}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
