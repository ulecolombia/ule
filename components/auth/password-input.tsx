/**
 * ULE - COMPONENTE PASSWORD INPUT
 * Input de contraseña con botón de mostrar/ocultar e indicador de fortaleza
 * Diseño inspirado en N26 con validación visual y accesibilidad
 */

'use client'

import * as React from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Nivel de fortaleza de la contraseña
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong'

/**
 * Propiedades del componente PasswordInput
 */
export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
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
  /** Mostrar indicador de fortaleza de contraseña */
  showStrengthIndicator?: boolean
  /** Fortaleza actual de la contraseña */
  strength?: PasswordStrength
}

/**
 * Configuración de colores para los niveles de fortaleza
 */
const strengthConfig: Record<
  PasswordStrength,
  { label: string; color: string; barColor: string }
> = {
  weak: {
    label: 'Débil',
    color: 'text-error',
    barColor: 'bg-error',
  },
  medium: {
    label: 'Media',
    color: 'text-warning',
    barColor: 'bg-warning',
  },
  strong: {
    label: 'Fuerte',
    color: 'text-success',
    barColor: 'bg-success',
  },
}

/**
 * Input de contraseña con mostrar/ocultar e indicador de fortaleza
 * Incluye validación visual, atributos ARIA y navegación por teclado
 *
 * @example
 * ```tsx
 * <PasswordInput
 *   id="password"
 *   name="password"
 *   label="Contraseña"
 *   error={errors.password}
 *   showStrengthIndicator
 *   strength={passwordStrength}
 *   helperText="Mínimo 8 caracteres"
 *   required
 * />
 * ```
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
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
      showStrengthIndicator = false,
      strength,
      value,
      ...props
    },
    ref
  ) => {
    const id = propId || name
    const [showPassword, setShowPassword] = React.useState(false)

    /**
     * Alterna la visibilidad de la contraseña
     */
    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev)
    }

    /**
     * Maneja la tecla Enter en el botón de toggle
     */
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        togglePasswordVisibility()
      }
    }

    // Calcular número de barras activas según fortaleza
    const activeBarCount = strength
      ? { weak: 1, medium: 2, strong: 3 }[strength]
      : 0

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

        {/* Contenedor del input con botón de toggle */}
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            name={name}
            type={showPassword ? 'text' : 'password'}
            value={value}
            required={required}
            disabled={disabled}
            className={cn(
              'h-12 w-full rounded-xl border-2 bg-white px-4 py-3 pr-12 text-base transition-all duration-200',
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
              error
                ? `${id}-error`
                : helperText
                  ? `${id}-helper`
                  : showStrengthIndicator && strength
                    ? `${id}-strength`
                    : undefined
            }
            aria-required={required}
            {...props}
          />

          {/* Botón para mostrar/ocultar contraseña */}
          <button
            type="button"
            onClick={togglePasswordVisibility}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2',
              'rounded-lg p-1.5 transition-all duration-200',
              'hover:bg-light-50 focus:outline-none focus:ring-2 focus:ring-primary/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'text-dark-100 hover:text-dark'
            )}
            aria-label={
              showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
            aria-pressed={showPassword}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Indicador de fortaleza de contraseña */}
        {showStrengthIndicator && strength && value && (
          <div
            id={`${id}-strength`}
            className="animate-in fade-in-50 slide-in-from-top-1 space-y-2 duration-200"
            role="status"
            aria-live="polite"
          >
            {/* Barras de fortaleza */}
            <div className="flex gap-2" aria-hidden="true">
              {[1, 2, 3].map((bar) => (
                <div
                  key={bar}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all duration-300',
                    bar <= activeBarCount
                      ? strengthConfig[strength].barColor
                      : 'bg-light-100'
                  )}
                />
              ))}
            </div>

            {/* Etiqueta de fortaleza */}
            <p
              className={cn(
                'text-sm font-medium transition-colors duration-200',
                strengthConfig[strength].color
              )}
            >
              Fortaleza: {strengthConfig[strength].label}
            </p>
          </div>
        )}

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

PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
