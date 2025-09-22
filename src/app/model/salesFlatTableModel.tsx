import { ColumnConfig } from '../components/DataTable'
import { Badge } from 'antd'
import { formatCurrency } from '../utils/currency'

export interface FilterConfig {
  type: 'text' | 'select'
  key: string
  placeholder: string
  width: string
  options?: { value: string; label: string }[]
}

export const SalesFlatcolumns: ColumnConfig[] = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: 'Fecha de Venta',
    dataIndex: 'fecha_venta',
    key: 'fecha_venta',
  },
  {
    title: 'Cliente',
    dataIndex: 'cliente_nombre',
    key: 'cliente_nombre',
  },
  {
    title: 'NIT',
    dataIndex: 'cliente_nit',
    key: 'cliente_nit',
  },
  {
    key: 'estado_venta',
    title: 'Estado venta',
    dataIndex: 'estado_venta',
    type: 'select',
    render: (estado_venta: string) => {
      const colors: Record<string, string> = {
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
      { value: 'vendido', label: 'Vendido' },
      { value: 'cancelado', label: 'Cancelado' },
    ],
  },
  {
    title: 'Total',
    dataIndex: 'total_venta',
    key: 'total_venta',
    render: (total: string) => formatCurrency(undefined, parseFloat(total)),
  },
  {
    title: 'Total Pagado',
    dataIndex: 'total_pagado',
    key: 'total_pagado',
    render: (total: string | number, record: any) => {
      // Calcular total pagado sumando todos los pagos de la venta
      const totalPagado =
        record.pagos?.reduce(
          (sum: number, pago: any) => sum + (pago.monto || 0),
          0
        ) || 0
      return formatCurrency(undefined, Number(totalPagado))
    },
  },
  {
    title: 'Saldo Pendiente',
    dataIndex: 'saldo_pendiente',
    key: 'saldo_pendiente',
    render: (saldo: string | number, record: any) => {
      const total = parseFloat(record.total_venta)
      // Calcular total pagado sumando todos los pagos de la venta
      const totalPagado =
        record.pagos?.reduce(
          (sum: number, pago: any) => sum + (pago.monto || 0),
          0
        ) || 0
      const saldoPendiente = total - Number(totalPagado)
      return (
        <span
          style={{
            color: saldoPendiente > 0 ? '#cf1322' : '#52c41a',
            fontWeight: saldoPendiente > 0 ? 'bold' : 'normal',
          }}
        >
          {formatCurrency(undefined, saldoPendiente)}
        </span>
      )
    },
  },
]

export const SalesFlatfilterConfigs: FilterConfig[] = [
  {
    type: 'text' as const,
    key: 'cliente_nombre',
    placeholder: 'Nombre del Cliente',
    width: '25%',
  },
  {
    type: 'text' as const,
    key: 'cliente_nit',
    placeholder: 'NIT del Cliente',
    width: '25%',
  },
  {
    type: 'text' as const,
    key: 'cliente_email',
    placeholder: 'Email del Cliente',
    width: '25%',
  },
  {
    type: 'select' as const,
    key: 'estado_venta',
    placeholder: 'Estado de Venta',
    width: '20%',
    options: [
      { value: 'vendido', label: 'Vendido' },
      { value: 'cancelado', label: 'Cancelado' },
    ],
  },
  {
    type: 'select' as const,
    key: 'con_saldo_pendiente',
    placeholder: 'Con Saldo Pendiente',
    width: '20%',
    options: [
      { value: 'true', label: 'Sí' },
      { value: 'false', label: 'No' },
    ],
  },
]

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
export const expandedRowRender = (record: any) => {
  return (
    <div
      style={{ padding: '16px', background: '#fafafa', borderRadius: '4px' }}
    >
      <h4>Detalles de Productos</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px', textAlign: 'left' }}>Código</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Descripción</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Categoría</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>
              Precio Unitario
            </th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Cantidad</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {record.productos.map((producto: any) => (
            <tr key={producto.detalle_id}>
              <td style={{ padding: '8px' }}>{producto.codigo}</td>
              <td style={{ padding: '8px' }}>{producto.descripcion}</td>
              <td style={{ padding: '8px' }}>
                {
                  <Badge
                    color={colors[producto.categoria]}
                    text={(
                      producto.categoria.charAt(0).toUpperCase() +
                      producto.categoria.slice(1)
                    ).replace(/_/g, ' ')}
                  />
                }
              </td>
              <td style={{ padding: '8px', textAlign: 'right' }}>
                $.{producto.precio_unitario.toFixed(2)}
              </td>
              <td style={{ padding: '8px', textAlign: 'right' }}>
                {producto.cantidad}
              </td>
              <td style={{ padding: '8px', textAlign: 'right' }}>
                $.{producto.subtotal.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
