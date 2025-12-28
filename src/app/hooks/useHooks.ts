'use client'

import { getClients } from '../api/clients'
import { getProducts, ProductType } from '../api/products'
import { getSalesFlat, SalesFlatType } from '../api/sales'
import { getStock, StockType } from '../api/stock'
import { getSuppliers, SupplierTypeResponse } from '../api/supplier'
import { getMetodosPago, MetodoPago } from '../api/metodos-pago'
import { getEnterprises, EnterpriseType } from '../api/enterprise'
import {
  getCuentasPorCobrar,
  CuentaPorCobrarTypeResponse,
} from '../api/cuentas-por-cobrar'
import {
  getCuentasPorPagar,
  CuentaPorPagarTypeResponse,
} from '../api/cuentas-por-pagar'
import { getUsuarios, UsuarioTypeResponse } from '../api/usuarios'
import { QueryKey } from '../utils/query'
import { useQuery } from '@tanstack/react-query'
import { useEmpresa } from '../empresaContext'

export const useProducts = (filters?: Record<string, any>) => {
  const { empresaId } = useEmpresa()

  return useQuery({
    queryKey: [QueryKey.productsInfo, { ...filters, empresa_id: empresaId }],
    queryFn: () => getProducts({ ...filters }, empresaId ?? 1),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useStock = (filters?: Record<string, any>) => {
  const { empresaId } = useEmpresa()

  const query = useQuery<StockType[]>({
    queryKey: [QueryKey.stockInfo, { ...filters, empresa_id: empresaId }],
    queryFn: () => getStock({ ...filters, empresa_id: empresaId }),
    staleTime: 0, // Los datos se consideran obsoletos inmediatamente
    refetchOnMount: true, // Refetch cuando el componente se monta
    refetchOnWindowFocus: true, // Refetch cuando la ventana gana foco
    refetchOnReconnect: true, // Refetch cuando se reconecta
  })
  return query
}

export const useSalesFlat = (filters?: Record<string, any>) => {
  const { empresaId } = useEmpresa()

  return useQuery<SalesFlatType[]>({
    queryKey: [QueryKey.salesFlatInfo, { ...filters, empresa_id: empresaId }],
    queryFn: () => getSalesFlat({ ...filters, empresa_id: empresaId }),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useClients = (filters?: Record<string, any>) => {
  const { empresaId } = useEmpresa()

  return useQuery({
    queryKey: [QueryKey.clientsInfo, { ...filters, empresa_id: empresaId }],
    queryFn: () => getClients({ ...filters }, empresaId ?? 1),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useSuppliers = (filters?: Record<string, any>) => {
  const { empresaId } = useEmpresa()

  return useQuery<SupplierTypeResponse[]>({
    queryKey: [QueryKey.suppliersInfo, { ...filters, empresa_id: empresaId }],
    queryFn: () => getSuppliers({ ...filters }, undefined, empresaId ?? 1),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useMetodosPago = (filters?: Record<string, any>) => {
  const { empresaId } = useEmpresa()

  return useQuery<MetodoPago[]>({
    queryKey: [QueryKey.metodosPagoInfo, { ...filters, empresa_id: empresaId }],
    queryFn: () => getMetodosPago({ ...filters }, empresaId ?? 1),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useEnterprises = (filters?: Record<string, any>) => {
  return useQuery<EnterpriseType[]>({
    queryKey: [QueryKey.enterprisesInfo, filters],
    queryFn: () => getEnterprises(filters),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useCuentasPorCobrar = (filters?: Record<string, any>) => {
  const { empresaId } = useEmpresa()

  return useQuery<CuentaPorCobrarTypeResponse[]>({
    queryKey: [
      QueryKey.cuentasPorCobrarInfo,
      { ...filters, empresa_id: empresaId },
    ],
    queryFn: () => getCuentasPorCobrar({ ...filters, empresa_id: empresaId }),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useCuentasPorPagar = (filters?: Record<string, any>) => {
  const { empresaId } = useEmpresa()

  return useQuery<CuentaPorPagarTypeResponse[]>({
    queryKey: [
      QueryKey.cuentasPorPagarInfo,
      { ...filters, empresa_id: empresaId },
    ],
    queryFn: () => getCuentasPorPagar({ ...filters, empresa_id: empresaId }),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

import {
  getCuentasPorPagarResumenProveedores,
  CuentasPorPagarProveedorResumen,
} from '../api/cuentas-por-pagar'

export const useCuentasPorPagarResumenProveedores = (
  filters?: Record<string, any>
) => {
  const { empresaId } = useEmpresa()

  return useQuery<CuentasPorPagarProveedorResumen[]>({
    queryKey: [
      QueryKey.cuentasPorPagarResumenProveedoresInfo,
      { ...filters, empresa_id: empresaId },
    ],
    queryFn: () =>
      getCuentasPorPagarResumenProveedores({
        ...filters,
        empresa_id: empresaId,
      }),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useUsuarios = (filters?: Record<string, any>) => {
  const { empresaId } = useEmpresa()

  return useQuery<UsuarioTypeResponse[]>({
    queryKey: [QueryKey.usuariosInfo, { ...filters, empresa_id: empresaId }],
    queryFn: () => getUsuarios({ ...filters }, empresaId ?? undefined),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}
