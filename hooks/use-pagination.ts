/**
 * HOOK DE PAGINACIÓN OPTIMIZADA
 *
 * Proporciona funcionalidad de paginación con soporte para:
 * - Paginación tradicional (botones prev/next)
 * - Infinite scroll
 * - Loading states
 * - Error handling
 */

'use client'

import { useState, useCallback, useEffect } from 'react'

export interface PaginationOptions {
  initialPage?: number
  initialLimit?: number
  autoLoad?: boolean
}

export interface PaginationData<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
    hasPrevious: boolean
  }
}

export interface UsePaginationReturn<T> {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
  hasPrevious: boolean
  loading: boolean
  error: Error | null
  loadMore: () => Promise<void>
  nextPage: () => Promise<void>
  prevPage: () => Promise<void>
  goToPage: (page: number) => Promise<void>
  reload: () => Promise<void>
  reset: () => void
}

/**
 * Hook de paginación para APIs
 *
 * @example
 * ```tsx
 * const {
 *   items,
 *   loading,
 *   hasMore,
 *   loadMore,
 *   nextPage
 * } = usePagination<Aporte>('/api/pila/liquidacion')
 * ```
 */
export function usePagination<T>(
  url: string,
  options: PaginationOptions = {}
): UsePaginationReturn<T> {
  const { initialPage = 1, initialLimit = 20, autoLoad = true } = options

  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetch data from API
   */
  const fetchData = useCallback(
    async (pageNum: number, append = false) => {
      if (loading) return

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: String(limit),
        })

        const response = await fetch(`${url}?${params}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: PaginationData<T> = await response.json()

        // Verificar si data tiene la estructura esperada
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format')
        }

        const newItems = Array.isArray(data.aportes)
          ? data.aportes
          : Array.isArray(data.items)
            ? data.items
            : []

        setItems((prev) => (append ? [...prev, ...newItems] : newItems))

        if (data.pagination) {
          setTotal(data.pagination.total || 0)
          setTotalPages(data.pagination.totalPages || 0)
          setHasMore(data.pagination.hasMore || false)
          setHasPrevious(data.pagination.hasPrevious || false)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
        console.error('Error fetching paginated data:', err)
      } finally {
        setLoading(false)
      }
    },
    [url, limit, loading]
  )

  /**
   * Load more items (infinite scroll)
   */
  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      const nextPage = page + 1
      setPage(nextPage)
      await fetchData(nextPage, true) // append = true
    }
  }, [hasMore, loading, page, fetchData])

  /**
   * Go to next page (traditional pagination)
   */
  const nextPage = useCallback(async () => {
    if (hasMore && !loading) {
      const nextPageNum = page + 1
      setPage(nextPageNum)
      await fetchData(nextPageNum, false) // replace items
    }
  }, [hasMore, loading, page, fetchData])

  /**
   * Go to previous page
   */
  const prevPage = useCallback(async () => {
    if (hasPrevious && !loading && page > 1) {
      const prevPageNum = page - 1
      setPage(prevPageNum)
      await fetchData(prevPageNum, false)
    }
  }, [hasPrevious, loading, page, fetchData])

  /**
   * Go to specific page
   */
  const goToPage = useCallback(
    async (pageNum: number) => {
      if (pageNum >= 1 && pageNum <= totalPages && !loading) {
        setPage(pageNum)
        await fetchData(pageNum, false)
      }
    },
    [totalPages, loading, fetchData]
  )

  /**
   * Reload current page
   */
  const reload = useCallback(async () => {
    await fetchData(page, false)
  }, [page, fetchData])

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setItems([])
    setPage(initialPage)
    setTotal(0)
    setTotalPages(0)
    setHasMore(false)
    setHasPrevious(false)
    setError(null)
  }, [initialPage])

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      fetchData(page, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo en mount

  return {
    items,
    page,
    limit,
    total,
    totalPages,
    hasMore,
    hasPrevious,
    loading,
    error,
    loadMore,
    nextPage,
    prevPage,
    goToPage,
    reload,
    reset,
  }
}
