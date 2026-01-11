/**
 *  REPORTES2 - VENTAS PAGE
 * */
'use client'
import '../../../globals.css'
import '@ant-design/v5-patch-for-react-19'
import { DataTable } from '../../../components/DataTable'
import { FilterSection } from '../../../components/FilterSection'
import { PageHeader } from '../../../components/PageHeader'
import { withAuth } from '../../../auth/withAuth'
import { useEffect, useState, useMemo } from 'react'
import { useEmpresa } from '../../../empresaContext'
import { formatCurrency, obtenerMonedaBase } from '@/app/utils/currency'
import { getMonedas, Moneda } from '@/app/api/monedas'
import {
  getReporteVentasResumen,
  getReporteVentasPorVendedor,
  getReporteVentasPorCliente,
  getReporteVentasPorMetodoPago,
  getReporteVentasPorProducto,
} from '@/app/api/reportes2'
import {
  Card,
  message,
  Space,
  Button,
  Row,
  Col,
  Select,
  Typography,
  Divider,
  Statistic,
  Tag,
} from 'antd'
import { motion } from 'framer-motion'
import {
  FileTextOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  BankOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'

const { Title, Text } = Typography
const { Option } = Select

function Reportes2VentasPage() {
  const { empresaId } = useEmpresa()
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<string>('resumen')
  const [columns, setColumns] = useState<any[]>([])
  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [monedaBase, setMonedaBase] = useState<Moneda | null>(null)

  const reportTypes = [
    {
      key: 'resumen',
      title: 'Resumen de Ventas',
      description: 'Ventas por período y estado',
      icon: <BarChartOutlined />,
    },
    {
      key: 'por-vendedor',
      title: 'Ventas por Vendedor',
      description: 'Agrupado por vendedor',
      icon: <UserOutlined />,
    },
    {
      key: 'por-cliente',
      title: 'Ventas por Cliente',
      description: 'Top clientes y análisis',
      icon: <ShoppingCartOutlined />,
    },
    {
      key: 'por-metodo-pago',
      title: 'Ventas por Método de Pago',
      description: 'Agrupado por método de pago',
      icon: <BankOutlined />,
    },
    {
      key: 'por-producto',
      title: 'Ventas por Producto',
      description: 'Análisis de ventas por producto',
      icon: <FileTextOutlined />,
    },
  ]

  const getResumenColumns = () => {
    const baseColumns = [
      {
        key: 'id',
        title: 'ID',
        dataIndex: 'id',
        type: 'text',
      },
      ...(empresaId === null
        ? [
            {
              key: 'empresa_nombre',
              title: 'Sucursal',
              dataIndex: 'empresa_nombre',
              type: 'text',
            },
          ]
        : []),
      {
        key: 'fecha_venta',
        title: 'Fecha',
        dataIndex: 'fecha_venta',
        type: 'text',
      },
    ]
    return [
      ...baseColumns,
      {
        key: 'cliente_nombre',
        title: 'Cliente',
        dataIndex: 'cliente_nombre',
        type: 'text',
      },
      {
        key: 'usuario_nombre',
        title: 'Vendedor',
        dataIndex: 'usuario_nombre',
        type: 'text',
      },
      {
        key: 'total_venta',
        title: 'Total Venta',
        dataIndex: 'total_venta',
        type: 'text',
        render: (value: number) => formatCurrency(undefined, value),
      },
      {
        key: 'total_pagado',
        title: 'Pagado',
        dataIndex: 'total_pagado',
        type: 'text',
        render: (value: number) => formatCurrency(undefined, value),
      },
      {
        key: 'saldo_pendiente',
        title: 'Saldo',
        dataIndex: 'saldo_pendiente',
        type: 'text',
        render: (value: number) => (
          <span style={{ color: value > 0 ? '#ff4d4f' : '#52c41a' }}>
            {formatCurrency(undefined, value)}
          </span>
        ),
      },
      {
        key: 'estado_venta',
        title: 'Estado',
        dataIndex: 'estado_venta',
        type: 'text',
        render: (estado: string) => (
          <Tag color={estado === 'vendido' ? 'success' : 'error'}>{estado}</Tag>
        ),
      },
    ]
  }

  // resumenColumns se obtiene dinámicamente con getResumenColumns()

  const porVendedorColumns = [
    {
      key: 'usuario_nombre',
      title: 'Vendedor',
      dataIndex: 'usuario_nombre',
      type: 'text',
    },
    {
      key: 'cantidad_ventas',
      title: 'Cantidad Ventas',
      dataIndex: 'cantidad_ventas',
      type: 'text',
    },
    {
      key: 'total_vendido',
      title: 'Total Vendido',
      dataIndex: 'total_vendido',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
    {
      key: 'total_pagado',
      title: 'Total Pagado',
      dataIndex: 'total_pagado',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
    {
      key: 'saldo_pendiente',
      title: 'Saldo Pendiente',
      dataIndex: 'saldo_pendiente',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
    {
      key: 'ticket_promedio',
      title: 'Ticket Promedio',
      dataIndex: 'ticket_promedio',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
  ]

  const porClienteColumns = [
    {
      key: 'cliente_nombre',
      title: 'Cliente',
      dataIndex: 'cliente_nombre',
      type: 'text',
    },
    {
      key: 'cliente_nit',
      title: 'NIT',
      dataIndex: 'cliente_nit',
      type: 'text',
    },
    {
      key: 'numero_ventas',
      title: 'Número Ventas',
      dataIndex: 'numero_ventas',
      type: 'text',
    },
    {
      key: 'total_vendido',
      title: 'Total Vendido',
      dataIndex: 'total_vendido',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
    {
      key: 'promedio_ticket',
      title: 'Ticket Promedio',
      dataIndex: 'promedio_ticket',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
    {
      key: 'saldo_pendiente_acumulado',
      title: 'Saldo Pendiente',
      dataIndex: 'saldo_pendiente_acumulado',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
  ]

  const porMetodoPagoColumns = [
    {
      key: 'metodo_pago_nombre',
      title: 'Método de Pago',
      dataIndex: 'metodo_pago_nombre',
      type: 'text',
    },
    {
      key: 'moneda_codigo',
      title: 'Moneda',
      dataIndex: 'moneda_codigo',
      type: 'text',
    },
    {
      key: 'total_ventas',
      title: 'Total Ventas',
      dataIndex: 'total_ventas',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
    {
      key: 'total_monto_original',
      title: 'Monto Original',
      dataIndex: 'total_monto_original',
      type: 'text',
      render: (value: number | null, record: any) => {
        if (value === null || value === undefined) {
          return '-'
        }
        return formatCurrency(record.moneda_codigo, value)
      },
    },
    {
      key: 'numero_ventas',
      title: 'Número Ventas',
      dataIndex: 'numero_ventas',
      type: 'text',
    },
  ]

  const porProductoColumns = [
    {
      key: 'producto_codigo',
      title: 'Código Producto',
      dataIndex: 'producto_codigo',
      type: 'text',
    },
    {
      key: 'producto_descripcion',
      title: 'Descripción',
      dataIndex: 'producto_descripcion',
      type: 'text',
    },
    {
      key: 'categoria',
      title: 'Categoría',
      dataIndex: 'categoria',
      type: 'text',
    },
    {
      key: 'cantidad_vendida',
      title: 'Cantidad Vendida',
      dataIndex: 'cantidad_vendida',
      type: 'text',
      align: 'right' as const,
    },
    {
      key: 'numero_ventas',
      title: 'Número de Ventas',
      dataIndex: 'numero_ventas',
      type: 'text',
      align: 'right' as const,
    },
    {
      key: 'total_vendido',
      title: 'Total Vendido',
      dataIndex: 'total_vendido',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },

    {
      key: 'fecha_primera_venta',
      title: 'Primera Venta',
      dataIndex: 'fecha_primera_venta',
      type: 'text',
      render: (value: string) => {
        if (!value) return '-'
        return new Date(value).toLocaleDateString('es-ES')
      },
    },
    {
      key: 'fecha_ultima_venta',
      title: 'Última Venta',
      dataIndex: 'fecha_ultima_venta',
      type: 'text',
      render: (value: string) => {
        if (!value) return '-'
        return new Date(value).toLocaleDateString('es-ES')
      },
    },
  ]

  const handleReportChange = (value: string) => {
    setSelectedReport(value)
    setColumns(getColumnsForReport(value))
    fetchData(value)
  }

  const getColumnsForReport = (reportType: string) => {
    switch (reportType) {
      case 'resumen':
        return getResumenColumns()
      case 'por-vendedor':
        return porVendedorColumns
      case 'por-cliente':
        return porClienteColumns
      case 'por-metodo-pago':
        return porMetodoPagoColumns
      case 'por-producto':
        return porProductoColumns
      default:
        return getResumenColumns()
    }
  }

  const fetchData = async (reportType: string = selectedReport) => {
    try {
      setLoading(true)
      let result: any[] = []

      // Si empresaId es null, no pasamos empresa_id para obtener todas las sucursales
      const filtersWithEmpresa = {
        ...filters,
        ...(empresaId ? { empresa_id: empresaId } : {}),
      }

      switch (reportType) {
        case 'resumen':
          result = await getReporteVentasResumen(filtersWithEmpresa)
          break
        case 'por-vendedor':
          result = await getReporteVentasPorVendedor(filtersWithEmpresa)
          break
        case 'por-cliente':
          result = await getReporteVentasPorCliente(filtersWithEmpresa)
          break
        case 'por-metodo-pago':
          result = await getReporteVentasPorMetodoPago(filtersWithEmpresa)
          break
        case 'por-producto':
          result = await getReporteVentasPorProducto(filtersWithEmpresa)
          break
        default:
          result = await getReporteVentasResumen(filtersWithEmpresa)
      }

      setData(result)
    } catch (error) {
      console.error('Error fetching report data:', error)
      message.error('Error al cargar el reporte')
    } finally {
      setLoading(false)
    }
  }

  // Cargar monedas al montar el componente
  useEffect(() => {
    const loadMonedas = async () => {
      try {
        const monedasData = await getMonedas()
        setMonedas(monedasData)
        const base = obtenerMonedaBase(monedasData)
        if (base) {
          setMonedaBase(base)
        }
      } catch (error) {
        console.error('Error loading monedas:', error)
      }
    }
    loadMonedas()
  }, [])

  useEffect(() => {
    setColumns(getColumnsForReport(selectedReport))
    fetchData()
  }, [filters, empresaId, selectedReport])

  const reportStats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalVentas: 0,
        numeroVentas: 0,
        ticketPromedio: 0,
        totalPagado: 0,
        saldoPendiente: 0,
        porcentajeCobranza: 0,
      }
    }

    if (selectedReport === 'resumen') {
      const totalVentas = data.reduce(
        (sum, record) => sum + Number(record.total_venta || 0),
        0
      )
      const totalPagado = data.reduce(
        (sum, record) => sum + Number(record.total_pagado || 0),
        0
      )
      const saldoPendiente = data.reduce(
        (sum, record) => sum + Number(record.saldo_pendiente || 0),
        0
      )
      const numeroVentas = data.length
      const ticketPromedio = numeroVentas > 0 ? totalVentas / numeroVentas : 0
      const porcentajeCobranza =
        totalVentas > 0 ? (totalPagado / totalVentas) * 100 : 0

      return {
        totalVentas,
        numeroVentas,
        ticketPromedio,
        totalPagado,
        saldoPendiente,
        porcentajeCobranza,
      }
    } else if (selectedReport === 'por-vendedor') {
      const totalVendido = data.reduce(
        (sum, record) => sum + Number(record.total_vendido || 0),
        0
      )
      const totalPagado = data.reduce(
        (sum, record) => sum + Number(record.total_pagado || 0),
        0
      )
      const saldoPendiente = data.reduce(
        (sum, record) => sum + Number(record.saldo_pendiente || 0),
        0
      )
      const cantidadVentas = data.reduce(
        (sum, record) => sum + Number(record.cantidad_ventas || 0),
        0
      )
      const ticketPromedio =
        cantidadVentas > 0 ? totalVendido / cantidadVentas : 0

      return {
        totalVentas: totalVendido,
        numeroVentas: cantidadVentas,
        ticketPromedio,
        totalPagado,
        saldoPendiente,
        porcentajeCobranza:
          totalVendido > 0 ? (totalPagado / totalVendido) * 100 : 0,
      }
    } else if (selectedReport === 'por-cliente') {
      const totalVendido = data.reduce(
        (sum, record) => sum + Number(record.total_vendido || 0),
        0
      )
      const numeroVentas = data.reduce(
        (sum, record) => sum + Number(record.numero_ventas || 0),
        0
      )
      const ticketPromedio = numeroVentas > 0 ? totalVendido / numeroVentas : 0
      const saldoPendiente = data.reduce(
        (sum, record) => sum + Number(record.saldo_pendiente_acumulado || 0),
        0
      )

      return {
        totalVentas: totalVendido,
        numeroVentas,
        ticketPromedio,
        totalPagado: totalVendido - saldoPendiente,
        saldoPendiente,
        porcentajeCobranza:
          totalVendido > 0
            ? ((totalVendido - saldoPendiente) / totalVendido) * 100
            : 0,
      }
    }

    return {
      totalVentas: 0,
      numeroVentas: 0,
      ticketPromedio: 0,
      totalPagado: 0,
      saldoPendiente: 0,
      porcentajeCobranza: 0,
    }
  }, [data, selectedReport])

  const handleExportExcel = () => {
    const reportType = reportTypes.find(r => r.key === selectedReport)
    const fileName = `reportes2_ventas_${reportType?.title
      .toLowerCase()
      .replace(/\s+/g, '_')}.xlsx`

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      reportType?.title || 'Reporte'
    )
    XLSX.writeFile(workbook, fileName)
    message.success('Reporte exportado exitosamente')
  }

  const onFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  const getFilterConfigs = () => {
    const baseFilters = [
      {
        type: 'dateRange' as const,
        key: 'fecha',
        placeholder: 'Rango de fechas',
        width: '30%',
      },
    ]

    // Agregar filtro de categoría solo para el reporte por producto
    if (selectedReport === 'por-producto') {
      return [
        ...baseFilters,
        {
          type: 'text' as const,
          key: 'categoria',
          placeholder: 'Categoría',
          width: '25%',
        },
      ]
    }

    return baseFilters
  }

  const filterConfigs = getFilterConfigs()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '24px' }}
    >
      <Card
        variant='outlined'
        style={{
          borderRadius: '15px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <PageHeader
          title='Reportes Avanzados de Ventas'
          showNewButton={false}
        />

        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <Title level={4}>Seleccionar Tipo de Reporte</Title>
            <Select
              style={{ width: '100%', marginBottom: '5px', height: '75px' }}
              value={selectedReport}
              onChange={handleReportChange}
            >
              {reportTypes.map(report => (
                <Option key={report.key} value={report.key}>
                  <div>
                    <Text strong>
                      {report.icon} {report.title}
                    </Text>
                    <br />
                    <Text type='secondary'>{report.description}</Text>
                  </div>
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Divider />

        {/* KPIs */}
        {selectedReport !== 'por-metodo-pago' &&
          selectedReport !== 'por-producto' && (
            <Row
              gutter={[16, 16]}
              justify='center'
              style={{ marginBottom: '24px' }}
            >
              <Col xs={24} sm={12} md={6}>
                <Card
                  style={{
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                  }}
                >
                  <Statistic
                    title={
                      <span style={{ color: 'white', opacity: 0.9 }}>
                        Total Ventas
                      </span>
                    }
                    value={reportStats.totalVentas}
                    precision={2}
                    prefix={<BankOutlined style={{ color: 'white' }} />}
                    valueStyle={{ color: 'white' }}
                    formatter={value =>
                      formatCurrency(monedaBase?.codigo || 'USD', Number(value))
                    }
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card
                  style={{
                    background:
                      'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                  }}
                >
                  <Statistic
                    title={
                      <span style={{ color: 'white', opacity: 0.9 }}>
                        Número Ventas
                      </span>
                    }
                    value={reportStats.numeroVentas}
                    prefix={<ShoppingCartOutlined style={{ color: 'white' }} />}
                    valueStyle={{ color: 'white' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card
                  style={{
                    background:
                      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                  }}
                >
                  <Statistic
                    title={
                      <span style={{ color: 'white', opacity: 0.9 }}>
                        Ticket Promedio
                      </span>
                    }
                    value={reportStats.ticketPromedio}
                    precision={2}
                    prefix={<BarChartOutlined style={{ color: 'white' }} />}
                    valueStyle={{ color: 'white' }}
                    formatter={value =>
                      formatCurrency(monedaBase?.codigo || 'USD', Number(value))
                    }
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card
                  style={{
                    background:
                      'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                  }}
                >
                  <Statistic
                    title={
                      <span style={{ color: 'white', opacity: 0.9 }}>
                        % Cobranza
                      </span>
                    }
                    value={reportStats.porcentajeCobranza}
                    precision={2}
                    suffix='%'
                    prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
                    valueStyle={{ color: 'white' }}
                  />
                </Card>
              </Col>
            </Row>
          )}

        <div style={{ marginBottom: '24px' }}>
          <FilterSection
            filters={filterConfigs}
            onFilterChange={onFilterChange}
          />
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col span={24}>
            <Space style={{ marginBottom: '16px' }}>
              <Button
                type='primary'
                onClick={handleExportExcel}
                icon={<FileTextOutlined />}
              >
                Exportar a Excel
              </Button>
              <Button
                onClick={() => fetchData()}
                icon={<FileTextOutlined />}
                loading={loading}
              >
                Actualizar Reporte
              </Button>
            </Space>
          </Col>
        </Row>

        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          onEdit={() => {}}
          onDelete={() => {}}
          showActions={false}
        />
      </Card>
    </motion.div>
  )
}

export default withAuth(Reportes2VentasPage)
