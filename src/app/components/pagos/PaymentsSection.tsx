'use client'
import React, { useState } from 'react'
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
import { formatCurrency, sumPagos, calculateSaldo } from '@/app/utils/currency'

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

  // Si se proporcionan pagos externos, usar solo esos (modo local)
  // Si no, usar el hook (modo API)
  const isLocalMode = !!externalPagos

  // Solo usar el hook si NO estamos en modo local
  const hookResult = isLocalMode ? null : usePayments(venta.id)

  // Extraer valores del hook solo si no estamos en modo local
  const hookPagos = hookResult?.pagos || []
  const hookLoading = hookResult?.loading || false
  const addPayment = hookResult?.addPayment || (async () => {})
  const editPayment = hookResult?.editPayment || (async () => {})
  const removePayment = hookResult?.removePayment || (async () => {})

  // Usar pagos externos si estamos en modo local, sino usar los del hook
  const pagos = isLocalMode ? externalPagos : hookPagos
  const loading = isLocalMode ? externalLoading || false : hookLoading

  const isVendido = venta.estado === 'vendido'
  // Calcular total pagado basado en los pagos actuales
  const totalPagado = sumPagos(pagos)
  const saldoPendiente = calculateSaldo(venta.total, totalPagado)
  const progressPercentage =
    venta.total > 0 ? (totalPagado / venta.total) * 100 : 0

  const handleAddPayment = () => {
    setEditingPago(undefined)
    setModalOpen(true)
  }

  const handleEditPayment = (pago: VentaPago) => {
    setEditingPago(pago)
    setModalOpen(true)
  }

  const handleDeletePayment = async (pagoId: number) => {
    try {
      // En modo local usar función externa, sino usar hook
      if (isLocalMode && externalDeletePayment) {
        externalDeletePayment(pagoId)
      } else {
        await removePayment(pagoId)
      }
      // Notificar cambio de pagos solo si NO estamos en modo local
      if (onPaymentsChange && !isLocalMode) {
        onPaymentsChange()
      }
    } catch (error) {
      // Error ya manejado en el hook
    }
  }

  const handleSavePayment = async (payload: any) => {
    try {
      if (editingPago) {
        // En modo local usar función externa, sino usar hook
        if (isLocalMode && externalEditPayment) {
          externalEditPayment(editingPago.id, payload)
        } else {
          await editPayment(editingPago.id, payload)
        }
      } else {
        // En modo local usar función externa, sino usar hook
        if (isLocalMode && externalAddPayment) {
          externalAddPayment(payload)
        } else {
          await addPayment(payload)
        }
      }
      setModalOpen(false)
      setEditingPago(undefined)
      // Notificar cambio de pagos solo si NO estamos en modo local
      if (onPaymentsChange && !isLocalMode) {
        onPaymentsChange()
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
        />
      </Space>
    </Card>
  )
}
