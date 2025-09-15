import { ColumnConfig } from '../components/DataTable'
import { Badge } from 'antd'

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
  },
  {
    key: 'codigo',
    title: 'Código',
    dataIndex: 'codigo',
    type: 'text',
  },
  {
    key: 'nombre',
    title: 'Nombre',
    dataIndex: 'nombre',
    type: 'text',
  },
  {
    key: 'simbolo',
    title: 'Símbolo',
    dataIndex: 'simbolo',
    type: 'text',
    render: (simbolo: string) => simbolo || '-',
  },
  {
    key: 'decimales',
    title: 'Decimales',
    dataIndex: 'decimales',
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
      { value: 'true', label: 'Activo' },
      { value: 'false', label: 'Inactivo' },
    ],
  },
]

export const filterConfigs: FilterConfig[] = [
  {
    type: 'text' as const,
    key: 'nombre',
    placeholder: 'Nombre de la moneda',
    width: '25%',
  },
  {
    type: 'text' as const,
    key: 'codigo',
    placeholder: 'Código',
    width: '25%',
  },
  {
    type: 'select' as const,
    key: 'activo',
    placeholder: 'Estado',
    width: '25%',
    options: [
      { value: 'true', label: 'Activo' },
      { value: 'false', label: 'Inactivo' },
    ],
  },
]
