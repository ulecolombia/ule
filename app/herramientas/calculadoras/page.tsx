/**
 * PÁGINA DE CALCULADORAS TRIBUTARIAS
 * Herramientas de cálculo para gestión tributaria y contable
 */

'use client'

import { useState, Fragment } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/Header'
import { CalculadoraRetencion } from '@/components/calculadoras/calculadora-retencion'
import { CalculadoraIVA } from '@/components/calculadoras/calculadora-iva'
import { CalculadoraPILA } from '@/components/calculadoras/calculadora-pila'
import { ConversorUVT } from '@/components/calculadoras/conversor-uvt'
import { HistorialCalculos } from '@/components/calculadoras/historial-calculos'
import Link from 'next/link'

type CalculadoraTipo =
  | 'RETENCION_FUENTE'
  | 'IVA'
  | 'PROYECCION_PILA'
  | 'CONVERSOR_UVT'

export default function CalculadorasPage() {
  const { data: session } = useSession()
  const [tabActiva, setTabActiva] =
    useState<CalculadoraTipo>('RETENCION_FUENTE')

  const handleReloadCalculo = (calculo: any) => {
    // Switch to the appropriate calculator tab
    setTabActiva(calculo.tipoCalculadora as CalculadoraTipo)
    // Note: Individual calculators would need to be refactored to accept
    // initial values as props to fully reload calculations
  }

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
    <Fragment>
      <Header userName={session?.user?.name} userEmail={session?.user?.email} />

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="text-dark-100 mb-6 flex items-center gap-2 text-sm">
            <Link
              href="/herramientas"
              className="cursor-pointer transition-colors hover:text-primary"
            >
              Herramientas
            </Link>
            <span className="material-symbols-outlined text-xs">
              chevron_right
            </span>
            <span className="text-dark font-medium">
              Calculadora Tributaria
            </span>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-primary/10 p-3">
                  <span className="material-symbols-outlined text-3xl text-primary">
                    calculate
                  </span>
                </div>
                <div>
                  <h1 className="text-dark text-3xl font-bold tracking-tight">
                    Calculadora Tributaria
                  </h1>
                  <p className="text-dark-100 mt-1 text-base">
                    Herramientas de cálculo precisas para retención, IVA, PILA y
                    UVT
                  </p>
                </div>
              </div>

              <Link
                href="/herramientas/simuladores"
                className="flex items-center gap-2 rounded-lg border-2 border-primary bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-primary hover:text-white hover:shadow-md"
              >
                <span className="material-symbols-outlined text-lg">
                  science
                </span>
                <span>Ver Simuladores</span>
              </Link>
            </div>
          </div>

          {/* Tabs - Selector de Calculadora */}
          <Card className="border-light-200 mb-6 overflow-hidden shadow-md">
            <div className="border-light-200 border-b bg-gradient-to-r from-primary/5 to-primary/10 px-5 py-4">
              <h2 className="text-dark flex items-center gap-2 text-lg font-semibold">
                <span className="material-symbols-outlined text-primary">
                  view_module
                </span>
                Selecciona una Calculadora
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTabActiva(tab.id)}
                    className={`
                      group relative flex flex-col items-center gap-3 rounded-xl p-4 transition-all
                      ${
                        tabActiva === tab.id
                          ? 'scale-105 bg-primary text-white shadow-lg'
                          : 'border-light-200 text-dark hover:scale-102 border-2 bg-white hover:border-primary hover:shadow-md'
                      }
                    `}
                  >
                    <span
                      className={`material-symbols-outlined text-3xl ${
                        tabActiva === tab.id ? 'text-white' : 'text-primary'
                      }`}
                    >
                      {tab.icono}
                    </span>
                    <span className="text-center text-sm font-semibold">
                      {tab.nombre}
                    </span>
                    {tabActiva === tab.id && (
                      <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white">
                        <span className="material-symbols-outlined text-sm text-primary">
                          check_circle
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Info Banner */}
          <div className="mb-6 overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
            <div className="flex items-start gap-4 p-5">
              <div className="rounded-lg bg-blue-100 p-2">
                <span className="material-symbols-outlined text-2xl text-blue-600">
                  info
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-dark mb-1 font-semibold">
                  {tabs.find((t) => t.id === tabActiva)?.nombre}
                </h3>
                <p className="text-dark-100 text-sm leading-relaxed">
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
              <HistorialCalculos
                tipo={tabActiva}
                onReload={handleReloadCalculo}
              />
            </div>
          </div>

          {/* Footer Info */}
          <Card className="border-light-200 mt-6 overflow-hidden shadow-md">
            <div className="border-light-200 border-b bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
              <h3 className="text-dark flex items-center gap-2 text-lg font-semibold">
                <span className="material-symbols-outlined text-amber-600">
                  lightbulb
                </span>
                Acerca de estas calculadoras
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div className="hover:scale-102 group rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 transition-all hover:shadow-md">
                  <h4 className="text-dark mb-2 flex items-center gap-2 font-semibold">
                    <div className="rounded-lg bg-emerald-100 p-1.5">
                      <span className="material-symbols-outlined text-lg text-emerald-600">
                        verified
                      </span>
                    </div>
                    Cálculos precisos 2025
                  </h4>
                  <p className="text-dark-100 leading-relaxed">
                    Todas las calculadoras usan las tarifas y constantes
                    vigentes para el año 2025 (UVT: $47,065 | SMMLV: $1,423,500
                    | IVA: 19%)
                  </p>
                </div>

                <div className="hover:scale-102 group rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 transition-all hover:shadow-md">
                  <h4 className="text-dark mb-2 flex items-center gap-2 font-semibold">
                    <div className="rounded-lg bg-blue-100 p-1.5">
                      <span className="material-symbols-outlined text-lg text-blue-600">
                        history
                      </span>
                    </div>
                    Historial automático
                  </h4>
                  <p className="text-dark-100 leading-relaxed">
                    Todos tus cálculos se guardan automáticamente para consultar
                    más tarde
                  </p>
                </div>

                <div className="hover:scale-102 group rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-5 transition-all hover:shadow-md">
                  <h4 className="text-dark mb-2 flex items-center gap-2 font-semibold">
                    <div className="rounded-lg bg-purple-100 p-1.5">
                      <span className="material-symbols-outlined text-lg text-purple-600">
                        school
                      </span>
                    </div>
                    Educativo
                  </h4>
                  <p className="text-dark-100 leading-relaxed">
                    Cada calculadora explica cómo se realizan los cálculos y el
                    significado de los resultados
                  </p>
                </div>

                <div className="hover:scale-102 group rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 transition-all hover:shadow-md">
                  <h4 className="text-dark mb-2 flex items-center gap-2 font-semibold">
                    <div className="rounded-lg bg-amber-100 p-1.5">
                      <span className="material-symbols-outlined text-lg text-amber-600">
                        bolt
                      </span>
                    </div>
                    En tiempo real
                  </h4>
                  <p className="text-dark-100 leading-relaxed">
                    Los resultados se calculan instantáneamente sin recargar la
                    página
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Fragment>
  )
}
