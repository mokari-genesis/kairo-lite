import { ColumnConfig } from '../components/DataTable'
import { Space, Tag, Button } from 'antd'
import {
  CalendarOutlined,
  ShopOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  StopOutlined,
} from '@ant-design/icons'
import {
  formatCurrency,
  convertirAMonedaBase,
  obtenerMonedaBase,
} from '../utils/currency'
import { Moneda } from '../api/monedas'
import dayjs from 'dayjs'

export interface FilterConfig {
  type: 'text' | 'select' | 'dateRange'
  key: string
  placeholder: string
  width: string
  options?: { value: string; label: string }[]
}

export const CompraColumns: ColumnConfig[] = [
  {
    key: 'id',
    title: 'ID',
    dataIndex: 'id',
    type: 'text',
    disabled: true,
    render: (value: any) => (
      <Space>
        <span style={{ fontWeight: 'bold', color: '#722ed1' }}>#{value}</span>
      </Space>
    ),
  },
  {
    key: 'fecha',
    title: 'Fecha',
    dataIndex: 'fecha',
    type: 'date',
    render: (value: any) => (
      <Space>
        <CalendarOutlined style={{ color: '#1890ff' }} />
        <span style={{ fontWeight: 500 }}>
          {dayjs(value).format('DD/MM/YYYY')}
        </span>
      </Space>
    ),
  },
  {
    key: 'proveedor_nombre',
    title: 'Proveedor',
    dataIndex: 'proveedor_nombre',
    type: 'text',
    render: (value: any, record: any) => (
      <Space>
        <ShopOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontWeight: 500 }}>{value}</span>
        {record.proveedor_nit && (
          <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
            ({record.proveedor_nit})
          </span>
        )}
      </Space>
    ),
  },
  {
    key: 'total',
    title: 'Total',
    dataIndex: 'total',
    type: 'text',
    render: (value: any, record: any) => (
      <Space>
        <DollarOutlined style={{ color: '#faad14' }} />
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
          {formatCurrency(value, record.moneda_simbolo || '$')}
        </span>
      </Space>
    ),
  },
  {
    key: 'tipo_pago',
    title: 'Tipo',
    dataIndex: 'tipo_pago',
    type: 'select',
    options: [
      { value: 'contado', label: 'Contado' },
      { value: 'credito', label: 'Crédito' },
    ],
    render: (value: any) => {
      if (!value) {
        return <Tag color='default'>No especificado</Tag>
      }
      const tipoConfig = {
        contado: { color: 'green', text: 'Contado' },
        credito: { color: 'blue', text: 'Crédito' },
      }
      const config =
        tipoConfig[value as keyof typeof tipoConfig] || tipoConfig.contado

      return (
        <Tag
          color={config.color}
          style={{ borderRadius: '6px', fontWeight: 'bold' }}
        >
          {config.text}
        </Tag>
      )
    },
  },
  {
    key: 'estado',
    title: 'Estado',
    dataIndex: 'estado',
    type: 'select',
    options: [
      { value: 'registrada', label: 'Registrada' },
      { value: 'anulada', label: 'Anulada' },
    ],
    render: (value: any) => {
      const estadoConfig = {
        registrada: {
          color: 'success',
          icon: <CheckCircleOutlined />,
          text: 'Registrada',
        },
        anulada: {
          color: 'error',
          icon: <CloseCircleOutlined />,
          text: 'Anulada',
        },
      }
      const config =
        estadoConfig[value as keyof typeof estadoConfig] ||
        estadoConfig.registrada

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
  },
  {
    key: 'moneda_codigo',
    title: 'Moneda',
    dataIndex: 'moneda_codigo',
    type: 'text',
    hidden: true,
    render: (value: any) => (
      <Tag color='blue' style={{ borderRadius: '6px' }}>
        {value}
      </Tag>
    ),
  },
  {
    key: 'total_items',
    title: 'Items',
    dataIndex: 'total_items',
    type: 'text',
    hidden: true,
    render: (value: any) => (
      <Space>
        <span style={{ fontWeight: 500 }}>{value || 0}</span>
      </Space>
    ),
  },
  {
    key: 'total_productos',
    title: 'Productos',
    dataIndex: 'total_productos',
    type: 'text',
    hidden: true,
    render: (value: any) => (
      <Space>
        <span style={{ fontWeight: 500 }}>{value || 0}</span>
      </Space>
    ),
  },
]

export const CompraFilterConfigs: FilterConfig[] = [
  {
    type: 'dateRange' as const,
    key: 'fecha',
    placeholder: 'Rango de fechas',
    width: '30%',
  },
  {
    type: 'select' as const,
    key: 'tipo_pago',
    placeholder: 'Tipo de pago',
    width: '20%',
    options: [
      { value: 'contado', label: 'Contado' },
      { value: 'credito', label: 'Crédito' },
    ],
  },
  {
    type: 'select' as const,
    key: 'estado',
    placeholder: 'Estado',
    width: '20%',
    options: [
      { value: 'registrada', label: 'Registrada' },
      { value: 'anulada', label: 'Anulada' },
    ],
  },
]
