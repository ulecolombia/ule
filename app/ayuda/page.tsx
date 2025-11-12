/**
 * PÁGINA CENTRO DE AYUDA
 * Guías, videos, FAQs y glosario
 */

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function AyudaPage() {
  const guiasPILA = [
    {
      titulo: 'Cómo liquidar tu PILA por primera vez',
      descripcion: 'Guía paso a paso para calcular y pagar tus aportes',
      url: '#',
    },
    {
      titulo: 'Entender el IBC (Ingreso Base de Cotización)',
      descripcion: 'Qué es, cómo se calcula y por qué es importante',
      url: '#',
    },
    {
      titulo: 'Niveles de riesgo ARL - ¿Cuál es el tuyo?',
      descripcion: 'Guía para identificar tu nivel de riesgo según tu actividad',
      url: '#',
    },
    {
      titulo: '¿Qué pasa si no pago a tiempo?',
      descripcion: 'Multas, intereses y consecuencias del pago tardío',
      url: '#',
    },
  ]

  const guiasFacturacion = [
    {
      titulo: 'Emitir tu primera factura electrónica',
      descripcion: 'Paso a paso con screenshots',
      url: '#',
    },
    {
      titulo: 'Qué es el CUFE y por qué es importante',
      descripcion: 'Código Único de Factura Electrónica',
      url: '#',
    },
    {
      titulo: 'Gestión de clientes efectiva',
      descripcion: 'Cómo organizar y mantener tu base de clientes',
      url: '#',
    },
    {
      titulo: 'Facturación recurrente y automatización',
      descripcion: 'Crea facturas automáticas para servicios mensuales',
      url: '#',
    },
  ]

  const faqsPILA = [
    {
      pregunta: '¿Qué pasa si no pago la PILA a tiempo?',
      respuesta:
        'Si no pagas antes del día 10, recibes una multa del 5% del valor del aporte por cada mes de mora, más intereses moratorios. Es muy importante pagar a tiempo para evitar sanciones.',
    },
    {
      pregunta: '¿Puedo pagar PILA si no tengo ingresos un mes?',
      respuesta:
        'Sí, pero el valor mínimo es sobre 1 SMMLV ($1.423.500 en 2025). Si no tienes ingresos, el IBC será el salario mínimo y deberás pagar los aportes sobre ese valor.',
    },
    {
      pregunta: '¿Cómo cambio mis entidades de salud, pensión o ARL?',
      respuesta:
        'Puedes cambiar de entidad una vez al año. Debes llenar un formulario de traslado en la nueva entidad que elijas. El proceso toma aproximadamente 2 meses.',
    },
    {
      pregunta: '¿Qué es el IBC y cómo se calcula?',
      respuesta:
        'El IBC (Ingreso Base de Cotización) es el valor sobre el cual se calculan tus aportes. Tiene un mínimo de 1 SMMLV y un máximo de 25 SMMLV. Si tu ingreso está fuera de ese rango, se ajusta automáticamente.',
    },
  ]

  const faqsFacturacion = [
    {
      pregunta: '¿Estoy obligado a facturar electrónicamente?',
      respuesta:
        'Sí, desde 2023 todas las personas naturales que facturen deben hacerlo electrónicamente. La DIAN exige factura electrónica con CUFE válido.',
    },
    {
      pregunta: '¿Puedo anular una factura ya emitida?',
      respuesta:
        'Sí, pero solo dentro de las 24 horas siguientes a su emisión. Después de ese tiempo, debes emitir una nota crédito para reversar la operación.',
    },
    {
      pregunta: '¿Qué información debe tener una factura?',
      respuesta:
        'Datos del emisor (tu NIT/CC), datos del cliente, descripción de productos/servicios, valores unitarios, subtotal, IVA (si aplica), total y CUFE.',
    },
    {
      pregunta: '¿Puedo facturar en dólares o moneda extranjera?',
      respuesta:
        'No directamente. Debes facturar en pesos colombianos. Si tu cliente paga en dólares, conviertes a la TRM del día de la transacción.',
    },
  ]

  const glosario = [
    {
      termino: 'IBC',
      definicion:
        'Ingreso Base de Cotización. Es el valor sobre el cual se calculan tus aportes a PILA. Mínimo 1 SMMLV ($1.423.500), máximo 25 SMMLV ($35.587.500).',
    },
    {
      termino: 'CUFE',
      definicion:
        'Código Único de Factura Electrónica. Es un código alfanumérico que identifica de manera única cada factura electrónica ante la DIAN. Se genera automáticamente al emitir.',
    },
    {
      termino: 'UVT',
      definicion:
        'Unidad de Valor Tributario. Valor de referencia para calcular impuestos, multas y sanciones. En 2025 equivale a $47.065. Se actualiza anualmente.',
    },
    {
      termino: 'ARL',
      definicion:
        'Administradora de Riesgos Laborales. Asegura contra accidentes de trabajo y enfermedades profesionales. El porcentaje de cotización varía según tu nivel de riesgo (I-V).',
    },
    {
      termino: 'SMMLV',
      definicion:
        'Salario Mínimo Mensual Legal Vigente. Es el salario mínimo establecido por el gobierno. En 2025 es de $1.423.500. Se usa como base para muchos cálculos tributarios.',
    },
    {
      termino: 'PILA',
      definicion:
        'Planilla Integrada de Liquidación de Aportes. Sistema para pagar los aportes a seguridad social (salud, pensión, ARL). El pago debe hacerse antes del día 10 de cada mes.',
    },
    {
      termino: 'Régimen Simple',
      definicion:
        'Régimen tributario opcional para personas naturales y jurídicas con ingresos anuales menores a 80.000 UVT. Unifica varios impuestos en uno solo con tarifas progresivas del 1.5% al 13.5%.',
    },
    {
      termino: 'Régimen Ordinario',
      definicion:
        'Régimen tributario general donde pagas impuesto de renta sobre la utilidad (ingresos menos gastos). La tarifa es progresiva del 0% al 39% según el nivel de renta.',
    },
  ]

  return (
    <div className="min-h-screen bg-light-50 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 flex items-center text-3xl font-bold text-dark">
            <span className="material-symbols-outlined mr-3 text-4xl text-primary">
              help_center
            </span>
            Centro de Ayuda
          </h1>
          <p className="text-dark-100">
            Guías, tutoriales y respuestas a tus preguntas sobre PILA, facturación y tributación
          </p>
        </div>

        <Tabs defaultValue="guias" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="guias">Guías</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="glosario">Glosario</TabsTrigger>
          </TabsList>

          {/* GUÍAS */}
          <TabsContent value="guias" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Guías Paso a Paso</h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center">
                    <span className="material-symbols-outlined text-primary mr-2">
                      payments
                    </span>
                    PILA - Seguridad Social
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {guiasPILA.map((guia, index) => (
                      <Card
                        key={index}
                        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                      >
                        <Link href={guia.url}>
                          <h4 className="font-semibold mb-2">{guia.titulo}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {guia.descripcion}
                          </p>
                          <div className="mt-3 text-primary text-sm flex items-center">
                            Leer guía
                            <span className="material-symbols-outlined text-sm ml-1">
                              arrow_forward
                            </span>
                          </div>
                        </Link>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center">
                    <span className="material-symbols-outlined text-primary mr-2">
                      receipt
                    </span>
                    Facturación Electrónica
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {guiasFacturacion.map((guia, index) => (
                      <Card
                        key={index}
                        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                      >
                        <Link href={guia.url}>
                          <h4 className="font-semibold mb-2">{guia.titulo}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {guia.descripcion}
                          </p>
                          <div className="mt-3 text-primary text-sm flex items-center">
                            Leer guía
                            <span className="material-symbols-outlined text-sm ml-1">
                              arrow_forward
                            </span>
                          </div>
                        </Link>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* VIDEOS */}
          <TabsContent value="videos">
            <h2 className="text-2xl font-bold mb-4">Video Tutoriales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="overflow-hidden">
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-400 mb-2">
                      play_circle
                    </span>
                    <p className="text-sm text-gray-500">Video: Cómo liquidar PILA</p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">Cómo liquidar tu PILA</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Tutorial completo de 5 minutos
                  </p>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-400 mb-2">
                      play_circle
                    </span>
                    <p className="text-sm text-gray-500">Video: Primera Factura</p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">Emite tu primera factura</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Paso a paso en 3 minutos
                  </p>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-400 mb-2">
                      play_circle
                    </span>
                    <p className="text-sm text-gray-500">Video: Asesor IA</p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">Usa el asesor con IA</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Cómo hacer preguntas efectivas
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* FAQs */}
          <TabsContent value="faqs">
            <h2 className="text-2xl font-bold mb-4">Preguntas Frecuentes</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="material-symbols-outlined text-primary mr-2">
                    payments
                  </span>
                  PILA y Seguridad Social
                </h3>
                <Accordion type="single" collapsible className="space-y-2">
                  {faqsPILA.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`pila-${index}`}
                      className="border rounded-lg px-4 bg-white dark:bg-gray-900"
                    >
                      <AccordionTrigger className="font-semibold">
                        {faq.pregunta}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-700 dark:text-gray-300">
                        {faq.respuesta}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="material-symbols-outlined text-primary mr-2">
                    receipt
                  </span>
                  Facturación Electrónica
                </h3>
                <Accordion type="single" collapsible className="space-y-2">
                  {faqsFacturacion.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`factura-${index}`}
                      className="border rounded-lg px-4 bg-white dark:bg-gray-900"
                    >
                      <AccordionTrigger className="font-semibold">
                        {faq.pregunta}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-700 dark:text-gray-300">
                        {faq.respuesta}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </TabsContent>

          {/* GLOSARIO */}
          <TabsContent value="glosario">
            <h2 className="text-2xl font-bold mb-4">Glosario de Términos</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Todos los términos tributarios y contables explicados de forma simple
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {glosario.map((item, index) => (
                <Card key={index} className="p-4">
                  <h3 className="font-bold text-lg text-primary mb-2">{item.termino}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{item.definicion}</p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="mt-8 p-6 bg-primary/10">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-4xl text-primary">
              support_agent
            </span>
            <div>
              <h3 className="text-xl font-bold mb-2">¿No encuentras lo que buscas?</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Nuestro equipo de soporte está listo para ayudarte con cualquier duda que tengas.
              </p>
              <Link
                href="/contacto"
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Contáctanos
                <span className="material-symbols-outlined ml-2">arrow_forward</span>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
