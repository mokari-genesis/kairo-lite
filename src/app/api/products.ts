import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
const DATE_FORMAT = 'DD/MM/YYYY hh:mm:ss A'

const API_URL = 'https://dc3s229nvf.execute-api.us-east-1.amazonaws.com/prod'

export interface ProductType {
  id: string
  codigo: string
  serie: string
  descripcion: string
  categoria: string
  estado: string
  stock: number
  precio: number
  proveedor_id?: number
  nombre_proveedor?: string
  fecha_creacion: string
}

export interface UpdateProductRequest {
  product_id: number
  empresa_id: number
  codigo: string
  serie: string
  descripcion: string
  categoria: string
  estado: string
  stock: number
  precio: number
  proveedor_id?: number
}

export const getProducts = async (
  filters?: Record<string, any>
): Promise<ProductType[]> => {
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

    const response = await fetchApi<LambdaResponse<ProductType[]>>({
      api: API_URL,
      service: `/products?${queryParams.toString()}`,
      method: 'GET',
    })

    // Formatear las fechas en la zona horaria de Guatemala
    const formattedData = response.data.map(product => ({
      ...product,
      fecha_creacion: dayjs.utc(product.fecha_creacion).format(DATE_FORMAT),
    }))

    return formattedData || []
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

export const createProduct = async (
  product: Omit<ProductType, 'id' | 'fecha_creacion'>
) => {
  try {
    const response = await fetchApi<LambdaResponse<ProductType>>({
      api: API_URL,
      service: '/products',
      method: 'POST',
      body: product,
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const deleteProduct = async (id: string) => {
  const response = await fetchApi<LambdaResponse<ProductType>>({
    api: API_URL,
    service: `/products`,
    method: 'DELETE',
    body: { product_ids: [id] },
  })
  return response
}

export type UpdateStateRequest = {
  venta_id: number
  estado: string
}

export const updateProduct = async (product: UpdateProductRequest) => {
  const response = await fetchApi<LambdaResponse<ProductType>>({
    api: API_URL,
    service: `/products`,
    method: 'PUT',
    body: product,
  })
  return response
}
