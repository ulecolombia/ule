'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface LogAuditoria {
  id: string
  userEmail?: string
  userName?: string
  accion: string
  recurso?: string
  exitoso: boolean
  categoria: string
  nivelRiesgo: string
  ip: string
  dispositivo?: string
  navegador?: string
  timestamp: string
  detalles?: any
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<LogAuditoria[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Filtros
  const [filtros, setFiltros] = useState({
    userEmail: '',
    accion: '',
    categoria: '',
    nivelRiesgo: '',
    exitoso: '',
    fechaInicio: '',
    fechaFin: '',
    ip: '',
    page: 1,
  })

  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  // ✅ MEDIO #15 & #16: useCallback con dependencies + AbortController
  const cargarLogs = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true)

      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value.toString())
      })

      const response = await fetch(`/api/admin/auditoria?${params}`, {
        signal, // ✅ MEDIO #16: Cancelable fetch
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar logs')
      }

      setLogs(data.logs)
      setPagination(data.pagination)
    } catch (error: any) {
      if (error.name === 'AbortError') return // Ignorar cancelación
      toast.error(error.message || 'Error al cargar logs')
    } finally {
      setIsLoading(false)
    }
  }, [filtros]) // ✅ MEDIO #15: Dependency array completo

  useEffect(() => {
    const controller = new AbortController()
    cargarLogs(controller.signal)
    return () => controller.abort() // Cleanup
  }, [cargarLogs])

  const aplicarFiltros = () => {
    setFiltros({ ...filtros, page: 1 })
    cargarLogs()
  }

  const limpiarFiltros = () => {
    setFiltros({
      userEmail: '',
      accion: '',
      categoria: '',
      nivelRiesgo: '',
      exitoso: '',
      fechaInicio: '',
      fechaFin: '',
      ip: '',
      page: 1,
    })
    cargarLogs()
  }

  const verDetalle = async (logId: string) => {
    try {
      const response = await fetch(`/api/admin/auditoria/${logId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar detalle')
      }

      setSelectedLog(data.log)
      setShowDetails(true)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar detalle')
    }
  }

  const exportarLogs = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, value]) => {
        if (value && key !== 'page') params.append(key, value.toString())
      })

      window.open(`/api/admin/auditoria/export?${params}`, '_blank')
      toast.success('Exportación iniciada')
    } catch (error) {
      toast.error('Error al exportar logs')
    }
  }

  const getNivelRiesgoColor = (nivel: string) => {
    const colors: Record<string, string> = {
      BAJO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      MEDIO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      ALTO: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      CRITICO: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }
    return colors[nivel] || colors.BAJO
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
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
            history
          </span>
          Auditoría del Sistema
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Registro completo de todas las acciones críticas del sistema
        </p>
      </div>

      {/* Filtros */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4 flex items-center">
          <span className="material-symbols-outlined mr-2">filter_alt</span>
          Filtros de Búsqueda
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Email Usuario */}
          <div>
            <label className="text-sm font-medium mb-2 block">Email Usuario</label>
            <Input
              placeholder="usuario@ejemplo.com"
              value={filtros.userEmail}
              onChange={(e) => setFiltros({ ...filtros, userEmail: e.target.value })}
            />
          </div>

          {/* Acción */}
          <div>
            <label className="text-sm font-medium mb-2 block">Acción</label>
            <Select
              value={filtros.accion}
              onValueChange={(value) => setFiltros({ ...filtros, accion: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las acciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="LOGIN_FALLIDO">Login Fallido</SelectItem>
                <SelectItem value="PASSWORD_CAMBIADO">Cambio de Contraseña</SelectItem>
                <SelectItem value="PILA_LIQUIDADA">PILA Liquidada</SelectItem>
                <SelectItem value="PILA_PAGADA">PILA Pagada</SelectItem>
                <SelectItem value="FACTURA_EMITIDA">Factura Emitida</SelectItem>
                <SelectItem value="DATOS_EXPORTADOS">Datos Exportados</SelectItem>
                <SelectItem value="SOLICITUD_ELIMINACION">Solicitud Eliminación</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Categoría */}
          <div>
            <label className="text-sm font-medium mb-2 block">Categoría</label>
            <Select
              value={filtros.categoria}
              onValueChange={(value) => setFiltros({ ...filtros, categoria: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="AUTENTICACION">Autenticación</SelectItem>
                <SelectItem value="DATOS_PERSONALES">Datos Personales</SelectItem>
                <SelectItem value="DATOS_FINANCIEROS">Datos Financieros</SelectItem>
                <SelectItem value="FACTURACION">Facturación</SelectItem>
                <SelectItem value="SEGURIDAD_SOCIAL">Seguridad Social</SelectItem>
                <SelectItem value="SEGURIDAD">Seguridad</SelectItem>
                <SelectItem value="ADMINISTRACION">Administración</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nivel de Riesgo */}
          <div>
            <label className="text-sm font-medium mb-2 block">Nivel de Riesgo</label>
            <Select
              value={filtros.nivelRiesgo}
              onValueChange={(value) => setFiltros({ ...filtros, nivelRiesgo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los niveles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="BAJO">Bajo</SelectItem>
                <SelectItem value="MEDIO">Medio</SelectItem>
                <SelectItem value="ALTO">Alto</SelectItem>
                <SelectItem value="CRITICO">Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div>
            <label className="text-sm font-medium mb-2 block">Estado</label>
            <Select
              value={filtros.exitoso}
              onValueChange={(value) => setFiltros({ ...filtros, exitoso: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="true">Exitoso</SelectItem>
                <SelectItem value="false">Fallido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* IP */}
          <div>
            <label className="text-sm font-medium mb-2 block">Dirección IP</label>
            <Input
              placeholder="192.168.1.1"
              value={filtros.ip}
              onChange={(e) => setFiltros({ ...filtros, ip: e.target.value })}
            />
          </div>

          {/* Fecha Inicio */}
          <div>
            <label className="text-sm font-medium mb-2 block">Desde</label>
            <Input
              type="datetime-local"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
            />
          </div>

          {/* Fecha Fin */}
          <div>
            <label className="text-sm font-medium mb-2 block">Hasta</label>
            <Input
              type="datetime-local"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={aplicarFiltros}>
            <span className="material-symbols-outlined mr-2">search</span>
            Buscar
          </Button>
          <Button onClick={limpiarFiltros} variant="outline">
            <span className="material-symbols-outlined mr-2">clear</span>
            Limpiar
          </Button>
          <Button onClick={exportarLogs} variant="outline" className="ml-auto">
            <span className="material-symbols-outlined mr-2">download</span>
            Exportar
          </Button>
        </div>
      </Card>

      {/* Tabla de Logs */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">
            Logs de Auditoría ({pagination.total.toLocaleString()})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha/Hora</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Riesgo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    <span className="material-symbols-outlined text-4xl mb-2">
                      search_off
                    </span>
                    <p>No se encontraron logs con los filtros aplicados</p>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.userName || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{log.userEmail || 'Sistema'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{log.accion}</span>
                      {log.recurso && (
                        <div className="text-xs text-gray-500 mt-1">{log.recurso}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getNivelRiesgoColor(log.nivelRiesgo)}>
                        {log.nivelRiesgo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.exitoso ? (
                        <Badge className="bg-green-100 text-green-800">
                          <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                          Exitoso
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <span className="material-symbols-outlined text-sm mr-1">error</span>
                          Fallido
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.dispositivo && (
                          <div className="capitalize">{log.dispositivo}</div>
                        )}
                        {log.navegador && (
                          <div className="text-xs text-gray-500">{log.navegador}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => verDetalle(log.id)}
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Página {pagination.page} de {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setFiltros({ ...filtros, page: pagination.page - 1 })}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setFiltros({ ...filtros, page: pagination.page + 1 })}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal de Detalle */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Log de Auditoría</DialogTitle>
            <DialogDescription>
              Información completa del evento registrado
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              {/* Información General */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Información General</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">ID:</span>
                    <div className="font-mono">{selectedLog.id}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Fecha/Hora:</span>
                    <div>
                      {format(new Date(selectedLog.timestamp), "dd 'de' MMMM 'de' yyyy, HH:mm:ss", { locale: es })}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Usuario:</span>
                    <div>{selectedLog.userName || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{selectedLog.userEmail || 'Sistema'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Acción:</span>
                    <div className="font-mono">{selectedLog.accion}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Categoría:</span>
                    <div><Badge variant="outline">{selectedLog.categoria}</Badge></div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Nivel de Riesgo:</span>
                    <div>
                      <Badge className={getNivelRiesgoColor(selectedLog.nivelRiesgo)}>
                        {selectedLog.nivelRiesgo}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Estado:</span>
                    <div>
                      {selectedLog.exitoso ? (
                        <Badge className="bg-green-100 text-green-800">Exitoso</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Fallido</Badge>
                      )}
                    </div>
                  </div>
                  {selectedLog.recurso && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Recurso:</span>
                      <div className="font-mono text-xs">{selectedLog.recurso}</div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Contexto Técnico */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Contexto Técnico</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">IP:</span>
                    <div className="font-mono">{selectedLog.ip}</div>
                  </div>
                  {selectedLog.ipGeo && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Ubicación:</span>
                      <div>
                        {selectedLog.ipGeo.city}, {selectedLog.ipGeo.country}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Dispositivo:</span>
                    <div className="capitalize">{selectedLog.dispositivo || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Navegador:</span>
                    <div>{selectedLog.navegador || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Sistema Operativo:</span>
                    <div>{selectedLog.sistemaOperativo || 'N/A'}</div>
                  </div>
                  {selectedLog.metodoHttp && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Método HTTP:</span>
                      <div className="font-mono">{selectedLog.metodoHttp}</div>
                    </div>
                  )}
                  {selectedLog.ruta && (
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">Ruta:</span>
                      <div className="font-mono text-xs break-all">{selectedLog.ruta}</div>
                    </div>
                  )}
                  {selectedLog.duracionMs && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Duración:</span>
                      <div>{selectedLog.duracionMs} ms</div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Error (si aplica) */}
              {!selectedLog.exitoso && (
                <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <h4 className="font-semibold mb-3 text-red-800 dark:text-red-200">
                    Información del Error
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedLog.codigoError && (
                      <div>
                        <span className="text-red-600 dark:text-red-400">Código:</span>
                        <div className="font-mono">{selectedLog.codigoError}</div>
                      </div>
                    )}
                    {selectedLog.mensajeError && (
                      <div>
                        <span className="text-red-600 dark:text-red-400">Mensaje:</span>
                        <div>{selectedLog.mensajeError}</div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Detalles */}
              {selectedLog.detalles && Object.keys(selectedLog.detalles).length > 0 && (
                <Card className="p-4">
                  <h4 className="font-semibold mb-3">Detalles Adicionales</h4>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.detalles, null, 2)}
                  </pre>
                </Card>
              )}

              {/* User Agent Completo */}
              {selectedLog.userAgent && (
                <Card className="p-4">
                  <h4 className="font-semibold mb-3">User Agent</h4>
                  <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded break-all">
                    {selectedLog.userAgent}
                  </div>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
