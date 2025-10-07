/**
 * ULE - PÁGINA DE REGISTRO
 * Página de creación de cuenta
 */

import { Suspense } from 'react'
import { AuthCard } from '@/components/auth/auth-card'
import { RegisterForm } from '@/components/auth/register-form'

/**
 * Página de registro de usuarios
 * Ruta: /registro
 */
export default function RegisterPage() {
  return (
    <AuthCard
      title="Crear cuenta"
      description="Únete a Ule y gestiona tu seguridad social"
    >
      <Suspense fallback={<div>Cargando...</div>}>
        <RegisterForm />
      </Suspense>
    </AuthCard>
  )
}

export const metadata = {
  title: 'Crear cuenta',
  description: 'Crea tu cuenta en Ule',
}
