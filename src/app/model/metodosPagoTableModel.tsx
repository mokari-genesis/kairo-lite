import { ColumnConfig } from '../components/DataTable'
import { Badge } from 'antd'

export interface FilterConfig {
  type: 'text' | 'select'
  key: string
  placeholder: string
  width: string
  options?: { value: any; label: string }[]
}

export const columns: ColumnConfig[] = [
  {
    key: 'id',
    title: 'ID',
    dataIndex: 'id',
    type: 'text',
    disabled: true,
  },
  {
    key: 'nombre',
    title: 'Nombre',
    dataIndex: 'nombre',
    type: 'text',
  },
  {
    key: 'estado',
    title: 'Estado',
    dataIndex: 'activo',
    type: 'select',
    render: (activo: boolean) => (
      <Badge
        status={activo ? 'success' : 'error'}
        text={activo ? 'Activo' : 'Inactivo'}
      />
    ),
    options: [
      { value: true, label: 'Activo' },
      { value: false, label: 'Inactivo' },
    ],
  },
]

export const filterConfigs: FilterConfig[] = [
  {
    type: 'text' as const,
    key: 'nombre',
    placeholder: 'Nombre del método de pago',
    width: '50%',
  },
  {
    type: 'select' as const,
    key: 'activo',
    placeholder: 'Estado',
    width: '30%',
    options: [
      { value: true, label: 'Activo' },
      { value: false, label: 'Inactivo' },
    ],
  },
]
