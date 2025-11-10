/**
 * ULE - COMPONENTE INPUT
 * Input profesional estilo Spotify/Stripe
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base
          'w-full h-14 px-4 rounded-md',
          'text-[15px] font-medium text-gray-900',

          // Placeholder
          'placeholder:text-gray-500 placeholder:font-normal',

          // Background y border
          'bg-white',
          'border border-gray-300',

          // Focus state (minimalista)
          'focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900',

          // Hover
          'hover:border-gray-400',

          // Transition
          'transition-all duration-150',

          // Disabled
          'disabled:bg-gray-50 disabled:cursor-not-allowed',

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
