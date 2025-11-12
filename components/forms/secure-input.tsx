'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SecureInputProps {
  id: string
  label: string
  type: 'text' | 'email' | 'tel' | 'number'
  value: string
  onChange: (value: string) => void
  sanitizeType?: 'text' | 'email' | 'documento' | 'telefono'
  maxLength?: number
  placeholder?: string
  required?: boolean
  showMask?: boolean
  error?: string
  className?: string
}

/**
 * Input seguro con sanitización automática y enmascaramiento opcional
 *
 * Características:
 * - Sanitización automática según tipo
 * - Enmascaramiento de datos sensibles
 * - Validación de longitud
 * - Indicadores visuales de seguridad
 */
export function SecureInput({
  id,
  label,
  type,
  value,
  onChange,
  sanitizeType = 'text',
  maxLength,
  placeholder,
  required,
  showMask,
  error,
  className = '',
}: SecureInputProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isMasked, setIsMasked] = useState(showMask)

  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let sanitized = e.target.value

    // Sanitización del lado del cliente
    switch (sanitizeType) {
      case 'documento':
        // Solo números
        sanitized = sanitized.replace(/\D/g, '')
        break
      case 'telefono':
        // Solo números y +
        sanitized = sanitized.replace(/[^\d+]/g, '')
        break
      case 'email':
        // Lowercase y trim
        sanitized = sanitized.toLowerCase().trim()
        break
      case 'text':
        // Remover caracteres potencialmente peligrosos
        sanitized = sanitized.replace(/[<>]/g, '')
        break
    }

    // Limitar longitud
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.slice(0, maxLength)
    }

    setDisplayValue(sanitized)
    onChange(sanitized)
  }

  const toggleMask = () => {
    setIsMasked(!isMasked)
  }

  const getMaskedValue = (val: string) => {
    if (val.length <= 4) return val
    return '*'.repeat(val.length - 4) + val.slice(-4)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {showMask && displayValue && (
          <button
            type="button"
            onClick={toggleMask}
            className="text-xs text-primary hover:underline focus:outline-none"
          >
            {isMasked ? 'Mostrar' : 'Ocultar'}
          </button>
        )}
      </div>

      <div className="relative">
        <Input
          id={id}
          type={type}
          value={
            isMasked && displayValue ? getMaskedValue(displayValue) : displayValue
          }
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          className={error ? 'border-red-500 pr-10' : 'pr-10'}
        />

        {sanitizeType === 'documento' && displayValue && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-green-600"
            >
              <path
                fillRule="evenodd"
                d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {maxLength && (
        <p className="text-xs text-gray-500">
          {displayValue.length} / {maxLength} caracteres
        </p>
      )}

      {error && (
        <p className="text-sm text-red-500 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 mr-1"
          >
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {sanitizeType === 'documento' && displayValue.length > 0 && !error && (
        <p className="text-xs text-gray-500 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-3 h-3 mr-1"
          >
            <path
              fillRule="evenodd"
              d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
              clipRule="evenodd"
            />
          </svg>
          Este dato será encriptado antes de guardarse
        </p>
      )}
    </div>
  )
}
