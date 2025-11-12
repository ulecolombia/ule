/**
 * ULE - INFO BANNER COMPONENT
 * Banner informativo reutilizable para mensajes contextuales
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface InfoBannerProps {
  type: 'warning' | 'info' | 'success' | 'error'
  title?: string
  message: string | React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  icon?: string
  className?: string
}

export function InfoBanner({
  type,
  title,
  message,
  action,
  icon,
  className,
}: InfoBannerProps) {
  const styles = {
    warning: {
      container: 'bg-warning/10 border-l-4 border-warning',
      icon: 'text-warning',
      title: 'text-warning',
      message: 'text-warning/90',
      defaultIcon: 'warning',
    },
    info: {
      container: 'bg-blue-50 border-l-4 border-blue-500',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      message: 'text-blue-700',
      defaultIcon: 'info',
    },
    success: {
      container: 'bg-success/10 border-l-4 border-success',
      icon: 'text-success',
      title: 'text-success',
      message: 'text-success/90',
      defaultIcon: 'check_circle',
    },
    error: {
      container: 'bg-error/10 border-l-4 border-error',
      icon: 'text-error',
      title: 'text-error',
      message: 'text-error/90',
      defaultIcon: 'error',
    },
  }

  const style = styles[type]
  const iconName = icon || style.defaultIcon

  return (
    <div
      className={cn(
        'rounded-lg p-4',
        style.container,
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className={cn('material-symbols-outlined flex-shrink-0', style.icon)}>
          {iconName}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn('mb-1 font-semibold', style.title)}>{title}</h4>
          )}
          <div className={cn('text-sm', style.message)}>
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>

          {/* Action Button */}
          {action && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className="mt-3"
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
