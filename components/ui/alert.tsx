/**
 * ULE - COMPONENTE ALERT
 * Alerta para mostrar mensajes informativos, de éxito, advertencia o error
 */

'use client'

import * as React from 'react'
import { X, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error'
  dismissible?: boolean
  onDismiss?: () => void
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'info',
      dismissible = false,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true)

    const handleDismiss = () => {
      setIsVisible(false)
      onDismiss?.()
    }

    if (!isVisible) return null

    const variants = {
      info: {
        container: 'bg-primary/10 border-primary/20 text-primary',
        icon: Info,
      },
      success: {
        container: 'bg-success/10 border-success/20 text-success',
        icon: CheckCircle,
      },
      warning: {
        container: 'bg-warning/10 border-warning/20 text-warning',
        icon: AlertTriangle,
      },
      error: {
        container: 'bg-error/10 border-error/20 text-error',
        icon: XCircle,
      },
    }

    const Icon = variants[variant].icon

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative rounded-xl border-2 p-4',
          variants[variant].container,
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{children}</div>
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 rounded-lg p-1 hover:bg-black/5 transition-colors"
              aria-label="Cerrar alerta"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }
)

Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-semibold leading-none', className)}
    {...props}
  />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
