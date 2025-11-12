/**
 * ULE - SELECT COMPONENT
 * Select component con diseño Ule
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, icon, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-dark">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dark-100">
              {icon}
            </div>
          )}
          <select
            className={cn(
              'flex h-12 w-full appearance-none rounded-lg border border-light-200 bg-white px-4 py-3 text-sm text-dark',
              'transition-all duration-200',
              'hover:border-light-300',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              icon && 'pl-10',
              error && 'border-error focus:border-error focus:ring-error/20',
              'pr-10', // Space for dropdown arrow
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          {/* Custom dropdown arrow */}
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <span className="material-symbols-outlined text-dark-100">
              expand_more
            </span>
          </div>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-error">{error}</p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select }
