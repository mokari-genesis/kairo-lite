'use client'
import React, { useMemo, memo } from 'react'
import { Table, Button, Space, Tag, Popconfirm, message } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { VentaPago } from '@/app/api/pagos'
import { formatCurrency } from '@/app/utils/currency'

interface PaymentListProps {
  pagos: VentaPago[]
  loading: boolean
  onEdit: (pago: VentaPago) => void
  onDelete: (pagoId: number) => void
  isVendido: boolean
  readOnly?: boolean
}

export const PaymentList: React.FC<PaymentListProps> = memo(
  ({ pagos, loading, onEdit, onDelete, isVendido, readOnly = false }) => {
    const columns = useMemo(
      () => [
        {
          title: 'Método de Pago',
          dataIndex: 'metodoPagoNombre',
          key: 'metodoPagoNombre',
          render: (text: string, record: VentaPago) =>
            text || record.metodo_pago || '-',
        },
        {
          title: 'Moneda',
          dataIndex: 'monedaCodigo',
          key: 'monedaCodigo',
          render: (text: string, record: VentaPago) =>
            text || record.moneda_codigo || '-',
        },
        {
          title: 'Monto',
          dataIndex: 'monto',
          key: 'monto',
          render: (monto: number, record: VentaPago) => {
            const monedaCodigo = record.monedaCodigo || record.moneda_codigo
            return formatCurrency(monedaCodigo, monto)
          },
        },
        {
          title: 'Monto en Moneda Venta',
          dataIndex: 'monto_en_moneda_venta',
          key: 'monto_en_moneda_venta',
          render: (
            montoEnMonedaVenta: string | number | undefined,
            record: VentaPago
          ) => {
            // monto_en_moneda_venta siempre está en moneda base (USD)
            // Mostrar monto_en_moneda_venta si está disponible (ya convertido por el backend)
            if (
              montoEnMonedaVenta !== undefined &&
              montoEnMonedaVenta !== null
            ) {
              // monto_en_moneda_venta siempre está en USD (moneda base)
              return formatCurrency('USD', Number(montoEnMonedaVenta))
            }
            // Si no hay monto_en_moneda_venta, mostrar el monto original
            return formatCurrency(
              record.monedaCodigo || record.moneda_codigo,
              record.monto
            )
          },
        },
        {
          title: 'Referencia',
          dataIndex: 'referencia_pago',
          key: 'referencia_pago',
          render: (text: string) => text || '-',
        },
        {
          title: 'Fecha',
          dataIndex: 'fecha',
          key: 'fecha',
          render: (fecha: string) =>
            fecha ? new Date(fecha).toLocaleString('es-GT') : '-',
        },
        {
          title: 'Acciones',
          key: 'actions',
          render: (_: any, record: VentaPago) => (
            <Space size='small'>
              <Button
                type='link'
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                disabled={isVendido}
                size='small'
              >
                Editar
              </Button>
              <Popconfirm
                title='¿Eliminar pago?'
                description='Esta acción no se puede deshacer'
                onConfirm={() => onDelete(record.id)}
                okText='Sí, eliminar'
                cancelText='Cancelar'
                disabled={isVendido}
              >
                <Button
                  type='link'
                  danger
                  icon={<DeleteOutlined />}
                  disabled={isVendido}
                  size='small'
                >
                  Eliminar
                </Button>
              </Popconfirm>
            </Space>
          ),
        },
      ],
      [onEdit, onDelete, isVendido, readOnly]
    )

    return (
      <Table
        columns={columns}
        dataSource={pagos}
        loading={loading}
        rowKey='id'
        pagination={false}
        size='small'
      />
    )
  }
)

PaymentList.displayName = 'PaymentList'
