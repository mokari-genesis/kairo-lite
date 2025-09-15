import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
const DATE_FORMAT = 'DD/MM/YYYY hh:mm:ss A'

const API_URL = 'https://rromgnmix6.execute-api.us-east-1.amazonaws.com/prod'

export interface SalesType {
  id: number
  id_venta: number
  fecha_venta: string
  total_venta: string
  estado_venta: string
  empresa_id: number
  empresa_nombre: string
  empresa_nit: string
  empresa_email: string
  cliente_id: number
  cliente_nombre: string
  cliente_nit: string
  cliente_email: string
  cliente_telefono?: string
  cliente_direccion: string
  cliente_tipo: string
  usuario_id: number
  usuario_nombre: string
  usuario_email: string
  detalle_id: number
  producto_id: number
  cantidad: number
  precio_unitario: string
  subtotal: string
  producto_codigo: string
  producto_serie: string
  producto_descripcion: string
  producto_categoria: string
  producto_estado: string
  producto_precio: string
  tipo_precio_aplicado: string
  metodo_pago: string
}

export type SalesCreateRequest = {
  empresa_id: number
  cliente_id: number
  usuario_id: number
  total: number
  estado: string
  metodo_pago_id?: number
  moneda_id?: number
  moneda?: string
  referencia_pago?: string
  detalle: [
    {
      producto_id: number
      cantidad: number
      precio_unitario: number
      subtotal: number
      tipo_precio_aplicado?:
        | 'sugerido'
        | 'mayorista'
        | 'minorista'
        | 'distribuidores'
        | 'especial'
    }
  ]
}

export const getSales = async (
  filters?: Record<string, any>
): Promise<SalesType[]> => {
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

    const response = await fetchApi<LambdaResponse<SalesType[]>>({
      api: API_URL,
      service: `/purchase?${queryParams.toString()}`,
      method: 'GET',
    })

    // Formatear las fechas en la zona horaria de Guatemala
    const formattedData = response.data.map(sales => ({
      ...sales,
      fecha_venta: dayjs.utc(sales.fecha_venta).format(DATE_FORMAT),
    }))

    return formattedData || []
  } catch (error) {
    console.error('Error fetching sales:', error)
    throw error
  }
}

export const createPurchase = async (saleObj: SalesCreateRequest) => {
  try {
    const response = await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: '/purchase',
      method: 'POST',
      body: saleObj,
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

//cancelar venta
export const cancelSale = async (sale: any) => {
  try {
    const response = await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: `/purchase`,
      method: 'DELETE',
      body: sale,
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const updateSale = async (sale: any) => {
  try {
    const response = await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: '/purchase',
      method: 'PUT',
      body: sale,
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const updateSaleStatus = async (sale: any) => {
  try {
    const response = await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: '/purchase/status',
      method: 'PUT',
      body: sale,
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export type SalesFlatType = {
  id: number
  fecha_venta: string
  cliente_id: number
  cliente_nombre: string
  cliente_nit: string
  cliente_email: string
  usuario_id: number
  usuario_nombre: string
  empresa_id: number
  estado_venta: string
  total_venta: string
  productos: [
    {
      detalle_id: number
      producto_id: number
      codigo: string
      descripcion: string
      serie: string
      categoria: string
      estado: string
      precio_unitario: number
      cantidad: number
      subtotal: number
    }
  ]
}

export const getSalesFlat = async (
  filters?: Record<string, any>
): Promise<SalesFlatType[]> => {
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

    const response = await fetchApi<LambdaResponse<SalesFlatType[]>>({
      api: API_URL,
      service: `/purchase/flat?${queryParams.toString()}`,
      method: 'GET',
    })

    // Formatear las fechas en la zona horaria de Guatemala
    const formattedData = response.data.map(sales => ({
      ...sales,
      fecha_venta: dayjs.utc(sales.fecha_venta).format(DATE_FORMAT),
    }))

    return formattedData || []
  } catch (error) {
    console.error('Error fetching sales:', error)
    throw error
  }
}

export type SalesEditRequest = {
  venta_id: number
  empresa_id: number
  cliente_id: number
  usuario_id: number
  total: number
  estado: string
  metodo_pago_id?: number
  moneda_id?: number
  moneda?: string
  referencia_pago?: string
  detalle: [
    {
      producto_id: number
      cantidad: number
      precio_unitario: number
      subtotal: number
      tipo_precio_aplicado?:
        | 'sugerido'
        | 'mayorista'
        | 'minorista'
        | 'distribuidores'
        | 'especial'
    }
  ]
}

export const editSale = async (sale: any) => {
  try {
    const response = await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: '/purchase/sale',
      method: 'PUT',
      body: sale,
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

//remover venta
export const removeSale = async (id: any) => {
  try {
    const response = await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: '/purchase/sale',
      method: 'DELETE',
      body: { venta_id: id },
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}
