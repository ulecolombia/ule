/**
 * ULE - COMPONENTE LOADING
 * Indicadores de carga y skeleton loaders
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Spinner animado de carga
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size = 'md',
  ...props
}) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  }

  return (
    <div
      role="status"
      aria-label="Cargando"
      className={cn('flex items-center justify-center', className)}
      {...props}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-primary border-t-transparent',
          sizes[size]
        )}
      />
    </div>
  )
}

/**
 * Skeleton loader para contenido
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  ...props
}) => {
  const variants = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full aspect-square',
    rectangular: 'rounded-xl',
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-light-100',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

/**
 * Componente de carga para páginas completas
 */
export const PageLoader: React.FC = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-light-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-dark-100">Cargando Ule...</p>
      </div>
    </div>
  )
}

/**
 * Skeleton para tarjetas de contenido
 */
export const CardSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-soft">
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton para listas
 */
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-soft">
          <Skeleton variant="circular" className="h-12 w-12" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
