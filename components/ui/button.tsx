/**
 * ULE - BUTTON COMPONENT
 * Botón con diseño Ule
 */

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Loader2, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/theme'
import { getButtonStyles, ButtonVariant, ButtonSize } from '@/lib/theme'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
  loading?: boolean
  icon?: LucideIcon
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      asChild = false,
      loading = false,
      icon: Icon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(getButtonStyles(variant, size), 'space-x-2', className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : Icon ? (
          <Icon className="h-5 w-5" />
        ) : null}
        <span>{children}</span>
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button }
