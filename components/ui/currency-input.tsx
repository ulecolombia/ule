/**
 * ULE - CURRENCY INPUT COMPONENT
 * Input con formato de moneda colombiana (COP)
 */

'use client'

import React from 'react'
import CurrencyInput from 'react-currency-input-field'
import { cn } from '@/lib/utils'

export interface CurrencyInputProps {
  value?: string | number
  onValueChange?: (value: string | undefined, name?: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  name?: string
}

export function MoneyInput({
  value,
  onValueChange,
  placeholder = 'Ej: $2.500.000',
  disabled = false,
  className,
  name,
}: CurrencyInputProps) {
  return (
    <CurrencyInput
      name={name}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      disabled={disabled}
      prefix="$"
      groupSeparator="."
      decimalSeparator=","
      decimalsLimit={0}
      allowNegativeValue={false}
      className={cn(
        'flex h-12 w-full rounded-lg border border-light-200 bg-white px-4 py-3 text-sm text-dark',
        'transition-all duration-200',
        'placeholder:text-dark-100',
        'hover:border-light-300',
        'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    />
  )
}
