import { ColumnConfig } from '../components/DataTable'
import { Space, Tag } from 'antd'
import {
  ShopOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  GlobalOutlined,
} from '@ant-design/icons'

export interface FilterConfig {
  type: 'text' | 'select'
  key: string
  placeholder: string
  width: string
  options?: { value: string; label: string }[]
}

export const SupplierColumns: ColumnConfig[] = [
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
        <HomeOutlined style={{ color: '#722ed1' }} />
        <span style={{ fontWeight: 500 }}>{value || 'No disponible'}</span>
      </Space>
    ),
  },
  {
    key: 'tipo',
    title: 'Tipo',
    dataIndex: 'tipo',
    type: 'select',
    options: [
      { value: 'nacional', label: 'Nacional' },
      { value: 'internacional', label: 'Internacional' },
    ],
    render: (value: any) => {
      const tipoConfig = {
        nacional: { color: 'green', icon: <HomeOutlined />, text: 'Nacional' },
        internacional: {
          color: 'blue',
          icon: <GlobalOutlined />,
          text: 'Internacional',
        },
      }
      const config =
        tipoConfig[value as keyof typeof tipoConfig] || tipoConfig.nacional

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
    key: 'fecha_registro',
    title: 'Fecha de Registro',
    dataIndex: 'fecha_registro',
    type: 'date',
    hidden: true,
    render: (value: any) => (
      <Space>
        <CalendarOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontWeight: 500 }}>{value}</span>
      </Space>
    ),
  },
]

export const SupplierFilterConfigs: FilterConfig[] = [
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
    type: 'select' as const,
    key: 'tipo',
    placeholder: 'Tipo',
    width: '25%',
    options: [
      { value: 'nacional', label: 'Nacional' },
      { value: 'internacional', label: 'Internacional' },
    ],
  },
]
