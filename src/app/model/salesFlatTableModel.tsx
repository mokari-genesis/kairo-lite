import { ColumnConfig } from '../components/DataTable'
import { Badge, Space, Tag } from 'antd'
import { formatCurrency } from '../utils/currency'
import {
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'

export interface FilterConfig {
  type: 'text' | 'select'
  key: string
  placeholder: string
  width: string
  options?: { value: string; label: string }[]
}

export const SalesFlatcolumns: ColumnConfig[] = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    render: value => (
      <Space>
        <ShoppingCartOutlined style={{ color: '#1890ff' }} />
        <span style={{ fontWeight: 'bold' }}>#{value}</span>
      </Space>
    ),
  },
  {
    title: 'Fecha de Venta',
    dataIndex: 'fecha_venta',
    key: 'fecha_venta',
    render: value => (
      <Space>
        <CalendarOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontWeight: 500 }}>{value}</span>
      </Space>
    ),
  },
  {
    title: 'Cliente',
    dataIndex: 'cliente_nombre',
    key: 'cliente_nombre',
    render: value => (
      <Space>
        <UserOutlined style={{ color: '#722ed1' }} />
        <span style={{ fontWeight: 500 }}>{value}</span>
      </Space>
    ),
  },
  {
    title: 'NIT',
    dataIndex: 'cliente_nit',
    key: 'cliente_nit',
    render: value => (
      <Tag color='blue' style={{ borderRadius: '6px' }}>
        {value}
      </Tag>
    ),
  },
  {
    key: 'estado_venta',
    title: 'Estado venta',
    dataIndex: 'estado_venta',
    type: 'select',
    render: (estado_venta: string) => {
      const statusConfig = {
        vendido: {
          color: 'success',
          icon: <CheckCircleOutlined />,
          text: 'Completada',
        },
        cancelado: {
          color: 'error',
          icon: <ExclamationCircleOutlined />,
          text: 'Cancelada',
        },
      }

      const config =
        statusConfig[estado_venta as keyof typeof statusConfig] ||
        statusConfig.vendido

      return (
        <Tag
          color={config.color}
          icon={config.icon}
          style={{
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '12px',
            padding: '4px 8px',
          }}
        >
          {config.text}
        </Tag>
      )
    },
    options: [
      { value: 'vendido', label: 'Vendido' },
      { value: 'cancelado', label: 'Cancelado' },
    ],
  },
  {
    title: 'Total',
    dataIndex: 'total_venta',
    key: 'total_venta',
    render: (total: string) => (
      <Space>
        <DollarOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
          {formatCurrency(undefined, parseFloat(total))}
        </span>
      </Space>
    ),
  },
  {
    title: 'Total Pagado',
    dataIndex: 'total_pagado',
    key: 'total_pagado',
    render: (total: string | number, record: any) => {
      // Calcular total pagado sumando todos los pagos de la venta
      const totalPagado =
        record.pagos?.reduce(
          (sum: number, pago: any) => sum + (pago.monto || 0),
          0
        ) || 0
      return (
        <Space>
          <CheckCircleOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
            {formatCurrency(undefined, Number(totalPagado))}
          </span>
        </Space>
      )
    },
  },
  {
    title: 'Saldo Pendiente',
    dataIndex: 'saldo_pendiente',
    key: 'saldo_pendiente',
    render: (saldo: string | number, record: any) => {
      const total = parseFloat(record.total_venta)
      // Calcular total pagado sumando todos los pagos de la venta
      const totalPagado =
        record.pagos?.reduce(
          (sum: number, pago: any) => sum + (pago.monto || 0),
          0
        ) || 0
      const saldoPendiente = total - Number(totalPagado)
      const isPendiente = saldoPendiente > 0

      return (
        <Space>
          <ClockCircleOutlined
            style={{ color: isPendiente ? '#ff4d4f' : '#52c41a' }}
          />
          <span
            style={{
              color: isPendiente ? '#ff4d4f' : '#52c41a',
              fontWeight: 'bold',
            }}
          >
            {formatCurrency(undefined, saldoPendiente)}
          </span>
          {isPendiente && (
            <Tag
              color='warning'
              style={{ borderRadius: '4px', fontSize: '11px' }}
            >
              Pendiente
            </Tag>
          )}
        </Space>
      )
    },
  },
]

export const SalesFlatfilterConfigs: FilterConfig[] = [
  {
    type: 'text' as const,
    key: 'cliente_nombre',
    placeholder: 'Nombre del Cliente',
    width: '25%',
  },
  {
    type: 'text' as const,
    key: 'cliente_nit',
    placeholder: 'NIT del Cliente',
    width: '25%',
  },
  {
    type: 'text' as const,
    key: 'cliente_email',
    placeholder: 'Email del Cliente',
    width: '25%',
  },
  {
    type: 'select' as const,
    key: 'estado_venta',
    placeholder: 'Estado de Venta',
    width: '20%',
    options: [
      { value: 'vendido', label: 'Vendido' },
      { value: 'cancelado', label: 'Cancelado' },
    ],
  },
  {
    type: 'select' as const,
    key: 'con_saldo_pendiente',
    placeholder: 'Con Saldo Pendiente',
    width: '20%',
    options: [
      { value: 'true', label: 'Sí' },
      { value: 'false', label: 'No' },
    ],
  },
]

const colors: Record<string, string> = {
  juguete: '#FF6B6B',
  ropa: '#4ECDC4',
  accesorio: '#FFD166',
  artículo_pinata: '#FF9F1C',
  utensilio_cocina: '#2EC4B6',
  material_educativo: '#6A4C93',
  material_didactico: '#45B7D1',
  otros: '#95A5A6',
}
export const expandedRowRender = (record: any) => {
  return (
    <div
      style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '12px',
        margin: '8px 0',
        border: '1px solid #e8e8e8',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '2px solid #d9d9d9',
        }}
      >
        <ShoppingCartOutlined
          style={{ fontSize: '20px', color: '#1890ff', marginRight: '8px' }}
        />
        <h4 style={{ margin: 0, color: '#1890ff', fontWeight: 'bold' }}>
          Detalles de Productos ({record.productos?.length || 0} productos)
        </h4>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th
                style={{
                  padding: '12px 8px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  color: '#1890ff',
                  borderBottom: '2px solid #1890ff',
                }}
              >
                Código
              </th>
              <th
                style={{
                  padding: '12px 8px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  color: '#1890ff',
                  borderBottom: '2px solid #1890ff',
                }}
              >
                Descripción
              </th>
              <th
                style={{
                  padding: '12px 8px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  color: '#1890ff',
                  borderBottom: '2px solid #1890ff',
                }}
              >
                Categoría
              </th>
              <th
                style={{
                  padding: '12px 8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: '#1890ff',
                  borderBottom: '2px solid #1890ff',
                }}
              >
                Precio Unitario
              </th>
              <th
                style={{
                  padding: '12px 8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: '#1890ff',
                  borderBottom: '2px solid #1890ff',
                }}
              >
                Cantidad
              </th>
              <th
                style={{
                  padding: '12px 8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: '#1890ff',
                  borderBottom: '2px solid #1890ff',
                }}
              >
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {record.productos?.map((producto: any, index: number) => (
              <tr
                key={producto.detalle_id}
                style={{
                  background: index % 2 === 0 ? '#fafafa' : 'white',
                  transition: 'background-color 0.3s ease',
                }}
              >
                <td
                  style={{
                    padding: '12px 8px',
                    fontWeight: 'bold',
                    color: '#722ed1',
                  }}
                >
                  {producto.codigo}
                </td>
                <td style={{ padding: '12px 8px' }}>{producto.descripcion}</td>
                <td style={{ padding: '12px 8px' }}>
                  <Tag
                    color={colors[producto.categoria] || 'default'}
                    style={{
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      fontSize: '11px',
                    }}
                  >
                    {(
                      producto.categoria.charAt(0).toUpperCase() +
                      producto.categoria.slice(1)
                    ).replace(/_/g, ' ')}
                  </Tag>
                </td>
                <td
                  style={{
                    padding: '12px 8px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: '#52c41a',
                  }}
                >
                  {formatCurrency(undefined, producto.precio_unitario)}
                </td>
                <td
                  style={{
                    padding: '12px 8px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                  }}
                >
                  <Badge count={producto.cantidad} color='#1890ff' />
                </td>
                <td
                  style={{
                    padding: '12px 8px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: '#52c41a',
                    fontSize: '14px',
                  }}
                >
                  {formatCurrency(undefined, producto.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
