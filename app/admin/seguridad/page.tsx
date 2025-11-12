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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <span className="material-symbols-outlined text-primary mr-3 text-4xl">
            security
          </span>
          Dashboard de Seguridad
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitoreo en tiempo real de eventos de seguridad y auditoría
        </p>
      </div>

      {/* Resumen - Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Eventos</p>
              <p className="text-3xl font-bold mt-1">
                {stats?.resumen.totalLogs.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-200 text-3xl">
                analytics
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Eventos Fallidos</p>
              <p className="text-3xl font-bold mt-1 text-red-600">
                {stats?.resumen.fallidos.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <span className="material-symbols-outlined text-red-600 dark:text-red-200 text-3xl">
                error
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Requieren Revisión</p>
              <p className="text-3xl font-bold mt-1 text-orange-600">
                {stats?.resumen.requierenRevision.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <span className="material-symbols-outlined text-orange-600 dark:text-orange-200 text-3xl">
                flag
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tasa de Éxito</p>
              <p className="text-3xl font-bold mt-1 text-green-600">
                {stats?.resumen.tasaExito}%
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="material-symbols-outlined text-green-600 dark:text-green-200 text-3xl">
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
            <h3 className="font-semibold mb-4">Actividad Diaria (Últimos 30 días)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.actividadDiaria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={(date) => format(new Date(date), 'dd/MM', { locale: es })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => format(new Date(date), "dd 'de' MMMM", { locale: es })}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Top Acciones */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Top 10 Acciones</h3>
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
              <h3 className="font-semibold mb-4">Top 10 IPs</h3>
              <div className="space-y-2">
                {stats?.topIPs.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Alertas Pendientes ({alertas.length})</h3>
              <Button onClick={() => window.location.href = '/admin/alertas'} variant="outline">
                Ver Todas
              </Button>
            </div>

            {alertas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="material-symbols-outlined text-4xl mb-2">
                  check_circle
                </span>
                <p>No hay alertas pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeveridadColor(alerta.severidad)}>
                          {alerta.severidad}
                        </Badge>
                        <Badge variant="outline">{alerta.tipo}</Badge>
                      </div>
                      <h4 className="font-semibold">{alerta.titulo}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {alerta.descripcion}
                      </p>
                      {alerta.userEmail && (
                        <div className="text-sm text-gray-500 mt-2">
                          Usuario: {alerta.userEmail}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        {format(new Date(alerta.createdAt), "dd 'de' MMMM, HH:mm", { locale: es })}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.location.href = `/admin/alertas/${alerta.id}`}
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
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
            <h3 className="font-semibold mb-4">Top 10 Usuarios Más Activos</h3>
            <div className="space-y-2">
              {stats?.topUsuarios.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{user.nombre || 'N/A'}</div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por Nivel de Riesgo */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Por Nivel de Riesgo</h3>
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
                    {stats?.porNivelRiesgo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Por Categoría */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Por Categoría</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.porCategoria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" angle={-45} textAnchor="end" height={100} />
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
