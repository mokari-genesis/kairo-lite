import { useState, useCallback, useEffect } from 'react'
import {
  MetodosPagoUnificadoFilters,
  MetodosPagoUnificadoResumenFilters,
  MetodoPagoUnificado,
  MetodosPagoUnificadoResponse,
  MetodosPagoUnificadoResumenResponse,
  getMetodosPagoUnificado,
  getMetodosPagoUnificadoResumen,
} from '../api/metodos-pago-unificado'

interface UseUnifiedPaymentMethodsState {
  tableData: MetodosPagoUnificadoResponse
  summaryData: MetodosPagoUnificadoResumenResponse | null
  loading: boolean
  error: string | null
  filters: MetodosPagoUnificadoFilters
  summaryFilters: MetodosPagoUnificadoResumenFilters
}

interface UseUnifiedPaymentMethodsActions {
  loadTableData: (filters?: MetodosPagoUnificadoFilters) => Promise<void>
  loadSummaryData: (
    filters?: MetodosPagoUnificadoResumenFilters
  ) => Promise<void>
  updateFilters: (filters: MetodosPagoUnificadoFilters) => void
  updateSummaryFilters: (filters: MetodosPagoUnificadoResumenFilters) => void
  clearError: () => void
  refreshData: () => Promise<void>
}

export const useUnifiedPaymentMethods = (): UseUnifiedPaymentMethodsState &
  UseUnifiedPaymentMethodsActions => {
  // Initial state
  const [tableData, setTableData] = useState<MetodosPagoUnificadoResponse>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 100,
    hasMore: false,
  })

  const [summaryData, setSummaryData] =
    useState<MetodosPagoUnificadoResumenResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<MetodosPagoUnificadoFilters>({
    empresa_id: 1,
    limit: 100,
    offset: 0,
  })

  const [summaryFilters, setSummaryFilters] =
    useState<MetodosPagoUnificadoResumenFilters>({
      empresa_id: 1,
      agrupar_por: 'metodo_pago',
    })

  // Load table data
  const loadTableData = useCallback(
    async (newFilters?: MetodosPagoUnificadoFilters) => {
      setLoading(true)
      setError(null)

      try {
        const filtersToUse = newFilters || filters
        console.log('Loading table data with filters:', filtersToUse)
        const response = await getMetodosPagoUnificado(filtersToUse)
        console.log('Received response:', response)
        setTableData(response)

        if (newFilters) {
          setFilters(filtersToUse)
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar los datos de la tabla')
        console.error('Error loading table data:', err)
      } finally {
        setLoading(false)
      }
    },
    [] // Remove filters dependency to avoid infinite loops
  )

  // Load summary data
  const loadSummaryData = useCallback(
    async (newFilters?: MetodosPagoUnificadoResumenFilters) => {
      setLoading(true)
      setError(null)

      try {
        const filtersToUse = newFilters || summaryFilters
        const response = await getMetodosPagoUnificadoResumen(filtersToUse)
        setSummaryData(response)

        if (newFilters) {
          setSummaryFilters(filtersToUse)
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar los datos del resumen')
        console.error('Error loading summary data:', err)
      } finally {
        setLoading(false)
      }
    },
    [] // Remove summaryFilters dependency to avoid infinite loops
  )

  // Update filters
  const updateFilters = useCallback(
    (newFilters: MetodosPagoUnificadoFilters) => {
      setFilters(newFilters)
    },
    []
  )

  // Update summary filters
  const updateSummaryFilters = useCallback(
    (newFilters: MetodosPagoUnificadoResumenFilters) => {
      setSummaryFilters(newFilters)
    },
    []
  )

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Refresh data
  const refreshData = useCallback(async () => {
    await Promise.all([loadTableData(), loadSummaryData()])
  }, [loadTableData, loadSummaryData])

  // Load initial data
  useEffect(() => {
    console.log('Hook initialized, loading initial data...')
    loadTableData()
  }, []) // Only run once on mount

  return {
    // State
    tableData,
    summaryData,
    loading,
    error,
    filters,
    summaryFilters,

    // Actions
    loadTableData,
    loadSummaryData,
    updateFilters,
    updateSummaryFilters,
    clearError,
    refreshData,
  }
}

// Custom hook for pagination
export const usePagination = (
  initialPage: number = 1,
  initialPageSize: number = 100
) => {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const handlePageChange = useCallback(
    (page: number, newPageSize: number) => {
      setCurrentPage(page)
      if (newPageSize !== pageSize) {
        setPageSize(newPageSize)
      }
    },
    [pageSize]
  )

  const resetPagination = useCallback(() => {
    setCurrentPage(1)
  }, [])

  return {
    currentPage,
    pageSize,
    handlePageChange,
    resetPagination,
  }
}

// Custom hook for filtering with debounce
export const useDebouncedFilters = (delay: number = 500) => {
  const [filters, setFilters] = useState<MetodosPagoUnificadoFilters>({
    empresa_id: 1,
    limit: 100,
    offset: 0,
  })
  const [debouncedFilters, setDebouncedFilters] =
    useState<MetodosPagoUnificadoFilters>(filters)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters)
    }, delay)

    return () => clearTimeout(timer)
  }, [filters, delay])

  const updateFilters = useCallback(
    (newFilters: MetodosPagoUnificadoFilters) => {
      setFilters(newFilters)
    },
    []
  )

  const resetFilters = useCallback(() => {
    const defaultFilters: MetodosPagoUnificadoFilters = {
      empresa_id: 1,
      limit: 100,
      offset: 0,
    }
    setFilters(defaultFilters)
    setDebouncedFilters(defaultFilters)
  }, [])

  return {
    filters,
    debouncedFilters,
    updateFilters,
    resetFilters,
  }
}
