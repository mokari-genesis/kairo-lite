import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import { API_URL } from '../utils/commons'

export interface EnterpriseType {
  id: number
  nombre: string
  nit: string
  direccion: string
  telefono: string
  email: string
}

export interface CreateEnterpriseRequest {
  nombre: string
  nit: string
  direccion: string
  telefono: string
  email: string
}

export interface UpdateEnterpriseRequest {
  id: number
  nombre: string
  nit: string
  direccion: string
  telefono: string
  email: string
}

export const getEnterprises = async (
  filters?: Record<string, any>
): Promise<EnterpriseType[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const response = await fetchApi<LambdaResponse<EnterpriseType[]>>({
      api: API_URL,
      service: `/empresas${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`,
      method: 'GET',
    })

    return response.data || []
  } catch (error) {
    console.error('Error fetching enterprises:', error)
    throw error
  }
}

export const createEnterprise = async (
  enterprise: CreateEnterpriseRequest
): Promise<EnterpriseType> => {
  try {
    const response = await fetchApi<LambdaResponse<EnterpriseType>>({
      api: API_URL,
      service: '/empresas',
      method: 'POST',
      body: enterprise,
    })
    return response.data
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const updateEnterprise = async (
  enterprise: UpdateEnterpriseRequest
): Promise<EnterpriseType> => {
  try {
    const response = await fetchApi<LambdaResponse<EnterpriseType>>({
      api: API_URL,
      service: '/empresas',
      method: 'PUT',
      body: enterprise,
    })
    return response.data
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const deleteEnterprise = async (id: number): Promise<void> => {
  try {
    await fetchApi<LambdaResponse<void>>({
      api: API_URL,
      service: '/empresas',
      method: 'DELETE',
      body: { id },
    })
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}
