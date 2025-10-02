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
        const response = await getMetodosPagoUnificado(filtersToUse)
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

  // Calculate total cancelled sales from API
  const calculateTotalCancelled = useCallback(
    async (filters: MetodosPagoUnificadoFilters) => {
      try {
        // Get all data with cancelled sales filter to calculate total
        const cancelledFilters = {
          ...filters,
          estado_venta: 'cancelado',
          limit: 1000, // Get more records to ensure we have all cancelled sales
          offset: 0,
        }

        const cancelledData = await getMetodosPagoUnificado(cancelledFilters)

        if (!cancelledData.data || cancelledData.data.length === 0) {
          return 0
        }

        return cancelledData.data.reduce(
          (sum, record) =>
            sum + parseFloat(record.monto_pago_convertido || '0'),
          0
        )
      } catch (error) {
        console.error('Error calculating total cancelled:', error)
        return 0
      }
    },
    []
  )

  // Load summary data
  const loadSummaryData = useCallback(
    async (newFilters?: MetodosPagoUnificadoResumenFilters) => {
      setLoading(true)
      setError(null)

      try {
        // Get current filters from state
        const currentFilters = newFilters || summaryFilters
        const response = await getMetodosPagoUnificadoResumen(currentFilters)

        // Ensure we have the data array
        const dataArray = Array.isArray(response.data) ? response.data : []

        // Calculate total cancelled from API
        const totalCancelled = await calculateTotalCancelled(currentFilters)

        // Get all data to calculate totals excluding cancelled sales
        const allDataFilters = {
          ...currentFilters,
          limit: 1000,
          offset: 0,
        }
        const allData = await getMetodosPagoUnificado(allDataFilters)

        // Filter out cancelled sales for total calculations
        const nonCancelledData = allData.data.filter(
          record => record.estado_venta !== 'cancelado'
        )

        // Transform the API response to match expected structure
        const transformedResponse = {
          data: dataArray,
          total_general: {
            total_ventas: dataArray.reduce(
              (sum, item) => sum + (item.total_ventas || 0),
              0
            ),
            total_monto: nonCancelledData.reduce(
              (sum, record) =>
                sum + parseFloat(record.monto_pago_convertido || '0'),
              0
            ),
            total_pagado: nonCancelledData.reduce(
              (sum, record) =>
                sum + parseFloat(record.total_pagado_venta || '0'),
              0
            ),
            total_pendiente: dataArray.reduce(
              (sum, item) =>
                sum + parseFloat(item.total_saldo_pendiente || '0'),
              0
            ),
            total_cancelado: totalCancelled,
          },
        }

        setSummaryData(transformedResponse)

        if (newFilters) {
          setSummaryFilters(currentFilters)
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar los datos del resumen')
        console.error('Error loading summary data:', err)
      } finally {
        setLoading(false)
      }
    },
    [calculateTotalCancelled, tableData] // Add dependencies
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

  // Update summary data when table data changes
  useEffect(() => {
    const updateTotalCancelled = async () => {
      if (summaryData) {
        const totalCancelled = await calculateTotalCancelled(filters)
        setSummaryData(prevSummary => {
          if (!prevSummary) return prevSummary
          // Only update if the value has actually changed to prevent infinite loops
          if (prevSummary.total_general.total_cancelado === totalCancelled) {
            return prevSummary
          }
          return {
            ...prevSummary,
            total_general: {
              ...prevSummary.total_general,
              total_cancelado: totalCancelled,
            },
          }
        })
      }
    }

    updateTotalCancelled()
  }, [filters, calculateTotalCancelled]) // Use filters instead of tableData

  // Load initial data
  useEffect(() => {
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
