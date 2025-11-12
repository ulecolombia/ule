/**
 * ULE - COMPONENTE INPUT
 * Input profesional estilo Spotify/Stripe con label y error
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  error?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, required, ...props }, ref) => {
    if (label) {
      return (
        <div className="w-full">
          <label className="mb-2 block text-sm font-medium text-dark">
            {label}
            {required && <span className="ml-1 text-error">*</span>}
          </label>
          <input
            type={type}
            className={cn(
              // Base
              'w-full px-4 py-2 rounded-lg',
              'text-[15px] font-medium text-dark',

              // Placeholder
              'placeholder:text-dark-100 placeholder:font-normal',

              // Background y border
              'bg-white',
              error
                ? 'border-2 border-error'
                : 'border border-light-300',

              // Focus state
              error
                ? 'focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error'
                : 'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',

              // Hover
              !error && 'hover:border-primary/50',

              // Transition
              'transition-all duration-150',

              // Disabled
              'disabled:bg-light-50 disabled:cursor-not-allowed disabled:opacity-50',

              className
            )}
            ref={ref}
            {...props}
          />
          {error && (
            <p className="mt-1.5 flex items-center gap-1 text-sm text-error">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </p>
          )}
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(
          // Base
          'w-full px-4 py-2 rounded-lg',
          'text-[15px] font-medium text-dark',

          // Placeholder
          'placeholder:text-dark-100 placeholder:font-normal',

          // Background y border
          'bg-white',
          error
            ? 'border-2 border-error'
            : 'border border-light-300',

          // Focus state
          error
            ? 'focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error'
            : 'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',

          // Hover
          !error && 'hover:border-primary/50',

          // Transition
          'transition-all duration-150',

          // Disabled
          'disabled:bg-light-50 disabled:cursor-not-allowed disabled:opacity-50',

          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }
