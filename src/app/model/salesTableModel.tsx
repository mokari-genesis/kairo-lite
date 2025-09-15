import { ColumnConfig } from '../components/DataTable'
import { Badge } from 'antd'

export interface FilterConfig {
  type: 'text' | 'select' | 'dateRange'
  key: string
  placeholder: string
  width: string
  options?: { value: string; label: string }[]
}

export const Salescolumns: ColumnConfig[] = [
  {
    key: 'id',
    title: 'ID',
    dataIndex: 'id',
    type: 'text',
    disabled: true,
  },
  {
    key: 'id_venta',
    title: 'ID Venta',
    dataIndex: 'id_venta',
    type: 'text',
    disabled: true,
  },
  {
    key: 'cliente_nombre',
    title: 'Cliente',
    dataIndex: 'cliente_nombre',
    type: 'text',
  },
  {
    key: 'fecha_venta',
    title: 'Fecha de venta',
    dataIndex: 'fecha_venta',
    type: 'text',
  },
  {
    key: 'producto_descripcion',
    title: 'Producto vendido',
    dataIndex: 'producto_descripcion',
    type: 'text',
  },
  {
    key: 'estado_venta',
    title: 'Estado venta',
    dataIndex: 'estado_venta',
    type: 'select',
    render: (estado_venta: string) => {
      const colors: Record<string, string> = {
        generado: '#2db7f5',
        vendido: '#87d068',
        cancelado: '#f50',
      }
      return (
        <Badge
          color={colors[estado_venta]}
          text={estado_venta.charAt(0).toUpperCase() + estado_venta.slice(1)}
        />
      )
    },
    options: [
      { value: 'generado', label: 'Generado' },
      { value: 'vendido', label: 'Vendido' },
      { value: 'cancelado', label: 'Cancelado' },
    ],
  },
  {
    key: 'cantidad',
    title: 'Cantidad',
    dataIndex: 'cantidad',
    type: 'text',
    render: (stock: number) => {
      return <Badge color={'#87d068'} text={stock} />
    },
  },
  {
    key: 'metodo_pago',
    title: 'Metodo de pago',
    dataIndex: 'metodo_pago',
    type: 'text',
    render: (metodo_pago: string) => metodo_pago,
  },
  {
    key: 'tipo_precio_aplicado',
    title: 'Tipo de precio aplicado',
    dataIndex: 'tipo_precio_aplicado',
    type: 'text',
    render: (tipo_precio_aplicado: string) => tipo_precio_aplicado,
  },
  {
    key: 'precio_unitario',
    title: 'Precio',
    dataIndex: 'precio_unitario',
    type: 'text',
    render: (precio: number) => `Q.${precio}`,
  },
  {
    key: 'total_venta',
    title: 'Total',
    dataIndex: 'total_venta',
    type: 'text',
  },
]

export const SalesfilterConfigs: FilterConfig[] = [
  {
    type: 'text' as const,
    key: 'producto_descripcion',
    placeholder: 'Descripción Producto',
    width: '20%',
  },
  {
    type: 'text' as const,
    key: 'producto_codigo',
    placeholder: 'Código Producto',
    width: '20%',
  },
  {
    type: 'text' as const,
    key: 'cliente_nombre',
    placeholder: 'Nombre Cliente',
    width: '20%',
  },
  {
    type: 'select' as const,
    key: 'producto_categoria',
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
    key: 'estado_venta',
    placeholder: 'Estado venta',
    width: '20%',
    options: [
      { value: 'generado', label: 'Generado' },
      { value: 'vendido', label: 'Vendido' },
      { value: 'cancelado', label: 'Cancelado' },
    ],
  },
  {
    type: 'select' as const,
    key: 'metodo_pago',
    placeholder: 'Método de Pago',
    width: '20%',
    options: [], // Se llenará dinámicamente
  },
  {
    type: 'select' as const,
    key: 'tipo_precio_aplicado',
    placeholder: 'Tipo de Precio',
    width: '20%',
    options: [
      { value: 'sugerido', label: 'Sugerido' },
      { value: 'mayorista', label: 'Mayorista' },
      { value: 'minorista', label: 'Minorista' },
      { value: 'distribuidores', label: 'Distribuidores' },
      { value: 'especial', label: 'Especial' },
    ],
  },
  {
    type: 'dateRange' as const,
    key: 'fecha_venta',
    placeholder: 'Fecha de Venta',
    width: '20%',
  },
]
