/**
 * HOOK DE PAGINACIÓN
 * Maneja la lógica de paginación de listas
 */

'use client'

import { useState, useMemo, useEffect, useRef } from 'react'

interface UsePaginationProps<T> {
  items: T[]
  itemsPerPage?: number
  resetOnItemsChange?: boolean // Si es true, resetea a página 1 cuando cambian los items
}

interface UsePaginationReturn<T> {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  paginatedItems: T[]
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  hasNextPage: boolean
  hasPrevPage: boolean
}

export function usePagination<T>({
  items,
  itemsPerPage = 20,
  resetOnItemsChange = true,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1)
  const prevItemsLengthRef = useRef(items.length)

  // ✅ Resetear a página 1 cuando cambian los items (filtros aplicados)
  useEffect(() => {
    if (resetOnItemsChange && items.length !== prevItemsLengthRef.current) {
      setCurrentPage(1)
      prevItemsLengthRef.current = items.length
    }
  }, [items.length, resetOnItemsChange])

  const totalPages = Math.ceil(items.length / itemsPerPage)

  // ✅ Si la página actual excede el total de páginas, ir a la última página
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }, [items, currentPage, itemsPerPage])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)
  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(totalPages)

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  }
}
