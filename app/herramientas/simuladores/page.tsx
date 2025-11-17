/**
 * PÁGINA DE SIMULADOR TRIBUTARIO
 * Herramientas de simulación para escenarios tributarios y contables
 */

'use client'

import { useState, Fragment, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/Header'
import { SimuladorRegimen } from '@/components/calculadoras/simulador-regimen'
import { SimuladorPensional } from '@/components/calculadoras/simulador-pensional'
import { HistorialCalculos } from '@/components/calculadoras/historial-calculos'
import Link from 'next/link'

type SimuladorTipo = 'SIMULADOR_REGIMEN' | 'SIMULADOR_PENSIONAL'

export default function SimuladoresPage() {
  const { data: session } = useSession()
  const [tabActiva, setTabActiva] = useState<SimuladorTipo>('SIMULADOR_REGIMEN')

  // P3: Optimización - memoizar tabs para evitar recreación en cada render
  const tabs = useMemo(
    () => [
      {
        id: 'SIMULADOR_REGIMEN' as SimuladorTipo,
        nombre: 'Régimen Simple vs Ordinario',
        icono: 'compare',
        descripcion:
          'Compara cuál régimen tributario te conviene más según tus ingresos proyectados',
      },
      {
        id: 'SIMULADOR_PENSIONAL' as SimuladorTipo,
        nombre: 'Simulador Pensional',
        icono: 'savings',
        descripcion:
          'Proyecta tu pensión comparando RPM (Colpensiones) vs RAIS (Fondos Privados)',
      },
    ],
    []
  )

  const renderSimulador = () => {
    switch (tabActiva) {
      case 'SIMULADOR_REGIMEN':
        return <SimuladorRegimen />
      case 'SIMULADOR_PENSIONAL':
        return <SimuladorPensional />
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
            <span className="text-dark font-medium">Simuladores</span>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-primary/10 p-3">
                  <span className="material-symbols-outlined text-3xl text-primary">
                    science
                  </span>
                </div>
                <div>
                  <h1 className="text-dark text-3xl font-bold tracking-tight">
                    Simuladores Financieros
                  </h1>
                  <p className="text-dark-100 mt-1 text-base">
                    Simula escenarios tributarios, pensionales y financieros
                    para tomar mejores decisiones
                  </p>
                </div>
              </div>

              <Link
                href="/herramientas/calculadoras"
                className="flex items-center gap-2 rounded-lg border-2 border-primary bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-primary hover:text-white hover:shadow-md"
              >
                <span className="material-symbols-outlined text-lg">
                  calculate
                </span>
                <span>Ver Calculadoras</span>
              </Link>
            </div>
          </div>

          {/* Tabs - Selector de Simulador */}
          <Card className="border-light-200 mb-6 overflow-hidden shadow-md">
            <div className="border-light-200 border-b bg-gradient-to-r from-primary/5 to-primary/10 px-5 py-4">
              <h2 className="text-dark flex items-center gap-2 text-lg font-semibold">
                <span className="material-symbols-outlined text-primary">
                  view_module
                </span>
                Selecciona un Simulador
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

              {/* Coming Soon Badge */}
              <div className="mt-4 overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
                <div className="flex items-start gap-3 p-4">
                  <div className="rounded-lg bg-amber-100 p-2">
                    <span className="material-symbols-outlined text-xl text-amber-600">
                      schedule
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-dark mb-1 font-semibold">
                      Próximamente
                    </h4>
                    <p className="text-dark-100 text-sm leading-relaxed">
                      Simulador de Nómina, Simulador de Flujo de Caja,
                      Proyección de Inversiones y más herramientas avanzadas
                    </p>
                  </div>
                </div>
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

          {/* Layout: Simulador + Historial */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Simulador (2 columnas) */}
            <div className="lg:col-span-2">{renderSimulador()}</div>

            {/* Historial (1 columna) */}
            <div className="lg:col-span-1">
              <HistorialCalculos tipo={tabActiva} />
            </div>
          </div>

          {/* Footer Info */}
          <Card className="border-light-200 mt-6 overflow-hidden shadow-md">
            <div className="border-light-200 border-b bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
              <h3 className="text-dark flex items-center gap-2 text-lg font-semibold">
                <span className="material-symbols-outlined text-amber-600">
                  lightbulb
                </span>
                Acerca de los simuladores
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div className="hover:scale-102 group rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 transition-all hover:shadow-md">
                  <h4 className="text-dark mb-2 flex items-center gap-2 font-semibold">
                    <div className="rounded-lg bg-emerald-100 p-1.5">
                      <span className="material-symbols-outlined text-lg text-emerald-600">
                        trending_up
                      </span>
                    </div>
                    Proyecciones realistas
                  </h4>
                  <p className="text-dark-100 leading-relaxed">
                    Los simuladores proyectan escenarios basados en datos reales
                    y legislación vigente 2025
                  </p>
                </div>

                <div className="hover:scale-102 group rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 transition-all hover:shadow-md">
                  <h4 className="text-dark mb-2 flex items-center gap-2 font-semibold">
                    <div className="rounded-lg bg-blue-100 p-1.5">
                      <span className="material-symbols-outlined text-lg text-blue-600">
                        compare_arrows
                      </span>
                    </div>
                    Comparación lado a lado
                  </h4>
                  <p className="text-dark-100 leading-relaxed">
                    Visualiza y compara múltiples escenarios para tomar la mejor
                    decisión
                  </p>
                </div>

                <div className="hover:scale-102 group rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-5 transition-all hover:shadow-md">
                  <h4 className="text-dark mb-2 flex items-center gap-2 font-semibold">
                    <div className="rounded-lg bg-purple-100 p-1.5">
                      <span className="material-symbols-outlined text-lg text-purple-600">
                        insights
                      </span>
                    </div>
                    Análisis detallado
                  </h4>
                  <p className="text-dark-100 leading-relaxed">
                    Cada simulación incluye análisis detallado y recomendaciones
                    personalizadas
                  </p>
                </div>

                <div className="hover:scale-102 group rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 transition-all hover:shadow-md">
                  <h4 className="text-dark mb-2 flex items-center gap-2 font-semibold">
                    <div className="rounded-lg bg-amber-100 p-1.5">
                      <span className="material-symbols-outlined text-lg text-amber-600">
                        save
                      </span>
                    </div>
                    Guarda tus simulaciones
                  </h4>
                  <p className="text-dark-100 leading-relaxed">
                    Todas las simulaciones se guardan automáticamente en tu
                    historial
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* CTA Section */}
          <Card className="mt-6 overflow-hidden border-2 border-primary/30 shadow-lg">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-6">
              <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                <div className="flex flex-1 items-start gap-4">
                  <div className="rounded-xl bg-primary/20 p-3">
                    <span className="material-symbols-outlined text-3xl text-primary">
                      school
                    </span>
                  </div>
                  <div>
                    <h3 className="text-dark mb-2 text-xl font-bold">
                      ¿Necesitas asesoría personalizada?
                    </h3>
                    <p className="text-dark-100 text-sm leading-relaxed">
                      Nuestra Consulta Educativa con IA puede ayudarte a
                      interpretar los resultados y tomar mejores decisiones
                    </p>
                  </div>
                </div>
                <Link
                  href="/asesoria"
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white shadow-md transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-lg"
                >
                  <span className="material-symbols-outlined">psychology</span>
                  <span>Consultar con IA</span>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Fragment>
  )
}
