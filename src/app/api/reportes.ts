import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
const DATE_FORMAT = 'DD/MM/YYYY hh:mm:ss A'

const API_URL = 'https://3112nzl9fi.execute-api.us-east-1.amazonaws.com/prod'

export interface ReporteInventarioConMetodo {
  id: number
  producto_id: number
  producto_codigo: string
  producto_descripcion: string
  stock_actual: number
  metodo_pago_id: number
  metodo_pago_nombre: string
  ventas_por_metodo: number
  fecha_reporte: string
}

export interface ReporteMovimientoInventario {
  id: number
  producto_id: number
  producto_codigo: string
  producto_descripcion: string
  tipo_movimiento: string
  cantidad: number
  stock_anterior: number
  stock_nuevo: number
  usuario_id: number
  usuario_nombre: string
  fecha_movimiento: string
  comentario?: string
}

export interface ReporteStockActual {
  id: number
  producto_id: number
  producto_codigo: string
  producto_descripcion: string
  categoria: string
  stock_actual: number
  precio_sugerido: number
  valor_total: number
  proveedor_id?: number
  proveedor_nombre?: string
  ultima_actualizacion: string
}

export const getReporteInventarioConMetodo = async (
  filters?: Record<string, any>
): Promise<ReporteInventarioConMetodo[]> => {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append('empresa_id', '1')
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const response = await fetchApi<
      LambdaResponse<ReporteInventarioConMetodo[]>
    >({
      api: API_URL,
      service: `/reportes/inventario-con-metodo?${queryParams.toString()}`,
      method: 'GET',
    })

    // Formatear las fechas
    const formattedData = response.data.map(reporte => ({
      ...reporte,
      fecha_reporte: dayjs.utc(reporte.fecha_reporte).format(DATE_FORMAT),
    }))

    return formattedData || []
  } catch (error) {
    console.error(
      'Error fetching inventory report with payment methods:',
      error
    )
    throw error
  }
}

export const getReporteMovimientosInventario = async (
  filters?: Record<string, any>
): Promise<ReporteMovimientoInventario[]> => {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append('empresa_id', '1')
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const response = await fetchApi<
      LambdaResponse<ReporteMovimientoInventario[]>
    >({
      api: API_URL,
      service: `/reportes/movimientos-inventario?${queryParams.toString()}`,
      method: 'GET',
    })

    // Formatear las fechas
    const formattedData = response.data.map(reporte => ({
      ...reporte,
      fecha_movimiento: dayjs.utc(reporte.fecha_movimiento).format(DATE_FORMAT),
    }))

    return formattedData || []
  } catch (error) {
    console.error('Error fetching inventory movements report:', error)
    throw error
  }
}

export const getReporteStockActual = async (
  filters?: Record<string, any>
): Promise<ReporteStockActual[]> => {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append('empresa_id', '1')
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const response = await fetchApi<LambdaResponse<ReporteStockActual[]>>({
      api: API_URL,
      service: `/reportes/stock-actual?${queryParams.toString()}`,
      method: 'GET',
    })

    // Formatear las fechas
    const formattedData = response.data.map(reporte => ({
      ...reporte,
      ultima_actualizacion: dayjs
        .utc(reporte.ultima_actualizacion)
        .format(DATE_FORMAT),
    }))

    return formattedData || []
  } catch (error) {
    console.error('Error fetching current stock report:', error)
    throw error
  }
}
