import { ColumnConfig } from '../components/DataTable'
import { Space, Tag } from 'antd'
import {
  UserOutlined,
  MailOutlined,
  CalendarOutlined,
  IdcardOutlined,
  CrownOutlined,
  ShoppingOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'

export interface FilterConfig {
  type: 'text' | 'select'
  key: string
  placeholder: string
  width: string
  options?: { value: string; label: string }[]
}

export const UsuarioColumns: ColumnConfig[] = [
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
        <UserOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontWeight: 500 }}>{value}</span>
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
    key: 'rol',
    title: 'Rol',
    dataIndex: 'rol',
    type: 'select',
    options: [
      { value: 'admin', label: 'Administrador' },
      { value: 'vendedor', label: 'Vendedor' },
      { value: 'bodega', label: 'Bodega' },
      { value: 'master', label: 'Master' },
    ],
    render: (value: any) => {
      const rolConfig = {
        admin: {
          color: 'red',
          icon: <CrownOutlined />,
          text: 'Administrador',
        },
        vendedor: {
          color: 'blue',
          icon: <ShoppingOutlined />,
          text: 'Vendedor',
        },
        bodega: {
          color: 'green',
          icon: <InboxOutlined />,
          text: 'Bodega',
        },
        master: {
          color: 'purple',
          icon: <CrownOutlined />,
          text: 'Master',
        },
      }
      const config =
        rolConfig[value as keyof typeof rolConfig] || rolConfig.vendedor

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
    key: 'activo',
    title: 'Estado',
    dataIndex: 'activo',
    type: 'select',
    options: [
      { value: '1', label: 'Activo' },
      { value: '0', label: 'Inactivo' },
    ],
    render: (value: any) => {
      const isActive = value === 1 || value === '1' || value === true
      return (
        <Tag
          color={isActive ? 'success' : 'error'}
          style={{ borderRadius: '6px', fontWeight: 'bold' }}
        >
          <Space>
            {isActive ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            )}
            {isActive ? 'Activo' : 'Inactivo'}
          </Space>
        </Tag>
      )
    },
  },
  {
    key: 'cognito_id',
    title: 'Cognito ID',
    dataIndex: 'cognito_id',
    type: 'text',
    hidden: true,
    render: (value: any) => (
      <Space>
        <IdcardOutlined style={{ color: '#faad14' }} />
        <span style={{ fontWeight: 500, fontSize: '12px' }}>
          {value ? value.substring(0, 20) + '...' : 'No disponible'}
        </span>
      </Space>
    ),
  },
  {
    key: 'fecha_creacion',
    title: 'Fecha de Creación',
    dataIndex: 'fecha_creacion',
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

export const UsuarioFilterConfigs: FilterConfig[] = [
  {
    type: 'text' as const,
    key: 'nombre',
    placeholder: 'Nombre',
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
    key: 'rol',
    placeholder: 'Rol',
    width: '25%',
    options: [
      { value: 'admin', label: 'Administrador' },
      { value: 'vendedor', label: 'Vendedor' },
      { value: 'bodega', label: 'Bodega' },
      { value: 'master', label: 'Master' },
    ],
  },
  {
    type: 'select' as const,
    key: 'activo',
    placeholder: 'Estado',
    width: '25%',
    options: [
      { value: '1', label: 'Activo' },
      { value: '0', label: 'Inactivo' },
    ],
  },
]
