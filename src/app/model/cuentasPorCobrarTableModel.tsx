import { ColumnConfig } from '../components/DataTable'
import { Space, Tag, Badge, Button, Tooltip } from 'antd'
import {
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  BankOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DollarCircleOutlined,
} from '@ant-design/icons'
import { formatCurrency } from '@/app/utils/currency'
import { JSX } from 'react'
// FilterConfig compatible with FilterSection
export interface FilterConfig {
  type: 'text' | 'dateRange' | 'select'
  key: string
  placeholder?: string
  options?: { value: string; label: string }[]
  width?: string | number
}

const getEstadoColor = (estado: string) => {
  const estadoMap: Record<string, { color: string; text: string }> = {
    abierta: { color: 'blue', text: 'Abierta' },
    parcial: { color: 'orange', text: 'Parcial' },
    cancelada: { color: 'green', text: 'Cancelada' },
    vencida: { color: 'red', text: 'Vencida' },
    anulada: { color: 'default', text: 'Anulada' },
  }
  return estadoMap[estado] || { color: 'default', text: estado }
}

const getEstadoPagoColor = (
  estado: 'pendiente' | 'parcial' | 'pagada'
): { color: string; text: string; icon: JSX.Element } => {
  const estadoMap = {
    pendiente: {
      color: 'red',
      text: 'Pendiente',
      icon: <ClockCircleOutlined />,
    },
    parcial: {
      color: 'orange',
      text: 'Parcial',
      icon: <ExclamationCircleOutlined />,
    },
    pagada: {
      color: 'green',
      text: 'Pagada',
      icon: <CheckCircleOutlined />,
    },
  }
  return estadoMap[estado] || estadoMap.pendiente
}

const getAntiguedadColor = (dias: number): string => {
  if (dias <= 30) return 'green'
  if (dias <= 60) return 'orange'
  if (dias <= 90) return 'volcano'
  return 'red'
}

export const CuentasPorCobrarColumns: ColumnConfig[] = [
  {
    key: 'id',
    title: 'ID',
    dataIndex: 'id',
    type: 'text',
    disabled: true,
    render: (value: any) => (
      <Space>
        <FileTextOutlined style={{ color: '#1890ff' }} />
        <span style={{ fontWeight: 'bold', color: '#722ed1' }}>{value}</span>
      </Space>
    ),
  },
  {
    key: 'cliente_nombre',
    title: 'Cliente',
    dataIndex: 'cliente_nombre',
    type: 'text',
    render: (value: any, record: any) => (
      <Space direction='vertical' size='small'>
        <Space>
          <UserOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontWeight: 500 }}>{value}</span>
        </Space>
        {record.cliente_nit && (
          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
            NIT: {record.cliente_nit}
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
    render: (value: any) => (
      <Space>
        <BankOutlined style={{ color: '#1890ff' }} />
        <span style={{ fontWeight: 500 }}>{value}</span>
      </Space>
    ),
  },
  {
    key: 'total',
    title: 'Total',
    dataIndex: 'total',
    type: 'number',
    textAlign: 'right',
    render: (value: any, record: any) => (
      <Space direction='vertical' size='small' style={{ textAlign: 'right' }}>
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
          {formatCurrency(record.moneda_codigo, Number(value))}
        </span>
        <span style={{ fontSize: '11px', color: '#8c8c8c' }}>
          {record.moneda_codigo}
        </span>
      </Space>
    ),
  },
  {
    key: 'saldo',
    title: 'Saldo',
    dataIndex: 'saldo',
    type: 'number',
    textAlign: 'right',
    render: (value: any, record: any) => {
      const saldo = Number(value)
      const isPagada = saldo <= 0
      return (
        <Space direction='vertical' size='small' style={{ textAlign: 'right' }}>
          <span
            style={{
              fontWeight: 'bold',
              fontSize: '14px',
              color: isPagada ? '#52c41a' : '#ff4d4f',
            }}
          >
            {formatCurrency(record.moneda_codigo, saldo)}
          </span>
          {!isPagada && (
            <span style={{ fontSize: '11px', color: '#8c8c8c' }}>
              Pendiente
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
    render: (value: any, record: any) => (
      <Space direction='vertical' size='small' style={{ textAlign: 'right' }}>
        <span style={{ fontWeight: 500, fontSize: '14px', color: '#52c41a' }}>
          {formatCurrency(record.moneda_codigo, Number(value))}
        </span>
      </Space>
    ),
  },
  {
    key: 'dias_antiguedad',
    title: 'Antigüedad',
    dataIndex: 'dias_antiguedad',
    type: 'number',
    textAlign: 'center',
    render: (value: any) => {
      const dias = Number(value)
      const color = getAntiguedadColor(dias)
      let texto = ''
      if (dias === 0) {
        texto = 'Hoy'
      } else if (dias === 1) {
        texto = '1 día'
      } else if (dias < 30) {
        texto = `${dias} días`
      } else if (dias < 365) {
        const meses = Math.floor(dias / 30)
        texto = `${meses} ${meses === 1 ? 'mes' : 'meses'}`
      } else {
        const años = Math.floor(dias / 365)
        texto = `${años} ${años === 1 ? 'año' : 'años'}`
      }

      return (
        <Badge
          count={dias}
          style={{ backgroundColor: color }}
          title={`${dias} días de antigüedad`}
        >
          <Tag
            color={color}
            style={{ borderRadius: '6px', fontWeight: 'bold' }}
          >
            <Space>
              <CalendarOutlined />
              {texto}
            </Space>
          </Tag>
        </Badge>
      )
    },
  },
  {
    key: 'estado_pago_clasificacion',
    title: 'Estado Pago',
    dataIndex: 'estado_pago_clasificacion',
    type: 'select',
    options: [
      { value: 'pendiente', label: 'Pendiente' },
      { value: 'parcial', label: 'Parcial' },
      { value: 'pagada', label: 'Pagada' },
    ],
    render: (value: any) => {
      const estado = getEstadoPagoColor(value)
      return (
        <Tag
          color={estado.color}
          style={{ borderRadius: '6px', fontWeight: 'bold' }}
        >
          <Space>
            {estado.icon}
            {estado.text}
          </Space>
        </Tag>
      )
    },
  },
  {
    key: 'estado',
    title: 'Estado',
    dataIndex: 'estado',
    type: 'select',
    options: [
      { value: 'abierta', label: 'Abierta' },
      { value: 'parcial', label: 'Parcial' },
      { value: 'cancelada', label: 'Cancelada' },
      { value: 'vencida', label: 'Vencida' },
      { value: 'anulada', label: 'Anulada' },
    ],
    render: (value: any) => {
      const estado = getEstadoColor(value)
      return (
        <Tag
          color={estado.color}
          style={{ borderRadius: '6px', fontWeight: 'bold' }}
        >
          {estado.text}
        </Tag>
      )
    },
  },
  {
    key: 'fecha_emision',
    title: 'Fecha Emisión',
    dataIndex: 'fecha_emision',
    type: 'date',
    render: (value: any) => (
      <Space>
        <CalendarOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontWeight: 500 }}>{value}</span>
      </Space>
    ),
  },

  {
    key: 'venta_id',
    title: 'Venta ID',
    dataIndex: 'venta_id',
    type: 'text',
    hidden: true,
    render: (value: any) => (value ? `#${value}` : 'N/A'),
  },
  {
    key: 'abonos',
    title: 'Abonos',
    dataIndex: 'id',
    type: 'action',
    render: (value: any, record: any, actions?: any) => {
      const handleOpenAbonos = () => {
        if (actions?.onOpenAbonos) {
          actions.onOpenAbonos(record)
        }
      }
      return (
        <Tooltip title='Ver y gestionar abonos/pagos'>
          <Button
            type='primary'
            icon={<DollarCircleOutlined />}
            onClick={handleOpenAbonos}
            size='small'
          >
            Abonos
          </Button>
        </Tooltip>
      )
    },
  },
]

export const CuentasPorCobrarFilterConfigs: FilterConfig[] = [
  {
    type: 'text' as const,
    key: 'cliente_nombre',
    placeholder: 'Nombre del cliente',
    width: '25%',
  },
  {
    type: 'text' as const,
    key: 'cliente_nit',
    placeholder: 'NIT del cliente',
    width: '25%',
  },
  {
    type: 'select' as const,
    key: 'estado',
    placeholder: 'Estado',
    width: '25%',
    options: [
      { value: 'abierta', label: 'Abierta' },
      { value: 'parcial', label: 'Parcial' },
      { value: 'cancelada', label: 'Cancelada' },
      { value: 'vencida', label: 'Vencida' },
      { value: 'anulada', label: 'Anulada' },
    ],
  },
  {
    type: 'select' as const,
    key: 'estado_pago_clasificacion',
    placeholder: 'Estado de pago',
    width: '25%',
    options: [
      { value: 'pendiente', label: 'Pendiente' },
      { value: 'parcial', label: 'Parcial' },
      { value: 'pagada', label: 'Pagada' },
    ],
  },
]
