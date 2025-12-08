'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ReporteTributario } from '@/lib/services/analisis-tributario-service'
import { ComparativaRegimenes } from '@/components/asesoria/comparativa-regimenes'
import { PasosImplementacion } from '@/components/asesoria/pasos-implementacion'
import { HistorialAnalisis } from '@/components/asesoria/historial-analisis'

export default function RegimenTributarioPage() {
  const [reporte, setReporte] = useState<ReporteTributario | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHistorial, setShowHistorial] = useState(false)

  const generarAnalisis = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/asesoria/analisis-tributario')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al generar análisis')
      }

      const data = await response.json()
      setReporte(data.reporte)

      // Mostrar alerta si hubo cambios
      if (data.comparacion?.huboCambio) {
        // Mostrar toast o alerta
      }
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          Análisis de Régimen Tributario
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Descubre qué régimen tributario es más conveniente para tu situación
        </p>
      </div>

      {/* Disclaimer Legal */}
      <Alert variant="warning" className="mb-6">
        <AlertDescription>
          <strong>Importante:</strong> Este análisis es de carácter informativo
          y educativo, basado en información general. No constituye asesoría
          tributaria profesional certificada. Para decisiones tributarias
          específicas, se recomienda consultar con un contador público o abogado
          tributarista que pueda analizar tu caso particular en detalle.
        </AlertDescription>
      </Alert>

      {/* Botones de acción */}
      <div className="mb-6 flex items-center space-x-4">
        <Button onClick={generarAnalisis} disabled={isLoading} size="lg">
          {isLoading ? (
            <>
              <span className="material-symbols-outlined mr-2 animate-spin">
                progress_activity
              </span>
              Analizando...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined mr-2">analytics</span>
              {reporte ? 'Actualizar Análisis' : 'Generar Análisis'}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowHistorial(!showHistorial)}
        >
          <span className="material-symbols-outlined mr-2">history</span>
          Historial
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Historial */}
      {showHistorial && (
        <HistorialAnalisis onClose={() => setShowHistorial(false)} />
      )}

      {/* Reporte */}
      {reporte && (
        <div className="space-y-6">
          {/* Recomendación Principal */}
          <Card className="border-primary bg-gradient-to-br from-primary/10 to-primary/5 p-8">
            <div className="text-center">
              <Badge
                variant={
                  reporte.confianzaRecomendacion === 'ALTA'
                    ? 'default'
                    : 'secondary'
                }
                className="mb-4"
              >
                Confianza {reporte.confianzaRecomendacion}
              </Badge>
              <h2 className="mb-2 text-2xl font-bold">Régimen Recomendado</h2>
              <div className="my-4 text-5xl font-bold text-primary">
                {reporte.regimenRecomendado === 'SIMPLE'
                  ? 'Régimen Simple de Tributación'
                  : reporte.regimenRecomendado === 'ORDINARIO'
                    ? 'Régimen Ordinario'
                    : 'Consultar con profesional'}
              </div>
              <p className="mx-auto max-w-2xl text-gray-600 dark:text-gray-400">
                Basado en tu perfil actual, este régimen ofrece las mejores
                condiciones tributarias y administrativas para tu situación.
              </p>
            </div>
          </Card>

          {/* Razones Legales */}
          <Card className="p-6">
            <h3 className="mb-4 flex items-center text-xl font-semibold">
              <span className="material-symbols-outlined mr-2 text-primary">
                gavel
              </span>
              Razones Legales y Normativas
            </h3>
            <ul className="space-y-2">
              {reporte.razonesLegales.map((razon, index) => (
                <li key={index} className="flex items-start">
                  <span className="material-symbols-outlined mr-2 mt-0.5 text-green-600">
                    check_circle
                  </span>
                  <span>{razon}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Razones Económicas */}
          <Card className="p-6">
            <h3 className="mb-4 flex items-center text-xl font-semibold">
              <span className="material-symbols-outlined mr-2 text-primary">
                monetization_on
              </span>
              Razones Económicas
            </h3>
            <ul className="space-y-2">
              {reporte.razonesEconomicas.map((razon, index) => (
                <li key={index} className="flex items-start">
                  <span className="material-symbols-outlined mr-2 mt-0.5 text-green-600">
                    check_circle
                  </span>
                  <span>{razon}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Comparativa de Regímenes */}
          <ComparativaRegimenes comparativa={reporte.comparativaTabla} />

          {/* Pasos a Seguir */}
          <PasosImplementacion pasos={reporte.pasosSeguir} />

          {/* Consideraciones Adicionales */}
          {reporte.consideracionesAdicionales.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-4 flex items-center text-xl font-semibold">
                <span className="material-symbols-outlined mr-2 text-primary">
                  lightbulb
                </span>
                Consideraciones Adicionales
              </h3>
              <ul className="space-y-2">
                {reporte.consideracionesAdicionales.map(
                  (consideracion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="material-symbols-outlined mr-2 mt-0.5 text-blue-600">
                        info
                      </span>
                      <span>{consideracion}</span>
                    </li>
                  )
                )}
              </ul>
            </Card>
          )}

          {/* Advertencias */}
          {reporte.advertencias.length > 0 && (
            <Alert variant="warning">
              <AlertDescription>
                <strong>Advertencias importantes:</strong>
                <ul className="mt-2 space-y-1">
                  {reporte.advertencias.map((advertencia, index) => (
                    <li key={index}>• {advertencia}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Disclaimer Final */}
          <Card className="bg-gray-50 p-6 dark:bg-gray-900">
            <div className="flex items-start space-x-3">
              <span className="material-symbols-outlined text-gray-500">
                verified_user
              </span>
              <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2 font-semibold">Sobre este análisis:</p>
                <p>
                  Este reporte fue generado el{' '}
                  {new Date(reporte.fechaAnalisis).toLocaleDateString('es-CO', {
                    dateStyle: 'long',
                  })}{' '}
                  basado en la información de tu perfil y la normativa
                  tributaria colombiana vigente (Ley 2277 de 2022 y normas
                  concordantes). La información tributaria puede cambiar, por lo
                  que recomendamos mantener este análisis actualizado y
                  consultar con un profesional antes de tomar decisiones
                  definitivas.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Estado inicial sin reporte */}
      {!reporte && !isLoading && (
        <Card className="p-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <span className="material-symbols-outlined text-4xl text-primary">
                query_stats
              </span>
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              Análisis Personalizado
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Genera un análisis tributario personalizado basado en tu perfil
              para descubrir qué régimen es más conveniente para ti.
            </p>
            <Button onClick={generarAnalisis} size="lg">
              Comenzar Análisis
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
