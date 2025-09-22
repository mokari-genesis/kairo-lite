'use client'
import React from 'react'
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
}

export const PaymentList: React.FC<PaymentListProps> = ({
  pagos,
  loading,
  onEdit,
  onDelete,
  isVendido
}) => {
  const columns = [
    {
      title: 'Método de Pago',
      dataIndex: 'metodoPagoNombre',
      key: 'metodoPagoNombre',
      render: (text: string, record: VentaPago) => 
        text || record.metodo_pago || '-'
    },
    {
      title: 'Moneda',
      dataIndex: 'monedaCodigo',
      key: 'monedaCodigo',
      render: (text: string, record: VentaPago) => 
        text || record.moneda_codigo || '-'
    },
    {
      title: 'Monto',
      dataIndex: 'monto',
      key: 'monto',
      render: (monto: number, record: VentaPago) => 
        formatCurrency(record.monedaCodigo || record.moneda_codigo, monto)
    },
    {
      title: 'Referencia',
      dataIndex: 'referencia_pago',
      key: 'referencia_pago',
      render: (text: string) => text || '-'
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (fecha: string) => 
        fecha ? new Date(fecha).toLocaleString('es-GT') : '-'
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record: VentaPago) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            disabled={isVendido}
            size="small"
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar pago?"
            description="Esta acción no se puede deshacer"
            onConfirm={() => onDelete(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            disabled={isVendido}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={isVendido}
              size="small"
            >
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Table
      columns={columns}
      dataSource={pagos}
      loading={loading}
      rowKey="id"
      pagination={false}
      size="small"
      scroll={{ x: 600 }}
    />
  )
}
