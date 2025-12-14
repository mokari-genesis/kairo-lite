import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { API_URL } from '../utils/commons'
dayjs.extend(utc)
const DATE_FORMAT = 'DD/MM/YYYY hh:mm:ss A'

export type ClientsTypeResponse = {
  id: number
  empresa_id: number
  nombre: string
  tipo: string
  nit: string
  email: string
  telefono: string
  direccion: string
  fecha_registro: string
}

export type CreateClientRequestType = {
  empresa_id: number
  name: string
  type: string
  nit: number
  email: string
  phone: string
  address: string
}

export const getClients = async (
  filters?: Record<string, any>
): Promise<ClientsTypeResponse[]> => {
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

    const response = await fetchApi<LambdaResponse<ClientsTypeResponse[]>>({
      api: API_URL,
      service: `/clientes?${queryParams.toString()}`,
      method: 'GET',
    })

    // Formatear las fechas en la zona horaria de Guatemala
    const formattedData = response.data.map(sales => ({
      ...sales,
      fecha_registro: dayjs.utc(sales.fecha_registro).format(DATE_FORMAT),
    }))

    return formattedData || []
  } catch (error) {
    console.error('Error fetching sales:', error)
    throw error
  }
}

export const deleteClient = async (id: string) => {
  const response = await fetchApi<LambdaResponse<ClientsTypeResponse>>({
    api: API_URL,
    service: `/clientes`,
    method: 'DELETE',
    body: { id: id },
  })
  return response
}

export type UpdateClientRequest = {
  id: number
  name: string
  type: string
  nit: number
  email: string
  phone: string
  address: string
}

export const updateClient = async (client: UpdateClientRequest) => {
  const response = await fetchApi<LambdaResponse<ClientsTypeResponse>>({
    api: API_URL,
    service: `/clientes`,
    method: 'PUT',
    body: client,
  })
  return response
}

export const createClient = async (product: CreateClientRequestType) => {
  try {
    const response = await fetchApi<LambdaResponse<CreateClientRequestType>>({
      api: API_URL,
      service: '/clientes',
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
