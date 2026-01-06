/**
 * ULE - PÁGINA DE DASHBOARD
 * Dashboard principal con resumen de métricas y acciones rápidas
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Card, CardBody } from '@/components/ui/card'
import { getInfoVencimientoPILA } from '@/lib/pila-utils'

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

interface UserProfile {
  numeroDocumento: string | null
}

interface DashboardStats {
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
    proximaFechaTributaria: null,
    actividadReciente: [],
  })
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showHerramientas, setShowHerramientas] = useState(false)
  const herramientasRef = useRef<HTMLDivElement>(null)

  // Cerrar el menú de herramientas al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        herramientasRef.current &&
        !herramientasRef.current.contains(event.target as Node)
      ) {
        setShowHerramientas(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch stats y perfil en paralelo
      const [statsResponse, profileResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/user/profile'),
      ])

      if (statsResponse.ok) {
        const data = await statsResponse.json()
        setStats(data)
      }

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setUserProfile({
          numeroDocumento: profileData.user?.numeroDocumento || null,
        })
      }
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calcular info de vencimiento PILA basada en cédula del usuario
  const infoPILA = getInfoVencimientoPILA(userProfile?.numeroDocumento)

  if (status === 'loading' || loading) {
    return (
      <>
        <Header
          userName={session?.user?.name}
          userEmail={session?.user?.email}
        />
        <div className="bg-light-50 min-h-screen p-6">
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

  const proximaFechaTributaria = stats.proximaFechaTributaria
  const actividadReciente = stats.actividadReciente

  return (
    <>
      <Header userName={session.user.name} userEmail={session.user.email} />
      <div className="min-h-screen p-6" style={{ backgroundColor: '#F8F9FA' }}>
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumbs */}
          {/* <Breadcrumbs /> */}

          {/* Header Personalizado */}
          <div className="mb-10">
            <h1 className="text-dark mb-3 text-4xl font-bold tracking-tight">
              Hola, {session.user.name} 👋
            </h1>
            <p className="text-lg font-medium text-gray-400">
              Gestiona tus aportes y obligaciones de forma inteligente
            </p>
          </div>

          {/* Alertas Importantes */}
          {/* <AlertasBanner /> */}

          {/* Centro de Información - 2 Cards */}
          <div className="mb-10 grid gap-5 md:grid-cols-2">
            {/* Card 1: Próximo Pago PILA */}
            <Card className="border-light-200 border-2">
              <CardBody className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-xl bg-primary/10 p-3.5">
                    <span className="material-symbols-outlined text-2xl text-primary">
                      account_balance
                    </span>
                  </div>
                  {infoPILA && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      Día {infoPILA.diaDelMes} de cada mes
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-dark-100 mb-2 text-sm font-semibold uppercase tracking-wide">
                    Próximo Pago PILA
                  </p>
                  {infoPILA ? (
                    <>
                      <p className="text-dark mb-1.5 text-2xl font-bold">
                        {infoPILA.fechaFormateada}
                      </p>
                      <p className="text-dark-100 text-sm font-medium">
                        {infoPILA.textodiasRestantes}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-dark mb-1.5 text-3xl font-bold">--</p>
                      <p className="text-dark-100 text-sm font-medium">
                        Completa tu perfil para ver tu fecha
                      </p>
                    </>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Card 2: Próxima Fecha Tributaria */}
            <Card className="border-light-200 border-2">
              <CardBody className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-xl bg-amber-50 p-3.5">
                    <span className="material-symbols-outlined text-2xl text-amber-600">
                      event_note
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-dark-100 mb-2 text-sm font-semibold uppercase tracking-wide">
                    Próxima Fecha Tributaria
                  </p>
                  {proximaFechaTributaria ? (
                    <>
                      <p className="text-dark mb-1.5 text-2xl font-bold">
                        {proximaFechaTributaria.fechaFormateada}
                      </p>
                      <p className="text-dark-100 text-sm font-medium">
                        {proximaFechaTributaria.descripcion}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-dark mb-1.5 text-3xl font-bold">--</p>
                      <p className="text-dark-100 text-sm font-medium">
                        Completa tu perfil
                      </p>
                    </>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* 6 Acciones Rápidas */}
          <Card className="border-light-200 mb-8 border-2">
            <CardBody className="p-6">
              <div className="mb-6">
                <h2 className="text-dark mb-1 text-2xl font-bold">
                  Acciones Rápidas
                </h2>
                <p className="text-dark-100 text-sm">
                  Accede a nuestras funciones principales
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Acción 1: Liquidar PILA */}
                <Link
                  href="/pila/liquidar"
                  className="border-light-200 group flex items-center gap-4 rounded-lg border-2 p-4 transition-all hover:border-primary hover:!bg-primary hover:text-white hover:shadow-lg"
                  style={{ backgroundColor: '#F8F9FA' }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-white/20">
                    <span className="material-symbols-outlined text-2xl text-primary group-hover:text-white">
                      calculate
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-dark font-semibold group-hover:text-white">
                      Liquidar PILA
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-dark-100 flex-shrink-0 group-hover:text-white">
                    arrow_forward
                  </span>
                </Link>

                {/* Acción 2: Cuenta de Cobro */}
                <Link
                  href="/cuenta-cobro/nueva"
                  className="border-light-200 group flex items-center gap-4 rounded-lg border-2 p-4 transition-all hover:border-primary hover:!bg-primary hover:text-white hover:shadow-lg"
                  style={{ backgroundColor: '#F8F9FA' }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-white/20">
                    <span className="material-symbols-outlined text-2xl text-primary group-hover:text-white">
                      request_quote
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-dark font-semibold group-hover:text-white">
                      Cuenta de Cobro
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-dark-100 flex-shrink-0 group-hover:text-white">
                    arrow_forward
                  </span>
                </Link>

                {/* Acción 3: Biblioteca de Archivos */}
                <Link
                  href="/biblioteca"
                  className="border-light-200 group flex items-center gap-4 rounded-lg border-2 p-4 transition-all hover:border-primary hover:!bg-primary hover:text-white hover:shadow-lg"
                  style={{ backgroundColor: '#F8F9FA' }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-white/20">
                    <span className="material-symbols-outlined text-2xl text-primary group-hover:text-white">
                      folder_open
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-dark font-semibold group-hover:text-white">
                      Biblioteca de Archivos
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-dark-100 flex-shrink-0 group-hover:text-white">
                    arrow_forward
                  </span>
                </Link>

                {/* Acción 4: Calendario Tributario */}
                <Link
                  href="/calendario"
                  className="border-light-200 group flex items-center gap-4 rounded-lg border-2 p-4 transition-all hover:border-primary hover:!bg-primary hover:text-white hover:shadow-lg"
                  style={{ backgroundColor: '#F8F9FA' }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-white/20">
                    <span className="material-symbols-outlined text-2xl text-primary group-hover:text-white">
                      event
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-dark font-semibold group-hover:text-white">
                      Calendario Tributario
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-dark-100 flex-shrink-0 group-hover:text-white">
                    arrow_forward
                  </span>
                </Link>

                {/* Acción 5: Asesoría con IA */}
                <Link
                  href="/asesoria"
                  className="border-light-200 group flex items-center gap-4 rounded-lg border-2 p-4 transition-all hover:border-primary hover:!bg-primary hover:text-white hover:shadow-lg"
                  style={{ backgroundColor: '#F8F9FA' }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-white/20">
                    <span className="material-symbols-outlined text-2xl text-primary group-hover:text-white">
                      school
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-dark font-semibold group-hover:text-white">
                      Asesoría con IA
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-dark-100 flex-shrink-0 group-hover:text-white">
                    arrow_forward
                  </span>
                </Link>

                {/* Acción 6: Herramientas (con menú desplegable) */}
                <div className="relative" ref={herramientasRef}>
                  <button
                    type="button"
                    onClick={() => setShowHerramientas(!showHerramientas)}
                    className={`border-light-200 group flex w-full items-center gap-4 rounded-lg border-2 p-4 transition-all hover:border-primary hover:shadow-lg ${
                      showHerramientas
                        ? 'border-primary !bg-primary text-white shadow-lg'
                        : ''
                    }`}
                    style={{
                      backgroundColor: showHerramientas ? undefined : '#F8F9FA',
                    }}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${
                        showHerramientas
                          ? 'bg-white/20'
                          : 'bg-primary/10 group-hover:bg-primary/20'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-2xl ${
                          showHerramientas ? 'text-white' : 'text-primary'
                        }`}
                      >
                        construction
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p
                        className={`font-semibold ${showHerramientas ? 'text-white' : 'text-dark'}`}
                      >
                        Herramientas
                      </p>
                    </div>
                    <span
                      className={`material-symbols-outlined flex-shrink-0 transition-transform ${
                        showHerramientas
                          ? 'rotate-180 text-white'
                          : 'text-dark-100'
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Menú desplegable compacto - abre hacia la derecha */}
                  {showHerramientas && (
                    <div className="border-light-200 absolute left-full top-1/2 z-50 ml-3 w-52 -translate-y-1/2 overflow-hidden rounded-xl border bg-white shadow-2xl">
                      <div className="p-1.5">
                        {/* Calculadora Tributaria */}
                        <Link
                          href="/herramientas/calculadoras"
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-primary/10"
                          onClick={() => setShowHerramientas(false)}
                        >
                          <span className="material-symbols-outlined text-lg text-blue-600">
                            calculate
                          </span>
                          <span className="text-dark text-sm font-medium">
                            Calculadora Tributaria
                          </span>
                        </Link>

                        {/* Simulador de Régimen */}
                        <Link
                          href="/herramientas/simuladores"
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-primary/10"
                          onClick={() => setShowHerramientas(false)}
                        >
                          <span className="material-symbols-outlined text-lg text-purple-600">
                            science
                          </span>
                          <span className="text-dark text-sm font-medium">
                            Simulador de Régimen
                          </span>
                        </Link>

                        {/* Facturación Electrónica */}
                        <Link
                          href="/facturacion/nueva"
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-primary/10"
                          onClick={() => setShowHerramientas(false)}
                        >
                          <span className="material-symbols-outlined text-lg text-green-600">
                            receipt_long
                          </span>
                          <span className="text-dark text-sm font-medium">
                            Facturación Electrónica
                          </span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Timeline de Actividad Reciente */}
          <Card className="border-light-200 border-2">
            <CardBody className="p-6">
              <div className="mb-6">
                <h2 className="text-dark mb-1 text-2xl font-bold">
                  Actividad Reciente
                </h2>
                <p className="text-dark-100 text-sm">
                  Tus últimas operaciones y movimientos
                </p>
              </div>
              {actividadReciente.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {actividadReciente.map((actividad) => (
                      <div
                        key={actividad.id}
                        className="border-light-200 flex items-start gap-4 rounded-lg border-2 p-4 transition-all hover:border-primary/30"
                        style={{ backgroundColor: '#F8F9FA' }}
                      >
                        {/* Ícono */}
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white">
                          <span
                            className={`material-symbols-outlined ${actividad.color}`}
                          >
                            {actividad.icono}
                          </span>
                        </div>

                        {/* Contenido */}
                        <div className="flex-1">
                          <p className="text-dark font-semibold">
                            {actividad.titulo}
                          </p>
                          <p className="text-dark-100 text-sm">
                            {actividad.descripcion}
                          </p>
                        </div>

                        {/* Fecha */}
                        <p className="text-dark-100 text-xs">
                          {actividad.fecha}
                        </p>
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
                  <span className="material-symbols-outlined text-dark-100 mb-3 text-6xl">
                    inbox
                  </span>
                  <p className="text-dark-100">No hay actividad reciente</p>
                  <p className="text-dark-100 mt-1 text-sm">
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
