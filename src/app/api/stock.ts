import { fetchApi, LambdaResponse } from './constants'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { API_URL } from '../utils/commons'
dayjs.extend(utc)
const DATE_FORMAT = 'DD/MM/YYYY hh:mm:ss A'
//const API_URL = 'https://5rcm6ztyyj.execute-api.us-east-1.amazonaws.com/prod'

export interface StockType {
  id: number
  empresa_id: number
  empresa: string
  producto: string
  producto_id: number
  codigo_producto: string
  usuario: string
  usuario_id: number
  stock_actual: number
  tipo_movimiento: string
  cantidad: number
  fecha: string
  comentario: string
  stock_movimiento: number
  venta_id: number
}

export interface StockTypeUpdate {
  id: number
  product_id: number
  movement_type: string
  quantity: number
  comment: string
}

export const getStock = async (
  filters?: Record<string, any>
): Promise<StockType[]> => {
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

    const response = await fetchApi<LambdaResponse<StockType[]>>({
      api: API_URL,
      service: `/inventory-movement?${queryParams.toString()}`,
      method: 'GET',
    })

    // Formatear las fechas en la zona horaria de Guatemala
    const formattedData = response.data.map(product => ({
      ...product,
      fecha: dayjs.utc(product.fecha).format(DATE_FORMAT),
    }))

    return formattedData || []
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

export const updateStock = async (stock: StockTypeUpdate) => {
  try {
    const response = await fetchApi<LambdaResponse<StockType>>({
      api: API_URL,
      service: `/inventory-movement`,
      method: 'PUT',
      body: stock,
    })
    return response.data || []
  } catch (error) {
    console.error('Error updating stock:', error)
    throw error
  }
}

export const deleteStock = async (id: string) => {
  const response = await fetchApi<LambdaResponse<any>>({
    api: API_URL,
    service: `/inventory-movement`,
    method: 'DELETE',
    body: { id: id },
  })
  return response
}

export interface StockTypeCreate {
  empresa_id: number
  product_id: number
  user_id: number
  movement_type: string
  quantity: number
  comment: string
}

export const createStock = async (stock: StockTypeCreate) => {
  const response = await fetchApi<LambdaResponse<StockType>>({
    api: API_URL,
    service: `/inventory-movement`,
    method: 'POST',
    body: stock,
  })
  return response
}
