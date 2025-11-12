/**
 * ULE - SEARCHABLE SELECT COMPONENT
 * Select con búsqueda para listas grandes
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface SearchableSelectOption {
  value: string
  label: string
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  icon?: React.ReactNode
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
  disabled = false,
  className,
  icon,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus en input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-lg border border-light-200 bg-white px-4 py-3 text-sm text-dark',
          'transition-all duration-200',
          'hover:border-light-300',
          'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          icon && 'pl-10',
          className
        )}
      >
        <span className={cn(!selectedOption && 'text-dark-100')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="material-symbols-outlined text-dark-100">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Icon */}
      {icon && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dark-100">
          {icon}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-light-200 bg-white shadow-lg">
          {/* Search Input */}
          <div className="border-b border-light-200 p-2">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-lg border border-light-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-sm text-dark-100">
                No se encontraron resultados
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'w-full px-4 py-2.5 text-left text-sm transition-colors',
                    'hover:bg-light-50',
                    option.value === value &&
                      'bg-primary/5 font-medium text-primary'
                  )}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
