/**
 * ULE - CHECKBOX COMPONENT
 * Checkbox con label personalizable y diseño Ule
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps {
  label: string | React.ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  required?: boolean
  error?: string
  disabled?: boolean
  className?: string
  name?: string
}

export function Checkbox({
  label,
  checked,
  onChange,
  required = false,
  error,
  disabled = false,
  className,
  name,
}: CheckboxProps) {
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      onChange(!checked)
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <label className="flex items-start gap-3">
        {/* Hidden native checkbox for accessibility */}
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          required={required}
          className="sr-only"
        />

        {/* Custom checkbox visual */}
        <div
          onClick={handleToggle}
          className={cn(
            'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all',
            checked
              ? 'border-primary bg-primary'
              : 'border-light-300 bg-white hover:border-primary/50',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          )}
        >
          {checked && (
            <span className="material-symbols-outlined text-sm text-white">
              check
            </span>
          )}
        </div>

        {/* Label */}
        <span
          className={cn(
            'flex-1 text-sm',
            error ? 'text-error' : 'text-dark',
            disabled && 'opacity-50'
          )}
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </span>
      </label>

      {/* Error message */}
      {error && (
        <p className="text-error mt-1.5 flex items-center gap-1 text-sm">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </p>
      )}
    </div>
  )
}
