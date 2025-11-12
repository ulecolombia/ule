/**
 * SUSPENSE WRAPPER
 * Wrapper para Suspense con skeletons específicos por tipo
 */

'use client'

import { Suspense, ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface SuspenseWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  type?: 'chart' | 'table' | 'card' | 'list' | 'default'
}

export function SuspenseWrapper({
  children,
  fallback,
  type = 'default',
}: SuspenseWrapperProps) {
  if (fallback) {
    return <Suspense fallback={fallback}>{children}</Suspense>
  }

  // Fallbacks por defecto según tipo
  const defaultFallbacks: Record<string, ReactNode> = {
    chart: <ChartSkeleton />,
    table: <TableSkeleton />,
    card: <CardSkeleton />,
    list: <ListSkeleton />,
    default: <DefaultSkeleton />,
  }

  return <Suspense fallback={defaultFallbacks[type]}>{children}</Suspense>
}

/**
 * Skeleton para gráficos
 */
function ChartSkeleton() {
  return (
    <div className="w-full space-y-3 p-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-[400px] w-full" />
      <div className="flex justify-center space-x-4 mt-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

/**
 * Skeleton para tablas
 */
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4 border-b pb-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Rows */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex space-x-4 py-2">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-24" />
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton para cards
 */
function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex space-x-2 mt-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

/**
 * Skeleton para listas
 */
function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton por defecto
 */
function DefaultSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}
