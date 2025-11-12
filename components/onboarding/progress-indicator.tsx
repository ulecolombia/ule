/**
 * ULE - PROGRESS INDICATOR
 * Indicador de progreso para onboarding multi-paso
 */

'use client'

import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  steps: {
    number: number
    title: string
  }[]
}

export function ProgressIndicator({
  currentStep,
  totalSteps,
  steps,
}: ProgressIndicatorProps) {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative mb-8 h-2 w-full overflow-hidden rounded-full bg-light-200">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-start justify-between">
        {steps.map((step) => {
          const isCompleted = step.number < currentStep
          const isCurrent = step.number === currentStep
          const isPending = step.number > currentStep

          return (
            <div
              key={step.number}
              className="flex flex-1 flex-col items-center"
            >
              {/* Step Circle */}
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300',
                  isCompleted &&
                    'bg-primary text-white shadow-md shadow-primary/30',
                  isCurrent &&
                    'bg-primary text-white shadow-lg shadow-primary/40 ring-4 ring-primary/20',
                  isPending && 'bg-light-200 text-dark-100'
                )}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined text-lg">
                    check
                  </span>
                ) : (
                  step.number
                )}
              </div>

              {/* Step Title */}
              <p
                className={cn(
                  'mt-2 text-center text-xs font-medium transition-colors duration-300',
                  (isCompleted || isCurrent) && 'text-dark',
                  isPending && 'text-dark-100'
                )}
              >
                {step.title}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
