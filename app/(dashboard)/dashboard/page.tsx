/**
 * ULE - PÁGINA DE DASHBOARD
 * Dashboard principal (ruta protegida)
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LogOut, User, Shield } from 'lucide-react'

/**
 * Dashboard principal (ruta protegida)
 * Solo accesible para usuarios autenticados
 */
export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-light-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-dark">
              Bienvenido, {session.user.name}
            </h1>
            <p className="text-dark-100">Dashboard de Ule</p>
          </div>

          <form action="/api/auth/signout" method="POST">
            <Button variant="outline" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </form>
        </div>

        {/* Información del usuario */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="rounded-xl bg-primary/10 p-3">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-dark-100">Usuario</p>
                <p className="font-semibold text-dark">{session.user.email}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="rounded-xl bg-success/10 p-3">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-dark-100">Rol</p>
                <Badge variant="success">{session.user.role}</Badge>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="rounded-xl bg-warning/10 p-3">
                <Shield className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-dark-100">Estado</p>
                <Badge variant="success">Activo</Badge>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Contenido principal */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-dark">
              Sistema de Gestión de Seguridad Social
            </h2>
          </CardHeader>
          <CardBody>
            <p className="mb-4 text-dark-100">
              Autenticación implementada exitosamente. El sistema está listo
              para agregar funcionalidades específicas de gestión de seguridad
              social.
            </p>

            <div className="rounded-lg bg-light-50 p-4">
              <h3 className="mb-2 font-semibold text-dark">
                ✅ Subfase 0.2 Completada
              </h3>
              <ul className="space-y-2 text-sm text-dark-100">
                <li>• Registro de usuarios funcional</li>
                <li>• Login con validación robusta</li>
                <li>• Logout implementado</li>
                <li>• Protección de rutas con middleware</li>
                <li>• Diseño N26-style aplicado</li>
                <li>• Roles y permisos configurados</li>
              </ul>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Dashboard',
  description: 'Dashboard de Ule',
}
