/**
 * ULE - RADIO CARD COMPONENT
 * Radio button estilizado como card seleccionable
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface RadioCardProps {
  value: string
  label: string
  description: string
  selected: boolean
  onChange: (value: string) => void
  icon?: React.ReactNode
  name: string
}

export function RadioCard({
  value,
  label,
  description,
  selected,
  onChange,
  icon,
  name,
}: RadioCardProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer flex-col gap-3 rounded-lg border-2 p-4 transition-all duration-200',
        'hover:border-primary/50',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-light-200 bg-white'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Radio input oculto pero accesible */}
        <input
          type="radio"
          name={name}
          value={value}
          checked={selected}
          onChange={() => onChange(value)}
          className="sr-only"
          aria-label={label}
        />

        {/* Indicador visual del radio */}
        <div
          className={cn(
            'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all',
            selected
              ? 'border-primary bg-primary'
              : 'border-light-300 bg-white'
          )}
        >
          {selected && (
            <div className="h-2 w-2 rounded-full bg-white" />
          )}
        </div>

        {/* Contenido */}
        <div className="flex flex-1 items-start gap-3">
          {icon && (
            <div
              className={cn(
                'flex-shrink-0 transition-colors',
                selected ? 'text-primary' : 'text-dark-100'
              )}
            >
              {icon}
            </div>
          )}

          <div className="flex-1">
            <h4
              className={cn(
                'font-semibold transition-colors',
                selected ? 'text-primary' : 'text-dark'
              )}
            >
              {label}
            </h4>
            <p className="mt-1 text-sm text-dark-100">{description}</p>
          </div>
        </div>
      </div>
    </label>
  )
}
