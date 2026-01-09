/**
 * PÁGINA DE HERRAMIENTAS Y CALCULADORAS TRIBUTARIAS
 * 5 calculadoras especializadas con historial
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalculadoraRetencion } from '@/components/calculadoras/calculadora-retencion'
import { CalculadoraIVA } from '@/components/calculadoras/calculadora-iva'
import { CalculadoraPILA } from '@/components/calculadoras/calculadora-pila'
import { SimuladorRegimen } from '@/components/calculadoras/simulador-regimen'
import { ConversorUVT } from '@/components/calculadoras/conversor-uvt'
import { HistorialCalculos } from '@/components/calculadoras/historial-calculos'

type CalculadoraTipo =
  | 'RETENCION_FUENTE'
  | 'IVA'
  | 'PROYECCION_PILA'
  | 'SIMULADOR_REGIMEN'
  | 'CONVERSOR_UVT'

export default function HerramientasPage() {
  const [tabActiva, setTabActiva] =
    useState<CalculadoraTipo>('RETENCION_FUENTE')

  const tabs = [
    {
      id: 'RETENCION_FUENTE' as CalculadoraTipo,
      nombre: 'Retención en la Fuente',
      icono: 'receipt_long',
      descripcion: 'Calcula la retención en la fuente según tu ingreso mensual',
    },
    {
      id: 'IVA' as CalculadoraTipo,
      nombre: 'IVA',
      icono: 'payments',
      descripcion: 'Calcula el IVA desde el valor base o desde el total',
    },
    {
      id: 'PROYECCION_PILA' as CalculadoraTipo,
      nombre: 'Proyección PILA',
      icono: 'savings',
      descripcion:
        'Proyecta tus aportes mensuales y anuales a seguridad social',
    },
    {
      id: 'SIMULADOR_REGIMEN' as CalculadoraTipo,
      nombre: 'Régimen Simple vs Ordinario',
      icono: 'compare',
      descripcion: 'Compara cuál régimen tributario te conviene más',
    },
    {
      id: 'CONVERSOR_UVT' as CalculadoraTipo,
      nombre: 'Conversor UVT',
      icono: 'currency_exchange',
      descripcion: 'Convierte entre UVT y pesos colombianos',
    },
  ]

  const renderCalculadora = () => {
    switch (tabActiva) {
      case 'RETENCION_FUENTE':
        return <CalculadoraRetencion />
      case 'IVA':
        return <CalculadoraIVA />
      case 'PROYECCION_PILA':
        return <CalculadoraPILA />
      case 'SIMULADOR_REGIMEN':
        return <SimuladorRegimen />
      case 'CONVERSOR_UVT':
        return <ConversorUVT />
      default:
        return null
    }
  }

  return (
    <div className="bg-light-50 min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-dark mb-2 flex items-center text-3xl font-bold">
            <span className="material-symbols-outlined mr-3 text-4xl text-primary">
              calculate
            </span>
            Herramientas y Calculadoras
          </h1>
          <p className="text-dark-100">
            Calculadoras tributarias y contables especializadas para personas
            naturales en Colombia
          </p>
        </div>

        {/* Tabs */}
        <Card className="mb-6 p-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={tabActiva === tab.id ? 'default' : 'outline'}
                onClick={() => setTabActiva(tab.id)}
                className="flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">
                  {tab.icono}
                </span>
                <span className="hidden sm:inline">{tab.nombre}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* Info Banner */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl text-blue-600">
              info
            </span>
            <div>
              <h3 className="text-dark mb-1 font-semibold">
                {tabs.find((t) => t.id === tabActiva)?.nombre}
              </h3>
              <p className="text-dark text-sm">
                {tabs.find((t) => t.id === tabActiva)?.descripcion}
              </p>
            </div>
          </div>
        </div>

        {/* Layout: Calculadora + Historial */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Calculadora (2 columnas) */}
          <div className="lg:col-span-2">{renderCalculadora()}</div>

          {/* Historial (1 columna) */}
          <div className="lg:col-span-1">
            <HistorialCalculos tipo={tabActiva} />
          </div>
        </div>

        {/* Footer Info */}
        <Card className="mt-6 p-6">
          <h3 className="text-dark mb-4 flex items-center text-lg font-semibold">
            <span className="material-symbols-outlined mr-2 text-primary">
              lightbulb
            </span>
            Acerca de estas herramientas
          </h3>

          <div className="text-dark space-y-4 text-sm">
            <div>
              <h4 className="mb-1 font-semibold">📊 Cálculos precisos 2026</h4>
              <p className="text-dark-100">
                Todas las calculadoras usan las tarifas y constantes vigentes
                para el año 2026 (UVT: $52,374 | SMMLV: $1,750,905 | IVA: 19%)
              </p>
            </div>

            <div>
              <h4 className="mb-1 font-semibold">💾 Historial automático</h4>
              <p className="text-dark-100">
                Todos tus cálculos se guardan automáticamente en tu historial
                para que puedas consultarlos cuando quieras
              </p>
            </div>

            <div>
              <h4 className="mb-1 font-semibold">🎓 Educativo</h4>
              <p className="text-dark-100">
                Cada calculadora te explica cómo se realizan los cálculos y qué
                significan los resultados
              </p>
            </div>

            <div>
              <h4 className="mb-1 font-semibold">⚡ En tiempo real</h4>
              <p className="text-dark-100">
                Los resultados se calculan instantáneamente sin recargar la
                página
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
