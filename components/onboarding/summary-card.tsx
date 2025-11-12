/**
 * ULE - SUMMARY CARD COMPONENT
 * Card de resumen para mostrar datos de cada paso del onboarding
 */

'use client'

import React from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface SummaryField {
  key: string
  label: string
  format?: (value: any) => string
  badge?: (value: any) => { label: string; variant: 'success' | 'warning' | 'danger' | 'default' } | null
}

export interface SummaryCardProps {
  title: string
  icon: string
  data: Record<string, any>
  onEdit: () => void
  fields: SummaryField[]
}

export function SummaryCard({
  title,
  icon,
  data,
  onEdit,
  fields,
}: SummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-primary">
                {icon}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-dark">{title}</h3>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <span className="material-symbols-outlined mr-1 text-sm">
              edit
            </span>
            Editar
          </Button>
        </div>
      </CardHeader>

      <CardBody>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const value = data[field.key]
            if (value === undefined || value === null || value === '') {
              return null
            }

            const displayValue = field.format ? field.format(value) : value
            const badgeInfo = field.badge ? field.badge(value) : null

            return (
              <div key={field.key} className="space-y-1">
                <p className="text-sm text-dark-100">{field.label}</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-dark">{displayValue}</p>
                  {badgeInfo && (
                    <Badge variant={badgeInfo.variant}>
                      {badgeInfo.label}
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}
