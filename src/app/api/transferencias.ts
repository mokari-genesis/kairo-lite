import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { API_URL } from '../utils/commons'
dayjs.extend(utc)
const DATE_FORMAT = 'DD/MM/YYYY hh:mm:ss A'

export interface TransferenciaDetalle {
  id?: number
  producto_id: number
  cantidad: number
  producto_codigo?: string
  producto_descripcion?: string
  producto_categoria?: string
}

export interface Transferencia {
  id: number
  empresa_origen_id: number
  empresa_origen_nombre?: string
  empresa_destino_id: number
  empresa_destino_nombre?: string
  usuario_id?: number
  usuario_nombre?: string
  estado: 'borrador' | 'confirmada' | 'cancelada'
  comentario?: string
  fecha?: string
  detalles?: TransferenciaDetalle[]
}

export interface CreateTransferenciaRequest {
  empresa_origen_id: number
  empresa_destino_id: number
  usuario_id?: number
  estado?: 'borrador' | 'confirmada'
  comentario?: string
  detalles: Array<{
    producto_id: number
    cantidad: number
  }>
}

export interface UpdateTransferenciaRequest {
  transferencia_id: number
  empresa_origen_id?: number
  empresa_destino_id?: number
  usuario_id?: number
  comentario?: string
  detalles?: Array<{
    producto_id: number
    cantidad: number
  }>
}

export const getTransferencias = async (
  filters?: Record<string, any>
): Promise<Transferencia[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const response = await fetchApi<LambdaResponse<Transferencia[]>>({
      api: API_URL,
      service: `/transferencias${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`,
      method: 'GET',
    })

    // Formatear las fechas
    const formattedData = response.data.map(transferencia => ({
      ...transferencia,
      fecha: transferencia.fecha
        ? dayjs.utc(transferencia.fecha).format(DATE_FORMAT)
        : undefined,
    }))

    return formattedData || []
  } catch (error) {
    console.error('Error fetching transferencias:', error)
    throw error
  }
}

export const getTransferencia = async (
  transferencia_id: number
): Promise<Transferencia> => {
  try {
    const response = await fetchApi<LambdaResponse<Transferencia>>({
      api: API_URL,
      service: `/transferencias/${transferencia_id}`,
      method: 'GET',
    })

    return {
      ...response.data,
      fecha: response.data.fecha
        ? dayjs.utc(response.data.fecha).format(DATE_FORMAT)
        : undefined,
    }
  } catch (error) {
    console.error('Error fetching transferencia:', error)
    throw error
  }
}

export const createTransferencia = async (
  transferencia: CreateTransferenciaRequest
): Promise<Transferencia> => {
  try {
    const response = await fetchApi<LambdaResponse<Transferencia>>({
      api: API_URL,
      service: '/transferencias',
      method: 'POST',
      body: transferencia,
    })
    return response.data
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const updateTransferencia = async (
  transferencia: UpdateTransferenciaRequest
): Promise<Transferencia> => {
  try {
    const response = await fetchApi<LambdaResponse<Transferencia>>({
      api: API_URL,
      service: `/transferencias/${transferencia.transferencia_id}`,
      method: 'PUT',
      body: transferencia,
    })
    return response.data
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const confirmarTransferencia = async (
  transferencia_id: number,
  usuario_id?: number
): Promise<Transferencia> => {
  try {
    const response = await fetchApi<LambdaResponse<Transferencia>>({
      api: API_URL,
      service: `/transferencias/${transferencia_id}/confirmar`,
      method: 'POST',
      body: { usuario_id, transferencia_id },
    })
    return response.data
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const cancelarTransferencia = async (
  transferencia_id: number
): Promise<Transferencia> => {
  try {
    const response = await fetchApi<LambdaResponse<Transferencia>>({
      api: API_URL,
      service: `/transferencias/${transferencia_id}/cancelar`,
      method: 'POST',
    })
    return response.data
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const deleteTransferencia = async (
  transferencia_id: number
): Promise<void> => {
  try {
    await fetchApi<LambdaResponse<void>>({
      api: API_URL,
      service: `/transferencias/${transferencia_id}`,
      method: 'DELETE',
    })
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}
