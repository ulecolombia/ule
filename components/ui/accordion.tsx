/**
 * ACCORDION COMPONENT
 * Componente colapsable para FAQs
 */

'use client'

import * as React from 'react'

interface AccordionContextType {
  openItems: string[]
  toggleItem: (value: string) => void
  type: 'single' | 'multiple'
}

const AccordionContext = React.createContext<AccordionContextType | undefined>(undefined)

interface AccordionProps {
  type: 'single' | 'multiple'
  collapsible?: boolean
  children: React.ReactNode
  className?: string
  defaultValue?: string | string[]
}

export function Accordion({
  type,
  collapsible = false,
  children,
  className = '',
  defaultValue,
}: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<string[]>(() => {
    if (!defaultValue) return []
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue]
  })

  const toggleItem = (value: string) => {
    setOpenItems((prev) => {
      if (type === 'single') {
        // En modo single, solo un item abierto a la vez
        if (prev.includes(value)) {
          return collapsible ? [] : prev
        }
        return [value]
      } else {
        // En modo multiple, varios items pueden estar abiertos
        if (prev.includes(value)) {
          return prev.filter((item) => item !== value)
        }
        return [...prev, value]
      }
    })
  }

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

function AccordionItemBase({ value, children, className = '' }: AccordionItemProps) {
  return (
    <div className={className} data-value={value}>
      {children}
    </div>
  )
}

interface AccordionTriggerProps {
  children: React.ReactNode
  className?: string
}

export function AccordionTrigger({ children, className = '' }: AccordionTriggerProps) {
  const context = React.useContext(AccordionContext)
  if (!context) throw new Error('AccordionTrigger must be used within Accordion')

  const parent = React.useContext(AccordionItemContext)
  if (!parent) throw new Error('AccordionTrigger must be used within AccordionItem')

  const isOpen = context.openItems.includes(parent.value)

  return (
    <button
      onClick={() => context.toggleItem(parent.value)}
      className={`flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline ${className}`}
    >
      {children}
      <span
        className={`material-symbols-outlined transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`}
      >
        expand_more
      </span>
    </button>
  )
}

interface AccordionContentProps {
  children: React.ReactNode
  className?: string
}

const AccordionItemContext = React.createContext<{ value: string } | undefined>(undefined)

export function AccordionContent({ children, className = '' }: AccordionContentProps) {
  const context = React.useContext(AccordionContext)
  if (!context) throw new Error('AccordionContent must be used within Accordion')

  const parent = React.useContext(AccordionItemContext)
  if (!parent) throw new Error('AccordionContent must be used within AccordionItem')

  const isOpen = context.openItems.includes(parent.value)

  return (
    <div
      className={`overflow-hidden transition-all ${
        isOpen ? 'max-h-screen pb-4' : 'max-h-0'
      } ${className}`}
    >
      <div>{children}</div>
    </div>
  )
}

// Wrapper para AccordionItem que provee el contexto
export function AccordionItem({ value, children, className }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <AccordionItemBase value={value} className={className}>
        {children}
      </AccordionItemBase>
    </AccordionItemContext.Provider>
  )
}
