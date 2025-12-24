/**
 * PÁGINA DE SIMULADORES TRIBUTARIOS
 * Diseño limpio y funcional - ULE Colombia 2025
 */

'use client'

import { useState, Fragment } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/Header'
import { SimuladorRegimen } from '@/components/calculadoras/simulador-regimen'
import { SimuladorPensional } from '@/components/calculadoras/simulador-pensional'
import Link from 'next/link'
import './print.css'

type SimuladorTipo = 'REGIMEN' | 'PENSIONAL'

const SIMULADORES = [
  {
    id: 'REGIMEN' as SimuladorTipo,
    nombre: 'Régimen Tributario',
    descripcion: 'RST vs Ordinario',
    icono: 'compare',
  },
  {
    id: 'PENSIONAL' as SimuladorTipo,
    nombre: 'Pensión',
    descripcion: 'RPM vs RAIS',
    icono: 'savings',
  },
]

export default function SimuladoresPage() {
  const { data: session } = useSession()
  const [simuladorActivo, setSimuladorActivo] =
    useState<SimuladorTipo>('REGIMEN')

  return (
    <Fragment>
      <Header userName={session?.user?.name} userEmail={session?.user?.email} />

      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb + Header compacto */}
          <div className="mb-6">
            <nav className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <Link href="/herramientas" className="hover:text-primary">
                Herramientas
              </Link>
              <span className="material-symbols-outlined text-xs">
                chevron_right
              </span>
              <span className="font-medium text-gray-900">Simuladores</span>
            </nav>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Simuladores Tributarios
                </h1>
                <p className="text-sm text-gray-600">
                  Compara escenarios y toma mejores decisiones financieras
                </p>
              </div>

              {/* Tabs compactos */}
              <div className="flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                {SIMULADORES.map((sim) => (
                  <button
                    key={sim.id}
                    onClick={() => setSimuladorActivo(sim.id)}
                    className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                      simuladorActivo === sim.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {sim.icono}
                    </span>
                    <span className="hidden sm:inline">{sim.nombre}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contenido del simulador - Ancho completo */}
          <div className="mb-8">
            {simuladorActivo === 'REGIMEN' ? (
              <SimuladorRegimen />
            ) : (
              <SimuladorPensional />
            )}
          </div>

          {/* CTA Consulta IA */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-white to-primary/5">
            <div className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3">
                  <span className="material-symbols-outlined text-2xl text-primary">
                    psychology
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    ¿Necesitas ayuda interpretando los resultados?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Nuestra IA puede explicarte las implicaciones y ayudarte a
                    optimizar tu situación
                  </p>
                </div>
              </div>
              <Link
                href="/asesoria"
                className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-5 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                Consultar con IA
              </Link>
            </div>
          </div>

          {/* Disclaimer profesional */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex gap-3">
              <span className="material-symbols-outlined mt-0.5 text-gray-400">
                info
              </span>
              <div className="text-sm text-gray-600">
                <p className="mb-2 font-semibold text-gray-700">
                  Aviso importante
                </p>
                <p className="leading-relaxed">
                  Los resultados de estos simuladores son de carácter educativo
                  e informativo. Las proyecciones y recomendaciones presentadas
                  se basan en la normativa tributaria vigente y los datos
                  proporcionados, pero no constituyen asesoría fiscal, contable
                  o legal. Cada situación tributaria es única y puede tener
                  particularidades que afecten el resultado final.
                </p>
                <p className="mt-2 leading-relaxed">
                  Recomendamos consultar con un contador público o asesor
                  tributario certificado antes de tomar decisiones financieras
                  importantes basadas en estos cálculos. ULE no se hace
                  responsable por decisiones tomadas con base en la información
                  proporcionada por estas herramientas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  )
}
