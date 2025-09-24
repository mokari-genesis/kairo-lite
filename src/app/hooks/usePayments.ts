import { useState, useEffect } from 'react'
import { message } from 'antd'
import { 
  listPayments, 
  createPayment, 
  updatePayment, 
  deletePayment,
  VentaPago,
  PaymentCreateRequest,
  PaymentUpdateRequest
} from '@/app/api/pagos'
import { queryClient } from '@/app/utils/query'
import { QueryKey } from '@/app/utils/query'

export const usePayments = (ventaId: number) => {
  const [pagos, setPagos] = useState<VentaPago[]>([])
  const [loading, setLoading] = useState(false)

  const loadPayments = async () => {
    if (!ventaId) return
    
    try {
      setLoading(true)
      const payments = await listPayments(ventaId)
      setPagos(payments)
    } catch (error: any) {
      message.error(error.message || 'Error al cargar pagos')
    } finally {
      setLoading(false)
    }
  }

  const addPayment = async (payload: PaymentCreateRequest) => {
    try {
      setLoading(true)
      await createPayment(ventaId, payload)
      await loadPayments()
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.salesFlatInfo],
      })
      message.success('Pago creado exitosamente')
    } catch (error: any) {
      message.error(error.message || 'Error al crear pago')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const editPayment = async (pagoId: number, payload: PaymentUpdateRequest) => {
    try {
      setLoading(true)
      await updatePayment(ventaId, pagoId, payload)
      await loadPayments()
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.salesFlatInfo],
      })
      message.success('Pago actualizado exitosamente')
    } catch (error: any) {
      message.error(error.message || 'Error al actualizar pago')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const removePayment = async (pagoId: number) => {
    try {
      setLoading(true)
      await deletePayment(ventaId, pagoId)
      await loadPayments()
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.salesFlatInfo],
      })
      message.success('Pago eliminado exitosamente')
    } catch (error: any) {
      message.error(error.message || 'Error al eliminar pago')
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [ventaId])

  return {
    pagos,
    loading,
    addPayment,
    editPayment,
    removePayment,
    reloadPayments: loadPayments
  }
}
