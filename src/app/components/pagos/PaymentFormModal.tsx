'use client'
import React, { useEffect, useState } from 'react'
import { Modal, Form, InputNumber, Input, Button, Space, message } from 'antd'
import { MetodoPagoSelect } from '../MetodoPagoSelect'
import { MonedaSelect } from '../MonedaSelect'
import {
  VentaPago,
  PaymentCreateRequest,
  PaymentUpdateRequest,
} from '@/app/api/pagos'
import {
  formatCurrency,
  convertirAMonedaBase,
  obtenerMonedaBase,
  formatearTasa,
} from '@/app/utils/currency'
import { Moneda, getMonedas } from '@/app/api/monedas'

interface PaymentFormModalProps {
  open: boolean
  onCancel: () => void
  onSave: (
    payload: PaymentCreateRequest | PaymentUpdateRequest
  ) => Promise<void>
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
  isVendido,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [monto, setMonto] = useState<number | undefined>()
  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [monedaBase, setMonedaBase] = useState<Moneda | null>(null)
  const [monedaSeleccionada, setMonedaSeleccionada] = useState<Moneda | null>(
    null
  )
  const [montoConvertido, setMontoConvertido] = useState<number | undefined>()

  const isEdit = !!initialValues
  const saldoPendiente = Number((ventaTotal - totalPagado).toFixed(2))
  const montoMaximo = isEdit
    ? Number((saldoPendiente + (initialValues?.monto || 0)).toFixed(2))
    : saldoPendiente

  // Cargar monedas al abrir el modal
  useEffect(() => {
    if (open) {
      const cargarMonedas = async () => {
        try {
          const monedasData = await getMonedas({ activo: 1 })
          setMonedas(monedasData)
          const base = obtenerMonedaBase(monedasData)
          setMonedaBase(base)
        } catch (error) {
          console.error('Error cargando monedas:', error)
          message.error('Error al cargar las monedas')
        }
      }
      cargarMonedas()
    }
  }, [open])

  useEffect(() => {
    if (open) {
      // Resetear todos los estados primero
      setMonto(undefined)
      setMontoConvertido(undefined)
      setMonedaSeleccionada(null)

      if (initialValues) {
        // Buscar la moneda seleccionada en la lista de monedas
        const monedaEncontrada = monedas.find(
          m => m.id === (initialValues.monedaId || initialValues.moneda_id)
        )

        form.setFieldsValue({
          metodo_pago_id:
            initialValues.metodoPagoId || initialValues.metodo_pago_id,
          moneda_id: initialValues.monedaId || initialValues.moneda_id,
          monto: Number(initialValues.monto?.toFixed(2) || 0),
          referencia_pago: initialValues.referencia_pago || '',
        })

        setMonto(Number(initialValues.monto?.toFixed(2) || 0))
        setMonedaSeleccionada(monedaEncontrada || null)
      } else {
        // Para nuevos pagos, no auto-popular el monto
        form.resetFields()
      }
    }
  }, [open, initialValues, form, monedas])

  // Calcular conversión cuando cambia el monto o la moneda
  useEffect(() => {
    if (monto && monedaSeleccionada && monedaBase) {
      const convertido = convertirAMonedaBase(
        monto,
        monedaSeleccionada,
        monedaBase
      )
      setMontoConvertido(convertido)
    } else {
      setMontoConvertido(undefined)
    }
  }, [monto, monedaSeleccionada, monedaBase])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // Asegurar que el monto tenga 2 decimales
      const payload = {
        ...values,
        monto: Number(values.monto.toFixed(2)),
      }

      await onSave(payload)
      form.resetFields()
      setMonto(undefined)
      setMontoConvertido(undefined)
      setMonedaSeleccionada(null)
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
    const montoValor = value ? Number(value.toFixed(2)) : 0
    setMonto(montoValor)
  }

  const handleMonedaChange = (value: number, moneda: Moneda) => {
    setMonedaSeleccionada(moneda)
  }

  return (
    <Modal
      title={isEdit ? 'Editar Pago' : 'Agregar Pago'}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key='cancel' onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>,
        <Button
          key='save'
          type='primary'
          loading={loading}
          onClick={handleSubmit}
          disabled={isVendido}
        >
          {isEdit ? 'Actualizar' : 'Guardar'}
        </Button>,
      ]}
      width={500}
    >
      <Form form={form} layout='vertical' disabled={isVendido}>
        <Form.Item
          label='Método de Pago'
          name='metodo_pago_id'
          rules={[{ required: true, message: 'Seleccione un método de pago' }]}
        >
          <MetodoPagoSelect disabled={isVendido} />
        </Form.Item>

        <Form.Item
          label='Moneda'
          name='moneda_id'
          rules={[{ required: true, message: 'Seleccione una moneda' }]}
        >
          <MonedaSelect disabled={isVendido} onChange={handleMonedaChange} />
        </Form.Item>

        <Form.Item
          label='Monto'
          name='monto'
          rules={[
            { required: true, message: 'Ingrese el monto' },
            {
              type: 'number',
              min: 0.01,
              message: 'El monto debe ser mayor a 0',
            },
            {
              validator: (_, value) => {
                if (value && value > montoMaximo) {
                  return Promise.reject(
                    new Error(
                      `El monto no puede exceder ${formatCurrency(
                        undefined,
                        montoMaximo
                      )}`
                    )
                  )
                }
                return Promise.resolve()
              },
            },
            {
              validator: (_, value) => {
                // Validar que el monto convertido no exceda el saldo pendiente
                if (
                  value &&
                  montoConvertido &&
                  monedaBase &&
                  monedaSeleccionada
                ) {
                  if (montoConvertido > montoMaximo) {
                    return Promise.reject(
                      new Error(
                        `El monto convertido a ${
                          monedaBase.codigo
                        } (${formatCurrency(
                          monedaBase.codigo,
                          montoConvertido
                        )}) excede el saldo pendiente`
                      )
                    )
                  }
                }
                return Promise.resolve()
              },
            },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0.01}
            max={montoMaximo}
            step={0.01}
            precision={2}
            onChange={handleMontoChange}
            placeholder='0.00'
            formatter={value =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            }
            parser={value => parseFloat(value!.replace(/\$\s?|(,*)/g, '')) || 0}
          />
        </Form.Item>

        <Form.Item label='Referencia (Opcional)' name='referencia_pago'>
          <Input
            placeholder='Número de transacción, cheque, etc.'
            maxLength={50}
          />
        </Form.Item>

        {!isVendido && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#f5f5f5',
              borderRadius: '6px',
              marginTop: '16px',
            }}
          >
            <Space direction='vertical' size='small' style={{ width: '100%' }}>
              <div>
                <strong>Total de la Venta:</strong>{' '}
                {formatCurrency(undefined, ventaTotal)}
              </div>
              <div>
                <strong>Total Pagado:</strong>{' '}
                {formatCurrency(undefined, totalPagado)}
              </div>
              <div>
                <strong>Saldo Pendiente:</strong>{' '}
                {formatCurrency(undefined, saldoPendiente)}
              </div>
              <div>
                <strong>Monto Máximo:</strong>{' '}
                {formatCurrency(undefined, montoMaximo)}
              </div>
              {montoConvertido &&
                monedaSeleccionada &&
                monedaBase &&
                monedaSeleccionada.id !== monedaBase.id && (
                  <div
                    style={{
                      padding: '8px',
                      backgroundColor: '#e6f7ff',
                      borderRadius: '4px',
                      border: '1px solid #91d5ff',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#1890ff' }}>
                      <strong>Conversión:</strong>{' '}
                      {formatCurrency(monedaSeleccionada.codigo, monto)} ={' '}
                      {formatCurrency(monedaBase.codigo, montoConvertido)}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#8c8c8c',
                        marginTop: '2px',
                      }}
                    >
                      Tasa: 1 {monedaSeleccionada.codigo} ={' '}
                      {formatearTasa(monedaSeleccionada.tasa_vs_base)}{' '}
                      {monedaBase.codigo}
                    </div>
                  </div>
                )}
            </Space>
          </div>
        )}

        {isVendido && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fff2e8',
              borderRadius: '6px',
              marginTop: '16px',
              border: '1px solid #ffd591',
            }}
          >
            <div style={{ color: '#d46b08' }}>
              <strong>⚠️ Esta Orden ya está vendida</strong>
              <br />
              No se pueden realizar cambios en los pagos, si asi lo deseas debes
              cancelar la venta.
            </div>
          </div>
        )}
      </Form>
    </Modal>
  )
}
