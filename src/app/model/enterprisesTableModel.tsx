import { ColumnConfig } from '../components/DataTable'
import { Space, Tag } from 'antd'
import {
  ShopOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  IdcardOutlined,
} from '@ant-design/icons'

export interface FilterConfig {
  type: 'text' | 'select'
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
    render: (value: any) => (
      <Space>
        <IdcardOutlined style={{ color: '#1890ff' }} />
        <span style={{ fontWeight: 'bold', color: '#722ed1' }}>#{value}</span>
      </Space>
    ),
  },
  {
    key: 'nombre',
    title: 'Nombre',
    dataIndex: 'nombre',
    type: 'text',
    render: (value: any) => (
      <Space>
        <ShopOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontWeight: 500 }}>{value}</span>
      </Space>
    ),
  },
  {
    key: 'nit',
    title: 'NIT',
    dataIndex: 'nit',
    type: 'text',
    render: (value: any) => (
      <Space>
        <IdcardOutlined style={{ color: '#faad14' }} />
        <span style={{ fontWeight: 500 }}>{value || 'No disponible'}</span>
      </Space>
    ),
  },
  {
    key: 'email',
    title: 'Email',
    dataIndex: 'email',
    type: 'text',
    render: (value: any) => (
      <Space>
        <MailOutlined style={{ color: '#1890ff' }} />
        <span style={{ fontWeight: 500 }}>{value || 'No disponible'}</span>
      </Space>
    ),
  },
  {
    key: 'telefono',
    title: 'Teléfono',
    dataIndex: 'telefono',
    type: 'text',
    render: (value: any) => (
      <Space>
        <PhoneOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontWeight: 500 }}>{value || 'No disponible'}</span>
      </Space>
    ),
  },
  {
    key: 'direccion',
    title: 'Dirección',
    dataIndex: 'direccion',
    type: 'text',
    render: (value: any) => (
      <Space>
        <HomeOutlined style={{ color: '#fa8c16' }} />
        <span style={{ fontWeight: 500 }}>{value || 'No disponible'}</span>
      </Space>
    ),
  },
]

export const filterConfigs: FilterConfig[] = [
  {
    type: 'text' as const,
    key: 'nombre',
    placeholder: 'Nombre',
    width: '25%',
  },
  {
    type: 'text' as const,
    key: 'nit',
    placeholder: 'NIT',
    width: '25%',
  },
  {
    type: 'text' as const,
    key: 'email',
    placeholder: 'Email',
    width: '25%',
  },
  {
    type: 'text' as const,
    key: 'telefono',
    placeholder: 'Teléfono',
    width: '25%',
  },
]
