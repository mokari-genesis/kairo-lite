import { fetchApi, LambdaResponse } from './constants'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import { API_URL } from '../utils/commons'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

const DATE_FORMAT = 'YYYY-MM-DD'

export type CompraItem = {
  producto_id: number
  cantidad: number
  costo_unitario: number
}

export type CompraCreateRequest = {
  empresa_id: number
  proveedor_id: number
  usuario_id?: number
  fecha?: string
  moneda_id: number
  tipo_pago: 'contado' | 'credito'
  fecha_vencimiento?: string
  comentario?: string
  items: CompraItem[]
}

export type CompraDetalle = {
  id: number
  compra_id: number
  producto_id: number
  producto_codigo: string
  producto_descripcion: string
  producto_serie?: string
  producto_categoria?: string
  cantidad: number
  costo_unitario: number
  subtotal: number
}

export type CompraResponse = {
  id: number
  empresa_id: number
  empresa_nombre: string
  proveedor_id: number
  proveedor_nombre: string
  proveedor_nit: string
  proveedor_email?: string
  proveedor_telefono?: string
  proveedor_direccion?: string
  usuario_id?: number
  usuario_nombre?: string
  usuario_email?: string
  fecha: string
  total: number
  estado: 'registrada' | 'anulada'
  moneda_id: number
  moneda_codigo: string
  moneda_simbolo: string
  moneda_nombre?: string
  tipo_pago: 'contado' | 'credito' | null
  comentario?: string
  total_items?: number
  total_productos?: number
  detalles?: CompraDetalle[]
  cuenta_por_pagar?: {
    id: number
    total: number
    saldo: number
    estado: string
    fecha_emision: string
    fecha_vencimiento?: string
  } | null
}

export type CompraFilters = {
  empresa_id?: number
  id?: number
  proveedor_id?: number
  usuario_id?: number
  estado?: 'registrada' | 'anulada'
  tipo_pago?: 'contado' | 'credito'
  fecha_inicio?: string
  fecha_fin?: string
  producto_id?: number
}

// Listar compras
export const getCompras = async (
  filters?: CompraFilters
): Promise<CompraResponse[]> => {
  try {
    const queryParams = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const response = await fetchApi<LambdaResponse<CompraResponse[]>>({
      api: API_URL,
      service: `/compras?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error: any) {
    console.error('Error fetching compras:', error)
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

// Obtener compra por ID
export const getCompra = async (id: number): Promise<CompraResponse> => {
  try {
    const response = await fetchApi<LambdaResponse<CompraResponse>>({
      api: API_URL,
      service: `/compras/${id}`,
      method: 'GET',
    })

    return response.data
  } catch (error: any) {
    console.error('Error fetching compra:', error)
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

// Crear compra
export const createCompra = async (
  compra: CompraCreateRequest
): Promise<CompraResponse> => {
  try {
    const response = await fetchApi<LambdaResponse<CompraResponse>>({
      api: API_URL,
      service: '/compras',
      method: 'POST',
      body: compra,
    })

    return response.data
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

// Anular compra
export const anularCompra = async (id: number): Promise<void> => {
  try {
    await fetchApi<LambdaResponse<void>>({
      api: API_URL,
      service: `/compras/${id}/anular`,
      method: 'POST',
    })
  } catch (error: any) {
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

// Reportes
export type CompraPorRangoFechas = {
  fecha: string
  total_compras: number
  total_monto: number
  total_proveedores: number
  total_contado: number
  total_credito: number
}

export type CompraPorProveedor = {
  proveedor_id: number
  proveedor_nombre: string
  proveedor_nit: string
  total_compras: number
  total_monto: number
  promedio_compra: number
  total_contado: number
  total_credito: number
}

export type CompraContadoVsCredito = {
  tipo_pago: 'contado' | 'credito'
  total_compras: number
  total_monto: number
  promedio_compra: number
}

export type CxpPorCompra = {
  compra_id: number
  compra_fecha: string
  compra_total: number
  tipo_pago: 'contado' | 'credito'
  cxp_id?: number
  cxp_total?: number
  cxp_saldo?: number
  cxp_estado?: string
  cxp_fecha_emision?: string
  cxp_fecha_vencimiento?: string
  proveedor_nombre: string
  proveedor_nit: string
}

export type ProductoMasComprado = {
  producto_id: number
  producto_codigo: string
  producto_descripcion: string
  producto_categoria?: string
  total_compras: number
  total_cantidad: number
  total_monto: number
  costo_promedio: number
}

export const getComprasPorRangoFechas = async (
  filters?: { empresa_id?: number; fecha_inicio?: string; fecha_fin?: string }
): Promise<CompraPorRangoFechas[]> => {
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
      LambdaResponse<CompraPorRangoFechas[]>
    >({
      api: API_URL,
      service: `/reportes2/compras-por-rango-fechas?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error: any) {
    console.error('Error fetching reporte:', error)
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const getComprasPorProveedor = async (
  filters?: { empresa_id?: number; fecha_inicio?: string; fecha_fin?: string }
): Promise<CompraPorProveedor[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const response = await fetchApi<LambdaResponse<CompraPorProveedor[]>>({
      api: API_URL,
      service: `/reportes2/compras-por-proveedor?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error: any) {
    console.error('Error fetching reporte:', error)
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const getComprasContadoVsCredito = async (
  filters?: { empresa_id?: number; fecha_inicio?: string; fecha_fin?: string }
): Promise<CompraContadoVsCredito[]> => {
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
      LambdaResponse<CompraContadoVsCredito[]>
    >({
      api: API_URL,
      service: `/reportes2/compras-contado-vs-credito?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error: any) {
    console.error('Error fetching reporte:', error)
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const getCxpPorCompras = async (
  filters?: { empresa_id?: number; fecha_inicio?: string; fecha_fin?: string }
): Promise<CxpPorCompra[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const response = await fetchApi<LambdaResponse<CxpPorCompra[]>>({
      api: API_URL,
      service: `/reportes2/cxp-por-compras?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error: any) {
    console.error('Error fetching reporte:', error)
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

export const getProductosMasComprados = async (
  filters?: {
    empresa_id?: number
    fecha_inicio?: string
    fecha_fin?: string
    limit?: number
  }
): Promise<ProductoMasComprado[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const response = await fetchApi<LambdaResponse<ProductoMasComprado[]>>({
      api: API_URL,
      service: `/reportes2/productos-mas-comprados?${queryParams.toString()}`,
      method: 'GET',
    })

    return response.data || []
  } catch (error: any) {
    console.error('Error fetching reporte:', error)
    if (error.message) {
      throw new Error(getFriendlyErrorMessage(error.message))
    }
    throw error
  }
}

