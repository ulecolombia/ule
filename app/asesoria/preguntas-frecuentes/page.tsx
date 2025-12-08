'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const CATEGORIAS = {
  TODAS: 'Todas',
  SEGURIDAD_SOCIAL: 'Seguridad Social',
  FACTURACION_ELECTRONICA: 'Facturación Electrónica',
  REGIMEN_TRIBUTARIO: 'Régimen Tributario',
  OBLIGACIONES_CONTABLES: 'Obligaciones Contables',
  CONSTITUCION_EMPRESA: 'Constitución de Empresa',
  GENERAL: 'General',
}

const CATEGORIA_ICONS: Record<string, string> = {
  SEGURIDAD_SOCIAL: 'health_and_safety',
  FACTURACION_ELECTRONICA: 'receipt_long',
  REGIMEN_TRIBUTARIO: 'account_balance',
  OBLIGACIONES_CONTABLES: 'book',
  CONSTITUCION_EMPRESA: 'business',
  GENERAL: 'help_center',
}

const CATEGORIA_COLORS: Record<string, string> = {
  SEGURIDAD_SOCIAL:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  FACTURACION_ELECTRONICA:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REGIMEN_TRIBUTARIO:
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  OBLIGACIONES_CONTABLES:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  CONSTITUCION_EMPRESA:
    'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  GENERAL: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

interface FAQ {
  id: string
  pregunta: string
  descripcionCorta: string | null
  categoria: string
  vecesConsultada: number
  tags: string[]
}

export default function PreguntasFrecuentesPage() {
  const router = useRouter()
  const [faqs, setFaqs] = useState<Record<string, FAQ[]>>({})
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('TODAS')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    cargarFAQs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaActiva, busqueda])

  const cargarFAQs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoriaActiva !== 'TODAS') {
        params.append('categoria', categoriaActiva)
      }
      if (busqueda) {
        params.append('busqueda', busqueda)
      }

      const response = await fetch(`/api/asesoria/faqs?${params}`)
      const data = await response.json()
      setFaqs(data.faqs)
    } catch (error) {
      console.error('Error al cargar FAQs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClickPregunta = async (faq: FAQ) => {
    try {
      // Registrar consulta
      await fetch('/api/asesoria/faqs/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faqId: faq.id }),
      })

      // Redirigir a chat con pregunta pre-cargada
      const queryParams = new URLSearchParams({
        pregunta: faq.pregunta,
      })
      router.push(`/asesoria?${queryParams}`)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          Preguntas Frecuentes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Encuentra respuestas rápidas a las preguntas más comunes sobre
          tributación y contabilidad en Colombia
        </p>
      </div>

      {/* Búsqueda */}
      <Card className="mb-6 p-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <Input
            type="text"
            placeholder="Buscar preguntas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Botones de Categorías */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORIAS).map(([key, label]) => (
            <Button
              key={key}
              variant={categoriaActiva === key ? 'default' : 'outline'}
              onClick={() => setCategoriaActiva(key)}
              className="flex items-center space-x-2"
            >
              {key !== 'TODAS' && (
                <span className="material-symbols-outlined text-sm">
                  {CATEGORIA_ICONS[key]}
                </span>
              )}
              <span>{label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de FAQs */}
      {isLoading ? (
        <div className="py-12 text-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">
            progress_activity
          </span>
          <p className="mt-2 text-gray-500">Cargando preguntas...</p>
        </div>
      ) : Object.keys(faqs).length === 0 ? (
        <Card className="p-12 text-center">
          <span className="material-symbols-outlined mb-4 text-5xl text-gray-400">
            search_off
          </span>
          <p className="text-gray-600 dark:text-gray-400">
            No se encontraron preguntas
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(faqs).map(([categoria, preguntas]) => (
            <div key={categoria}>
              <div className="mb-4 flex items-center space-x-3">
                <span className="material-symbols-outlined text-2xl text-primary">
                  {CATEGORIA_ICONS[categoria]}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {CATEGORIAS[categoria as keyof typeof CATEGORIAS]}
                </h2>
                <Badge variant="secondary">{preguntas.length}</Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {preguntas.map((faq) => (
                  <Card
                    key={faq.id}
                    className="group cursor-pointer p-4 transition-all hover:shadow-lg"
                    onClick={() => handleClickPregunta(faq)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-start space-x-2">
                          <span className="material-symbols-outlined mt-0.5 text-primary transition-transform group-hover:scale-110">
                            help
                          </span>
                          <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-primary dark:text-white">
                            {faq.pregunta}
                          </h3>
                        </div>
                        {faq.descripcionCorta && (
                          <p className="ml-7 text-sm text-gray-600 dark:text-gray-400">
                            {faq.descripcionCorta}
                          </p>
                        )}
                        <div className="ml-7 mt-3 flex items-center space-x-3">
                          <Badge
                            variant="outline"
                            className={CATEGORIA_COLORS[categoria]}
                          >
                            {CATEGORIAS[categoria as keyof typeof CATEGORIAS]}
                          </Badge>
                          {faq.vecesConsultada > 0 && (
                            <span className="flex items-center text-xs text-gray-500">
                              <span className="material-symbols-outlined mr-1 text-xs">
                                visibility
                              </span>
                              {faq.vecesConsultada} consultas
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-gray-400 transition-all group-hover:translate-x-1 group-hover:text-primary">
                        arrow_forward
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA Final */}
      <Card className="mt-12 bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
        <h3 className="mb-2 text-xl font-semibold">
          ¿No encontraste tu pregunta?
        </h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Pregúntale directamente a nuestro asesor con IA
        </p>
        <Button size="lg" onClick={() => router.push('/asesoria')}>
          <span className="material-symbols-outlined mr-2">chat</span>
          Iniciar Chat
        </Button>
      </Card>
    </div>
  )
}
