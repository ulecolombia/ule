/**
 * ULE - PASSWORD INPUT COMPONENT
 * Input de contraseña con toggle de visibilidad
 */

'use client'

import { useState, forwardRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <div className="relative">
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={`
            w-full px-4 py-3 pr-12 border rounded-xl
            focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
            transition-all
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
