import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { API_URL } from '../utils/commons'

dayjs.extend(utc)
const DATE_FORMAT = 'DD/MM/YYYY hh:mm:ss A'

// ============ VENTAS ============

export interface ReporteVentasResumen {
  id: number
  empresa_id: number
  cliente_id: number
  cliente_nombre: string
  cliente_nit: string
  usuario_id: number
  usuario_nombre: string
  total_venta: number
  total_pagado: number
  saldo_pendiente: number
  estado_venta: string
  fecha_venta: string
  numero_ventas: number
  ticket_promedio: number
}

export interface ReporteVentasPorVendedor {
  usuario_id: number
  usuario_nombre: string
  cantidad_ventas: number
  total_vendido: number
  total_pagado: number
  saldo_pendiente: number
  ticket_promedio: number
}

export interface ReporteVentasPorCliente {
  cliente_id: number
  cliente_nombre: string
  cliente_nit: string
  numero_ventas: number
  total_vendido: number
  promedio_ticket: number
  saldo_pendiente_acumulado: number
}

export interface ReporteVentasPorMetodoPago {
  metodo_pago_id: number
  metodo_pago_nombre: string
  moneda_id: number
  moneda_codigo: string
  total_ventas: number
  numero_ventas: number
}

export const getReporteVentasResumen = async (
  filters?: Record<string, any>
): Promise<ReporteVentasResumen[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (filters?.empresa_id) {
      queryParams.append('empresa_id', String(filters.empresa_id))
    }
    if (filters?.fecha_inicio) {
      queryParams.append('fecha_inicio', String(filters.fecha_inicio))
    }
    if (filters?.fecha_fin) {
      queryParams.append('fecha_fin', String(filters.fecha_fin))
    }
    if (filters?.estado_venta) {
      queryParams.append('estado_venta', String(filters.estado_venta))
    }
    if (filters?.usuario_id) {
      queryParams.append('usuario_id', String(filters.usuario_id))
    }
    if (filters?.cliente_id) {
      queryParams.append('cliente_id', String(filters.cliente_id))
    }

    const response = await fetchApi<LambdaResponse<ReporteVentasResumen[]>>({
      api: API_URL,
      service: `/reportes2/ventas-resumen?${queryParams.toString()}`,
      method: 'GET',
    })

    const formattedData = response.data.map(reporte => ({
      ...reporte,
      fecha_venta: dayjs.utc(reporte.fecha_venta).format(DATE_FORMAT),
    }))

    return formattedData || []
  } catch (error) {
    console.error('Error fetching ventas resumen report:', error)
    throw error
  }
}

export const getReporteVentasPorVendedor = async (
  filters?: Record<string, any>
): Promise<ReporteVentasPorVendedor[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (filters?.empresa_id) {
      queryParams.append('empresa_id', String(filters.empresa_id))
    }
    if (filters?.fecha_inicio) {
      queryParams.append('fecha_inicio', String(filters.fecha_inicio))
    }
    if (filters?.fecha_fin) {
      queryParams.append('fecha_fin', String(filters.fecha_fin))
    }

    const response = await fetchApi<LambdaResponse<ReporteVentasPorVendedor[]>>(
      {
        api: API_URL,
        service: `/reportes2/ventas-por-vendedor?${queryParams.toString()}`,
        method: 'GET',
      }
    )

    return response.data || []
  } catch (error) {
    console.error('Error fetching ventas por vendedor report:', error)
    throw error
  }
}

export const getReporteVentasPorCliente = async (
  filters?: Record<string, any>
): Promise<ReporteVentasPorCliente[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (filters?.empresa_id) {
      queryParams.append('empresa_id', String(filters.empresa_id))
    }
    if (filters?.fecha_inicio) {
      queryParams.append('fecha_inicio', String(filters.fecha_inicio))
    }
    if (filters?.fecha_fin) {
      queryParams.append('fecha_fin', String(filters.fecha_fin))
    }

    const response = await fetchApi<LambdaResponse<ReporteVentasPorCliente[]>>({
      api: API_URL,
      service: `/reportes2/ventas-por-cliente?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error) {
    console.error('Error fetching ventas por cliente report:', error)
    throw error
  }
}

export const getReporteVentasPorMetodoPago = async (
  filters?: Record<string, any>
): Promise<ReporteVentasPorMetodoPago[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (filters?.empresa_id) {
      queryParams.append('empresa_id', String(filters.empresa_id))
    }
    if (filters?.fecha_inicio) {
      queryParams.append('fecha_inicio', String(filters.fecha_inicio))
    }
    if (filters?.fecha_fin) {
      queryParams.append('fecha_fin', String(filters.fecha_fin))
    }

    const response = await fetchApi<
      LambdaResponse<ReporteVentasPorMetodoPago[]>
    >({
      api: API_URL,
      service: `/reportes2/ventas-por-metodo-pago?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error) {
    console.error('Error fetching ventas por metodo pago report:', error)
    throw error
  }
}

// ============ CARTERA ============

export interface ReporteCxcAging {
  cliente_id: number
  cliente_nombre: string
  cliente_nit: string
  total_saldo: number
  saldo_0_30: number
  saldo_31_60: number
  saldo_61_90: number
  saldo_mas_90: number
  dias_promedio_atraso: number
}

export interface ReporteCxpAging {
  proveedor_id: number
  proveedor_nombre: string
  total_saldo: number
  saldo_0_30: number
  saldo_31_60: number
  saldo_61_90: number
  saldo_mas_90: number
  dias_promedio_atraso: number
}

export interface ReporteFlujoCaja {
  periodo: string
  tipo: 'cobro' | 'pago'
  monto_estimado: number
  saldo_neto: number
}

export const getReporteCxcAging = async (
  filters?: Record<string, any>
): Promise<ReporteCxcAging[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (filters?.empresa_id) {
      queryParams.append('empresa_id', String(filters.empresa_id))
    }
    if (filters?.fecha_inicio) {
      queryParams.append('fecha_inicio', String(filters.fecha_inicio))
    }
    if (filters?.fecha_fin) {
      queryParams.append('fecha_fin', String(filters.fecha_fin))
    }
    if (filters?.cliente_id) {
      queryParams.append('cliente_id', String(filters.cliente_id))
    }

    const response = await fetchApi<LambdaResponse<ReporteCxcAging[]>>({
      api: API_URL,
      service: `/reportes2/cxc-aging?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error) {
    console.error('Error fetching CxC aging report:', error)
    throw error
  }
}

export const getReporteCxpAging = async (
  filters?: Record<string, any>
): Promise<ReporteCxpAging[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (filters?.empresa_id) {
      queryParams.append('empresa_id', String(filters.empresa_id))
    }
    if (filters?.fecha_inicio) {
      queryParams.append('fecha_inicio', String(filters.fecha_inicio))
    }
    if (filters?.fecha_fin) {
      queryParams.append('fecha_fin', String(filters.fecha_fin))
    }
    if (filters?.proveedor_id) {
      queryParams.append('proveedor_id', String(filters.proveedor_id))
    }

    const response = await fetchApi<LambdaResponse<ReporteCxpAging[]>>({
      api: API_URL,
      service: `/reportes2/cxp-aging?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error) {
    console.error('Error fetching CxP aging report:', error)
    throw error
  }
}

export const getReporteFlujoCaja = async (
  filters?: Record<string, any>
): Promise<ReporteFlujoCaja[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (filters?.empresa_id) {
      queryParams.append('empresa_id', String(filters.empresa_id))
    }
    if (filters?.fecha_inicio) {
      queryParams.append('fecha_inicio', String(filters.fecha_inicio))
    }
    if (filters?.fecha_fin) {
      queryParams.append('fecha_fin', String(filters.fecha_fin))
    }

    const response = await fetchApi<LambdaResponse<ReporteFlujoCaja[]>>({
      api: API_URL,
      service: `/reportes2/flujo-caja-cartera?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error) {
    console.error('Error fetching flujo caja report:', error)
    throw error
  }
}

// ============ INVENTARIO ============

export interface ReporteInventarioRotacion {
  producto_id: number
  producto_codigo: string
  producto_descripcion: string
  categoria: string
  unidades_vendidas: number
  stock_promedio: number
  rotacion: number
  dias_cobertura: number
}

export interface ReporteInventarioBajaRotacion {
  producto_id: number
  producto_codigo: string
  producto_descripcion: string
  categoria: string
  dias_sin_movimiento: number
  stock_actual: number
  valor_inventario: number
}

export interface ReporteInventarioRupturas {
  producto_id: number
  producto_codigo: string
  producto_descripcion: string
  categoria: string
  stock_actual: number
  stock_minimo: number
  diferencia: number
  estado: string
}

export const getReporteInventarioRotacion = async (
  filters?: Record<string, any>
): Promise<ReporteInventarioRotacion[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (filters?.empresa_id) {
      queryParams.append('empresa_id', String(filters.empresa_id))
    }
    if (filters?.fecha_inicio) {
      queryParams.append('fecha_inicio', String(filters.fecha_inicio))
    }
    if (filters?.fecha_fin) {
      queryParams.append('fecha_fin', String(filters.fecha_fin))
    }
    if (filters?.categoria) {
      queryParams.append('categoria', String(filters.categoria))
    }

    const response = await fetchApi<
      LambdaResponse<ReporteInventarioRotacion[]>
    >({
      api: API_URL,
      service: `/reportes2/inventario-rotacion?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error) {
    console.error('Error fetching inventario rotacion report:', error)
    throw error
  }
}

export const getReporteInventarioBajaRotacion = async (
  filters?: Record<string, any>
): Promise<ReporteInventarioBajaRotacion[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (filters?.empresa_id) {
      queryParams.append('empresa_id', String(filters.empresa_id))
    }
    if (filters?.dias_minimos) {
      queryParams.append('dias_minimos', String(filters.dias_minimos))
    }
    if (filters?.categoria) {
      queryParams.append('categoria', String(filters.categoria))
    }

    const response = await fetchApi<
      LambdaResponse<ReporteInventarioBajaRotacion[]>
    >({
      api: API_URL,
      service: `/reportes2/inventario-baja-rotacion?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error) {
    console.error('Error fetching inventario baja rotacion report:', error)
    throw error
  }
}

export const getReporteInventarioRupturas = async (
  filters?: Record<string, any>
): Promise<ReporteInventarioRupturas[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (filters?.empresa_id) {
      queryParams.append('empresa_id', String(filters.empresa_id))
    }
    if (filters?.categoria) {
      queryParams.append('categoria', String(filters.categoria))
    }

    const response = await fetchApi<
      LambdaResponse<ReporteInventarioRupturas[]>
    >({
      api: API_URL,
      service: `/reportes2/inventario-rupturas?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error) {
    console.error('Error fetching inventario rupturas report:', error)
    throw error
  }
}

// ============ RELACIONES ============

export interface ReporteTopClientes {
  cliente_id: number
  cliente_nombre: string
  cliente_nit: string
  total_ventas: number
  numero_ventas: number
  ticket_promedio: number
  porcentaje_participacion: number
}

export interface ReporteTopProveedores {
  proveedor_id: number
  proveedor_nombre: string
  total_compras: number
  numero_compras: number
  promedio_compra: number
  porcentaje_participacion: number
}

export interface ReporteClientesRiesgo {
  cliente_id: number
  cliente_nombre: string
  cliente_nit: string
  saldo_vencido_total: number
  dias_atraso_promedio: number
  numero_cuentas_vencidas: number
  riesgo_nivel: string
}

export const getReporteTopClientes = async (
  filters?: Record<string, any>
): Promise<ReporteTopClientes[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (
      filters?.empresa_id &&
      filters.empresa_id !== '' &&
      filters.empresa_id !== null
    ) {
      queryParams.append('empresa_id', String(filters.empresa_id))
    }
    if (
      filters?.fecha_inicio &&
      filters.fecha_inicio !== '' &&
      filters.fecha_inicio !== null
    ) {
      queryParams.append('fecha_inicio', String(filters.fecha_inicio))
    }
    if (
      filters?.fecha_fin &&
      filters.fecha_fin !== '' &&
      filters.fecha_fin !== null
    ) {
      queryParams.append('fecha_fin', String(filters.fecha_fin))
    }
    if (filters?.limite && filters.limite !== '' && filters.limite !== null) {
      queryParams.append('limite', String(filters.limite))
    }

    const response = await fetchApi<LambdaResponse<ReporteTopClientes[]>>({
      api: API_URL,
      service: `/reportes2/top-clientes?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error) {
    console.error('Error fetching top clientes report:', error)
    throw error
  }
}

export const getReporteTopProveedores = async (
  filters?: Record<string, any>
): Promise<ReporteTopProveedores[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (
      filters?.empresa_id &&
      filters.empresa_id !== '' &&
      filters.empresa_id !== null
    ) {
      queryParams.append('empresa_id', String(filters.empresa_id))
    }
    if (
      filters?.fecha_inicio &&
      filters.fecha_inicio !== '' &&
      filters.fecha_inicio !== null
    ) {
      queryParams.append('fecha_inicio', String(filters.fecha_inicio))
    }
    if (
      filters?.fecha_fin &&
      filters.fecha_fin !== '' &&
      filters.fecha_fin !== null
    ) {
      queryParams.append('fecha_fin', String(filters.fecha_fin))
    }
    if (filters?.limite && filters.limite !== '' && filters.limite !== null) {
      queryParams.append('limite', String(filters.limite))
    }

    const response = await fetchApi<LambdaResponse<ReporteTopProveedores[]>>({
      api: API_URL,
      service: `/reportes2/top-proveedores?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error) {
    console.error('Error fetching top proveedores report:', error)
    throw error
  }
}

export const getReporteClientesRiesgo = async (
  filters?: Record<string, any>
): Promise<ReporteClientesRiesgo[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (
      filters?.empresa_id &&
      filters.empresa_id !== '' &&
      filters.empresa_id !== null
    ) {
      queryParams.append('empresa_id', String(filters.empresa_id))
    }

    const response = await fetchApi<LambdaResponse<ReporteClientesRiesgo[]>>({
      api: API_URL,
      service: `/reportes2/clientes-riesgo?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error) {
    console.error('Error fetching clientes riesgo report:', error)
    throw error
  }
}
