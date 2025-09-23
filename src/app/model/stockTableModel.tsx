import { ColumnConfig } from '../components/DataTable'
import { Badge, Space, Tag } from 'antd'
import { ReactNode } from 'react'
import {
  IdcardOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  BarcodeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  CommentOutlined,
  InboxOutlined,
} from '@ant-design/icons'

// Define FilterConfig interface since it's not exported
export interface FilterConfig {
  type: 'text' | 'select' | 'dateRange'
  key: string
  placeholder: string
  width: string
  options?: { value: string; label: string }[]
}

export const StockColumns: ColumnConfig[] = [
  {
    key: 'id',
    title: 'ID',
    dataIndex: 'id',
    type: 'text',
    disabled: true,
    render: (value: any) => (
      <Space>
        <IdcardOutlined style={{ color: '#1890ff' }} />
        <span style={{ fontWeight: 'bold', color: '#722ed1' }}>{value}</span>
      </Space>
    ),
  },
  {
    key: 'venta_id',
    title: 'ID de Venta',
    dataIndex: 'venta_id',
    type: 'text',
    disabled: true,
    render: (value: any) => (
      <Space>
        <ShoppingCartOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{value}</span>
      </Space>
    ),
  },
  {
    key: 'producto',
    title: 'Producto',
    dataIndex: 'producto',
    type: 'text',
    disabled: true,
    render: (value: any) => (
      <Space>
        <InboxOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontWeight: 500 }}>{value}</span>
      </Space>
    ),
  },
  {
    key: 'producto_id',
    title: 'Producto ID',
    dataIndex: 'producto_id',
    type: 'text',
    disabled: true,
    render: (value: any) => (
      <Space>
        <IdcardOutlined style={{ color: '#faad14' }} />
        <span style={{ fontWeight: 'bold', color: '#722ed1' }}>{value}</span>
      </Space>
    ),
  },
  {
    key: 'codigo_producto',
    title: 'Código Producto',
    dataIndex: 'codigo_producto',
    type: 'text',
    disabled: true,
    render: (value: any) => (
      <Space>
        <BarcodeOutlined style={{ color: '#1890ff' }} />
        <span style={{ fontWeight: 500 }}>{value}</span>
      </Space>
    ),
  },
  {
    key: 'usuario',
    title: 'Usuario',
    dataIndex: 'usuario',
    type: 'text',
    disabled: true,
    render: (value: any) => (
      <Space>
        <UserOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontWeight: 500 }}>{value}</span>
      </Space>
    ),
  },
  {
    key: 'tipo_movimiento',
    title: 'Tipo de Movimiento',
    dataIndex: 'tipo_movimiento',
    type: 'select',
    render: (value: any) => {
      const tipoConfig = {
        entrada: { color: 'green', icon: <ArrowUpOutlined />, text: 'Entrada' },
        salida: { color: 'red', icon: <ArrowDownOutlined />, text: 'Salida' },
        venta: { color: 'blue', icon: <ShoppingCartOutlined />, text: 'Venta' },
        ajuste: { color: 'orange', icon: <InboxOutlined />, text: 'Ajuste' },
        devolucion: {
          color: 'purple',
          icon: <ArrowUpOutlined />,
          text: 'Devolución',
        },
      }
      const config =
        tipoConfig[value as keyof typeof tipoConfig] || tipoConfig.entrada

      return (
        <Tag
          color={config.color}
          style={{ borderRadius: '6px', fontWeight: 'bold' }}
        >
          <Space>
            {config.icon}
            {config.text}
          </Space>
        </Tag>
      )
    },
    options: [
      { value: 'entrada', label: 'Entrada' },
      { value: 'salida', label: 'Salida' },
    ],
  },
  {
    key: 'cantidad',
    title: 'Cantidad',
    dataIndex: 'cantidad',
    type: 'text',
    render: (value: any) => (
      <Space>
        <InboxOutlined style={{ color: '#1890ff' }} />
        <span style={{ fontWeight: 'bold', color: '#722ed1' }}>{value}</span>
      </Space>
    ),
  },
  {
    key: 'stock_actual',
    title: 'Stock Actual',
    dataIndex: 'stock_actual',
    type: 'text',
    disabled: true,
    render: (stock: number) => {
      const stockConfig = {
        color: stock > 10 ? '#52c41a' : stock > 5 ? '#faad14' : '#ff4d4f',
        text: stock > 10 ? 'Alto' : stock > 5 ? 'Medio' : 'Bajo',
      }

      return (
        stock && (
          <Space>
            <InboxOutlined style={{ color: stockConfig.color }} />
            <span style={{ fontWeight: 'bold', color: stockConfig.color }}>
              {stock}
            </span>
            <Tag
              color={
                stockConfig.color === '#52c41a'
                  ? 'success'
                  : stockConfig.color === '#faad14'
                  ? 'warning'
                  : 'error'
              }
              style={{ borderRadius: '4px', fontSize: '11px' }}
            >
              {stockConfig.text}
            </Tag>
          </Space>
        )
      )
    },
  },
  {
    key: 'stock_movimiento',
    title: 'Stock Anterior',
    dataIndex: 'stock_movimiento',
    type: 'text',
    disabled: true,
    render: (stock: number) => {
      const stockConfig = {
        color: stock > 10 ? '#52c41a' : stock > 5 ? '#faad14' : '#ff4d4f',
      }

      return (
        <Space>
          <InboxOutlined style={{ color: stockConfig.color }} />
          <span style={{ fontWeight: 'bold', color: stockConfig.color }}>
            {stock}
          </span>
        </Space>
      )
    },
  },
  {
    key: 'fecha',
    title: 'Fecha de Creación',
    dataIndex: 'fecha',
    type: 'date',
    hidden: true,
    render: (value: any) => (
      <Space>
        <CalendarOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontWeight: 500 }}>{value}</span>
      </Space>
    ),
  },
  {
    key: 'comentario',
    title: 'Comentario',
    dataIndex: 'comentario',
    type: 'text',
    render: (value: any) => (
      <Space>
        <CommentOutlined style={{ color: '#1890ff' }} />
        <span style={{ fontWeight: 500 }}>{value || 'Sin comentario'}</span>
      </Space>
    ),
  },
]

export const StockFilterConfigs: FilterConfig[] = [
  {
    type: 'text' as const,
    key: 'producto',
    placeholder: 'Producto',
    width: '25%',
  },
  {
    type: 'text' as const,
    key: 'usuario',
    placeholder: 'Usuario',
    width: '25%',
  },
  {
    type: 'text' as const,
    key: 'codigo_producto',
    placeholder: 'Código producto',
    width: '25%',
  },
  {
    type: 'select' as const,
    key: 'tipo_movimiento',
    placeholder: 'Tipo de movimiento',
    width: '25%',
    options: [
      { value: 'entrada', label: 'Entrada' },
      { value: 'salida', label: 'Salida' },
      { value: 'venta', label: 'Venta' },
      { value: 'ajuste', label: 'Ajuste (Re-stock)' },
    ],
  },
  {
    type: 'dateRange' as const,
    key: 'fecha',
    placeholder: 'Fecha',
    width: '25%',
  },
]
