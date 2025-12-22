import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import { API_URL } from '../utils/commons'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

const DATE_FORMAT = 'DD/MM/YYYY'

export type CuentaPorPagarTypeResponse = {
  id: number
  empresa_id: number
  empresa_nombre: string
  proveedor_id: number
  proveedor_nombre: string
  proveedor_nit: string
  compra_id: number | null
  compra_fecha: string | null
  moneda_id: number
  moneda_codigo: string
  moneda_simbolo: string
  total: number
  saldo: number
  fecha_emision: string
  fecha_vencimiento: string | null
  estado: string
  comentario: string | null
  total_pagado: number
  estado_pago_clasificacion: 'pendiente' | 'parcial' | 'pagada'
  producto_id?: number | null
  producto_descripcion?: string | null
  abonos?: AbonoCxpType[]
}

export type CuentasPorPagarProveedorResumen = {
  proveedor_id: number
  proveedor_nombre: string
  proveedor_nit: string | null
  moneda_id: number
  moneda_codigo: string
  moneda_simbolo: string
  cuentas: number
  total_facturado: number
  total_pagado: number
  saldo_pendiente: number
}

export type AbonoCxpType = {
  id: number
  cxp_id: number
  metodo_pago_id: number | null
  metodo_pago: string | null
  moneda_id: number
  moneda_codigo: string
  moneda_simbolo: string
  monto: number
  monto_en_moneda_cxp: number
  tasa_cambio: number | null
  referencia: string | null
  fecha: string
}

export type CreateCuentaPorPagarRequest = {
  empresa_id: number
  proveedor_id: number
  compra_id?: number | null
  moneda_id: number
  total: number
  fecha_emision: string
  fecha_vencimiento?: string | null
  comentario?: string | null
}

export type CreateAbonoCxpRequest = {
  moneda_id: number
  monto: number
  metodo_pago_id?: number | null
  tasa_cambio?: number | null
  referencia?: string | null
  fecha?: string | null
}

export const getCuentasPorPagar = async (
  filters?: Record<string, any>
): Promise<CuentaPorPagarTypeResponse[]> => {
  const queryParams = new URLSearchParams()

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value))
      }
    })
  }

  const response = await fetchApi<LambdaResponse<CuentaPorPagarTypeResponse[]>>(
    {
      api: API_URL,
      service: `/cuentas-por-pagar?${queryParams.toString()}`,
      method: 'GET',
    }
  )

  return (
    response.data?.map(cxp => ({
      ...cxp,
      fecha_emision: cxp.fecha_emision
        ? dayjs.utc(cxp.fecha_emision).format(DATE_FORMAT)
        : '',
      fecha_vencimiento: cxp.fecha_vencimiento
        ? dayjs.utc(cxp.fecha_vencimiento).format(DATE_FORMAT)
        : null,
      compra_fecha: cxp.compra_fecha
        ? dayjs.utc(cxp.compra_fecha).format(DATE_FORMAT)
        : null,
    })) || []
  )
}

export const getCuentasPorPagarResumenProveedores = async (
  filters?: Record<string, any>
): Promise<CuentasPorPagarProveedorResumen[]> => {
  const queryParams = new URLSearchParams()

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value))
      }
    })
  }

  const response = await fetchApi<
    LambdaResponse<CuentasPorPagarProveedorResumen[]>
  >({
    api: API_URL,
    service: `/cuentas-por-pagar/resumen/proveedores?${queryParams.toString()}`,
    method: 'GET',
  })

  return response.data || []
}

export const createCuentaPorPagar = async (
  payload: CreateCuentaPorPagarRequest
) => {
  try {
    const response = await fetchApi<LambdaResponse<CuentaPorPagarTypeResponse>>(
      {
        api: API_URL,
        service: '/cuentas-por-pagar',
        method: 'POST',
        body: payload,
      }
    )
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const getCuentaPorPagar = async (
  id: number
): Promise<CuentaPorPagarTypeResponse> => {
  try {
    const response = await fetchApi<LambdaResponse<CuentaPorPagarTypeResponse>>(
      {
        api: API_URL,
        service: `/cuentas-por-pagar/${id}`,
        method: 'GET',
      }
    )

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
      compra_fecha: data.compra_fecha
        ? dayjs.utc(data.compra_fecha).format(DATE_FORMAT)
        : null,
    }
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const addAbonoCuentaPorPagar = async (
  cxpId: number,
  payload: CreateAbonoCxpRequest
) => {
  try {
    const response = await fetchApi<LambdaResponse<CuentaPorPagarTypeResponse>>(
      {
        api: API_URL,
        service: `/cuentas-por-pagar/${cxpId}/abonos`,
        method: 'POST',
        body: { ...payload, cxp_id: cxpId },
      }
    )
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const deleteAbonoCuentaPorPagar = async (
  cxpId: number,
  abonoId: number
) => {
  try {
    const response = await fetchApi<LambdaResponse<CuentaPorPagarTypeResponse>>(
      {
        api: API_URL,
        service: `/cuentas-por-pagar/${cxpId}/abonos/${abonoId}`,
        method: 'DELETE',
      }
    )
    return response
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}
