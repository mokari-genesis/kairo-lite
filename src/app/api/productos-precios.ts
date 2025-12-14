import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import { API_URL } from '../utils/commons'

//const API_URL = 'https://3cymz3vn0f.execute-api.us-east-1.amazonaws.com/prod'

export interface ProductoPrecio {
  id: number
  producto_id: number
  tipo: 'sugerido' | 'mayorista' | 'minorista' | 'distribuidores' | 'especial'
  precio: number
  producto_codigo?: string
  producto_descripcion?: string
}

export interface CreateProductoPrecioRequest {
  producto_id: number
  tipo: 'sugerido' | 'mayorista' | 'minorista' | 'distribuidores' | 'especial'
  precio: number
}

export interface UpdateProductoPrecioRequest {
  id: number
  producto_id: number
  tipo: 'sugerido' | 'mayorista' | 'minorista' | 'distribuidores' | 'especial'
  precio: number
}

export const getProductosPrecios = async (
  filters?: Record<string, any>
): Promise<ProductoPrecio[]> => {
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

    const response = await fetchApi<LambdaResponse<ProductoPrecio[]>>({
      api: API_URL,
      service: `/productos-precios?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error) {
    console.error('Error fetching product prices:', error)
    throw error
  }
}

export const getProductosPreciosByProduct = async (
  productoId: number
): Promise<ProductoPrecio[]> => {
  try {
    const response = await fetchApi<LambdaResponse<ProductoPrecio[]>>({
      api: API_URL,
      service: `/productos-precios/producto/${productoId}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error) {
    console.error('Error fetching product prices by product:', error)
    throw error
  }
}

export const createProductoPrecio = async (
  productoPrecio: CreateProductoPrecioRequest
): Promise<LambdaResponse<any>> => {
  try {
    const response = await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: '/productos-precios',
      method: 'POST',
      body: { ...productoPrecio, empresa_id: 1 },
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const updateProductoPrecio = async (
  productoPrecio: UpdateProductoPrecioRequest
): Promise<LambdaResponse<any>> => {
  try {
    const response = await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: '/productos-precios',
      method: 'PUT',
      body: { ...productoPrecio, empresa_id: 1 },
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const deleteProductoPrecio = async (
  id: number
): Promise<LambdaResponse<any>> => {
  try {
    const response = await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: '/productos-precios',
      method: 'DELETE',
      body: { id, empresa_id: 1 },
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}
