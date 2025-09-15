import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'

const API_URL = 'https://scjou15keg.execute-api.us-east-1.amazonaws.com/prod'

export interface MetodoPago {
  id: number
  nombre: string
  activo: boolean
}

export interface CreateMetodoPagoRequest {
  nombre: string
  activo: boolean
}

export interface UpdateMetodoPagoRequest {
  id: number
  nombre: string
  activo: boolean
}

export const getMetodosPago = async (
  filters?: Record<string, any>
): Promise<MetodoPago[]> => {
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

    const response = await fetchApi<LambdaResponse<MetodoPago[]>>({
      api: API_URL,
      service: `/metodos-pago?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    throw error
  }
}

export const createMetodoPago = async (
  metodoPago: CreateMetodoPagoRequest
): Promise<LambdaResponse<any>> => {
  try {
    const response = await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: '/metodos-pago',
      method: 'POST',
      body: { ...metodoPago, empresa_id: 1 },
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const updateMetodoPago = async (
  metodoPago: UpdateMetodoPagoRequest
): Promise<LambdaResponse<any>> => {
  try {
    const response = await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: '/metodos-pago',
      method: 'PUT',
      body: { ...metodoPago, empresa_id: 1 },
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const deleteMetodoPago = async (
  id: number
): Promise<LambdaResponse<any>> => {
  try {
    const response = await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: '/metodos-pago',
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
