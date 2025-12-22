import { ColumnConfig } from '../components/DataTable'
import { Space, Tag, Badge } from 'antd'
import {
  FileTextOutlined,
  TeamOutlined,
  BankOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { formatCurrency } from '@/app/utils/currency'

export interface FilterConfig {
  type: 'text' | 'dateRange' | 'select'
  key: string
  placeholder?: string
  options?: { value: string | number; label: string }[]
  width?: string | number
}

const estadoColor: Record<string, { color: string; text: string }> = {
  abierta: { color: 'blue', text: 'Abierta' },
  parcial: { color: 'orange', text: 'Parcial' },
  cancelada: { color: 'green', text: 'Cancelada' },
  vencida: { color: 'red', text: 'Vencida' },
  anulada: { color: 'default', text: 'Anulada' },
}

export const CuentasPorPagarColumns: ColumnConfig[] = [
  {
    key: 'id',
    title: 'ID',
    dataIndex: 'id',
    type: 'text',
    render: value => (
      <Space>
        <FileTextOutlined style={{ color: '#1890ff' }} />
        <span style={{ fontWeight: 600 }}>{value}</span>
      </Space>
    ),
  },
  {
    key: 'proveedor_nombre',
    title: 'Proveedor',
    dataIndex: 'proveedor_nombre',
    type: 'text',
    render: (value, record) => (
      <Space direction='vertical' size='small'>
        <Space>
          <TeamOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontWeight: 500 }}>{value}</span>
        </Space>
        {record.proveedor_nit && (
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            NIT: {record.proveedor_nit}
          </span>
        )}
      </Space>
    ),
  },
  {
    key: 'empresa_nombre',
    title: 'Empresa',
    dataIndex: 'empresa_nombre',
    type: 'text',
    render: value => (
      <Space>
        <BankOutlined style={{ color: '#1890ff' }} />
        <span>{value}</span>
      </Space>
    ),
  },
  {
    key: 'producto_id',
    title: 'ID Producto',
    dataIndex: 'producto_id',
    type: 'text',
    render: value =>
      value ? (
        <Space>
          <FileTextOutlined />
          <span>{value}</span>
        </Space>
      ) : (
        <span style={{ color: '#bfbfbf' }}>N/A</span>
      ),
  },
  {
    key: 'producto_descripcion',
    title: 'Producto',
    dataIndex: 'producto_descripcion',
    type: 'text',
    render: value =>
      value ? (
        <span>{value}</span>
      ) : (
        <span style={{ color: '#bfbfbf' }}>Sin producto</span>
      ),
  },
  {
    key: 'total',
    title: 'Total',
    dataIndex: 'total',
    type: 'number',
    textAlign: 'right',
    render: (value, record) => (
      <Space direction='vertical' size='small' style={{ textAlign: 'right' }}>
        <span style={{ fontWeight: 600 }}>
          {formatCurrency(record.moneda_codigo, Number(value))}
        </span>
        <span style={{ fontSize: 12, color: '#8c8c8c' }}>
          {record.moneda_codigo}
        </span>
      </Space>
    ),
  },
  {
    key: 'saldo',
    title: 'Saldo',
    dataIndex: 'saldo',
    type: 'number',
    textAlign: 'right',
    render: (value, record) => {
      const saldo = Number(value)
      const isPagada = saldo <= 0
      return (
        <Space direction='vertical' size='small' style={{ textAlign: 'right' }}>
          <span
            style={{ fontWeight: 600, color: isPagada ? '#52c41a' : '#fa541c' }}
          >
            {formatCurrency(record.moneda_codigo, saldo)}
          </span>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            {isPagada ? 'Pagada' : 'Pendiente'}
          </span>
        </Space>
      )
    },
  },
  {
    key: 'total_pagado',
    title: 'Pagado',
    dataIndex: 'total_pagado',
    type: 'number',
    textAlign: 'right',
    render: (value, record) => (
      <Space direction='vertical' size='small' style={{ textAlign: 'right' }}>
        <span style={{ fontWeight: 500, color: '#52c41a' }}>
          {formatCurrency(record.moneda_codigo, Number(value))}
        </span>
      </Space>
    ),
  },
  {
    key: 'fecha_emision',
    title: 'Emisión',
    dataIndex: 'fecha_emision',
    type: 'text',
    render: value => (
      <Space>
        <CalendarOutlined />
        <span>{value}</span>
      </Space>
    ),
  },

  {
    key: 'estado',
    title: 'Estado',
    dataIndex: 'estado',
    type: 'text',
    render: value => {
      const data = estadoColor[value] || { color: 'default', text: value }
      return <Tag color={data.color}>{data.text}</Tag>
    },
  },
  {
    key: 'estado_pago_clasificacion',
    title: 'Pago',
    dataIndex: 'estado_pago_clasificacion',
    type: 'text',
    render: value => {
      const color =
        value === 'pagada' ? 'green' : value === 'parcial' ? 'orange' : 'red'
      const icon =
        value === 'pagada' ? <CheckCircleOutlined /> : <DollarOutlined />
      return (
        <Badge
          color={color}
          text={
            <Space>
              {icon}
              <span style={{ textTransform: 'capitalize' }}>{value}</span>
            </Space>
          }
        />
      )
    },
  },
]

export const CuentasPorPagarFilterConfigs: FilterConfig[] = [
  {
    type: 'select',
    key: 'estado',
    placeholder: 'Estado',
    width: 140,
    options: [
      { value: 'abierta', label: 'Abierta' },
      { value: 'parcial', label: 'Parcial' },
      { value: 'cancelada', label: 'Cancelada' },
      { value: 'vencida', label: 'Vencida' },
      { value: 'anulada', label: 'Anulada' },
    ],
  },
  {
    type: 'dateRange',
    key: 'fecha_emision',
    placeholder: 'Rango de emisión',
    width: 240,
  },
]
