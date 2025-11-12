/**
 * PÁGINA DE CALCULADORAS TRIBUTARIAS
 * Herramientas de cálculo para gestión tributaria y contable
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalculadoraRetencion } from '@/components/calculadoras/calculadora-retencion'
import { CalculadoraIVA } from '@/components/calculadoras/calculadora-iva'
import { CalculadoraPILA } from '@/components/calculadoras/calculadora-pila'
import { ConversorUVT } from '@/components/calculadoras/conversor-uvt'
import { HistorialCalculos } from '@/components/calculadoras/historial-calculos'
import Link from 'next/link'

type CalculadoraTipo = 'RETENCION_FUENTE' | 'IVA' | 'PROYECCION_PILA' | 'CONVERSOR_UVT'

export default function CalculadorasPage() {
  const [tabActiva, setTabActiva] = useState<CalculadoraTipo>('RETENCION_FUENTE')

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
      descripcion: 'Proyecta tus aportes mensuales y anuales a seguridad social',
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
      case 'CONVERSOR_UVT':
        return <ConversorUVT />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header with Breadcrumb */}
        <div className="mb-6">
          <nav className="mb-4 flex items-center gap-2 text-sm text-dark-100">
            <Link href="/herramientas" className="hover:text-primary transition-colors">
              Herramientas
            </Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-dark font-medium">Calculadoras</span>
          </nav>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="mb-2 flex items-center text-3xl font-bold text-dark tracking-tight">
                <span className="material-symbols-outlined mr-3 text-4xl text-primary">
                  function
                </span>
                Calculadoras Tributarias
              </h1>
              <p className="text-dark-100 font-medium">
                Herramientas de cálculo precisas para gestión tributaria y contable
              </p>
            </div>

            <Link
              href="/herramientas/simuladores"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors font-medium"
            >
              <span className="material-symbols-outlined">science</span>
              <span>Ver Simuladores</span>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <Card className="mb-6 p-2 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={tabActiva === tab.id ? 'default' : 'outline'}
                onClick={() => setTabActiva(tab.id)}
                className="flex items-center gap-2 transition-all"
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
        <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl text-blue-600">
              info
            </span>
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-dark">
                {tabs.find((t) => t.id === tabActiva)?.nombre}
              </h3>
              <p className="text-sm text-dark-100">
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
        <Card className="mt-6 p-6 shadow-sm">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-dark">
            <span className="material-symbols-outlined mr-2 text-primary">
              lightbulb
            </span>
            Acerca de estas calculadoras
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="mb-2 font-semibold text-dark flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">verified</span>
                Cálculos precisos 2025
              </h4>
              <p className="text-dark-100">
                Todas las calculadoras usan las tarifas y constantes vigentes para el año 2025
                (UVT: $47,065 | SMMLV: $1,423,500 | IVA: 19%)
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="mb-2 font-semibold text-dark flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Historial automático
              </h4>
              <p className="text-dark-100">
                Todos tus cálculos se guardan automáticamente para consultar más tarde
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="mb-2 font-semibold text-dark flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">school</span>
                Educativo
              </h4>
              <p className="text-dark-100">
                Cada calculadora explica cómo se realizan los cálculos y el significado de los resultados
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="mb-2 font-semibold text-dark flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">bolt</span>
                En tiempo real
              </h4>
              <p className="text-dark-100">
                Los resultados se calculan instantáneamente sin recargar la página
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
