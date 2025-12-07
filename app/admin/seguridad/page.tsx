'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Estadisticas {
  resumen: {
    totalLogs: number
    fallidos: number
    requierenRevision: number
    tasaExito: string
  }
  porNivelRiesgo: Array<{ nivel: string; total: number }>
  porCategoria: Array<{ categoria: string; total: number }>
  porAccion: Array<{ accion: string; total: number }>
  actividadDiaria: Array<{ fecha: string; total: number }>
  topUsuarios: Array<{ email: string; nombre: string; total: number }>
  topIPs: Array<{ ip: string; total: number }>
}

interface Alerta {
  id: string
  tipo: string
  severidad: string
  titulo: string
  descripcion: string
  userEmail?: string
  estado: string
  createdAt: string
}

export default function SeguridadPage() {
  const [stats, setStats] = useState<Estadisticas | null>(null)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setIsLoading(true)

      const [statsRes, alertasRes] = await Promise.all([
        fetch('/api/admin/auditoria/stats'),
        fetch('/api/admin/alertas?limit=10&estado=PENDIENTE'),
      ])

      const statsData = await statsRes.json()
      const alertasData = await alertasRes.json()

      setStats(statsData)
      setAlertas(alertasData.alertas || [])
    } catch (error) {
      toast.error('Error al cargar datos de seguridad')
    } finally {
      setIsLoading(false)
    }
  }

  const getSeveridadColor = (severidad: string) => {
    const colors: Record<string, string> = {
      INFO: 'bg-blue-100 text-blue-800',
      BAJA: 'bg-green-100 text-green-800',
      MEDIA: 'bg-yellow-100 text-yellow-800',
      ALTA: 'bg-orange-100 text-orange-800',
      CRITICA: 'bg-red-100 text-red-800',
    }
    return colors[severidad] || colors.INFO
  }

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#dc2626']

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse p-6">
              <div className="mb-4 h-6 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-8 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center text-3xl font-bold">
          <span className="material-symbols-outlined mr-3 text-4xl text-primary">
            security
          </span>
          Dashboard de Seguridad
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Monitoreo en tiempo real de eventos de seguridad y auditoría
        </p>
      </div>

      {/* Resumen - Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Eventos
              </p>
              <p className="mt-1 text-3xl font-bold">
                {stats?.resumen.totalLogs.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <span className="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-200">
                analytics
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Eventos Fallidos
              </p>
              <p className="mt-1 text-3xl font-bold text-red-600">
                {stats?.resumen.fallidos.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900">
              <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-200">
                error
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Requieren Revisión
              </p>
              <p className="mt-1 text-3xl font-bold text-orange-600">
                {stats?.resumen.requierenRevision.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900">
              <span className="material-symbols-outlined text-3xl text-orange-600 dark:text-orange-200">
                flag
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tasa de Éxito
              </p>
              <p className="mt-1 text-3xl font-bold text-green-600">
                {stats?.resumen.tasaExito}%
              </p>
            </div>
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900">
              <span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-200">
                check_circle
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="actividad" className="space-y-6">
        <TabsList>
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="distribuciones">Distribuciones</TabsTrigger>
        </TabsList>

        {/* TAB: Actividad */}
        <TabsContent value="actividad">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">
              Actividad Diaria (Últimos 30 días)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.actividadDiaria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={(date) =>
                    format(new Date(date), 'dd/MM', { locale: es })
                  }
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) =>
                    format(new Date(date), "dd 'de' MMMM", { locale: es })
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  name="Eventos"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top Acciones */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Top 10 Acciones</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.porAccion} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="accion" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#14b8a6" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Top IPs */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Top 10 IPs</h3>
              <div className="space-y-2">
                {stats?.topIPs.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded bg-gray-50 p-3 dark:bg-gray-800"
                  >
                    <span className="font-mono text-sm">{item.ip}</span>
                    <Badge>{item.total.toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Alertas */}
        <TabsContent value="alertas">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">
                Alertas Pendientes ({alertas.length})
              </h3>
              <Button
                onClick={() => (window.location.href = '/admin/alertas')}
                variant="outline"
              >
                Ver Todas
              </Button>
            </div>

            {alertas.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <span className="material-symbols-outlined mb-2 text-4xl">
                  check_circle
                </span>
                <p>No hay alertas pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className="flex items-start justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge className={getSeveridadColor(alerta.severidad)}>
                          {alerta.severidad}
                        </Badge>
                        <Badge variant="outline">{alerta.tipo}</Badge>
                      </div>
                      <h4 className="font-semibold">{alerta.titulo}</h4>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {alerta.descripcion}
                      </p>
                      {alerta.userEmail && (
                        <div className="mt-2 text-sm text-gray-500">
                          Usuario: {alerta.userEmail}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        {format(
                          new Date(alerta.createdAt),
                          "dd 'de' MMMM, HH:mm",
                          { locale: es }
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        (window.location.href = `/admin/alertas/${alerta.id}`)
                      }
                    >
                      <span className="material-symbols-outlined">
                        chevron_right
                      </span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB: Usuarios */}
        <TabsContent value="usuarios">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Top 10 Usuarios Más Activos</h3>
            <div className="space-y-2">
              {stats?.topUsuarios.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">
                        {user.nombre || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <Badge>{user.total.toLocaleString()} eventos</Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* TAB: Distribuciones */}
        <TabsContent value="distribuciones">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Por Nivel de Riesgo */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Por Nivel de Riesgo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats?.porNivelRiesgo}
                    dataKey="total"
                    nameKey="nivel"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {stats?.porNivelRiesgo.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Por Categoría */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Por Categoría</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.porCategoria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="categoria"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#14b8a6" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
