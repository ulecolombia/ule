/**
 * ULE - PÁGINA DE LOGIN
 * Página de inicio de sesión
 */

import { Suspense } from 'react'
import { AuthCard } from '@/components/auth/auth-card'
import { LoginForm } from '@/components/auth/login-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2 } from 'lucide-react'

/**
 * Página de inicio de sesión
 * Ruta: /login
 */
export default function LoginPage({
  searchParams,
}: {
  searchParams: { registered?: string; error?: string }
}) {
  return (
    <AuthCard title="Iniciar sesión" description="Accede a tu cuenta de Ule">
      {searchParams.registered === 'true' && (
        <Alert variant="success" className="mb-6">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            ¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.
          </AlertDescription>
        </Alert>
      )}

      {searchParams.error && (
        <Alert variant="error" className="mb-6">
          <AlertDescription>
            Ocurrió un error. Por favor, intenta nuevamente.
          </AlertDescription>
        </Alert>
      )}

      <Suspense fallback={<div>Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  )
}

export const metadata = {
  title: 'Iniciar sesión',
  description: 'Inicia sesión en tu cuenta de Ule',
}
