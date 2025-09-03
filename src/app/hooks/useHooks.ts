import { getClients } from '../api/clients'
import { getProducts, ProductType } from '../api/products'
import { getSales, getSalesFlat, SalesFlatType } from '../api/sales'
import { getStock, StockType } from '../api/stock'
import { QueryKey } from '../utils/query'
import { useQuery } from '@tanstack/react-query'

export const useProducts = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: [QueryKey.productsInfo, filters],
    queryFn: () => getProducts({ ...filters }),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useStock = (filters?: Record<string, any>) => {
  const query = useQuery<StockType[]>({
    queryKey: [QueryKey.stockInfo, filters],
    queryFn: () => getStock(filters),
    staleTime: 0, // Los datos se consideran obsoletos inmediatamente
    refetchOnMount: true, // Refetch cuando el componente se monta
    refetchOnWindowFocus: true, // Refetch cuando la ventana gana foco
    refetchOnReconnect: true, // Refetch cuando se reconecta
  })
  return query
}

export const useSales = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: [QueryKey.salesInfo, filters],
    queryFn: () => getSales(filters),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useSalesFlat = (filters?: Record<string, any>) => {
  return useQuery<SalesFlatType[]>({
    queryKey: [QueryKey.salesFlatInfo, filters],
    queryFn: () => getSalesFlat(filters),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export const useClients = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: [QueryKey.clientsInfo, filters],
    queryFn: () => getClients(filters),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}
