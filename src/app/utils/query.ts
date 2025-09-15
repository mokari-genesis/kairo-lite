import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryKey as TanQueryKey } from '@tanstack/react-query'

// 1. Query Client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 60 * 24, // 24 horas
    },
  },
})

// 2. Persister para Web usando localStorage
export const getLocalStoragePersister = () => {
  if (typeof window === 'undefined') {
    return null
  }
  return createSyncStoragePersister({
    storage: window.localStorage,
  })
}

// 3. Query Keys (no hay que tocar nada aquí)
export const QueryKey = {
  productsInfo: 'productsInfo',
  stockInfo: 'stockInfo',
  salesInfo: 'salesInfo',
  salesFlatInfo: 'salesFlatInfo',
  clientsInfo: 'clientsInfo',
  suppliersInfo: 'suppliersInfo-02',
  metodosPagoInfo: 'metodosPagoInfo',
  monedasInfo: 'monedasInfo',
  productosPreciosInfo: 'productosPreciosInfo',
}

// 4. Helper
export const isQueryFetching = (queryKey: TanQueryKey) => {
  return queryClient.getQueryState(queryKey)?.fetchStatus === 'fetching'
}
