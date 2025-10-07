/**
 * ULE - AUTH CARD COMPONENT
 * Card wrapper para páginas de autenticación con diseño N26
 */

import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AuthCardProps {
  children: React.ReactNode
  title: string
  description?: string
  className?: string
}

/**
 * Card wrapper para páginas de autenticación
 * Diseño inspirado en N26
 */
export function AuthCard({
  children,
  title,
  description,
  className,
}: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-dark via-dark-50 to-dark p-4">
      <Card
        className={cn(
          'w-full max-w-md',
          'rounded-2xl shadow-2xl',
          'border border-dark-100/20',
          'bg-light/95 backdrop-blur-sm',
          className
        )}
      >
        <CardHeader className="space-y-2 pb-8 text-center">
          {/* Logo de Ule */}
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
              <span className="text-2xl font-bold text-white">U</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-dark">{title}</h1>
          {description && (
            <p className="text-sm text-dark-100">{description}</p>
          )}
        </CardHeader>

        <CardBody className="pt-0">{children}</CardBody>
      </Card>
    </div>
  )
}
