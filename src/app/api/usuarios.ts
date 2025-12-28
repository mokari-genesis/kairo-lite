import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { API_URL } from '../utils/commons'
dayjs.extend(utc)
const DATE_FORMAT = 'DD/MM/YYYY hh:mm:ss A'

export type UsuarioTypeResponse = {
  id: number
  empresa_id: number | null
  cognito_id: string
  nombre: string
  email: string
  rol: 'admin' | 'vendedor' | 'bodega' | 'master'
  activo: number
  fecha_creacion: string
}

export type CreateUsuarioRequestType = {
  empresa_id?: number | null
  nombre: string
  email: string
  rol: 'admin' | 'vendedor' | 'bodega' | 'master'
  activo?: number
  password: string
}

export type UpdateUsuarioRequest = {
  id: number
  empresa_id?: number | null
  nombre?: string
  email?: string
  rol?: 'admin' | 'vendedor' | 'bodega' | 'master'
  activo?: number
}

export const getUsuarios = async (
  filters?: Record<string, any>,
  empresa_id?: number
): Promise<UsuarioTypeResponse[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (empresa_id) {
      queryParams.append('empresa_id', String(empresa_id))
    }
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const response = await fetchApi<LambdaResponse<UsuarioTypeResponse[]>>({
      api: API_URL,
      service: `/usuarios?${queryParams.toString()}`,
      method: 'GET',
    })

    // Formatear las fechas en la zona horaria de Guatemala
    const formattedData = response.data.map(usuario => ({
      ...usuario,
      fecha_creacion: dayjs.utc(usuario.fecha_creacion).format(DATE_FORMAT),
    }))

    return formattedData || []
  } catch (error) {
    console.error('Error fetching usuarios:', error)
    throw error
  }
}

export const deleteUsuario = async (id: string) => {
  const response = await fetchApi<LambdaResponse<UsuarioTypeResponse>>({
    api: API_URL,
    service: `/usuarios`,
    method: 'DELETE',
    body: { id: id },
  })
  return response
}

export const updateUsuario = async (usuario: UpdateUsuarioRequest) => {
  const response = await fetchApi<LambdaResponse<UsuarioTypeResponse>>({
    api: API_URL,
    service: `/usuarios`,
    method: 'PUT',
    body: usuario,
  })
  return response
}

export const createUsuario = async (usuario: CreateUsuarioRequestType) => {
  try {
    const response = await fetchApi<LambdaResponse<CreateUsuarioRequestType>>({
      api: API_URL,
      service: '/usuarios',
      method: 'POST',
      body: usuario,
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}
