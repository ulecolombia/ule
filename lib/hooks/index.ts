/**
 * CUSTOM HOOKS INDEX
 * Exportación centralizada de todos los hooks personalizados
 */

// Hooks de utilidad general
export { useAnalytics } from './use-analytics'
export { useCachedData } from './use-cached-data'
export { useInfiniteScroll } from './use-infinite-scroll'
export { usePagination } from './use-pagination'

// Hooks de seguridad y storage
export { useSecureStorage } from './use-secure-storage'
export type { UseSecureStorageOptions } from './use-secure-storage'

// Hooks de UX
export { useUnsavedChanges } from './use-unsaved-changes'
export type { UseUnsavedChangesOptions } from './use-unsaved-changes'

// Hooks de simuladores financieros
export {
  usePensionSimulator,
  DEFAULT_PENSION_INPUTS,
} from './use-pension-simulator'
export type {
  PensionSimulatorInputs,
  PensionSimulatorOptions,
} from './use-pension-simulator'

export {
  useRegimenSimulator,
  DEFAULT_REGIMEN_INPUTS,
} from './use-regimen-simulator'
export type { RegimenSimulatorInputs } from './use-regimen-simulator'
