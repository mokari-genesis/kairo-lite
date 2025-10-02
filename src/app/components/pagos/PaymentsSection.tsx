'use client'
import React, { useState, useMemo, useCallback, useRef } from 'react'
import {
  Card,
  Button,
  Space,
  Statistic,
  Progress,
  Tag,
  message,
  Modal,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { Venta, VentaPago } from '@/app/api/pagos'
import { usePayments } from '@/app/hooks/usePayments'
import { PaymentFormModal } from './PaymentFormModal'
import { PaymentList } from './PaymentList'
import {
  formatCurrency,
  sumPagos,
  calculateSaldo,
  sumPagosConConversion,
  obtenerMonedaBase,
} from '@/app/utils/currency'
import { Moneda, getMonedas } from '@/app/api/monedas'

interface PaymentsSectionProps {
  venta: Venta
  onPaymentsChange?: () => void
  pagos?: VentaPago[]
  onAddPayment?: (payment: Omit<VentaPago, 'id'>) => void
  onEditPayment?: (paymentId: number, payment: Partial<VentaPago>) => void
  onDeletePayment?: (paymentId: number) => void
  loading?: boolean
}

export const PaymentsSection: React.FC<PaymentsSectionProps> = ({
  venta,
  onPaymentsChange,
  pagos: externalPagos,
  onAddPayment: externalAddPayment,
  onEditPayment: externalEditPayment,
  onDeletePayment: externalDeletePayment,
  loading: externalLoading,
}) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPago, setEditingPago] = useState<VentaPago | undefined>()
  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [monedaBase, setMonedaBase] = useState<Moneda | null>(null)

  // Usar refs para evitar re-renders innecesarios
  const onPaymentsChangeRef = useRef(onPaymentsChange)
  onPaymentsChangeRef.current = onPaymentsChange

  const externalDeletePaymentRef = useRef(externalDeletePayment)
  externalDeletePaymentRef.current = externalDeletePayment

  const externalAddPaymentRef = useRef(externalAddPayment)
  externalAddPaymentRef.current = externalAddPayment

  const externalEditPaymentRef = useRef(externalEditPayment)
  externalEditPaymentRef.current = externalEditPayment

  // Si se proporcionan pagos externos, usar solo esos (modo local)
  // Si no, usar el hook (modo API)
  const isLocalMode = !!externalPagos

  // Solo usar el hook si NO estamos en modo local
  const hookResult = usePayments(venta.id)

  // Extraer valores del hook solo si no estamos en modo local
  const hookPagos = hookResult?.pagos || []
  const hookLoading = hookResult?.loading || false
  const addPayment = hookResult?.addPayment || (async () => {})
  const editPayment = hookResult?.editPayment || (async () => {})
  const removePayment = hookResult?.removePayment || (async () => {})

  // Usar pagos externos si están disponibles, sino usar los del hook (memoizado)
  const pagos = useMemo(() => {
    return externalPagos || hookPagos
  }, [externalPagos, hookPagos])

  const loading = useMemo(() => {
    return externalLoading !== undefined ? externalLoading : hookLoading
  }, [externalLoading, hookLoading])

  const isVendido = useMemo(() => venta.estado === 'vendido', [venta.estado])

  // Cargar monedas al montar el componente
  React.useEffect(() => {
    const cargarMonedas = async () => {
      try {
        const monedasData = await getMonedas({ activo: 1 })
        setMonedas(monedasData)
        const base = obtenerMonedaBase(monedasData)
        setMonedaBase(base)
      } catch (error) {
        console.error('Error cargando monedas:', error)
      }
    }
    cargarMonedas()
  }, [])

  // Calcular total pagado con conversión si hay moneda base (memoizado)
  const totalPagado = useMemo(() => {
    return monedaBase
      ? sumPagosConConversion(pagos, monedaBase, monedas)
      : sumPagos(pagos)
  }, [pagos, monedaBase, monedas])

  const saldoPendiente = useMemo(() => {
    return calculateSaldo(venta.total, totalPagado)
  }, [venta.total, totalPagado])

  const progressPercentage = useMemo(() => {
    return venta.total > 0 ? (totalPagado / venta.total) * 100 : 0
  }, [venta.total, totalPagado])

  const handleAddPayment = useCallback(() => {
    setEditingPago(undefined)
    setModalOpen(true)
  }, [])

  const handleEditPayment = useCallback((pago: VentaPago) => {
    setEditingPago(pago)
    setModalOpen(true)
  }, [])

  const handleDeletePayment = useCallback(
    async (pagoId: number) => {
      try {
        // En modo local usar función externa, sino usar hook
        if (isLocalMode && externalDeletePaymentRef.current) {
          externalDeletePaymentRef.current(pagoId)
        } else {
          await removePayment(pagoId)
        }
        // Notificar cambio de pagos usando ref
        if (onPaymentsChangeRef.current) {
          onPaymentsChangeRef.current()
        }
      } catch (error) {
        // Error ya manejado en el hook
      }
    },
    [isLocalMode]
  )

  const handleSavePayment = async (payload: any) => {
    try {
      if (editingPago) {
        // En modo local usar función externa, sino usar hook
        if (isLocalMode && externalEditPaymentRef.current) {
          externalEditPaymentRef.current(editingPago.id, payload)
        } else {
          await editPayment(editingPago.id, payload)
        }
      } else {
        // En modo local usar función externa, sino usar hook
        if (isLocalMode && externalAddPaymentRef.current) {
          externalAddPaymentRef.current(payload)
        } else {
          await addPayment(payload)
        }
      }
      setModalOpen(false)
      setEditingPago(undefined)
      // Notificar cambio de pagos usando ref
      if (onPaymentsChangeRef.current) {
        onPaymentsChangeRef.current()
      }
    } catch (error) {
      // Error ya manejado en el hook
      throw error
    }
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'vendido':
        return 'success'
      case 'cancelado':
        return 'error'
      case 'pendiente':
        return 'processing'
      default:
        return 'default'
    }
  }

  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'vendido':
        return 'Vendido'
      case 'cancelado':
        return 'Cancelado'
      case 'pendiente':
        return 'Pendiente'
      default:
        return estado
    }
  }

  return (
    <Card title='Gestión de Pagos' size='small' style={{ marginTop: '16px' }}>
      <Space direction='vertical' size='large' style={{ width: '100%' }}>
        {/* Resumen de pagos */}
        <div>
          <Space size='large' wrap>
            <Statistic
              title='Total de la Venta'
              value={venta.total}
              formatter={value => formatCurrency(undefined, value as number)}
            />
            <Statistic
              title='Total Pagado'
              value={totalPagado}
              formatter={value => formatCurrency(undefined, value as number)}
            />
            <Statistic
              title='Saldo Pendiente'
              value={saldoPendiente}
              formatter={value => formatCurrency(undefined, value as number)}
              valueStyle={{
                color: saldoPendiente > 0 ? '#cf1322' : '#52c41a',
              }}
            />
            <div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Estado:</strong>
              </div>
              <Tag color={getStatusColor(venta.estado)}>
                {getStatusText(venta.estado)}
              </Tag>
            </div>
          </Space>
        </div>

        {/* Barra de progreso */}
        <div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Progreso de Pago</strong>
          </div>
          <Progress
            percent={Math.round(progressPercentage)}
            status={progressPercentage === 100 ? 'success' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            format={percent => `${percent}%`}
          />
        </div>

        {/* Botón para agregar pago */}
        <div>
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={handleAddPayment}
          >
            Agregar Pago
          </Button>
        </div>

        {/* Lista de pagos */}
        {pagos.length > 0 ? (
          <PaymentList
            pagos={pagos}
            loading={loading}
            onEdit={handleEditPayment}
            onDelete={handleDeletePayment}
            isVendido={isVendido}
          />
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '20px',
              color: '#8c8c8c',
            }}
          >
            No hay pagos registrados
          </div>
        )}

        {/* Modal de formulario */}
        <PaymentFormModal
          open={modalOpen}
          onCancel={() => {
            setModalOpen(false)
            setEditingPago(undefined)
          }}
          onSave={handleSavePayment}
          initialValues={editingPago}
          ventaTotal={venta.total}
          totalPagado={totalPagado}
          isVendido={isVendido}
          key={editingPago?.id || 'new'} // Forzar re-render cuando cambie el pago a editar
        />
      </Space>
    </Card>
  )
}
