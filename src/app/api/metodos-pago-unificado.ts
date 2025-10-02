import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'

const API_URL = 'https://20qc8ho1uh.execute-api.us-east-1.amazonaws.com/prod'

// Interfaces for the unified payment methods data structure
export interface MetodoPagoUnificado {
  empresa_id: number
  empresa_nombre: string
  venta_id: number
  fecha_venta: string
  fecha_venta_dia: string
  estado_venta: string
  estado_pago: string
  total_venta: string
  moneda_venta_id: number
  moneda_venta_codigo: string
  moneda_venta_nombre: string
  moneda_venta_simbolo: string
  comentario_venta: string | null
  cliente_id: number
  cliente_nombre: string
  cliente_email: string
  cliente_telefono: string
  usuario_id: number
  usuario_nombre: string
  pago_id: number
  metodo_pago_id: number
  metodo_pago: string
  monto_pago: string
  monto_pago_convertido: string
  tasa_cambio_aplicada: string
  moneda_pago_id: number
  moneda_pago_codigo: string
  moneda_pago_nombre: string
  moneda_pago_simbolo: string
  referencia_pago: string
  fecha_pago: string
  fecha_pago_dia: string
  total_pagado_venta: string
  cantidad_pagos_venta: number
  total_por_metodo_en_venta: string
  saldo_pendiente_venta: string
  venta_es_vendida_bool: number
}

export interface MetodoPagoUnificadoResumen {
  metodo_pago_id: number
  metodo_pago: string
  grupo_nombre: string | null
  total_ventas: number
  total_pagos: number
  total_monto_pagado: string
  promedio_monto_pago: string
  monto_minimo: string
  monto_maximo: string
  total_ventas_monto: string
  promedio_venta: string
  total_saldo_pendiente: string
  ventas_completadas: number
  ventas_pendientes: number
  moneda_pago_id: number
  moneda_pago_codigo: string
  moneda_pago_nombre: string
  moneda_pago_simbolo: string
}

export interface MetodosPagoUnificadoFilters {
  // Filtros básicos
  empresa_id: number
  venta_id?: number
  cliente_id?: number
  usuario_id?: number
  metodo_pago_id?: number
  moneda_id?: number
  estado_venta?: string

  // Filtros de fecha
  fecha_venta_inicio?: string // YYYY-MM-DD
  fecha_venta_fin?: string // YYYY-MM-DD

  // Filtros adicionales
  limit?: number
  offset?: number
}

export interface MetodosPagoUnificadoResumenFilters
  extends Omit<MetodosPagoUnificadoFilters, 'limit' | 'offset'> {
  agrupar_por:
    | 'metodo_pago'
    | 'cliente'
    | 'usuario'
    | 'moneda'
    | 'fecha_venta_dia'
    | 'fecha_pago_dia'
}

export interface MetodosPagoUnificadoResponse {
  data: MetodoPagoUnificado[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Raw API response interface
export interface MetodosPagoUnificadoResumenApiResponse {
  data: MetodoPagoUnificadoResumen[]
  msg: string
  status: string
}

// Transformed response interface
export interface MetodosPagoUnificadoResumenResponse {
  data: MetodoPagoUnificadoResumen[]
  total_general: {
    total_ventas: number
    total_monto: number
    total_pagado: number
    total_pendiente: number
    total_cancelado: number
  }
}

// Service functions
export const getMetodosPagoUnificado = async (
  filters: MetodosPagoUnificadoFilters
): Promise<MetodosPagoUnificadoResponse> => {
  try {
    const queryParams = new URLSearchParams()

    // Add all filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value))
      }
    })

    const response = await fetchApi<LambdaResponse<MetodoPagoUnificado[]>>({
      api: API_URL,
      service: `/metodos-pago-unificado?${queryParams.toString()}`,
      method: 'GET',
    })

    // Map the response to the expected structure
    // The API returns data directly in response.data as an array
    const data = Array.isArray(response.data) ? response.data : []

    // For now, we'll use the length of the returned data as total
    // TODO: The API should return a proper total count for pagination
    const total = data.length
    const page = Math.floor((filters.offset || 0) / (filters.limit || 100)) + 1
    const pageSize = filters.limit || 100
    const hasMore = (filters.offset || 0) + pageSize < total

    return {
      data,
      total,
      page,
      pageSize,
      hasMore,
    }
  } catch (error: any) {
    console.error('Error fetching unified payment methods:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const getMetodosPagoUnificadoResumen = async (
  filters: MetodosPagoUnificadoResumenFilters
): Promise<MetodosPagoUnificadoResumenApiResponse> => {
  try {
    const queryParams = new URLSearchParams()

    // Add all filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value))
      }
    })

    const response = await fetchApi<any>({
      api: API_URL,
      service: `/metodos-pago-unificado/resumen?${queryParams.toString()}`,
      method: 'GET',
    })

    return response as MetodosPagoUnificadoResumenApiResponse
  } catch (error: any) {
    console.error('Error fetching unified payment methods summary:', error)
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

// Helper functions for common use cases
export const getMetodosPagoUnificadoWithPagination = async (
  filters: Omit<MetodosPagoUnificadoFilters, 'limit' | 'offset'>,
  page: number = 1,
  pageSize: number = 100
): Promise<MetodosPagoUnificadoResponse> => {
  return getMetodosPagoUnificado({
    ...filters,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  })
}

export const getMetodosPagoUnificadoByDateRange = async (
  empresa_id: number,
  fecha_inicio: string,
  fecha_fin: string,
  additionalFilters?: Partial<MetodosPagoUnificadoFilters>
): Promise<MetodosPagoUnificadoResponse> => {
  return getMetodosPagoUnificado({
    empresa_id,
    fecha_venta_inicio: fecha_inicio,
    fecha_venta_fin: fecha_fin,
    ...additionalFilters,
  })
}

export const getMetodosPagoUnificadoByClient = async (
  empresa_id: number,
  cliente_id: number,
  additionalFilters?: Partial<MetodosPagoUnificadoFilters>
): Promise<MetodosPagoUnificadoResponse> => {
  return getMetodosPagoUnificado({
    empresa_id,
    cliente_id,
    ...additionalFilters,
  })
}

export const getMetodosPagoUnificadoByPaymentMethod = async (
  empresa_id: number,
  metodo_pago_id: number,
  additionalFilters?: Partial<MetodosPagoUnificadoFilters>
): Promise<MetodosPagoUnificadoResponse> => {
  return getMetodosPagoUnificado({
    empresa_id,
    metodo_pago_id,
    ...additionalFilters,
  })
}

export const getMetodosPagoUnificadoPendingPayments = async (
  empresa_id: number,
  additionalFilters?: Partial<MetodosPagoUnificadoFilters>
): Promise<MetodosPagoUnificadoResponse> => {
  return getMetodosPagoUnificado({
    empresa_id,
    ...additionalFilters,
  })
}
