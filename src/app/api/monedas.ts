import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import { API_URL } from '../utils/commons'

//const API_URL = 'https://tbn9kd18j2.execute-api.us-east-1.amazonaws.com/prod'

export interface Moneda {
  id: number
  codigo: string
  nombre: string
  simbolo?: string
  decimales: number
  activo: boolean
  es_base: number
  tasa_vs_base: string
  tasa_actualizada: string
}

export interface CreateMonedaRequest {
  codigo: string
  nombre: string
  simbolo?: string
  decimales: number
  activo: boolean
}

export interface UpdateMonedaRequest {
  id: number
  codigo: string
  nombre: string
  simbolo?: string
  decimales: number
  activo: number
  tasa_vs_base: number
  tasa_actualizada: string
  es_base: number
}

export const getMonedas = async (
  filters?: Record<string, any>
): Promise<Moneda[]> => {
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

    const response = await fetchApi<LambdaResponse<Moneda[]>>({
      api: API_URL,
      service: `/monedas?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error) {
    console.error('Error fetching currencies:', error)
    throw error
  }
}

export const createMoneda = async (
  moneda: CreateMonedaRequest
): Promise<LambdaResponse<any>> => {
  try {
    const response = await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: '/monedas',
      method: 'POST',
      body: { ...moneda, empresa_id: 1 },
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const updateMoneda = async (
  moneda: UpdateMonedaRequest
): Promise<LambdaResponse<any>> => {
  try {
    const response = await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: '/monedas',
      method: 'PUT',
      body: { ...moneda, empresa_id: 1 },
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const deleteMoneda = async (
  id: number
): Promise<LambdaResponse<any>> => {
  try {
    const response = await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: '/monedas',
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
