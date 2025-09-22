'use client'
import React, { useEffect, useState } from 'react'
import { Modal, Form, InputNumber, Button, Space, message } from 'antd'
import { MetodoPagoSelect } from '../MetodoPagoSelect'
import { MonedaSelect } from '../MonedaSelect'
import { VentaPago, PaymentCreateRequest, PaymentUpdateRequest } from '@/app/api/pagos'
import { formatCurrency } from '@/app/utils/currency'

interface PaymentFormModalProps {
  open: boolean
  onCancel: () => void
  onSave: (payload: PaymentCreateRequest | PaymentUpdateRequest) => Promise<void>
  initialValues?: VentaPago
  ventaTotal: number
  totalPagado: number
  isVendido: boolean
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  open,
  onCancel,
  onSave,
  initialValues,
  ventaTotal,
  totalPagado,
  isVendido
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [metodoPagoId, setMetodoPagoId] = useState<number | undefined>()
  const [monedaId, setMonedaId] = useState<number | undefined>()
  const [monto, setMonto] = useState<number | undefined>()

  const isEdit = !!initialValues
  const saldoPendiente = ventaTotal - totalPagado
  const montoMaximo = isEdit 
    ? saldoPendiente + (initialValues?.monto || 0)
    : saldoPendiente

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue({
          metodo_pago_id: initialValues.metodoPagoId || initialValues.metodo_pago_id,
          moneda_id: initialValues.monedaId || initialValues.moneda_id,
          monto: initialValues.monto,
          referencia_pago: initialValues.referencia_pago || ''
        })
        setMetodoPagoId(initialValues.metodoPagoId || initialValues.metodo_pago_id)
        setMonedaId(initialValues.monedaId || initialValues.moneda_id)
        setMonto(initialValues.monto)
      } else {
        form.resetFields()
        setMetodoPagoId(undefined)
        setMonedaId(undefined)
        setMonto(undefined)
      }
    }
  }, [open, initialValues, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      await onSave(values)
      form.resetFields()
      onCancel()
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Por favor complete todos los campos requeridos')
      } else {
        message.error(error.message || 'Error al guardar pago')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMontoChange = (value: number | null) => {
    setMonto(value || 0)
  }

  return (
    <Modal
      title={isEdit ? 'Editar Pago' : 'Agregar Pago'}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          disabled={isVendido}
        >
          {isEdit ? 'Actualizar' : 'Guardar'}
        </Button>
      ]}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        disabled={isVendido}
      >
        <Form.Item
          label="Método de Pago"
          name="metodo_pago_id"
          rules={[{ required: true, message: 'Seleccione un método de pago' }]}
        >
          <MetodoPagoSelect
            value={metodoPagoId}
            onChange={setMetodoPagoId}
            disabled={isVendido}
          />
        </Form.Item>

        <Form.Item
          label="Moneda"
          name="moneda_id"
          rules={[{ required: true, message: 'Seleccione una moneda' }]}
        >
          <MonedaSelect
            value={monedaId}
            onChange={setMonedaId}
            disabled={isVendido}
          />
        </Form.Item>

        <Form.Item
          label="Monto"
          name="monto"
          rules={[
            { required: true, message: 'Ingrese el monto' },
            { 
              type: 'number', 
              min: 0.01, 
              message: 'El monto debe ser mayor a 0' 
            },
            {
              validator: (_, value) => {
                if (value && value > montoMaximo) {
                  return Promise.reject(
                    new Error(`El monto no puede exceder ${formatCurrency(undefined, montoMaximo)}`)
                  )
                }
                return Promise.resolve()
              }
            }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0.01}
            max={montoMaximo}
            step={0.01}
            precision={2}
            onChange={handleMontoChange}
            placeholder="0.00"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          label="Referencia de Pago"
          name="referencia_pago"
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Opcional"
            maxLength={50}
          />
        </Form.Item>

        {!isVendido && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '6px',
            marginTop: '16px'
          }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div><strong>Total de la Venta:</strong> {formatCurrency(undefined, ventaTotal)}</div>
              <div><strong>Total Pagado:</strong> {formatCurrency(undefined, totalPagado)}</div>
              <div><strong>Saldo Pendiente:</strong> {formatCurrency(undefined, saldoPendiente)}</div>
              <div><strong>Monto Máximo:</strong> {formatCurrency(undefined, montoMaximo)}</div>
            </Space>
          </div>
        )}

        {isVendido && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fff2e8', 
            borderRadius: '6px',
            marginTop: '16px',
            border: '1px solid #ffd591'
          }}>
            <div style={{ color: '#d46b08' }}>
              <strong>⚠️ Esta venta ya está vendida</strong>
              <br />
              No se pueden realizar cambios en los pagos.
            </div>
          </div>
        )}
      </Form>
    </Modal>
  )
}
