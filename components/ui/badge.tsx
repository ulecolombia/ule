/**
 * ULE - BADGE COMPONENT
 * Componente de badge con variantes
 */

import * as React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn, getBadgeStyles, BadgeVariant } from '@/lib/theme'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  icon?: LucideIcon
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', icon: Icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(getBadgeStyles(variant), className)}
        {...props}
      >
        {Icon && <Icon className="h-3 w-3" />}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
