/**
 * ULE - COMPONENTE FORM FIELD
 * Campo de formulario reutilizable con etiqueta, input y visualización de errores
 * Diseño inspirado en N26 con validación y accesibilidad
 */

'use client'

import * as React from 'react'
import { AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Propiedades del componente FormField
 */
export interface FormFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Etiqueta del campo */
  label: string
  /** Mensaje de error a mostrar */
  error?: string
  /** Texto de ayuda adicional */
  helperText?: string
  /** Identificador único del campo (por defecto usa el name) */
  id?: string
  /** Nombre del campo para el formulario */
  name: string
}

/**
 * Campo de formulario con etiqueta, input y manejo de errores
 * Incluye validación visual y atributos ARIA para accesibilidad
 *
 * @example
 * ```tsx
 * <FormField
 *   id="email"
 *   name="email"
 *   label="Correo electrónico"
 *   type="email"
 *   error={errors.email}
 *   helperText="Ingrese su correo institucional"
 *   required
 * />
 * ```
 */
const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      helperText,
      id: propId,
      name,
      className,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const id = propId || name

    return (
      <div className="w-full space-y-2">
        {/* Etiqueta del campo */}
        <Label
          htmlFor={id}
          className={cn(
            'text-sm font-medium text-dark transition-colors duration-200',
            error && 'text-error',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {label}
          {required && (
            <span className="ml-1 text-error" aria-label="obligatorio">
              *
            </span>
          )}
        </Label>

        {/* Campo de entrada */}
        <Input
          ref={ref}
          id={id}
          name={name}
          required={required}
          disabled={disabled}
          className={cn(
            'h-12 w-full rounded-xl border-2 bg-white px-4 py-3 text-base transition-all duration-200',
            'placeholder:text-dark-100',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:bg-light-50 disabled:opacity-50',
            error
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-light-100 hover:border-light-100/80 focus:border-primary focus:ring-primary/20',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
          aria-required={required}
          {...props}
        />

        {/* Mensaje de error */}
        {error && (
          <div
            id={`${id}-error`}
            className="animate-in fade-in-50 slide-in-from-top-1 flex items-center gap-1.5 text-sm text-error duration-200"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Texto de ayuda */}
        {helperText && !error && (
          <p
            id={`${id}-helper`}
            className="text-sm text-dark-100 transition-opacity duration-200"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

export { FormField }
