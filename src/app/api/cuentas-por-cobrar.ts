import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import { API_URL } from '../utils/commons'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
const DATE_FORMAT = 'DD/MM/YYYY'

export type CuentaPorCobrarTypeResponse = {
  id: number
  empresa_id: number
  empresa_nombre: string
  cliente_id: number
  cliente_nombre: string
  cliente_nit: string
  cliente_email: string
  venta_id: number | null
  venta_fecha: string | null
  venta_total: number | null
  moneda_id: number
  moneda_codigo: string
  moneda_simbolo: string
  total: number
  saldo: number
  fecha_emision: string
  fecha_vencimiento: string | null
  estado: string
  comentario: string | null
  dias_antiguedad: number
  total_pagado: number
  estado_pago_clasificacion: 'pendiente' | 'parcial' | 'pagada'
  abonos?: AbonoType[]
}

export type AbonoType = {
  id: number
  cxc_id: number
  metodo_pago_id: number | null
  metodo_pago: string | null
  moneda_id: number
  moneda_codigo: string
  moneda_simbolo: string
  monto: number
  monto_en_moneda_cxc: number
  tasa_cambio: number | null
  referencia: string | null
  fecha: string
}

export type CreateCuentaPorCobrarRequest = {
  empresa_id: number
  cliente_id: number
  venta_id?: number | null
  moneda_id: number
  total: number
  fecha_emision: string
  fecha_vencimiento?: string | null
  comentario?: string | null
}

export type UpdateCuentaPorCobrarRequest = {
  id: number
  fecha_vencimiento?: string | null
  comentario?: string | null
}

export type CreateAbonoCxcRequest = {
  moneda_id: number
  monto: number
  metodo_pago_id?: number | null
  tasa_cambio?: number | null
  referencia?: string | null
  fecha?: string | null
}

export const getCuentasPorCobrar = async (
  filters?: Record<string, any>
): Promise<CuentaPorCobrarTypeResponse[]> => {
  try {
    const queryParams = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const response = await fetchApi<
      LambdaResponse<CuentaPorCobrarTypeResponse[]>
    >({
      api: API_URL,
      service: `/cuentas-por-cobrar?${queryParams.toString()}`,
      method: 'GET',
    })

    // Formatear las fechas
    const formattedData = response.data.map(cxc => ({
      ...cxc,
      fecha_emision: cxc.fecha_emision
        ? dayjs.utc(cxc.fecha_emision).format(DATE_FORMAT)
        : '',
      fecha_vencimiento: cxc.fecha_vencimiento
        ? dayjs.utc(cxc.fecha_vencimiento).format(DATE_FORMAT)
        : null,
      venta_fecha: cxc.venta_fecha
        ? dayjs.utc(cxc.venta_fecha).format(DATE_FORMAT)
        : null,
    }))

    return formattedData || []
  } catch (error) {
    console.error('Error fetching cuentas por cobrar:', error)
    throw error
  }
}

export const getCuentaPorCobrar = async (
  id: number
): Promise<CuentaPorCobrarTypeResponse> => {
  try {
    const response = await fetchApi<
      LambdaResponse<CuentaPorCobrarTypeResponse>
    >({
      api: API_URL,
      service: `/cuentas-por-cobrar/${id}`,
      method: 'GET',
    })

    // Formatear las fechas
    const data = response.data
    return {
      ...data,
      fecha_emision: data.fecha_emision
        ? dayjs.utc(data.fecha_emision).format(DATE_FORMAT)
        : '',
      fecha_vencimiento: data.fecha_vencimiento
        ? dayjs.utc(data.fecha_vencimiento).format(DATE_FORMAT)
        : null,
      venta_fecha: data.venta_fecha
        ? dayjs.utc(data.venta_fecha).format(DATE_FORMAT)
        : null,
    }
  } catch (error) {
    console.error('Error fetching cuenta por cobrar:', error)
    throw error
  }
}

export const createCuentaPorCobrar = async (
  cuenta: CreateCuentaPorCobrarRequest
) => {
  try {
    const response = await fetchApi<
      LambdaResponse<CuentaPorCobrarTypeResponse>
    >({
      api: API_URL,
      service: '/cuentas-por-cobrar',
      method: 'POST',
      body: cuenta,
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const updateCuentaPorCobrar = async (
  cuenta: UpdateCuentaPorCobrarRequest
) => {
  try {
    const response = await fetchApi<
      LambdaResponse<CuentaPorCobrarTypeResponse>
    >({
      api: API_URL,
      service: '/cuentas-por-cobrar',
      method: 'PUT',
      body: cuenta,
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const addAbonoCuentaPorCobrar = async (
  cxcId: number,
  payload: CreateAbonoCxcRequest
) => {
  try {
    const response = await fetchApi<
      LambdaResponse<CuentaPorCobrarTypeResponse>
    >({
      api: API_URL,
      service: `/cuentas-por-cobrar/${cxcId}/abonos`,
      method: 'POST',
      body: { ...payload, cxc_id: cxcId },
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const deleteAbonoCuentaPorCobrar = async (
  cxcId: number,
  abonoId: number
) => {
  try {
    const response = await fetchApi<
      LambdaResponse<CuentaPorCobrarTypeResponse>
    >({
      api: API_URL,
      service: `/cuentas-por-cobrar/${cxcId}/abonos/${abonoId}`,
      method: 'DELETE',
    })
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}
