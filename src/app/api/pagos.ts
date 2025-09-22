import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'

const API_URL = 'https://rromgnmix6.execute-api.us-east-1.amazonaws.com/prod'

export interface VentaPago {
  id: number
  metodoPagoId?: number
  metodo_pago_id?: number
  metodoPagoNombre?: string
  metodo_pago?: string
  monedaId?: number
  moneda_id?: number
  monedaCodigo?: string
  moneda_codigo?: string
  monto: number
  referencia_pago?: string
  fecha?: string
}

export interface Venta {
  id: number
  total: number
  estado: 'generado' | 'vendido' | 'cancelado'
  moneda_id?: number | null
  pagos?: VentaPago[]
  totalPagado?: number
  monto_pagado?: number
  saldoPendiente?: number
  saldo?: number
}

export interface PaymentCreateRequest {
  metodo_pago_id: number
  moneda_id: number
  monto: number
  referencia_pago?: string
}

export interface PaymentUpdateRequest {
  metodo_pago_id?: number
  moneda_id?: number
  monto?: number
  referencia_pago?: string
}

export const listPayments = async (ventaId: number): Promise<VentaPago[]> => {
  try {
    const response = await fetchApi<LambdaResponse<VentaPago[]>>({
      api: API_URL,
      service: `/purchase/${ventaId}/payments`,
      method: 'GET',
    })
    return response.data || []
  } catch (error: any) {
    console.error('Error fetching payments:', error)
    throw error
  }
}

export const createPayment = async (
  ventaId: number,
  payload: PaymentCreateRequest
): Promise<VentaPago> => {
  try {
    const response = await fetchApi<LambdaResponse<VentaPago>>({
      api: API_URL,
      service: `/purchase/${ventaId}/payments`,
      method: 'POST',
      body: payload,
    })
    return response.data
  } catch (error: any) {
    const message = error.message || getFriendlyErrorMessage(error.message)
    if (error.message?.includes('422') || error.message?.includes('SQLSTATE')) {
      throw new Error(message)
    }
    throw new Error(message)
  }
}

export const updatePayment = async (
  ventaId: number,
  pagoId: number,
  payload: PaymentUpdateRequest
): Promise<VentaPago> => {
  try {
    const response = await fetchApi<LambdaResponse<VentaPago>>({
      api: API_URL,
      service: `/purchase/${ventaId}/payments/${pagoId}`,
      method: 'PUT',
      body: payload,
    })
    return response.data
  } catch (error: any) {
    const message = error.message || getFriendlyErrorMessage(error.message)
    if (error.message?.includes('422') || error.message?.includes('SQLSTATE')) {
      throw new Error(message)
    }
    throw new Error(message)
  }
}

export const deletePayment = async (
  ventaId: number,
  pagoId: number
): Promise<void> => {
  try {
    await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: `/purchase/${ventaId}/payments/${pagoId}`,
      method: 'DELETE',
    })
  } catch (error: any) {
    const message = error.message || getFriendlyErrorMessage(error.message)
    if (error.message?.includes('422') || error.message?.includes('SQLSTATE')) {
      throw new Error(message)
    }
    throw new Error(message)
  }
}

export const getVentaById = async (ventaId: number): Promise<Venta> => {
  try {
    const response = await fetchApi<LambdaResponse<Venta>>({
      api: API_URL,
      service: `/purchase/${ventaId}`,
      method: 'GET',
    })
    return response.data
  } catch (error: any) {
    console.error('Error fetching venta:', error)
    throw error
  }
}

export const updateVentaStatus = async (payload: {
  venta_id: number
  estado: string
}): Promise<any> => {
  try {
    const response = await fetchApi<LambdaResponse<any>>({
      api: API_URL,
      service: '/purchase/update-status',
      method: 'PATCH',
      body: payload,
    })
    return response.data
  } catch (error: any) {
    const message = error.message || getFriendlyErrorMessage(error.message)
    if (error.message?.includes('422') || error.message?.includes('SQLSTATE')) {
      throw new Error(message)
    }
    throw new Error(message)
  }
}
