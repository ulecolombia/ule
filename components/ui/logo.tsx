/**
 * ULE - LOGO COMPONENT
 * Logo de Ule con variantes de tamaño
 */

import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ size = 'md', className }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-primary shadow-sm',
          sizeClasses[size]
        )}
      >
        <span className="font-bold text-white">U</span>
      </div>
      {size !== 'sm' && (
        <span className={cn('font-bold text-gray-900', size === 'lg' ? 'text-3xl' : 'text-2xl')}>
          Ule
        </span>
      )}
    </div>
  )
}
