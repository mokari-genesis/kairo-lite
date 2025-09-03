import { ColumnConfig } from '../components/DataTable'

export interface FilterConfig {
  type: 'text' | 'select'
  key: string
  placeholder: string
  width: string
  options?: { value: string; label: string }[]
}

export const ClientColumns: ColumnConfig[] = [
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
    key: 'tipo',
    title: 'Tipo cliente',
    dataIndex: 'tipo',
    type: 'select',
    options: [
      { value: 'empresa', label: 'Empresa' },
      { value: 'persona', label: 'Persona' },
    ],
  },
  {
    key: 'nit',
    title: 'Nit',
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
    key: 'fecha_registro',
    title: 'Fecha de registro',
    dataIndex: 'fecha_registro',
    type: 'date',
    hidden: true,
  },
]

export const ClientFilterConfigs: FilterConfig[] = [
  {
    type: 'text' as const,
    key: 'name',
    placeholder: 'Nombre',
    width: '25%',
  },
  {
    type: 'text' as const,
    key: 'nit',
    placeholder: 'Nit',
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
    key: 'type',
    placeholder: 'Tipo cliente',
    width: '25%',
    options: [
      { value: 'empresa', label: 'Empresa' },
      { value: 'persona', label: 'Persona' },
    ],
  },
]
