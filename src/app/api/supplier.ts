import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
const DATE_FORMAT = 'DD/MM/YYYY hh:mm:ss A'

const API_URL = 'https://jhpsb1dcdi.execute-api.us-east-1.amazonaws.com/prod'

export type SupplierTypeResponse = {
  id: number
  empresa_id: number
  nombre: string
  nit: string
  email: string
  telefono: string
  direccion: string
  tipo: 'nacional' | 'internacional'
  fecha_registro: string
}

export type CreateSupplierRequestType = {
  empresa_id: number
  nombre: string
  nit: string
  email: string
  telefono: string
  direccion: string
  tipo: 'nacional' | 'internacional'
}

export type UpdateSupplierRequest = {
  id: number
  nombre: string
  nit: string
  email: string
  telefono: string
  direccion: string
  tipo: 'nacional' | 'internacional'
}

export const getSuppliers = async (
  filters?: Record<string, any>,
  limit?: number
): Promise<SupplierTypeResponse[]> => {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append('empresa_id', '1')

    // Add limit parameter if provided
    if (limit) {
      queryParams.append('limit', String(limit))
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const response = await fetchApi<LambdaResponse<SupplierTypeResponse[]>>({
      api: API_URL,
      service: `/provider?${queryParams.toString()}`,
      method: 'GET',
    })

    // Formatear las fechas en la zona horaria de Guatemala
    const formattedData = response.data.map(supplier => ({
      ...supplier,
      fecha_registro: dayjs.utc(supplier.fecha_registro).format(DATE_FORMAT),
    }))

    return formattedData || []
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    throw error
  }
}

export const createSupplier = async (supplier: CreateSupplierRequestType) => {
  try {
    const response = await fetchApi<LambdaResponse<CreateSupplierRequestType>>({
      api: API_URL,
      service: '/provider',
      method: 'POST',
      body: supplier,
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const updateSupplier = async (supplier: UpdateSupplierRequest) => {
  const response = await fetchApi<LambdaResponse<SupplierTypeResponse>>({
    api: API_URL,
    service: `/provider`,
    method: 'PUT',
    body: supplier,
  })
  return response
}

export const deleteSupplier = async (id: string) => {
  try {
    const response = await fetchApi<LambdaResponse<SupplierTypeResponse>>({
      api: API_URL,
      service: `/provider`,
      method: 'DELETE',
      body: { id: id },
    })
    return response
  } catch (error: any) {
    // Re-throw the error with better message handling
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}
