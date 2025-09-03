import { ColumnConfig } from '../components/DataTable'
import { Badge } from 'antd'
import { ReactNode } from 'react'

// Define FilterConfig interface since it's not exported
export interface FilterConfig {
  type: 'text' | 'select' | 'dateRange'
  key: string
  placeholder: string
  width: string
  options?: { value: string; label: string }[]
}

export const StockColumns: ColumnConfig[] = [
  {
    key: 'id',
    title: 'ID',
    dataIndex: 'id',
    type: 'text',
    disabled: true,
  },
  {
    key: 'venta_id',
    title: 'ID de Venta',
    dataIndex: 'venta_id',
    type: 'text',
    disabled: true,
    render: (venta_id: number) => {
      return (
        <span
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {venta_id}
        </span>
      )
    },
  },
  {
    key: 'producto',
    title: 'Producto',
    dataIndex: 'producto',
    type: 'text',
    disabled: true,
  },
  {
    key: 'producto_id',
    title: 'Producto ID',
    dataIndex: 'producto_id',
    type: 'text',
    disabled: true,
    render: (venta_id: number) => {
      return (
        <span
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {venta_id}
        </span>
      )
    },
  },
  {
    key: 'codigo_producto',
    title: 'Codigo producto',
    dataIndex: 'codigo_producto',
    type: 'text',
    disabled: true,
    render: (venta_id: number) => {
      return (
        <span
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {venta_id}
        </span>
      )
    },
  },
  {
    key: 'usuario',
    title: 'Usuario',
    dataIndex: 'usuario',
    type: 'text',
    disabled: true,
  },
  {
    key: 'tipo_movimiento',
    title: 'Tipo de movimiento',
    dataIndex: 'tipo_movimiento',
    type: 'select',
    render: (tipo_movimiento: string) => {
      const colors: Record<string, string> = {
        entrada: '#87d068',
        venta: '#108ee9',
        ajuste: '#108ee9',
        salida: '#f50',
        devolucion: '#f50',
      }
      return (
        <Badge
          style={{
            textAlign: 'center',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          color={colors[tipo_movimiento]}
          text={
            tipo_movimiento.charAt(0).toUpperCase() + tipo_movimiento.slice(1)
          }
        />
      )
    },
    options: [
      { value: 'entrada', label: 'Entrada' },
      { value: 'salida', label: 'Salida' },
    ],
  },
  {
    key: 'cantidad',
    title: 'Cantidad movimiento',
    dataIndex: 'cantidad',
    type: 'text',
    render: (venta_id: number) => {
      return (
        <span
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {venta_id}
        </span>
      )
    },
  },
  {
    key: 'stock_actual',
    title: 'Stock actual',
    dataIndex: 'stock_actual',
    type: 'text',
    disabled: true,
    render: (stock: number) => {
      const color = stock > 10 ? '#87d068' : stock > 5 ? '#f5a623' : '#f50'
      return (
        stock && (
          <Badge
            style={{
              textAlign: 'center',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            color={color}
            text={stock}
          />
        )
      )
    },
  },
  {
    key: 'stock_movimiento',
    title: 'Stock antes del movimiento',
    dataIndex: 'stock_movimiento',
    type: 'text',
    disabled: true,
    render: (stock: number) => {
      const color = stock > 10 ? '#87d068' : stock > 5 ? '#f5a623' : '#f50'
      return (
        <Badge
          style={{
            textAlign: 'center',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          color={color}
          text={stock}
        />
      )
    },
  },
  {
    key: 'fecha',
    title: 'Fecha de creación',
    dataIndex: 'fecha',
    type: 'date',
    hidden: true,
  },
  {
    key: 'comentario',
    title: 'Comentario',
    dataIndex: 'comentario',
    type: 'text',
  },
]

export const StockFilterConfigs: FilterConfig[] = [
  {
    type: 'text' as const,
    key: 'producto',
    placeholder: 'Producto',
    width: '25%',
  },
  {
    type: 'text' as const,
    key: 'usuario',
    placeholder: 'Usuario',
    width: '25%',
  },
  {
    type: 'text' as const,
    key: 'codigo_producto',
    placeholder: 'Código producto',
    width: '25%',
  },
  {
    type: 'select' as const,
    key: 'tipo_movimiento',
    placeholder: 'Tipo de movimiento',
    width: '25%',
    options: [
      { value: 'entrada', label: 'Entrada' },
      { value: 'salida', label: 'Salida' },
      { value: 'venta', label: 'Venta' },
      { value: 'ajuste', label: 'Ajuste (Re-stock)' },
    ],
  },
  {
    type: 'dateRange' as const,
    key: 'fecha',
    placeholder: 'Fecha',
    width: '25%',
  },
]
