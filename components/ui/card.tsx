/**
 * ULE - CARD COMPONENT
 * Componente de tarjeta con variantes
 */

import * as React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn, getCardStyles, CardVariant } from '@/lib/theme'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  title?: string
  subtitle?: string
  value?: string | number
  icon?: LucideIcon
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      title,
      subtitle,
      value,
      icon: Icon,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn(getCardStyles(variant), className)} {...props}>
        {/* Header con título e ícono */}
        {(title || Icon) && (
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-sm font-medium text-subtext-light dark:text-subtext-dark">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-xs text-subtext-light dark:text-subtext-dark">
                  {subtitle}
                </p>
              )}
            </div>
            {Icon && (
              <div className="rounded-lg bg-primary-light/20 p-2">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>
        )}

        {/* Valor principal (para cards de métricas) */}
        {value !== undefined && (
          <div className="mb-2">
            <p className="text-3xl font-bold text-text-light dark:text-text-dark">
              {value}
            </p>
          </div>
        )}

        {/* Contenido personalizado */}
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Subcomponentes para mayor flexibilidad
export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5', className)}
      {...props}
    />
  )
})
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn(
        'text-lg font-semibold text-text-light dark:text-text-dark',
        className
      )}
      {...props}
    />
  )
})
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-subtext-light dark:text-subtext-dark', className)}
      {...props}
    />
  )
})
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('', className)} {...props} />
})
CardContent.displayName = 'CardContent'

// Alias para compatibilidad
export const CardBody = CardContent

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex items-center pt-4', className)}
      {...props}
    />
  )
})
CardFooter.displayName = 'CardFooter'
