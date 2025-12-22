import { ColumnConfig } from '../components/DataTable'
import { Tag, Space } from 'antd'
import {
  SwapOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons'

export interface FilterConfig {
  type: 'text' | 'select' | 'dateRange'
  key: string
  placeholder: string
  width: string
  options?: { value: string; label: string }[]
}

export const columns: ColumnConfig[] = [
  {
    key: 'id',
    title: 'ID',
    dataIndex: 'id',
    type: 'text',
    disabled: true,
    render: value => (
      <Space>
        <SwapOutlined style={{ color: '#1890ff' }} />
        <span style={{ fontWeight: 'bold' }}>#{value}</span>
      </Space>
    ),
  },
  {
    key: 'empresa_origen_nombre',
    title: 'Sucursal Origen',
    dataIndex: 'empresa_origen_nombre',
    type: 'text',
    render: (value: string) => (
      <Space>
        <ShopOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontWeight: 500 }}>{value || 'N/A'}</span>
      </Space>
    ),
  },
  {
    key: 'empresa_destino_nombre',
    title: 'Sucursal Destino',
    dataIndex: 'empresa_destino_nombre',
    type: 'text',
    render: (value: string) => (
      <Space>
        <ShopOutlined style={{ color: '#1890ff' }} />
        <span style={{ fontWeight: 500 }}>{value || 'N/A'}</span>
      </Space>
    ),
  },
  {
    key: 'estado',
    title: 'Estado',
    dataIndex: 'estado',
    type: 'select',
    render: (estado: string) => {
      const statusConfig = {
        borrador: {
          color: 'default',
          icon: <FileTextOutlined />,
          text: 'Borrador',
        },
        confirmada: {
          color: 'success',
          icon: <CheckCircleOutlined />,
          text: 'Confirmada',
        },
        cancelada: {
          color: 'error',
          icon: <CloseCircleOutlined />,
          text: 'Cancelada',
        },
      }

      const config =
        statusConfig[estado as keyof typeof statusConfig] ||
        statusConfig.borrador

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
      { value: 'borrador', label: 'Borrador' },
      { value: 'confirmada', label: 'Confirmada' },
      { value: 'cancelada', label: 'Cancelada' },
    ],
  },
  {
    key: 'usuario_nombre',
    title: 'Usuario',
    dataIndex: 'usuario_nombre',
    type: 'text',
    render: (value: string) => (
      <Space>
        <UserOutlined style={{ color: '#722ed1' }} />
        <span style={{ fontWeight: 500 }}>{value || 'N/A'}</span>
      </Space>
    ),
  },
  {
    key: 'fecha',
    title: 'Fecha',
    dataIndex: 'fecha',
    type: 'text',
    render: (value: string) => (
      <Space>
        <CalendarOutlined style={{ color: '#fa8c16' }} />
        <span style={{ fontWeight: 500 }}>{value || 'N/A'}</span>
      </Space>
    ),
  },
  {
    key: 'comentario',
    title: 'Comentario',
    dataIndex: 'comentario',
    type: 'text',
    render: (value: string) => (
      <span
        style={{
          fontStyle: value ? 'normal' : 'italic',
          color: value ? undefined : '#999',
        }}
      >
        {value || 'Sin comentario'}
      </span>
    ),
  },
  {
    key: 'detalles_count',
    title: 'Productos',
    dataIndex: 'detalles',
    type: 'text',
    render: (detalles: any[]) => (
      <Space>
        <span style={{ fontWeight: 'bold' }}>
          {detalles?.length || 0} producto(s)
        </span>
      </Space>
    ),
  },
]

export const filterConfigs: FilterConfig[] = [
  {
    type: 'select' as const,
    key: 'estado',
    placeholder: 'Estado',
    width: '20%',
    options: [
      { value: 'borrador', label: 'Borrador' },
      { value: 'confirmada', label: 'Confirmada' },
      { value: 'cancelada', label: 'Cancelada' },
    ],
  },
  {
    type: 'dateRange' as const,
    key: 'fecha',
    placeholder: 'Fecha',
    width: '20%',
  },
]
