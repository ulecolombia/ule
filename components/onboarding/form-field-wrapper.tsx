/**
 * ULE - FORM FIELD WRAPPER
 * Wrapper reutilizable para campos de formulario con diseño Ule
 */

'use client'

import { cn } from '@/lib/utils'

interface FormFieldWrapperProps {
  label: string
  icon: React.ReactNode
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormFieldWrapper({
  label,
  icon,
  error,
  required = false,
  children,
  className,
}: FormFieldWrapperProps) {
  return (
    <div className={cn('w-full', className)}>
      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-dark">
        <span className="text-dark-100">{icon}</span>
        {label}
        {required && <span className="text-error">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-sm text-error">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </p>
      )}
    </div>
  )
}
