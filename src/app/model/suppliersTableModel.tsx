import { ColumnConfig } from '../components/DataTable'

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
  },
  {
    key: 'nombre',
    title: 'Nombre',
    dataIndex: 'nombre',
    type: 'text',
  },
  {
    key: 'nit',
    title: 'NIT',
    dataIndex: 'nit',
    type: 'text',
  },
  {
    key: 'email',
    title: 'Email',
    dataIndex: 'email',
    type: 'text',
  },
  {
    key: 'telefono',
    title: 'Teléfono',
    dataIndex: 'telefono',
    type: 'text',
  },
  {
    key: 'direccion',
    title: 'Dirección',
    dataIndex: 'direccion',
    type: 'text',
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
  },
  {
    key: 'fecha_registro',
    title: 'Fecha de registro',
    dataIndex: 'fecha_registro',
    type: 'date',
    hidden: true,
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
