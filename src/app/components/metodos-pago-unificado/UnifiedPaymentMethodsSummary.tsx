'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  Button,
  Space,
  Typography,
  Spin,
  Alert,
  Table,
  Tag,
  Progress,
} from 'antd'
import {
  BankOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  CalendarOutlined,
  TrophyOutlined,
  BarChartOutlined,
  FileOutlined,
} from '@ant-design/icons'
import {
  MetodosPagoUnificadoResumenResponse,
  MetodosPagoUnificadoResumenFilters,
  getMetodosPagoUnificadoResumen,
} from '../../api/metodos-pago-unificado'
import { formatCurrency } from '../../utils/currency'
import { getMetodosPago } from '../../api/metodos-pago'
import { getClients } from '../../api/clients'
import { getMonedas } from '../../api/monedas'

const { Title, Text } = Typography
const { Option } = Select

interface UnifiedPaymentMethodsSummaryProps {
  filters?: Partial<MetodosPagoUnificadoResumenFilters>
  onFiltersChange?: (filters: MetodosPagoUnificadoResumenFilters) => void
  summaryData?: MetodosPagoUnificadoResumenResponse | null
  loading?: boolean
  error?: string | null
}

interface SelectOption {
  value: string | number
  label: string
}

export const UnifiedPaymentMethodsSummary: React.FC<
  UnifiedPaymentMethodsSummaryProps
> = ({
  filters = {},
  onFiltersChange,
  summaryData = null,
  loading = false,
  error = null,
}) => {
  // Use groupBy from filters or default to 'metodo_pago'
  const groupBy = filters.agrupar_por ?? 'metodo_pago'

  const [paymentMethods, setPaymentMethods] = useState<SelectOption[]>([])
  const [clients, setClients] = useState<SelectOption[]>([])
  const [currencies, setCurrencies] = useState<SelectOption[]>([])
  const [localGroupBy, setLocalGroupBy] =
    useState<MetodosPagoUnificadoResumenFilters['agrupar_por']>(groupBy)

  // Effect to sync local groupBy with filters
  useEffect(() => {
    setLocalGroupBy(groupBy)
  }, [filters, groupBy])

  // Helper function to safely access summaryData
  const getSafeSummaryData = () => {
    if (!summaryData) return null
    return {
      data: summaryData.data || [],
      total_general: summaryData.total_general || {
        total_ventas: 0,
        total_monto: 0,
        total_pagado: 0,
        total_pendiente: 0,
        total_cancelado: 0,
      },
    }
  }

  const safeSummaryData = getSafeSummaryData()

  // Load initial data for select options
  useEffect(() => {
    const loadSelectOptions = async () => {
      try {
        const [paymentMethodsData, clientsData, currenciesData] =
          await Promise.all([
            getMetodosPago(),
            getClients({ limit: 1000 }),
            getMonedas(),
          ])

        setPaymentMethods(
          paymentMethodsData.map(method => ({
            value: method.id,
            label: method.nombre,
          }))
        )

        setClients(
          clientsData.map(client => ({
            value: client.id,
            label: `${client.nombre} - ${client.telefono || 'Sin teléfono'}`,
          }))
        )

        setCurrencies(
          currenciesData.map(currency => ({
            value: currency.id,
            label: `${currency.nombre} (${currency.simbolo})`,
          }))
        )
      } catch (error) {
        console.error('Error loading select options:', error)
      }
    }

    loadSelectOptions()
  }, [])

  // No need to load data here - it's handled by the parent component

  // Handle groupBy change
  const handleGroupByChange = useCallback(
    (newGroupBy: MetodosPagoUnificadoResumenFilters['agrupar_por']) => {
      setLocalGroupBy(newGroupBy)
      // Notify parent component about the filter change
      if (onFiltersChange) {
        const newFilters: MetodosPagoUnificadoResumenFilters = {
          ...filters,
          empresa_id: 1,
          agrupar_por: newGroupBy,
        }
        onFiltersChange(newFilters)
      }
    },
    [filters, onFiltersChange]
  )

  const getGroupByLabel = (
    agrupar_por: MetodosPagoUnificadoResumenFilters['agrupar_por']
  ) => {
    const labels = {
      metodo_pago: 'Método de Pago',
      cliente: 'Cliente',
      usuario: 'Usuario',
      moneda: 'Moneda',
      fecha_venta_dia: 'Fecha de Venta (Día)',
      fecha_pago_dia: 'Fecha de Pago (Día)',
    }
    return labels[agrupar_por]
  }

  const getGroupByIcon = (
    agrupar_por: MetodosPagoUnificadoResumenFilters['agrupar_por']
  ) => {
    const icons = {
      metodo_pago: <BankOutlined />,
      cliente: <UserOutlined />,
      usuario: <UserOutlined />,
      moneda: <BankOutlined />,
      fecha_venta_dia: <CalendarOutlined />,
      fecha_pago_dia: <CalendarOutlined />,
    }
    return icons[agrupar_por]
  }

  // Function to get the appropriate key based on groupBy
  // Maps groupBy values to their corresponding data field names
  const getGroupByKey = (
    agrupar_por: MetodosPagoUnificadoResumenFilters['agrupar_por']
  ) => {
    const keyMap = {
      metodo_pago: 'metodo_pago',
      cliente: 'grupo_nombre',
      usuario: 'grupo_nombre',
      moneda: 'grupo_nombre',
      fecha_venta_dia: 'fecha_venta_dia',
      fecha_pago_dia: 'fecha_pago_dia',
    }
    return keyMap[agrupar_por] || 'metodo_pago'
  }

  // Function to get the display value for a record based on groupBy
  // Usage: getGroupByDisplayValue(record, 'cliente') returns record.cliente_nombre
  const getGroupByDisplayValue = (
    record: any,
    agrupar_por: MetodosPagoUnificadoResumenFilters['agrupar_por']
  ) => {
    const key = getGroupByKey(agrupar_por)
    return record[key] || 'Sin datos'
  }

  const getPerformanceColor = (porcentaje: number) => {
    if (porcentaje >= 90) return '#52c41a'
    if (porcentaje >= 70) return '#1890ff'
    if (porcentaje >= 50) return '#faad14'
    return '#ff4d4f'
  }

  const getPerformanceStatus = (porcentaje: number) => {
    if (porcentaje >= 90) return 'Excelente'
    if (porcentaje >= 70) return 'Bueno'
    if (porcentaje >= 50) return 'Regular'
    return 'Bajo'
  }

  const summaryColumns = [
    {
      title: getGroupByLabel(groupBy),
      dataIndex: getGroupByKey(groupBy),
      key: getGroupByKey(groupBy),
      render: (value: string) => (
        <Space>
          {getGroupByIcon(groupBy)}
          <Text strong>{value}</Text>
        </Space>
      ),
    },
    {
      title: 'Ventas',
      dataIndex: 'total_ventas',
      key: 'total_ventas',
      align: 'center' as const,
      sorter: (a: any, b: any) => a.total_ventas - b.total_ventas,
      render: (value: number) => <Tag color='blue'>{value}</Tag>,
    },
    {
      title: 'Monto Total',
      dataIndex: 'total_ventas_monto',
      key: 'total_ventas_monto',
      align: 'right' as const,
      sorter: (a: any, b: any) =>
        parseFloat(a.monto_pago) - parseFloat(b.monto_pago),
      render: (value: string, record: any) => (
        <Text strong>
          {formatCurrency(record.moneda_codigo, parseFloat(value))}
        </Text>
      ),
    },
    // {
    //   title: 'Estado',
    //   dataIndex: 'estado_venta',
    //   key: 'estado_venta',
    //   align: 'right' as const,
    //   sorter: (a: any, b: any) =>
    //     parseFloat(a.estado_venta) - parseFloat(b.estado_venta),
    //   render: (value: string) => {
    //     return (
    //       <Text
    //         style={{ color: value === 'cancelado' ? '#ff4d4f' : '#52c41a' }}
    //       >
    //         {value}
    //       </Text>
    //     )
    //   },
    // },
  ]

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size='large' />
          <div style={{ marginTop: 16 }}>
            <Text>Cargando resumen estadístico...</Text>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <Alert
          message='Error al cargar el resumen'
          description={error}
          type='error'
          showIcon
        />
      </Card>
    )
  }

  return (
    <div>
      {/* Controls */}
      <Card size='small' style={{ marginBottom: 16 }}>
        <Row gutter={16} align='middle'>
          <Col>
            <Space>
              <Text strong>Agrupar por:</Text>
              <Select
                value={localGroupBy}
                onChange={handleGroupByChange}
                style={{ width: 200 }}
                placeholder='Seleccionar agrupación'
              >
                <Option value='metodo_pago'>Método de Pago</Option>
                <Option value='cliente'>Cliente</Option>
                <Option value='usuario'>Usuario</Option>
                <Option value='moneda'>Moneda</Option>
                {/* <Option value='fecha_venta_dia'>Fecha de Venta (Día)</Option>
                <Option value='fecha_pago_dia'>Fecha de Pago (Día)</Option> */}
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* General Statistics */}
      {safeSummaryData && safeSummaryData.total_general && (
        <Card style={{ marginBottom: 16 }}>
          <Title level={4}>
            <BarChartOutlined /> Resumen General
          </Title>
          <Row gutter={16}>
            <Col xs={12} sm={8}>
              <Statistic
                style={{ textAlign: 'center' }}
                title='Total de Ventas'
                value={safeSummaryData.total_general.total_ventas || 0}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={12} sm={8}>
              <Statistic
                style={{ textAlign: 'center' }}
                title='Monto Total'
                value={safeSummaryData.total_general.total_monto || 0}
                precision={2}
                prefix={<BankOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={12} sm={8}>
              <Statistic
                style={{ textAlign: 'center' }}
                title='Total cancelado'
                value={safeSummaryData.total_general.total_cancelado || 0}
                precision={2}
                prefix={<BankOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Detailed Summary Table */}
      {safeSummaryData &&
        safeSummaryData.data &&
        safeSummaryData.data.length > 0 && (
          <Card>
            <Title level={4}>
              <TrophyOutlined /> Detalle por {getGroupByLabel(groupBy)}
            </Title>
            <Table
              columns={summaryColumns}
              dataSource={safeSummaryData.data}
              rowKey={record => {
                const keyField = getGroupByKey(groupBy)
                return (
                  (record as any)[keyField] ||
                  record.metodo_pago_id ||
                  `row-${Math.random()}`
                )
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} de ${total} registros`,
              }}
              scroll={{ x: 800 }}
              size='small'
            />
          </Card>
        )}

      {safeSummaryData &&
        safeSummaryData.data &&
        safeSummaryData.data.length === 0 && (
          <Card>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <FileOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
              <div style={{ marginTop: 16 }}>
                <Text type='secondary'>
                  No hay datos disponibles para los filtros seleccionados
                </Text>
              </div>
            </div>
          </Card>
        )}
    </div>
  )
}
