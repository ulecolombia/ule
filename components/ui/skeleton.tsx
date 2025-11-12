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
    <div
      className={cn(
        'animate-pulse rounded-md bg-light-200',
        className
      )}
    />
  )
}
