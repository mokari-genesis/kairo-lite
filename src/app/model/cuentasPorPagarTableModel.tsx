import { ColumnConfig } from '../components/DataTable'
import { Space, Tag, Badge } from 'antd'
import {
  FileTextOutlined,
  TeamOutlined,
  BankOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import { formatCurrency, convertirAMonedaBase } from '@/app/utils/currency'
import { Moneda } from '@/app/api/monedas'
import Link from 'next/link'

export interface FilterConfig {
  type: 'text' | 'dateRange' | 'select'
  key: string
  placeholder?: string
  options?: { value: string | number; label: string }[]
  width?: string | number
}

const estadoColor: Record<string, { color: string; text: string }> = {
  abierta: { color: 'blue', text: 'Abierta' },
  parcial: { color: 'orange', text: 'Parcial' },
  cancelada: { color: 'green', text: 'Cancelada' },
  vencida: { color: 'red', text: 'Vencida' },
  anulada: { color: 'default', text: 'Anulada' },
}

// Función para generar columnas con colores adaptativos al tema
export const getCuentasPorPagarColumns = (
  isDark: boolean = false,
  colorTextSecondary?: string,
  monedaBase?: Moneda | null,
  monedas?: Moneda[]
): ColumnConfig[] => [
  {
    key: 'id',
    title: 'ID',
    dataIndex: 'id',
    type: 'text',
    render: value => (
      <Space>
        <FileTextOutlined style={{ color: '#1890ff' }} />
        <span style={{ fontWeight: 600 }}>{value}</span>
      </Space>
    ),
  },
  {
    key: 'proveedor_nombre',
    title: 'Proveedor',
    dataIndex: 'proveedor_nombre',
    type: 'text',
    render: (value, record) => (
      <Space direction='vertical' size='small'>
        <Space>
          <TeamOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontWeight: 500 }}>{value}</span>
        </Space>
        {record.proveedor_nit && (
          <span
            style={{
              fontSize: 12,
              color: isDark ? colorTextSecondary || '#bfbfbf' : '#8c8c8c',
            }}
          >
            NIT: {record.proveedor_nit}
          </span>
        )}
      </Space>
    ),
  },
  {
    key: 'empresa_nombre',
    title: 'Empresa',
    dataIndex: 'empresa_nombre',
    type: 'text',
    render: value => (
      <Space>
        <BankOutlined style={{ color: '#1890ff' }} />
        <span>{value}</span>
      </Space>
    ),
  },
  {
    key: 'compra_id',
    title: 'ID Compra',
    dataIndex: 'compra_id',
    type: 'text',
    render: (value: any) => {
      if (!value) {
        return (
          <span
            style={{
              color: isDark ? colorTextSecondary || '#bfbfbf' : '#8c8c8c',
            }}
          >
            N/A
          </span>
        )
      }
      return (
        <Link
          href={`/home/compras/${value}`}
          style={{
            color: '#1890ff',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 500,
          }}
          onClick={e => {
            e.stopPropagation()
          }}
        >
          #{value}
          <LinkOutlined style={{ fontSize: '12px' }} />
        </Link>
      )
    },
  },
  {
    key: 'producto_id',
    title: 'ID Producto',
    dataIndex: 'producto_id',
    type: 'text',
    render: value =>
      value ? (
        <Space>
          <FileTextOutlined />
          <span>{value}</span>
        </Space>
      ) : (
        <span style={{ color: isDark ? '#8c8c8c' : '#bfbfbf' }}>N/A</span>
      ),
  },
  {
    key: 'producto_descripcion',
    title: 'Producto',
    dataIndex: 'producto_descripcion',
    type: 'text',
    render: value =>
      value ? (
        <span>{value}</span>
      ) : (
        <span style={{ color: isDark ? '#8c8c8c' : '#bfbfbf' }}>
          Sin producto
        </span>
      ),
  },
  {
    key: 'total',
    title: 'Total',
    dataIndex: 'total',
    type: 'number',
    textAlign: 'right',
    render: (value, record) => {
      // Calcular monto en moneda base si es diferente
      let totalBase = 0
      if (monedaBase && monedas && record.moneda_codigo) {
        const monedaRecord = monedas.find(
          m => m.codigo === record.moneda_codigo
        )
        if (monedaRecord && monedaRecord.codigo !== monedaBase.codigo) {
          try {
            totalBase = convertirAMonedaBase(
              Number(value),
              monedaRecord,
              monedaBase
            )
          } catch (error) {
            console.error('Error converting to base currency:', error)
          }
        }
      }

      return (
        <Space direction='vertical' size='small' style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 600 }}>
            {formatCurrency(record.moneda_codigo, Number(value))}
          </span>
          {monedaBase &&
            record.moneda_codigo !== monedaBase.codigo &&
            totalBase > 0 && (
              <span
                style={{
                  fontSize: 12,
                  color: isDark ? colorTextSecondary || '#bfbfbf' : '#8c8c8c',
                  fontStyle: 'italic',
                }}
              >
                {formatCurrency(monedaBase.codigo, totalBase)} (Moneda base)
              </span>
            )}
          {(!monedaBase || record.moneda_codigo === monedaBase.codigo) && (
            <span
              style={{
                fontSize: 12,
                color: isDark ? colorTextSecondary || '#bfbfbf' : '#8c8c8c',
              }}
            >
              {record.moneda_codigo}
            </span>
          )}
        </Space>
      )
    },
  },
  {
    key: 'saldo',
    title: 'Saldo',
    dataIndex: 'saldo',
    type: 'number',
    textAlign: 'right',
    render: (value, record) => {
      const saldo = Number(value)
      const isPagada = saldo <= 0

      // Calcular saldo en moneda base si es diferente
      let saldoBase = 0
      if (monedaBase && monedas && record.moneda_codigo && saldo > 0) {
        const monedaRecord = monedas.find(
          m => m.codigo === record.moneda_codigo
        )
        if (monedaRecord && monedaRecord.codigo !== monedaBase.codigo) {
          try {
            saldoBase = convertirAMonedaBase(saldo, monedaRecord, monedaBase)
          } catch (error) {
            console.error('Error converting to base currency:', error)
          }
        }
      }

      return (
        <Space direction='vertical' size='small' style={{ textAlign: 'right' }}>
          <span
            style={{ fontWeight: 600, color: isPagada ? '#52c41a' : '#fa541c' }}
          >
            {formatCurrency(record.moneda_codigo, saldo)}
          </span>
          {monedaBase &&
            record.moneda_codigo !== monedaBase.codigo &&
            saldoBase > 0 && (
              <span
                style={{
                  fontSize: 12,
                  color: isDark ? colorTextSecondary || '#bfbfbf' : '#8c8c8c',
                  fontStyle: 'italic',
                }}
              >
                {formatCurrency(monedaBase.codigo, saldoBase)} (Moneda base)
              </span>
            )}
          {(!monedaBase || record.moneda_codigo === monedaBase.codigo) && (
            <span
              style={{
                fontSize: 12,
                color: isDark ? colorTextSecondary || '#bfbfbf' : '#8c8c8c',
              }}
            >
              {isPagada ? 'Pagada' : 'Pendiente'}
            </span>
          )}
        </Space>
      )
    },
  },
  {
    key: 'total_pagado',
    title: 'Pagado',
    dataIndex: 'total_pagado',
    type: 'number',
    textAlign: 'right',
    render: (value, record) => {
      const totalPagado = Number(value)

      // Calcular monto pagado en moneda base si es diferente
      let totalPagadoBase = 0
      if (monedaBase && monedas && record.moneda_codigo && totalPagado > 0) {
        const monedaRecord = monedas.find(
          m => m.codigo === record.moneda_codigo
        )
        if (monedaRecord && monedaRecord.codigo !== monedaBase.codigo) {
          try {
            totalPagadoBase = convertirAMonedaBase(
              totalPagado,
              monedaRecord,
              monedaBase
            )
          } catch (error) {
            console.error('Error converting to base currency:', error)
          }
        }
      }

      return (
        <Space direction='vertical' size='small' style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 500, color: '#52c41a' }}>
            {formatCurrency(record.moneda_codigo, totalPagado)}
          </span>
          {monedaBase &&
            record.moneda_codigo !== monedaBase.codigo &&
            totalPagadoBase > 0 && (
              <span
                style={{
                  fontSize: 12,
                  color: isDark ? colorTextSecondary || '#bfbfbf' : '#8c8c8c',
                  fontStyle: 'italic',
                }}
              >
                {formatCurrency(monedaBase.codigo, totalPagadoBase)} (Moneda base)
              </span>
            )}
        </Space>
      )
    },
  },
  {
    key: 'fecha_emision',
    title: 'Emisión',
    dataIndex: 'fecha_emision',
    type: 'text',
    render: value => (
      <Space>
        <CalendarOutlined />
        <span>{value}</span>
      </Space>
    ),
  },

  {
    key: 'estado',
    title: 'Estado',
    dataIndex: 'estado',
    type: 'text',
    render: value => {
      const data = estadoColor[value] || { color: 'default', text: value }
      return <Tag color={data.color}>{data.text}</Tag>
    },
  },
  {
    key: 'estado_pago_clasificacion',
    title: 'Pago',
    dataIndex: 'estado_pago_clasificacion',
    type: 'text',
    render: value => {
      const color =
        value === 'pagada' ? 'green' : value === 'parcial' ? 'orange' : 'red'
      const icon =
        value === 'pagada' ? <CheckCircleOutlined /> : <DollarOutlined />
      return (
        <Badge
          color={color}
          text={
            <Space>
              {icon}
              <span style={{ textTransform: 'capitalize' }}>{value}</span>
            </Space>
          }
        />
      )
    },
  },
]

// Mantener exportación original para compatibilidad (sin moneda base)
export const CuentasPorPagarColumns = getCuentasPorPagarColumns()

export const CuentasPorPagarFilterConfigs: FilterConfig[] = [
  {
    type: 'text',
    key: 'id',
    placeholder: 'Buscar por ID',
    width: 140,
  },
  {
    type: 'select',
    key: 'estado',
    placeholder: 'Estado',
    width: 140,
    options: [
      { value: 'abierta', label: 'Abierta' },
      { value: 'parcial', label: 'Parcial' },
      { value: 'cancelada', label: 'Cancelada' },
      { value: 'vencida', label: 'Vencida' },
      { value: 'anulada', label: 'Anulada' },
    ],
  },
  {
    type: 'dateRange',
    key: 'fecha_emision',
    placeholder: 'Rango de emisión',
    width: 240,
  },
]
