/**
 * DASHBOARD DE ANALYTICS ADMIN
 * Vista completa de métricas y uso de la plataforma
 */

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { SuspenseWrapper } from '@/components/ui/suspense-wrapper'
import { useAnalytics } from '@/lib/hooks/use-analytics'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface MetricasData {
  metricasDiarias: Array<{
    fecha: string
    usuariosActivos: number
    nuevosUsuarios: number
    usosPILA: number
    usosFacturacion: number
    usosAsesoria: number
  }>
  totales: {
    usuariosActivos: number
    nuevosUsuarios: number
    usosPILA: number
    usosFacturacion: number
    usosAsesoria: number
  }
  eventosFrecuentes: Array<{
    evento: string
    _count: { evento: number }
  }>
  erroresRecientes: Array<{
    id: string
    mensaje: string
    severidad: string
    timestamp: string
    componente: string | null
    resuelto: boolean
  }>
  retencion7Dias: string
}

export default function AnalyticsDashboard() {
  const { data: session, status } = useSession()
  const [metricas, setMetricas] = useState<MetricasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('30')
  const { trackPageView } = useAnalytics()

  // ✅ Protección en el cliente
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login')
    }
    if (status === 'authenticated' && (session.user as any).role !== 'ADMIN') {
      redirect('/dashboard')
    }
  }, [session, status])

  useEffect(() => {
    if (status === 'authenticated') {
      trackPageView()
    }
  }, [trackPageView, status])

  useEffect(() => {
    if ((session?.user as any)?.role === 'ADMIN') {
      cargarMetricas()
    }
  }, [periodo, session])

  const cargarMetricas = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/metricas?dias=${periodo}`)
      if (!response.ok) throw new Error('Error al cargar métricas')
      const data = await response.json()
      setMetricas(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">Verificando acceso...</p>
        </Card>
      </div>
    )
  }

  // No autorizado
  if ((session?.user as any)?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4">
            block
          </span>
          <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta página.
          </p>
          <Button onClick={() => redirect('/dashboard')}>
            Volver al Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  if (loading || !metricas) {
    return (
      <div className="container mx-auto p-6">
        <SuspenseWrapper type="default" />
      </div>
    )
  }

  // Preparar datos para gráfico de usuarios
  const usuariosChartData = {
    labels: metricas.metricasDiarias.map((m) =>
      format(new Date(m.fecha), 'dd MMM', { locale: es })
    ),
    datasets: [
      {
        label: 'Usuarios Activos',
        data: metricas.metricasDiarias.map((m) => m.usuariosActivos),
        borderColor: 'rgb(20, 184, 166)',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Nuevos Usuarios',
        data: metricas.metricasDiarias.map((m) => m.nuevosUsuarios),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  // Preparar datos para gráfico de features
  const featuresChartData = {
    labels: ['PILA', 'Facturación', 'Asesoría IA'],
    datasets: [
      {
        data: [
          metricas.totales.usosPILA,
          metricas.totales.usosFacturacion,
          metricas.totales.usosAsesoria,
        ],
        backgroundColor: [
          'rgba(20, 184, 166, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  }

  // Preparar datos para gráfico de eventos
  const eventosChartData = {
    labels: metricas.eventosFrecuentes.map((e) => e.evento.replace(/_/g, ' ')),
    datasets: [
      {
        label: 'Frecuencia',
        data: metricas.eventosFrecuentes.map((e) => e._count.evento),
        backgroundColor: 'rgba(20, 184, 166, 0.7)',
        borderColor: 'rgb(20, 184, 166)',
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
      },
    },
  }

  const getSeverityColor = (severidad: string) => {
    const colors: Record<string, string> = {
      INFO: 'bg-blue-100 text-blue-800',
      WARNING: 'bg-yellow-100 text-yellow-800',
      ERROR: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800',
    }
    return colors[severidad] || colors.INFO
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Métricas y uso de la plataforma
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={periodo === '7' ? 'default' : 'outline'}
            onClick={() => setPeriodo('7')}
          >
            7 días
          </Button>
          <Button
            variant={periodo === '30' ? 'default' : 'outline'}
            onClick={() => setPeriodo('30')}
          >
            30 días
          </Button>
          <Button
            variant={periodo === '90' ? 'default' : 'outline'}
            onClick={() => setPeriodo('90')}
          >
            90 días
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usuarios Activos</CardDescription>
            <CardTitle className="text-3xl">
              {metricas.totales.usuariosActivos}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              En los últimos {periodo} días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Nuevos Usuarios</CardDescription>
            <CardTitle className="text-3xl">
              {metricas.totales.nuevosUsuarios}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Registros completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Retención 7 días</CardDescription>
            <CardTitle className="text-3xl">
              {metricas.retencion7Dias}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Usuarios que regresan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Errores Sin Resolver</CardDescription>
            <CardTitle className="text-3xl">
              {metricas.erroresRecientes.filter((e) => !e.resuelto).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs with Charts */}
      <Tabs defaultValue="usuarios" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="errores">Errores</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios Activos y Nuevos Usuarios</CardTitle>
              <CardDescription>
                Evolución diaria de usuarios en los últimos {periodo} días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: '400px' }}>
                <Line data={usuariosChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Uso por Feature</CardTitle>
                <CardDescription>
                  Total de usos en los últimos {periodo} días
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: '300px' }}>
                  <Doughnut
                    data={featuresChartData}
                    options={doughnutOptions}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usos por Feature</CardTitle>
                <CardDescription>Desglose detallado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">💰 PILA</p>
                      <p className="text-sm text-gray-600">
                        Liquidaciones de planilla
                      </p>
                    </div>
                    <p className="text-2xl font-bold">
                      {metricas.totales.usosPILA}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">📄 Facturación</p>
                      <p className="text-sm text-gray-600">
                        Facturas emitidas
                      </p>
                    </div>
                    <p className="text-2xl font-bold">
                      {metricas.totales.usosFacturacion}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">🤖 Asesoría IA</p>
                      <p className="text-sm text-gray-600">
                        Consultas realizadas
                      </p>
                    </div>
                    <p className="text-2xl font-bold">
                      {metricas.totales.usosAsesoria}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="eventos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Eventos Más Frecuentes</CardTitle>
              <CardDescription>
                Eventos registrados en los últimos {periodo} días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: '400px' }}>
                <Bar data={eventosChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Errores Recientes</CardTitle>
              <CardDescription>
                Últimos 20 errores sin resolver
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metricas.erroresRecientes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  🎉 ¡No hay errores sin resolver!
                </div>
              ) : (
                <div className="space-y-3">
                  {metricas.erroresRecientes.map((error) => (
                    <div
                      key={error.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                                error.severidad
                              )}`}
                            >
                              {error.severidad}
                            </span>
                            {error.componente && (
                              <span className="text-sm text-gray-600">
                                {error.componente}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-sm">
                            {error.mensaje}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(
                              new Date(error.timestamp),
                              "dd MMM yyyy 'a las' HH:mm",
                              { locale: es }
                            )}
                          </p>
                        </div>
                        {!error.resuelto && (
                          <Button size="sm" variant="outline">
                            Resolver
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
