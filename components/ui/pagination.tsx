/**
 * COMPONENTE DE PAGINACIÓN
 * Control completo de navegación por páginas
 */

'use client'

import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
  totalItems?: number
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 20,
  totalItems,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      {/* Info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {totalItems && (
          <span>
            Mostrando {(currentPage - 1) * itemsPerPage + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}{' '}
            resultados
          </span>
        )}
      </div>

      {/* Controles */}
      <div className="flex items-center space-x-2">
        {/* Primera página */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Primera página"
        >
          <span className="material-symbols-outlined">first_page</span>
        </Button>

        {/* Anterior */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </Button>

        {/* Números de página */}
        <div className="hidden sm:flex items-center space-x-1">
          {getPageNumbers().map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="icon"
                onClick={() => onPageChange(page as number)}
              >
                {page}
              </Button>
            )
          )}
        </div>

        {/* Página actual (móvil) */}
        <div className="sm:hidden px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
          {currentPage} / {totalPages}
        </div>

        {/* Siguiente */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Página siguiente"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </Button>

        {/* Última página */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Última página"
        >
          <span className="material-symbols-outlined">last_page</span>
        </Button>
      </div>
    </div>
  )
}
