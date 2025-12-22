import { ColumnConfig } from '../components/DataTable'
import { Badge, Button, Space, Tag } from 'antd'
import {
  BankOutlined,
  ProductOutlined,
  BarcodeOutlined,
  FileTextOutlined,
  TagOutlined,
  InboxOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { formatCurrency } from '../utils/currency'

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
    render: value => (
      <Space>
        <ProductOutlined style={{ color: '#1890ff' }} />
        <span style={{ fontWeight: 'bold' }}>#{value}</span>
      </Space>
    ),
  },
  {
    key: 'codigo',
    title: 'Código',
    dataIndex: 'codigo',
    type: 'text',
    render: value => (
      <Space>
        <BarcodeOutlined style={{ color: '#722ed1' }} />
        <span style={{ fontWeight: 500 }}>{value}</span>
      </Space>
    ),
  },
  {
    key: 'serie',
    title: 'Serie',
    dataIndex: 'serie',
    type: 'text',
    render: value => (
      <Space>
        <FileTextOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontWeight: 500 }}>{value}</span>
      </Space>
    ),
  },
  {
    key: 'descripcion',
    title: 'Descripción',
    dataIndex: 'descripcion',
    type: 'text',
    render: value => (
      <Space>
        <TagOutlined style={{ color: '#fa8c16' }} />
        <span style={{ fontWeight: 500 }}>{value}</span>
      </Space>
    ),
  },
  {
    key: 'categoria',
    title: 'Categoría',
    dataIndex: 'categoria',
    type: 'select',
    render: (categoria: string) => {
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
      return (
        <Space>
          <TagOutlined style={{ color: colors[categoria] || '#95A5A6' }} />
          <Tag
            color={colors[categoria] || 'default'}
            style={{
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '12px',
            }}
          >
            {(categoria.charAt(0).toUpperCase() + categoria.slice(1)).replace(
              /_/g,
              ' '
            )}
          </Tag>
        </Space>
      )
    },
    options: [
      { value: 'juguete', label: 'Juguete' },
      { value: 'ropa', label: 'Ropa' },
      { value: 'accesorio', label: 'Accesorio' },
      { value: 'artículo_pinata', label: 'Artículo piñata' },
      { value: 'utensilio_cocina', label: 'Utensilio de cocina' },
      { value: 'material_educativo', label: 'Material educativo' },
      { value: 'material_didactico', label: 'Material didáctico' },
      { value: 'otros', label: 'Otros' },
    ],
  },
  {
    key: 'stock',
    title: 'Stock (Sucursal)',
    dataIndex: 'stock',
    type: 'text',
    hidden: true,
    render: (stock: number) => {
      const stockConfig = {
        color: stock > 10 ? '#52c41a' : stock > 5 ? '#faad14' : '#ff4d4f',
        icon:
          stock > 10 ? (
            <CheckCircleOutlined />
          ) : stock > 5 ? (
            <ExclamationCircleOutlined />
          ) : (
            <ExclamationCircleOutlined />
          ),
        text: stock > 10 ? 'Alto' : stock > 5 ? 'Medio' : 'Bajo',
      }

      return (
        <Space>
          <InboxOutlined style={{ color: stockConfig.color }} />
          <span style={{ fontWeight: 'bold', color: stockConfig.color }}>
            {stock}
          </span>
          {stock <= 5 && (
            <Tag
              color='warning'
              style={{ borderRadius: '4px', fontSize: '11px' }}
            >
              {stockConfig.text}
            </Tag>
          )}
        </Space>
      )
    },
  },
  {
    key: 'precio',
    title: 'Precio Sugerido',
    dataIndex: 'precio',
    type: 'text',
    disabled: true,
    render: (precio: number) => (
      <Space>
        <BankOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
          {formatCurrency('VES', precio)}
        </span>
      </Space>
    ),
  },
  {
    key: 'proveedor_id',
    title: 'Proveedor',
    dataIndex: 'proveedor_id',
    type: 'supplier',
    render: (value: any, record: any) => (
      <Space>
        <ShopOutlined style={{ color: '#722ed1' }} />
        <span style={{ fontWeight: 500 }}>
          {record.nombre_proveedor || 'Sin proveedor'}
        </span>
      </Space>
    ),
  },
  {
    key: 'date',
    title: 'Fecha de creación',
    dataIndex: 'fecha_creacion',
    type: 'date',
    hidden: true,
  },
  {
    key: 'estado',
    title: 'Estado',
    dataIndex: 'estado',
    type: 'select',
    render: (estado: string) => {
      const statusConfig = {
        activo: {
          color: 'success',
          icon: <CheckCircleOutlined />,
          text: 'Activo',
        },
        inactivo: {
          color: 'error',
          icon: <ExclamationCircleOutlined />,
          text: 'Inactivo',
        },
      }

      const config =
        statusConfig[estado as keyof typeof statusConfig] || statusConfig.activo

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
      { value: 'activo', label: 'Activo' },
      { value: 'inactivo', label: 'Inactivo' },
    ],
  },
  {
    key: 'acciones_precios',
    title: 'Precios',
    dataIndex: 'acciones_precios',
    type: 'action',
    render: (_: any, record: any, actions: any) => (
      <Space>
        <Button
          type='text'
          icon={<BankOutlined />}
          onClick={() => actions?.onManagePrecios?.(record)}
          title='Gestionar Precios'
        />
      </Space>
    ),
  },
]

export const filterConfigs: FilterConfig[] = [
  {
    type: 'text' as const,
    key: 'descripcion',
    placeholder: 'Descripción',
    width: '20%',
  },
  {
    type: 'text' as const,
    key: 'codigo',
    placeholder: 'Código',
    width: '20%',
  },
  {
    type: 'text' as const,
    key: 'serie',
    placeholder: 'Serie',
    width: '20%',
  },
  {
    type: 'text' as const,
    key: 'nombre_proveedor',
    placeholder: 'Proveedor',
    width: '20%',
  },
  {
    type: 'select' as const,
    key: 'categoria',
    placeholder: 'Categoría',
    width: '20%',
    options: [
      { value: 'juguete', label: 'Juguete' },
      { value: 'ropa', label: 'Ropa' },
      { value: 'accesorio', label: 'Accesorio' },
      { value: 'artículo_pinata', label: 'Artículo piñata' },
      { value: 'utensilio_cocina', label: 'Utensilio de cocina' },
      { value: 'material_educativo', label: 'Material educativo' },
      { value: 'material_didactico', label: 'Material didáctico' },
      { value: 'otros', label: 'Otros' },
    ],
  },
  {
    type: 'select' as const,
    key: 'estado',
    placeholder: 'Estado',
    width: '20%',
    options: [
      { value: 'activo', label: 'Activado' },
      { value: 'inactivo', label: 'Desactivado' },
    ],
  },
]
