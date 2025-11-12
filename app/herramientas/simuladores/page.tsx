/**
 * PÁGINA DE SIMULADORES TRIBUTARIOS
 * Herramientas de simulación para escenarios tributarios y contables
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SimuladorRegimen } from '@/components/calculadoras/simulador-regimen'
import { HistorialCalculos } from '@/components/calculadoras/historial-calculos'
import Link from 'next/link'

type SimuladorTipo = 'SIMULADOR_REGIMEN'

export default function SimuladoresPage() {
  const [tabActiva, setTabActiva] = useState<SimuladorTipo>('SIMULADOR_REGIMEN')

  const tabs = [
    {
      id: 'SIMULADOR_REGIMEN' as SimuladorTipo,
      nombre: 'Régimen Simple vs Ordinario',
      icono: 'compare',
      descripcion: 'Compara cuál régimen tributario te conviene más según tus ingresos proyectados',
    },
  ]

  const renderSimulador = () => {
    switch (tabActiva) {
      case 'SIMULADOR_REGIMEN':
        return <SimuladorRegimen />
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
            <span className="text-dark font-medium">Simuladores</span>
          </nav>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="mb-2 flex items-center text-3xl font-bold text-dark tracking-tight">
                <span className="material-symbols-outlined mr-3 text-4xl text-primary">
                  science
                </span>
                Simuladores Tributarios
              </h1>
              <p className="text-dark-100 font-medium">
                Simula escenarios tributarios y toma decisiones informadas para tu negocio
              </p>
            </div>

            <Link
              href="/herramientas/calculadoras"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors font-medium"
            >
              <span className="material-symbols-outlined">function</span>
              <span>Ver Calculadoras</span>
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

          {/* Coming Soon Badge */}
          <div className="mt-3 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>Próximamente: Simulador de Nómina, Simulador de Flujo de Caja, y más herramientas avanzadas</span>
            </p>
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
        <Card className="mt-6 p-6 shadow-sm">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-dark">
            <span className="material-symbols-outlined mr-2 text-primary">
              lightbulb
            </span>
            Acerca de los simuladores
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="mb-2 font-semibold text-dark flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">trending_up</span>
                Proyecciones realistas
              </h4>
              <p className="text-dark-100">
                Los simuladores proyectan escenarios basados en datos reales y legislación vigente 2025
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="mb-2 font-semibold text-dark flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">compare_arrows</span>
                Comparación lado a lado
              </h4>
              <p className="text-dark-100">
                Visualiza y compara múltiples escenarios para tomar la mejor decisión
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="mb-2 font-semibold text-dark flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">insights</span>
                Análisis detallado
              </h4>
              <p className="text-dark-100">
                Cada simulación incluye análisis detallado y recomendaciones personalizadas
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="mb-2 font-semibold text-dark flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">save</span>
                Guarda tus simulaciones
              </h4>
              <p className="text-dark-100">
                Todas las simulaciones se guardan automáticamente en tu historial
              </p>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <Card className="mt-6 p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-dark mb-2">
                ¿Necesitas asesoría personalizada?
              </h3>
              <p className="text-sm text-dark-100">
                Nuestra Consulta Educativa con IA puede ayudarte a interpretar los resultados y tomar mejores decisiones
              </p>
            </div>
            <Link
              href="/asesoria"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium shadow-md"
            >
              <span className="material-symbols-outlined">school</span>
              <span>Consultar con IA</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
