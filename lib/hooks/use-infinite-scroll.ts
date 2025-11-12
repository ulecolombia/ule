/**
 * HOOK DE INFINITE SCROLL
 * Implementa scroll infinito con Intersection Observer
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'

interface UseInfiniteScrollProps {
  loadMore: () => void
  hasMore: boolean
  isLoading: boolean
  threshold?: number
}

export function useInfiniteScroll({
  loadMore,
  hasMore,
  isLoading,
  threshold = 100,
}: UseInfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const loadMoreCallbackRef = useRef(loadMore)
  const hasMoreRef = useRef(hasMore)
  const isLoadingRef = useRef(isLoading)

  // ✅ Mantener callbacks actualizados sin recrear el observer
  useEffect(() => {
    loadMoreCallbackRef.current = loadMore
    hasMoreRef.current = hasMore
    isLoadingRef.current = isLoading
  }, [loadMore, hasMore, isLoading])

  // ✅ Crear observer solo una vez (o cuando threshold cambie)
  useEffect(() => {
    // Limpiar observer anterior si existe
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    const options = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0.1,
    }

    // Usar refs para evitar recrear el observer
    observerRef.current = new IntersectionObserver(([entry]) => {
      if (
        entry.isIntersecting &&
        hasMoreRef.current &&
        !isLoadingRef.current
      ) {
        loadMoreCallbackRef.current()
      }
    }, options)

    const currentElement = loadMoreRef.current

    if (currentElement) {
      observerRef.current.observe(currentElement)
    }

    // ✅ Cleanup: disconnect y unobserve
    return () => {
      if (observerRef.current) {
        if (currentElement) {
          observerRef.current.unobserve(currentElement)
        }
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [threshold]) // Solo recrear cuando threshold cambie

  return { loadMoreRef }
}
