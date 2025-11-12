/**
 * ULE - PÁGINA DE DASHBOARD
 * Dashboard principal con resumen de métricas y acciones rápidas
 */

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatearMoneda } from '@/lib/utils/format'

interface ProximoPagoPILA {
  id: string
  periodo: string
  monto: number
  fechaLimite: string
  diasRestantes: number
}

interface FacturasDelMes {
  cantidad: number
  total: number
}

interface ConsultasIA {
  usadas: number
  total: number
}

interface ProximaFechaTributaria {
  fecha: string
  fechaFormateada: string
  descripcion: string
  diasRestantes: number
}

interface Actividad {
  id: string
  tipo: 'factura' | 'pila'
  titulo: string
  descripcion: string
  fecha: string
  fechaISO: string
  icono: string
  color: string
}

interface DashboardStats {
  proximoPagoPILA: ProximoPagoPILA | null
  facturasDelMes: FacturasDelMes
  consultasIA: ConsultasIA
  proximaFechaTributaria: ProximaFechaTributaria | null
  actividadReciente: Actividad[]
  fromCache?: boolean
}

/**
 * Dashboard principal (ruta protegida)
 * Solo accesible para usuarios autenticados
 */
export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    proximoPagoPILA: null,
    facturasDelMes: { cantidad: 0, total: 0 },
    consultasIA: { usadas: 0, total: 20 },
    proximaFechaTributaria: null,
    actividadReciente: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/dashboard/stats')

      if (response.ok) {
        const data: DashboardStats = await response.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Error loading dashboard:', err)
      // Mantener datos vacíos por defecto
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <>
        <Header userName={session?.user?.name} userEmail={session?.user?.email} />
        <div className="min-h-screen bg-light-50 p-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-dark-100">Cargando dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!session) {
    return null
  }

  const proximoPagoPILA = stats.proximoPagoPILA
  const facturasDelMes = stats.facturasDelMes
  const consultasIA = stats.consultasIA
  const proximaFechaTributaria = stats.proximaFechaTributaria
  const actividadReciente = stats.actividadReciente

  return (
    <>
      <Header userName={session.user.name} userEmail={session.user.email} />
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumbs */}
          {/* <Breadcrumbs /> */}

          {/* Header Personalizado */}
          <div className="mb-10">
            <h1 className="mb-3 text-4xl font-bold text-dark tracking-tight">
              Hola, {session.user.name} 👋
            </h1>
            <p className="text-lg font-medium" style={{ color: '#9CA3AF' }}>
              Gestiona tus aportes y obligaciones de forma inteligente
            </p>
          </div>

          {/* Alertas Importantes */}
          {/* <AlertasBanner /> */}

          {/* 3 Cards de Resumen - Métricas Clave */}
          <div className="mb-10 grid gap-5 md:grid-cols-3">
            {/* Card 1: Próximo Pago PILA */}
            <Card className="border-2 border-light-200">
              <CardBody className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-xl bg-primary/10 p-3.5">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      account_balance
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-100 mb-2 uppercase tracking-wide">
                    Próximo Pago PILA
                  </p>
                  {proximoPagoPILA ? (
                    <>
                      <p className="text-3xl font-bold text-dark mb-1.5">
                        {formatearMoneda(proximoPagoPILA.monto)}
                      </p>
                      <p className="text-sm text-dark-100 font-medium">
                        Vence en {proximoPagoPILA.diasRestantes} día{proximoPagoPILA.diasRestantes !== 1 ? 's' : ''}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-dark mb-1.5">
                        Sin pagos
                      </p>
                      <p className="text-sm text-dark-100 font-medium">
                        No hay pagos pendientes
                      </p>
                    </>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Card 2: Facturas del Mes */}
            <Card className="border-2 border-light-200">
              <CardBody className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-xl bg-green-50 p-3.5">
                    <span className="material-symbols-outlined text-green-600 text-2xl">
                      receipt_long
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-100 mb-2 uppercase tracking-wide">
                    Facturas Electrónicas del Mes
                  </p>
                  <p className="text-3xl font-bold text-dark mb-1.5">
                    {facturasDelMes.cantidad}
                  </p>
                  <p className="text-sm text-dark-100 font-medium">
                    Total: {formatearMoneda(facturasDelMes.total)}
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Card 3: Próxima Fecha Tributaria */}
            <Card className="border-2 border-light-200">
              <CardBody className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-xl bg-amber-50 p-3.5">
                    <span className="material-symbols-outlined text-amber-600 text-2xl">
                      event_note
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-100 mb-2 uppercase tracking-wide">
                    Próxima Fecha Tributaria
                  </p>
                  {proximaFechaTributaria ? (
                    <>
                      <p className="text-3xl font-bold text-dark mb-1.5">
                        {proximaFechaTributaria.fechaFormateada}
                      </p>
                      <p className="text-sm text-dark-100 font-medium">
                        {proximaFechaTributaria.descripcion}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-dark mb-1.5">
                        --
                      </p>
                      <p className="text-sm text-dark-100 font-medium">
                        Completa tu perfil
                      </p>
                    </>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* 7 Acciones Rápidas */}
          <Card className="mb-8 border-2 border-light-200">
            <CardBody className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-dark mb-1">
                  Acciones Rápidas
                </h2>
                <p className="text-sm text-dark-100">
                  Accede a nuestras funciones principales
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {/* Acción 1: Liquidar PILA */}
                <Link
                  href="/pila"
                  className="group flex items-center gap-4 rounded-lg border-2 border-light-200 p-4 transition-all hover:border-primary hover:bg-primary hover:text-white hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-white/20">
                    <span className="material-symbols-outlined text-2xl text-primary group-hover:text-white">
                      calculate
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dark group-hover:text-white">
                      Liquidar PILA
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-dark-100 group-hover:text-white flex-shrink-0">
                    arrow_forward
                  </span>
                </Link>

                {/* Acción 2: Facturación Electrónica */}
                <Link
                  href="/facturacion"
                  className="group flex items-center gap-4 rounded-lg border-2 border-light-200 p-4 transition-all hover:border-primary hover:bg-primary hover:text-white hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-white/20">
                    <span className="material-symbols-outlined text-2xl text-primary group-hover:text-white">
                      receipt_long
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dark group-hover:text-white">
                      Facturación Electrónica
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-dark-100 group-hover:text-white flex-shrink-0">
                    arrow_forward
                  </span>
                </Link>

                {/* Acción 3: Calendario Tributario */}
                <Link
                  href="/calendario"
                  className="group flex items-center gap-4 rounded-lg border-2 border-light-200 p-4 transition-all hover:border-primary hover:bg-primary hover:text-white hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-white/20">
                    <span className="material-symbols-outlined text-2xl text-primary group-hover:text-white">
                      event
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dark group-hover:text-white">
                      Calendario Tributario
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-dark-100 group-hover:text-white flex-shrink-0">
                    arrow_forward
                  </span>
                </Link>

                {/* Acción 4: Calculadora Tributaria */}
                <Link
                  href="/herramientas/calculadoras"
                  className="group flex items-center gap-4 rounded-lg border-2 border-light-200 p-4 transition-all hover:border-primary hover:bg-primary hover:text-white hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-white/20">
                    <span className="material-symbols-outlined text-2xl text-primary group-hover:text-white">
                      dialpad
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dark group-hover:text-white">
                      Calculadora Tributaria
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-dark-100 group-hover:text-white flex-shrink-0">
                    arrow_forward
                  </span>
                </Link>

                {/* Acción 5: Simulador Tributario */}
                <Link
                  href="/herramientas/simuladores"
                  className="group flex items-center gap-4 rounded-lg border-2 border-light-200 p-4 transition-all hover:border-primary hover:bg-primary hover:text-white hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-white/20">
                    <span className="material-symbols-outlined text-2xl text-primary group-hover:text-white">
                      science
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dark group-hover:text-white">
                      Simulador Tributario
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-dark-100 group-hover:text-white flex-shrink-0">
                    arrow_forward
                  </span>
                </Link>

                {/* Acción 6: Biblioteca de Archivos */}
                <Link
                  href="/biblioteca"
                  className="group flex items-center gap-4 rounded-lg border-2 border-light-200 p-4 transition-all hover:border-primary hover:bg-primary hover:text-white hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-white/20">
                    <span className="material-symbols-outlined text-2xl text-primary group-hover:text-white">
                      folder_open
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dark group-hover:text-white">
                      Biblioteca de Archivos
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-dark-100 group-hover:text-white flex-shrink-0">
                    arrow_forward
                  </span>
                </Link>

                {/* Acción 7: Consulta Educativa con IA */}
                <Link
                  href="/asesoria"
                  className="group flex items-center gap-4 rounded-lg border-2 border-light-200 p-4 transition-all hover:border-primary hover:bg-primary hover:text-white hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-white/20">
                    <span className="material-symbols-outlined text-2xl text-primary group-hover:text-white">
                      school
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dark group-hover:text-white">
                      Consulta con IA
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-dark-100 group-hover:text-white flex-shrink-0">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </CardBody>
          </Card>

          {/* Timeline de Actividad Reciente */}
          <Card>
            <CardBody>
              <h2 className="mb-6 text-xl font-semibold text-dark">
                Actividad Reciente
              </h2>
              {actividadReciente.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {actividadReciente.map((actividad) => (
                      <div
                        key={actividad.id}
                        className="flex items-start gap-4 rounded-lg border border-light-200 p-4 transition-all hover:border-primary/30 hover:bg-primary/5"
                      >
                        {/* Ícono */}
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-light-50">
                          <span className={`material-symbols-outlined ${actividad.color}`}>
                            {actividad.icono}
                          </span>
                        </div>

                        {/* Contenido */}
                        <div className="flex-1">
                          <p className="font-semibold text-dark">
                            {actividad.titulo}
                          </p>
                          <p className="text-sm text-dark-100">
                            {actividad.descripcion}
                          </p>
                        </div>

                        {/* Fecha */}
                        <p className="text-xs text-dark-100">{actividad.fecha}</p>
                      </div>
                    ))}
                  </div>

                  {/* Ver todo */}
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      className="text-sm font-medium text-primary hover:underline"
                      onClick={() => router.push('/actividad')}
                    >
                      Ver toda la actividad
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <span className="material-symbols-outlined text-6xl text-dark-100 mb-3">
                    inbox
                  </span>
                  <p className="text-dark-100">No hay actividad reciente</p>
                  <p className="text-sm text-dark-100 mt-1">
                    Empieza generando facturas o liquidando PILA
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
