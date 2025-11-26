/**
 * ULE - SKELETON COMPONENT
 * Loading placeholder con animación
 */

import { cn } from '@/lib/utils'

export interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-light-200 animate-pulse rounded-md', className)} />
  )
}

/**
 * P1: Skeleton específico para resultados de simulación pensional
 */
export function SimulationResultSkeleton() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 border-t pt-4 duration-500">
      {/* Skeleton de tarjetas de resultados */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>

      {/* Skeleton de tabla comparativa */}
      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Skeleton de recomendación */}
      <div className="rounded-xl border-2 border-gray-200 p-6">
        <Skeleton className="mb-3 h-6 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </div>

      {/* Skeleton de gráficos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <Skeleton className="mb-3 h-4 w-32" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="mt-3 h-3 w-24" />
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <Skeleton className="mb-3 h-4 w-32" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="mt-3 h-3 w-24" />
        </div>
      </div>
    </div>
  )
}

/**
 * P1: Skeleton para resultados de simulación de régimen tributario
 */
export function RegimenResultSkeleton() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 border-t pt-4 duration-500">
      {/* Skeleton de tabla comparativa */}
      <div className="rounded-lg border border-gray-200 p-4">
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>

      {/* Skeleton de recomendación */}
      <div className="rounded-lg border-2 border-gray-200 p-4">
        <Skeleton className="mb-2 h-5 w-56" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>

      {/* Skeleton de gráficos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  )
}
