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
    key: 'serie',
    title: 'Serie',
    dataIndex: 'serie',
    type: 'text',
  },
  {
    key: 'descripcion',
    title: 'Descripción',
    dataIndex: 'descripcion',
    type: 'text',
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
        <Badge
          color={colors[categoria]}
          text={(
            categoria.charAt(0).toUpperCase() + categoria.slice(1)
          ).replace(/_/g, ' ')}
        />
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
    title: 'Stock',
    dataIndex: 'stock',
    type: 'text',
    render: (stock: number) => {
      const color = stock > 10 ? '#87d068' : stock > 5 ? '#f5a623' : '#f50'
      return <Badge color={color} text={stock} />
    },
  },
  {
    key: 'precio',
    title: 'Precio Sugerido',
    dataIndex: 'precio',
    type: 'text',
    render: (precio: number) => `Q.${precio}`,
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
    render: (estado: string) => (
      <Badge
        status={estado === 'activo' ? 'success' : 'error'}
        text={estado.charAt(0).toUpperCase() + estado.slice(1)}
      />
    ),
    options: [
      { value: 'activo', label: 'Activo' },
      { value: 'inactivo', label: 'Inactivo' },
    ],
  },
]

export const filterConfigs: FilterConfig[] = [
  {
    type: 'text' as const,
    key: 'descripcion',
    placeholder: 'Descripción',
    width: '25%',
  },
  {
    type: 'text' as const,
    key: 'codigo',
    placeholder: 'Código',
    width: '25%',
  },
  {
    type: 'text' as const,
    key: 'serie',
    placeholder: 'Serie',
    width: '25%',
  },
  {
    type: 'select' as const,
    key: 'categoria',
    placeholder: 'Categoría',
    width: '25%',
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
    width: '25%',
    options: [
      { value: 'activo', label: 'Activado' },
      { value: 'inactivo', label: 'Desactivado' },
    ],
  },
]
