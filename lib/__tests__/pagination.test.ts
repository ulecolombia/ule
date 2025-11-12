/**
 * TESTS PARA usePagination HOOK
 * Tests unitarios para el hook de paginación
 */

import { renderHook, act } from '@testing-library/react'
import { usePagination } from '../hooks/use-pagination'

describe('usePagination Hook', () => {
  describe('Paginación básica', () => {
    it('debe inicializar en página 1', () => {
      const items = Array.from({ length: 50 }, (_, i) => i + 1)

      const { result } = renderHook(() =>
        usePagination({ items, itemsPerPage: 10 })
      )

      expect(result.current.currentPage).toBe(1)
    })

    it('debe calcular total de páginas correctamente', () => {
      const items = Array.from({ length: 47 }, (_, i) => i + 1)

      const { result } = renderHook(() =>
        usePagination({ items, itemsPerPage: 10 })
      )

      // 47 items / 10 per page = 5 páginas (4 completas + 1 con 7 items)
      expect(result.current.totalPages).toBe(5)
    })

    it('debe retornar items de la página actual correctamente', () => {
      const items = Array.from({ length: 25 }, (_, i) => i + 1)

      const { result } = renderHook(() =>
        usePagination({ items, itemsPerPage: 10 })
      )

      // Página 1 debe tener items 1-10
      expect(result.current.paginatedItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    })

    it('debe navegar a la siguiente página', () => {
      const items = Array.from({ length: 30 }, (_, i) => i + 1)

      const { result } = renderHook(() =>
        usePagination({ items, itemsPerPage: 10 })
      )

      act(() => {
        result.current.nextPage()
      })

      expect(result.current.currentPage).toBe(2)
      expect(result.current.paginatedItems).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
    })

    it('debe navegar a la página anterior', () => {
      const items = Array.from({ length: 30 }, (_, i) => i + 1)

      const { result } = renderHook(() =>
        usePagination({ items, itemsPerPage: 10 })
      )

      // Ir a página 2
      act(() => {
        result.current.goToPage(2)
      })

      // Volver a página 1
      act(() => {
        result.current.prevPage()
      })

      expect(result.current.currentPage).toBe(1)
    })

    it('no debe ir más allá de la última página', () => {
      const items = Array.from({ length: 25 }, (_, i) => i + 1)

      const { result } = renderHook(() =>
        usePagination({ items, itemsPerPage: 10 })
      )

      // Ir a última página (3)
      act(() => {
        result.current.goToLastPage()
      })

      expect(result.current.currentPage).toBe(3)

      // Intentar ir a la siguiente
      act(() => {
        result.current.nextPage()
      })

      // Debe permanecer en página 3
      expect(result.current.currentPage).toBe(3)
    })

    it('no debe ir antes de la primera página', () => {
      const items = Array.from({ length: 30 }, (_, i) => i + 1)

      const { result } = renderHook(() =>
        usePagination({ items, itemsPerPage: 10 })
      )

      // Intentar ir a página anterior desde página 1
      act(() => {
        result.current.prevPage()
      })

      expect(result.current.currentPage).toBe(1)
    })
  })

  describe('Reset automático al cambiar items', () => {
    it('debe resetear a página 1 cuando items cambian (default)', () => {
      const initialItems = Array.from({ length: 50 }, (_, i) => i + 1)

      const { result, rerender } = renderHook(
        ({ items }) => usePagination({ items, itemsPerPage: 10 }),
        { initialProps: { items: initialItems } }
      )

      // Ir a página 3
      act(() => {
        result.current.goToPage(3)
      })

      expect(result.current.currentPage).toBe(3)

      // Cambiar items (filtrar)
      const filteredItems = Array.from({ length: 15 }, (_, i) => i + 1)
      rerender({ items: filteredItems })

      // Debe resetear a página 1
      expect(result.current.currentPage).toBe(1)
    })

    it('NO debe resetear si resetOnItemsChange es false', () => {
      const initialItems = Array.from({ length: 50 }, (_, i) => i + 1)

      const { result, rerender } = renderHook(
        ({ items }) => usePagination({ items, itemsPerPage: 10, resetOnItemsChange: false }),
        { initialProps: { items: initialItems } }
      )

      // Ir a página 3
      act(() => {
        result.current.goToPage(3)
      })

      expect(result.current.currentPage).toBe(3)

      // Cambiar items
      const filteredItems = Array.from({ length: 30 }, (_, i) => i + 1)
      rerender({ items: filteredItems })

      // Debe permanecer en página 3
      expect(result.current.currentPage).toBe(3)
    })

    it('debe ajustar a última página si la actual excede el total', () => {
      const initialItems = Array.from({ length: 50 }, (_, i) => i + 1)

      const { result, rerender } = renderHook(
        ({ items }) => usePagination({ items, itemsPerPage: 10, resetOnItemsChange: false }),
        { initialProps: { items: initialItems } }
      )

      // Ir a página 5
      act(() => {
        result.current.goToPage(5)
      })

      expect(result.current.currentPage).toBe(5)

      // Cambiar a solo 15 items (2 páginas máximo)
      const filteredItems = Array.from({ length: 15 }, (_, i) => i + 1)
      rerender({ items: filteredItems })

      // Debe ajustarse a página 2 (última página disponible)
      expect(result.current.currentPage).toBe(2)
    })
  })

  describe('Navegación', () => {
    it('goToFirstPage() debe ir a página 1', () => {
      const items = Array.from({ length: 50 }, (_, i) => i + 1)

      const { result } = renderHook(() =>
        usePagination({ items, itemsPerPage: 10 })
      )

      act(() => {
        result.current.goToPage(4)
      })

      act(() => {
        result.current.goToFirstPage()
      })

      expect(result.current.currentPage).toBe(1)
    })

    it('goToLastPage() debe ir a última página', () => {
      const items = Array.from({ length: 47 }, (_, i) => i + 1)

      const { result } = renderHook(() =>
        usePagination({ items, itemsPerPage: 10 })
      )

      act(() => {
        result.current.goToLastPage()
      })

      expect(result.current.currentPage).toBe(5)
    })

    it('hasNextPage debe ser true si hay página siguiente', () => {
      const items = Array.from({ length: 30 }, (_, i) => i + 1)

      const { result } = renderHook(() =>
        usePagination({ items, itemsPerPage: 10 })
      )

      expect(result.current.hasNextPage).toBe(true)

      act(() => {
        result.current.goToLastPage()
      })

      expect(result.current.hasNextPage).toBe(false)
    })

    it('hasPrevPage debe ser true si hay página anterior', () => {
      const items = Array.from({ length: 30 }, (_, i) => i + 1)

      const { result } = renderHook(() =>
        usePagination({ items, itemsPerPage: 10 })
      )

      expect(result.current.hasPrevPage).toBe(false)

      act(() => {
        result.current.goToPage(2)
      })

      expect(result.current.hasPrevPage).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('debe manejar array vacío', () => {
      const { result } = renderHook(() =>
        usePagination({ items: [], itemsPerPage: 10 })
      )

      expect(result.current.currentPage).toBe(1)
      expect(result.current.totalPages).toBe(0)
      expect(result.current.paginatedItems).toEqual([])
      expect(result.current.hasNextPage).toBe(false)
      expect(result.current.hasPrevPage).toBe(false)
    })

    it('debe manejar items que caben en una página', () => {
      const items = Array.from({ length: 5 }, (_, i) => i + 1)

      const { result } = renderHook(() =>
        usePagination({ items, itemsPerPage: 10 })
      )

      expect(result.current.totalPages).toBe(1)
      expect(result.current.paginatedItems).toEqual([1, 2, 3, 4, 5])
      expect(result.current.hasNextPage).toBe(false)
    })

    it('debe manejar itemsPerPage mayor que total de items', () => {
      const items = Array.from({ length: 8 }, (_, i) => i + 1)

      const { result } = renderHook(() =>
        usePagination({ items, itemsPerPage: 100 })
      )

      expect(result.current.totalPages).toBe(1)
      expect(result.current.paginatedItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    })

    it('última página puede tener menos items', () => {
      const items = Array.from({ length: 47 }, (_, i) => i + 1)

      const { result } = renderHook(() =>
        usePagination({ items, itemsPerPage: 10 })
      )

      act(() => {
        result.current.goToLastPage()
      })

      // Última página tiene 7 items (47 % 10)
      expect(result.current.paginatedItems).toHaveLength(7)
      expect(result.current.paginatedItems).toEqual([41, 42, 43, 44, 45, 46, 47])
    })

    it('debe manejar página inválida correctamente', () => {
      const items = Array.from({ length: 30 }, (_, i) => i + 1)

      const { result } = renderHook(() =>
        usePagination({ items, itemsPerPage: 10 })
      )

      // Intentar ir a página 0 (inválida)
      act(() => {
        result.current.goToPage(0)
      })

      // Debe permanecer en página 1
      expect(result.current.currentPage).toBe(1)

      // Intentar ir a página 999 (fuera de rango)
      act(() => {
        result.current.goToPage(999)
      })

      // Debe permanecer en página actual (1)
      expect(result.current.currentPage).toBe(1)
    })
  })
})
