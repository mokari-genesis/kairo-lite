'use client'
import React, { useState } from 'react'
import {
  Card,
  Button,
  Space,
  Table,
  InputNumber,
  Input,
  Form,
  message,
  Popconfirm,
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { MetodoPagoSelect } from '../MetodoPagoSelect'
import { MonedaSelect } from '../MonedaSelect'
import { VentaPago, PaymentCreateRequest } from '@/app/api/pagos'
import { formatCurrency, sumPagos, calculateSaldo } from '@/app/utils/currency'

interface PaymentSubFormProps {
  total: number
  onPaymentsChange: (pagos: VentaPago[]) => void
  disabled?: boolean
}

export const PaymentSubForm: React.FC<PaymentSubFormProps> = ({
  total,
  onPaymentsChange,
  disabled = false,
}) => {
  const [pagos, setPagos] = useState<VentaPago[]>([])
  const [form] = Form.useForm()

  const totalPagado = sumPagos(pagos)
  const saldoPendiente = calculateSaldo(total, totalPagado)

  const handleAddPayment = () => {
    const newPago: VentaPago = {
      id: Date.now(), // ID temporal para la UI
      metodo_pago_id: undefined,
      moneda_id: undefined,
      monto: 0,
      referencia_pago: '',
      metodoPagoNombre: '',
      monedaCodigo: '',
    }

    const newPagos = [...pagos, newPago]
    setPagos(newPagos)
    onPaymentsChange(newPagos)
  }

  const handleRemovePayment = (index: number) => {
    const newPagos = pagos.filter((_, i) => i !== index)
    setPagos(newPagos)
    onPaymentsChange(newPagos)
  }

  const handlePaymentChange = (
    index: number,
    field: keyof VentaPago,
    value: any
  ) => {
    console.log(`Actualizando pago ${index}, campo: ${field}, valor:`, value)
    console.log('Estado actual de pagos antes del cambio:', pagos)

    setPagos(prevPagos => {
      const newPagos = [...prevPagos]
      newPagos[index] = {
        ...newPagos[index],
        [field]: value,
      }
      console.log(
        'Nuevo estado de pagos después del cambio:',
        JSON.stringify(newPagos, null, 2)
      )
      onPaymentsChange(newPagos)
      return newPagos
    })
  }

  const canAddPayment = () => {
    return saldoPendiente > 0 && !disabled
  }

  const columns = [
    {
      title: 'Método de Pago',
      dataIndex: 'metodo_pago_id',
      key: 'metodo_pago_id',
      width: 200,
      render: (_: any, record: VentaPago, index: number) => (
        <MetodoPagoSelect
          value={record.metodo_pago_id || undefined}
          onChange={(value, metodo) => {
            console.log('MetodoPagoSelect onChange:', { value, metodo, index })
            handlePaymentChange(index, 'metodo_pago_id', value)
            handlePaymentChange(index, 'metodoPagoNombre', metodo?.nombre)
          }}
          disabled={disabled}
          dropdownStyle={{
            zIndex: 10000,
            maxHeight: '250px',
            overflow: 'auto',
          }}
        />
      ),
    },
    {
      title: 'Moneda',
      dataIndex: 'moneda_id',
      key: 'moneda_id',
      width: 150,
      render: (_: any, record: VentaPago, index: number) => (
        <MonedaSelect
          value={record.moneda_id || undefined}
          onChange={(value, moneda) => {
            console.log('MonedaSelect onChange:', { value, moneda, index })
            handlePaymentChange(index, 'moneda_id', value)
            handlePaymentChange(index, 'monedaCodigo', moneda?.codigo)
          }}
          disabled={disabled}
          dropdownStyle={{
            zIndex: 10000,
            maxHeight: '250px',
            overflow: 'auto',
          }}
        />
      ),
    },
    {
      title: 'Monto',
      dataIndex: 'monto',
      key: 'monto',
      width: 150,
      render: (_: any, record: VentaPago, index: number) => (
        <InputNumber
          min={0.01}
          max={saldoPendiente + record.monto}
          step={0.01}
          precision={2}
          value={record.monto}
          onChange={value => handlePaymentChange(index, 'monto', value || 0)}
          disabled={disabled}
          style={{ width: '100%' }}
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => parseFloat(value!.replace(/\$\s?|(,*)/g, '')) || 0}
        />
      ),
    },
    {
      title: 'Referencia',
      dataIndex: 'referencia_pago',
      key: 'referencia_pago',
      width: 200,
      render: (_: any, record: VentaPago, index: number) => (
        <Input
          value={record.referencia_pago}
          onChange={e =>
            handlePaymentChange(index, 'referencia_pago', e.target.value)
          }
          disabled={disabled}
          placeholder='Opcional'
          maxLength={50}
        />
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 100,
      render: (_: any, record: VentaPago, index: number) => (
        <Button
          type='text'
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemovePayment(index)}
          disabled={disabled}
          size='small'
        />
      ),
    },
  ]

  return (
    <Card title='Pagos (Opcional)' size='small' style={{ marginTop: '16px' }}>
      <Space direction='vertical' size='large' style={{ width: '100%' }}>
        {/* Resumen */}
        <div>
          <Space size='large' wrap>
            <div>
              <strong>Total de la Venta:</strong>{' '}
              {formatCurrency(undefined, total)}
            </div>
            <div>
              <strong>Total Pagado:</strong>{' '}
              {formatCurrency(undefined, totalPagado)}
            </div>
            <div
              style={{
                color: saldoPendiente > 0 ? '#cf1322' : '#52c41a',
                fontWeight: saldoPendiente > 0 ? 'bold' : 'normal',
              }}
            >
              <strong>Saldo Pendiente:</strong>{' '}
              {formatCurrency(undefined, saldoPendiente)}
            </div>
          </Space>
        </div>

        {/* Botón para agregar pago */}
        <div>
          <Button
            type='dashed'
            icon={<PlusOutlined />}
            onClick={handleAddPayment}
            disabled={!canAddPayment()}
          >
            Agregar Pago
          </Button>
          {disabled && (
            <div
              style={{
                marginTop: '8px',
                color: '#8c8c8c',
                fontSize: '12px',
              }}
            >
              No se pueden agregar pagos a ventas vendidas
            </div>
          )}
          {!disabled && saldoPendiente <= 0 && (
            <div
              style={{
                marginTop: '8px',
                color: '#52c41a',
                fontSize: '12px',
              }}
            >
              ✅ La venta está completamente pagada
            </div>
          )}
        </div>

        {/* Tabla de pagos */}
        {pagos.length > 0 ? (
          <Table
            columns={columns}
            dataSource={pagos}
            rowKey={(record, index) => index || 0}
            pagination={false}
            size='small'
            scroll={{ x: 600 }}
            style={{
              overflow: 'visible',
            }}
          />
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '20px',
              color: '#8c8c8c',
            }}
          >
            No hay pagos agregados
          </div>
        )}
      </Space>
    </Card>
  )
}
