'use client'

import React, { useState, useMemo } from 'react'
import {
  Table,
  Tag,
  Space,
  Tooltip,
  Button,
  Typography,
  Card,
  Statistic,
  Row,
  Col,
  Badge,
} from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import {
  EyeOutlined,
  PrinterOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import {
  MetodoPagoUnificado,
  MetodosPagoUnificadoResponse,
} from '../../api/metodos-pago-unificado'
import { formatCurrency } from '../../utils/currency'

const { Text, Title } = Typography

interface UnifiedPaymentMethodsTableProps {
  data: MetodosPagoUnificadoResponse
  loading?: boolean
  onViewDetails?: (record: MetodoPagoUnificado) => void
  onPrintTicket?: (record: MetodoPagoUnificado) => void
  onPaginationChange?: (page: number, pageSize: number) => void
  showSummary?: boolean
}

export const UnifiedPaymentMethodsTable: React.FC<
  UnifiedPaymentMethodsTableProps
> = ({
  data,
  loading = false,
  onViewDetails,
  onPrintTicket,
  onPaginationChange,
  showSummary = true,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!data.data || data.data.length === 0) {
      return {
        totalVentas: 0,
        totalMonto: 0,
        totalPagado: 0,
        totalPendiente: 0,
        promedioVenta: 0,
        porcentajePagado: 0,
      }
    }

    const totalVentas = data.data.length
    const totalMonto = data.data.reduce(
      (sum, record) => sum + parseFloat(record.total_venta),
      0
    )
    const totalPagado = data.data.reduce(
      (sum, record) => sum + parseFloat(record.total_pagado_venta),
      0
    )
    const totalPendiente = data.data.reduce(
      (sum, record) => sum + parseFloat(record.saldo_pendiente_venta),
      0
    )
    const promedioVenta = totalVentas > 0 ? totalMonto / totalVentas : 0
    const porcentajePagado =
      totalMonto > 0 ? (totalPagado / totalMonto) * 100 : 0

    return {
      totalVentas,
      totalMonto,
      totalPagado,
      totalPendiente,
      promedioVenta,
      porcentajePagado,
    }
  }, [data.data])

  const getEstadoVentaTag = (estado: string) => {
    const statusMap = {
      pendiente: { color: 'warning', icon: <ClockCircleOutlined /> },
      completada: { color: 'success', icon: <CheckCircleOutlined /> },
      cancelada: { color: 'error', icon: <ExclamationCircleOutlined /> },
      en_proceso: { color: 'processing', icon: <ClockCircleOutlined /> },
    }

    const config =
      statusMap[estado as keyof typeof statusMap] || statusMap.pendiente

    return (
      <Tag color={config.color} icon={config.icon}>
        {estado.toUpperCase()}
      </Tag>
    )
  }

  const getEstadoPagoTag = (estado: string) => {
    const statusMap = {
      pendiente: { color: 'warning' },
      pagado: { color: 'success' },
      parcial: { color: 'processing' },
      cancelado: { color: 'error' },
    }

    const config =
      statusMap[estado as keyof typeof statusMap] || statusMap.pendiente

    return <Tag color={config.color}>{estado.toUpperCase()}</Tag>
  }

  const getPaymentProgressColor = (montoPagado: number, montoTotal: number) => {
    if (montoPagado === 0) return '#ff4d4f'
    if (montoPagado === montoTotal) return '#52c41a'
    if (montoPagado > montoTotal / 2) return '#faad14'
    return '#1890ff'
  }

  const columns: ColumnsType<MetodoPagoUnificado> = [
    {
      title: 'ID Venta',
      dataIndex: 'venta_id',
      key: 'venta_id',
      width: 80,
      sorter: (a, b) => a.venta_id - b.venta_id,
      render: value => <Text code>{value}</Text>,
    },
    {
      title: 'Cliente',
      key: 'cliente',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.cliente_nombre}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.cliente_telefono && `📞 ${record.cliente_telefono}`}
            {record.cliente_email && ` | ✉️ ${record.cliente_email}`}
          </div>
        </div>
      ),
      sorter: (a, b) => a.cliente_nombre.localeCompare(b.cliente_nombre),
    },
    {
      title: 'Usuario',
      dataIndex: 'usuario_nombre',
      key: 'usuario_nombre',
      width: 120,
      render: value => (
        <Space>
          <UserOutlined />
          {value}
        </Space>
      ),
      sorter: (a, b) => a.usuario_nombre.localeCompare(b.usuario_nombre),
    },
    {
      title: 'Método de Pago',
      dataIndex: 'metodo_pago',
      key: 'metodo_pago',
      width: 130,
      sorter: (a, b) => a.metodo_pago.localeCompare(b.metodo_pago),
    },
    {
      title: 'Moneda',
      key: 'moneda',
      width: 100,
      render: (_, record) => (
        <Space>
          <Text>{record.moneda_simbolo}</Text>
          <Text type='secondary' style={{ fontSize: '12px' }}>
            {record.moneda_nombre}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Monto Transaccion',
      dataIndex: 'monto_pago',
      key: 'monto_pago',
      width: 120,
      align: 'right',
      render: (value, record) => (
        <Text strong>
          {formatCurrency(record.moneda_codigo, parseFloat(value))}
        </Text>
      ),
      sorter: (a, b) => parseFloat(a.monto_pago) - parseFloat(b.monto_pago),
    },
    {
      title: 'Monto Pagado',
      dataIndex: 'total_pagado_venta',
      key: 'total_pagado_venta',
      width: 120,
      align: 'right',
      render: (value, record) => (
        <Text
          style={{
            color: getPaymentProgressColor(
              parseFloat(value),
              parseFloat(record.total_venta)
            ),
          }}
        >
          {formatCurrency(record.moneda_codigo, parseFloat(value))}
        </Text>
      ),
      sorter: (a, b) =>
        parseFloat(a.total_pagado_venta) - parseFloat(b.total_pagado_venta),
    },
    {
      title: 'Monto Pendiente',
      dataIndex: 'saldo_pendiente_venta',
      key: 'saldo_pendiente_venta',
      width: 130,
      align: 'right',
      render: (value, record) => (
        <Text type={parseFloat(value) > 0 ? 'danger' : 'success'}>
          {formatCurrency(record.moneda_codigo, parseFloat(value))}
        </Text>
      ),
      sorter: (a, b) =>
        parseFloat(a.saldo_pendiente_venta) -
        parseFloat(b.saldo_pendiente_venta),
    },
    {
      title: 'Progreso',
      key: 'progreso',
      width: 120,
      render: (_, record) => {
        const montoTotal = parseFloat(record.total_venta)
        const montoPagado = parseFloat(record.total_pagado_venta)
        const porcentaje =
          montoTotal > 0 ? Math.round((montoPagado / montoTotal) * 100) : 0

        return (
          <div style={{ width: '100%' }}>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${porcentaje}%`,
                  height: '100%',
                  backgroundColor: getPaymentProgressColor(
                    montoPagado,
                    montoTotal
                  ),
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <Text style={{ fontSize: '12px' }}>{porcentaje}%</Text>
          </div>
        )
      },
    },
    {
      title: 'Estado Venta',
      dataIndex: 'estado_venta',
      key: 'estado_venta',
      width: 120,
      render: value => getEstadoVentaTag(value),
      filters: [
        { text: 'Pendiente', value: 'pendiente' },
        { text: 'Completada', value: 'completada' },
        { text: 'Cancelada', value: 'cancelada' },
        { text: 'En Proceso', value: 'en_proceso' },
      ],
      onFilter: (value, record) => record.estado_venta === value,
    },
    {
      title: 'Estado Pago',
      dataIndex: 'estado_pago',
      key: 'estado_pago',
      width: 120,
      render: value => getEstadoPagoTag(value),
      filters: [
        { text: 'Pendiente', value: 'pendiente' },
        { text: 'Pagado', value: 'pagado' },
        { text: 'Parcial', value: 'parcial' },
        { text: 'Cancelado', value: 'cancelado' },
      ],
      onFilter: (value, record) => record.estado_pago === value,
    },
    {
      title: 'Fecha Venta',
      dataIndex: 'fecha_venta',
      key: 'fecha_venta',
      width: 120,
      render: value => (
        <Space>
          <CalendarOutlined />
          {new Date(value).toLocaleDateString('es-GT')}
        </Space>
      ),
      sorter: (a, b) =>
        new Date(a.fecha_venta).getTime() - new Date(b.fecha_venta).getTime(),
    },
    {
      title: 'Fecha Pago',
      dataIndex: 'fecha_pago',
      key: 'fecha_pago',
      width: 120,
      render: value =>
        value ? (
          <Space>
            <CalendarOutlined />
            {new Date(value).toLocaleDateString('es-GT')}
          </Space>
        ) : (
          <Text type='secondary'>-</Text>
        ),
      sorter: (a, b) => {
        if (!a.fecha_pago && !b.fecha_pago) return 0
        if (!a.fecha_pago) return 1
        if (!b.fecha_pago) return -1
        return (
          new Date(a.fecha_pago).getTime() - new Date(b.fecha_pago).getTime()
        )
      },
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {onViewDetails && (
            <Tooltip title='Ver detalles'>
              <Button
                type='text'
                icon={<EyeOutlined />}
                onClick={() => onViewDetails(record)}
              />
            </Tooltip>
          )}
          {onPrintTicket && (
            <Tooltip title='Imprimir ticket'>
              <Button
                type='text'
                icon={<PrinterOutlined />}
                onClick={() => onPrintTicket(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  const rowSelection: TableProps<MetodoPagoUnificado>['rowSelection'] = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  }

  const pagination = {
    total: data.total,
    pageSize: data.pageSize,
    current: data.page,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) =>
      `${range[0]}-${range[1]} de ${total} registros`,
    pageSizeOptions: ['50', '100', '200', '500'],
    onChange: onPaginationChange,
  }

  return (
    <div>
      {/* Summary Statistics */}
      {showSummary && (
        <Card size='small' style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <Statistic
                title='Total Ventas'
                value={summaryStats.totalVentas}
                prefix={<Badge count={summaryStats.totalVentas} />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title='Monto Total'
                value={summaryStats.totalMonto}
                precision={2}
                prefix={<DollarOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title='Total Pagado'
                value={summaryStats.totalPagado}
                precision={2}
                valueStyle={{ color: '#3f8600' }}
                prefix={<DollarOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title='Total Pendiente'
                value={summaryStats.totalPendiente}
                precision={2}
                valueStyle={{ color: '#cf1322' }}
                prefix={<DollarOutlined />}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col xs={12} sm={6}>
              <Statistic
                title='Promedio por Venta'
                value={summaryStats.promedioVenta}
                precision={2}
                prefix={<DollarOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title='% Pagado'
                value={summaryStats.porcentajePagado}
                precision={1}
                suffix='%'
                valueStyle={{
                  color:
                    summaryStats.porcentajePagado >= 80
                      ? '#3f8600'
                      : summaryStats.porcentajePagado >= 50
                      ? '#faad14'
                      : '#cf1322',
                }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={data.data}
          loading={loading}
          rowKey={record => `${record.venta_id}-${record.metodo_pago_id}`}
          rowSelection={rowSelection}
          pagination={pagination}
          scroll={{ x: 1500 }}
          size='small'
          bordered
        />
      </Card>
    </div>
  )
}
