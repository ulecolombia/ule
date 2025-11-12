'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CURRENT_TERMS_VERSION, TIPOS_TERMINOS } from '@/lib/constants/terms'

interface ModalBienvenidaProps {
  onAceptar: () => void
}

export function ModalBienvenida({ onAceptar }: ModalBienvenidaProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [aceptoTerminos, setAceptoTerminos] = useState(false)
  const [aceptoLimitaciones, setAceptoLimitaciones] = useState(false)
  const [leyoCompleto, setLeyoCompleto] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Verificar si ya aceptó términos
    verificarAceptacion()
  }, [])

  const verificarAceptacion = async () => {
    try {
      const response = await fetch('/api/asesoria/verificar-terminos')
      const data = await response.json()

      if (!data.aceptado) {
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Error al verificar términos:', error)
      setIsOpen(true) // Por seguridad, mostrar modal si hay error
    }
  }

  const handleAceptar = async () => {
    if (!aceptoTerminos || !aceptoLimitaciones) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/asesoria/aceptar-terminos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoTermino: TIPOS_TERMINOS.ASESORIA_IA,
          version: CURRENT_TERMS_VERSION,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al aceptar términos')
      }

      setIsOpen(false)
      onAceptar()
    } catch (error) {
      console.error('Error al aceptar términos:', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Error al aceptar términos. Por favor intenta nuevamente.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Debounced scroll handler para mejor performance
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Limpiar timeout anterior
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Crear nuevo timeout
    scrollTimeoutRef.current = setTimeout(() => {
      const element = e.target as HTMLDivElement
      const scrolledToBottom =
        element.scrollHeight - element.scrollTop <= element.clientHeight + 50

      if (scrolledToBottom && !leyoCompleto) {
        setLeyoCompleto(true)
      }
    }, 150) // 150ms debounce
  }, [leyoCompleto])

  // Cleanup del timeout al desmontar
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center space-x-2">
            <span className="material-symbols-outlined text-primary">
              verified_user
            </span>
            <span>Bienvenido al Asesor Tributario con IA</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4" onScroll={handleScroll}>
          <div className="space-y-4 text-sm">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <span className="material-symbols-outlined text-blue-600 mr-2">
                  info
                </span>
                ¿Qué es este servicio?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Este es un asistente de inteligencia artificial diseñado para proporcionar
                información educativa sobre tributación, contabilidad y seguridad social en Colombia.
                Está entrenado con normativa vigente y buenas prácticas del sector.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <span className="material-symbols-outlined text-green-600 mr-2">
                  check_circle
                </span>
                Lo que SÍ puedes hacer:
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Obtener información general sobre regímenes tributarios</li>
                <li>Aprender sobre el cálculo de aportes a PILA</li>
                <li>Entender requisitos de facturación electrónica</li>
                <li>Conocer obligaciones contables básicas</li>
                <li>Explorar opciones de constitución de empresas</li>
                <li>Recibir orientación educativa personalizada según tu perfil</li>
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <span className="material-symbols-outlined text-red-600 mr-2">
                  error
                </span>
                Limitaciones importantes:
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>NO es asesoría profesional certificada:</strong> Las respuestas son
                generadas por IA y no sustituyen el juicio de un contador, abogado o asesor certificado.</li>
                <li><strong>NO toma decisiones por ti:</strong> La información es orientativa.
                Tú eres responsable de tus decisiones tributarias y contables.</li>
                <li><strong>NO garantiza exactitud absoluta:</strong> Aunque se basa en normativa
                vigente, la información puede tener errores o estar desactualizada.</li>
                <li><strong>NO sustituye declaraciones oficiales:</strong> Para trámites ante DIAN
                u otras entidades, consulta directamente con ellas o con un profesional.</li>
                <li><strong>NO cubre casos complejos:</strong> Situaciones específicas o complejas
                requieren análisis profesional personalizado.</li>
              </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <span className="material-symbols-outlined text-yellow-600 mr-2">
                  shield
                </span>
                Limitación de responsabilidad:
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Al usar este servicio, aceptas que:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>La plataforma y sus operadores no son responsables por decisiones tomadas
                basadas en información del asistente de IA.</li>
                <li>Cualquier acción tributaria, contable o legal que realices es bajo tu
                exclusiva responsabilidad.</li>
                <li>En caso de duda, SIEMPRE debes consultar con un profesional certificado.</li>
                <li>La información proporcionada es de carácter general y educativo.</li>
              </ul>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <span className="material-symbols-outlined text-purple-600 mr-2">
                  recommend
                </span>
                Recomendaciones:
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Usa este servicio como punto de partida para tu aprendizaje</li>
                <li>Verifica información crítica con fuentes oficiales (DIAN, MinSalud, etc.)</li>
                <li>Para decisiones importantes, consulta con un contador o abogado certificado</li>
                <li>Mantén registros de todas tus obligaciones tributarias y contables</li>
                <li>Actualiza tu perfil para recibir orientación más personalizada</li>
              </ul>
            </div>

            {!leyoCompleto && (
              <div className="text-center text-sm text-gray-500 py-4">
                <span className="material-symbols-outlined text-2xl mb-2">
                  arrow_downward
                </span>
                <p>Desplázate hasta el final para continuar</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="space-y-4 pt-4 border-t">
          <Checkbox
            label="He leído y entiendo que este servicio proporciona información educativa automatizada y NO constituye asesoría profesional certificada."
            checked={aceptoTerminos}
            onChange={setAceptoTerminos}
            disabled={!leyoCompleto}
          />

          <Checkbox
            label="Entiendo las limitaciones del servicio y acepto que soy responsable de verificar información crítica con profesionales certificados antes de tomar decisiones importantes."
            checked={aceptoLimitaciones}
            onChange={setAceptoLimitaciones}
            disabled={!leyoCompleto}
          />

          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start space-x-2">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-sm">
                error
              </span>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={handleAceptar}
              disabled={!aceptoTerminos || !aceptoLimitaciones || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin mr-2">
                    progress_activity
                  </span>
                  Procesando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-2">check</span>
                  Acepto y deseo continuar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
