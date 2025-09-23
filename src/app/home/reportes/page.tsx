/**
 *  REPORTES PAGE
 * */
'use client'
import '../../globals.css'
import '@ant-design/v5-patch-for-react-19'
import { DataTable } from '../../components/DataTable'
import { FilterSection } from '../../components/FilterSection'
import { PageHeader } from '../../components/PageHeader'
import { withAuth } from '../../auth/withAuth'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  getReporteInventarioConMetodo,
  getReporteMovimientosInventario,
  getReporteStockActual,
  ReporteInventarioConMetodo,
  ReporteMovimientoInventario,
  ReporteStockActual,
} from '@/app/api/reportes'
import { getSalesFlat } from '@/app/api/sales'
import { formatCurrency } from '@/app/utils/currency'
import {
  Card,
  message,
  notification,
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
  DownloadOutlined,
  FileTextOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'

const { Title, Text } = Typography
const { Option } = Select

function ReportesPage() {
  const [api, contextHolder] = notification.useNotification()
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<string>('stock-actual')
  const [columns, setColumns] = useState<any[]>([])

  const router = useRouter()

  const reportTypes = [
    {
      key: 'stock-actual',
      title: 'Stock Actual',
      description: 'Muestra el inventario actual con valores totales',
      icon: <DatabaseOutlined />,
    },
    {
      key: 'ventas-con-pagos',
      title: 'Ventas con Pagos',
      description: 'Reporte de ventas con información de pagos y saldos',
      icon: <BarChartOutlined />,
    },
    // {
    //   key: 'inventario-con-metodo',
    //   title: 'Inventario con Métodos de Pago',
    //   description: 'Reporte de inventario agrupado por métodos de pago',
    //   icon: <FileTextOutlined />,
    // },
    // {
    //   key: 'movimientos-inventario',
    //   title: 'Movimientos de Inventario',
    //   description: 'Historial de todos los movimientos de stock',
    //   icon: <BarChartOutlined />,
    // },
  ]

  const stockActualColumns = [
    {
      key: 'codigo',
      title: 'Código',
      dataIndex: 'codigo',
      type: 'text',
      render: (value: any) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 'bold', color: '#722ed1' }}>{value}</span>
        </Space>
      ),
    },
    {
      key: 'descripcion',
      title: 'Descripción',
      dataIndex: 'descripcion',
      type: 'text',
      render: (value: any) => (
        <Space>
          <InboxOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontWeight: 500 }}>{value}</span>
        </Space>
      ),
    },
    {
      key: 'categoria',
      title: 'Categoría',
      dataIndex: 'categoria',
      type: 'text',
      render: (value: any) => (
        <Space>
          <BarChartOutlined style={{ color: '#faad14' }} />
          <span style={{ fontWeight: 500 }}>{value}</span>
        </Space>
      ),
    },
    {
      key: 'proveedor_nombre',
      title: 'Proveedor',
      dataIndex: 'proveedor_nombre',
      type: 'text',
      render: (value: any) => (
        <Space>
          <UserOutlined style={{ color: '#722ed1' }} />
          <span style={{ fontWeight: 500 }}>{value}</span>
        </Space>
      ),
    },
    {
      key: 'stock',
      title: 'Stock Actual',
      dataIndex: 'stock',
      type: 'text',
      render: (stock: number) => {
        const stockConfig = {
          color: stock > 10 ? '#52c41a' : stock > 5 ? '#faad14' : '#ff4d4f',
          text: stock > 10 ? 'Alto' : stock > 5 ? 'Medio' : 'Bajo',
        }

        return (
          <Space>
            <InboxOutlined style={{ color: stockConfig.color }} />
            <span style={{ fontWeight: 'bold', color: stockConfig.color }}>
              {stock}
            </span>
            <Tag
              color={
                stockConfig.color === '#52c41a'
                  ? 'success'
                  : stockConfig.color === '#faad14'
                  ? 'warning'
                  : 'error'
              }
              style={{ borderRadius: '4px', fontSize: '11px' }}
            >
              {stockConfig.text}
            </Tag>
          </Space>
        )
      },
    },
    {
      key: 'precio_sugerido',
      title: 'Precio Sugerido',
      dataIndex: 'precio_sugerido',
      type: 'text',
      render: (value: number) => (
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
            {formatCurrency(undefined, value)}
          </span>
        </Space>
      ),
    },
    {
      key: 'precio_minorista',
      title: 'Precio Minorista',
      dataIndex: 'precio_minorista',
      type: 'text',
      render: (value: number) => (
        <Space>
          <DollarOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
            {formatCurrency(undefined, value || 0)}
          </span>
        </Space>
      ),
    },
    {
      key: 'precio_mayorista',
      title: 'Precio Mayorista',
      dataIndex: 'precio_mayorista',
      type: 'text',
      render: (value: number) => (
        <Space>
          <DollarOutlined style={{ color: '#722ed1' }} />
          <span style={{ fontWeight: 'bold', color: '#722ed1' }}>
            {formatCurrency(undefined, value || 0)}
          </span>
        </Space>
      ),
    },
    {
      key: 'precio_distribuidores',
      title: 'Precio Distribuidores',
      dataIndex: 'precio_distribuidores',
      type: 'text',
      render: (value: number) => (
        <Space>
          <DollarOutlined style={{ color: '#faad14' }} />
          <span style={{ fontWeight: 'bold', color: '#faad14' }}>
            {formatCurrency(undefined, value || 0)}
          </span>
        </Space>
      ),
    },
    {
      key: 'precio_especial',
      title: 'Precio Especial',
      dataIndex: 'precio_especial',
      type: 'text',
      render: (value: number) => (
        <Space>
          <DollarOutlined style={{ color: '#ff4d4f' }} />
          <span style={{ fontWeight: 'bold', color: '#ff4d4f' }}>
            {formatCurrency(undefined, value || 0)}
          </span>
        </Space>
      ),
    },
    {
      key: 'valor_stock_sugerido',
      title: 'Valor Total (Precio sugerido)',
      dataIndex: 'valor_stock_sugerido',
      type: 'text',
      render: (value: number) => (
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
            {formatCurrency(undefined, value || 0)}
          </span>
        </Space>
      ),
    },
    {
      key: 'valor_stock_minorista',
      title: 'Valor Total (Precio minorista)',
      dataIndex: 'valor_stock_minorista',
      type: 'text',
      render: (value: number) => (
        <Space>
          <DollarOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
            {formatCurrency(undefined, value || 0)}
          </span>
        </Space>
      ),
    },
    {
      key: 'valor_stock_mayorista',
      title: 'Valor Total (Precio mayorista)',
      dataIndex: 'valor_stock_mayorista',
      type: 'text',
      render: (value: number) => (
        <Space>
          <DollarOutlined style={{ color: '#722ed1' }} />
          <span style={{ fontWeight: 'bold', color: '#722ed1' }}>
            {formatCurrency(undefined, value || 0)}
          </span>
        </Space>
      ),
    },
    {
      key: 'valor_stock_distribuidores',
      title: 'Valor Total (Precio distribuidores)',
      dataIndex: 'valor_stock_distribuidores',
      type: 'text',
      render: (value: number) => (
        <Space>
          <DollarOutlined style={{ color: '#faad14' }} />
          <span style={{ fontWeight: 'bold', color: '#faad14' }}>
            {formatCurrency(undefined, value || 0)}
          </span>
        </Space>
      ),
    },
    {
      key: 'valor_stock_especial',
      title: 'Valor Total (Precio especial)',
      dataIndex: 'valor_stock_especial',
      type: 'text',
      render: (value: number) => (
        <Space>
          <DollarOutlined style={{ color: '#ff4d4f' }} />
          <span style={{ fontWeight: 'bold', color: '#ff4d4f' }}>
            {formatCurrency(undefined, value || 0)}
          </span>
        </Space>
      ),
    },
  ]

  const ventasConPagosColumns = [
    {
      key: 'id',
      title: 'ID Venta',
      dataIndex: 'id',
      type: 'text',
      render: (value: any) => (
        <Space>
          <ShoppingCartOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 'bold', color: '#722ed1' }}>{value}</span>
        </Space>
      ),
    },
    {
      key: 'fecha_venta',
      title: 'Fecha de Venta',
      dataIndex: 'fecha_venta',
      type: 'text',
      render: (value: any) => (
        <Space>
          <CalendarOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontWeight: 500 }}>{value}</span>
        </Space>
      ),
    },
    {
      key: 'cliente_nombre',
      title: 'Cliente',
      dataIndex: 'cliente_nombre',
      type: 'text',
      render: (value: any) => (
        <Space>
          <UserOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontWeight: 500 }}>{value}</span>
        </Space>
      ),
    },
    {
      key: 'cliente_nit',
      title: 'NIT',
      dataIndex: 'cliente_nit',
      type: 'text',
      render: (value: any) => (
        <Space>
          <FileTextOutlined style={{ color: '#faad14' }} />
          <span style={{ fontWeight: 500 }}>{value || 'No disponible'}</span>
        </Space>
      ),
    },
    {
      key: 'estado_venta',
      title: 'Estado',
      dataIndex: 'estado_venta',
      type: 'text',
      render: (estado: string) => {
        const estadoConfig = {
          vendido: {
            color: 'success',
            icon: <CheckCircleOutlined />,
            text: 'Vendido',
          },
          cancelado: {
            color: 'error',
            icon: <ExclamationCircleOutlined />,
            text: 'Cancelado',
          },
        }
        const config = estadoConfig[estado as keyof typeof estadoConfig] || {
          color: 'default',
          icon: <ExclamationCircleOutlined />,
          text: estado,
        }

        return (
          <Tag
            color={config.color}
            style={{ borderRadius: '6px', fontWeight: 'bold' }}
          >
            <Space>
              {config.icon}
              {config.text}
            </Space>
          </Tag>
        )
      },
    },
    {
      key: 'total_venta',
      title: 'Total de Venta',
      dataIndex: 'total_venta',
      type: 'text',
      render: (total: string) => (
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
            {formatCurrency(undefined, parseFloat(total))}
          </span>
        </Space>
      ),
    },
    {
      key: 'total_pagado',
      title: 'Total Pagado',
      dataIndex: 'total_pagado',
      type: 'text',
      render: (total: string | number, record: any) => {
        // Calcular total pagado sumando todos los pagos de la venta
        const totalPagado =
          record.pagos?.reduce(
            (sum: number, pago: any) => sum + (pago.monto || 0),
            0
          ) || 0
        return (
          <Space>
            <CheckCircleOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
              {formatCurrency(undefined, Number(totalPagado))}
            </span>
          </Space>
        )
      },
    },
    {
      key: 'saldo_pendiente',
      title: 'Saldo Pendiente',
      dataIndex: 'saldo_pendiente',
      type: 'text',
      render: (saldo: string | number, record: any) => {
        const total = parseFloat(record.total_venta)
        // Calcular total pagado sumando todos los pagos de la venta
        const totalPagado =
          record.pagos?.reduce(
            (sum: number, pago: any) => sum + (pago.monto || 0),
            0
          ) || 0
        const saldoPendiente = total - Number(totalPagado)
        const isPendiente = saldoPendiente > 0

        return (
          <Space>
            <ExclamationCircleOutlined
              style={{ color: isPendiente ? '#ff4d4f' : '#52c41a' }}
            />
            <span
              style={{
                fontWeight: 'bold',
                color: isPendiente ? '#ff4d4f' : '#52c41a',
              }}
            >
              {formatCurrency(undefined, saldoPendiente)}
            </span>
            {isPendiente && (
              <Tag
                color='warning'
                style={{ borderRadius: '4px', fontSize: '11px' }}
              >
                Pendiente
              </Tag>
            )}
          </Space>
        )
      },
    },
    {
      key: 'usuario_nombre',
      title: 'Vendedor',
      dataIndex: 'usuario_nombre',
      type: 'text',
      render: (value: any) => (
        <Space>
          <UserOutlined style={{ color: '#722ed1' }} />
          <span style={{ fontWeight: 500 }}>{value}</span>
        </Space>
      ),
    },
  ]

  const inventarioConMetodoColumns = [
    {
      key: 'producto_codigo',
      title: 'Código',
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
      key: 'tipo_movimiento',
      title: 'Movimiento',
      dataIndex: 'tipo_movimiento',
      type: 'text',
    },
    {
      key: 'stock_actual',
      title: 'Stock Actual',
      dataIndex: 'stock_actual',
      type: 'text',
    },
    {
      key: 'metodo_pago',
      title: 'Método de Pago',
      dataIndex: 'metodo_pago',
      type: 'text',
    },
    {
      key: 'total_venta',
      title: 'Ventas por Método',
      dataIndex: 'total_venta',
      type: 'text',
    },
    {
      key: 'fecha_reporte',
      title: 'Fecha Reporte',
      dataIndex: 'fecha_reporte',
      type: 'text',
    },
  ]

  const movimientosInventarioColumns = [
    {
      key: 'producto_codigo',
      title: 'Código',
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
      key: 'tipo_movimiento',
      title: 'Tipo Movimiento',
      dataIndex: 'tipo_movimiento',
      type: 'text',
    },
    {
      key: 'cantidad',
      title: 'Cantidad',
      dataIndex: 'cantidad',
      type: 'text',
    },
    {
      key: 'stock_anterior',
      title: 'Stock Anterior',
      dataIndex: 'stock_anterior',
      type: 'text',
    },
    {
      key: 'stock_nuevo',
      title: 'Stock Nuevo',
      dataIndex: 'stock_nuevo',
      type: 'text',
    },
    {
      key: 'usuario_nombre',
      title: 'Usuario',
      dataIndex: 'usuario_nombre',
      type: 'text',
    },
    {
      key: 'fecha_movimiento',
      title: 'Fecha Movimiento',
      dataIndex: 'fecha_movimiento',
      type: 'text',
    },
  ]

  const handleReportChange = (value: string) => {
    setSelectedReport(value)
    setCurrentPage(1)

    // Set columns based on report type
    switch (value) {
      case 'stock-actual':
        setColumns(stockActualColumns)
        break
      case 'ventas-con-pagos':
        setColumns(ventasConPagosColumns)
        break
      case 'inventario-con-metodo':
        setColumns(inventarioConMetodoColumns)
        break
      case 'movimientos-inventario':
        setColumns(movimientosInventarioColumns)
        break
      default:
        setColumns(stockActualColumns)
    }

    fetchData(value)
  }

  const fetchData = async (reportType: string = selectedReport) => {
    try {
      setLoading(true)
      let result: any[] = []

      switch (reportType) {
        case 'stock-actual':
          result = await getReporteStockActual(filters)
          break
        case 'ventas-con-pagos':
          result = await getSalesFlat(filters)
          break
        case 'inventario-con-metodo':
          result = await getReporteInventarioConMetodo(filters)
          break
        case 'movimientos-inventario':
          result = await getReporteMovimientosInventario(filters)
          break
        default:
          result = await getReporteStockActual(filters)
      }

      setData(result)
    } catch (error) {
      message.error('Error al cargar el reporte')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initialize with default report
    setColumns(stockActualColumns)
    fetchData()
  }, [filters])

  const handleExportExcel = () => {
    const reportType = reportTypes.find(r => r.key === selectedReport)
    const fileName = `${reportType?.title
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

  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page)
    setPageSize(pageSize)
  }

  const onFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  // Calcular estadísticas de reportes
  const reportStats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalRegistros: 0,
        totalVentas: 0,
        totalPagado: 0,
        totalPendiente: 0,
        totalStock: 0,
        valorInventario: 0,
        valorInventarioMinorista: 0,
        valorInventarioMayorista: 0,
        valorInventarioDistribuidores: 0,
        valorInventarioEspecial: 0,
      }
    }

    const totalRegistros = data.length

    if (selectedReport === 'ventas-con-pagos') {
      const totalVentas = data.reduce(
        (sum, record) => sum + parseFloat(record.total_venta || 0),
        0
      )
      const totalPagado = data.reduce((sum, record) => {
        const pagado =
          record.pagos?.reduce(
            (pSum: number, pago: any) => pSum + (pago.monto || 0),
            0
          ) || 0
        return sum + pagado
      }, 0)
      const totalPendiente = totalVentas - totalPagado

      return {
        totalRegistros,
        totalVentas,
        totalPagado,
        totalPendiente,
        totalStock: 0,
        valorInventario: 0,
        valorInventarioMinorista: 0,
        valorInventarioMayorista: 0,
        valorInventarioDistribuidores: 0,
        valorInventarioEspecial: 0,
      }
    } else if (selectedReport === 'stock-actual') {
      const totalStock = data.reduce(
        (sum, record) => sum + (record.stock || 0),
        0
      )
      const valorInventario = data.reduce(
        (sum, record) =>
          sum + (record.stock || 0) * (record.precio_sugerido || 0),
        0
      )
      const valorInventarioMinorista = data.reduce(
        (sum, record) =>
          sum + (record.stock || 0) * (record.precio_minorista || 0),
        0
      )
      const valorInventarioMayorista = data.reduce(
        (sum, record) =>
          sum + (record.stock || 0) * (record.precio_mayorista || 0),
        0
      )
      const valorInventarioDistribuidores = data.reduce(
        (sum, record) =>
          sum + (record.stock || 0) * (record.precio_distribuidores || 0),
        0
      )
      const valorInventarioEspecial = data.reduce(
        (sum, record) =>
          sum + (record.stock || 0) * (record.precio_especial || 0),
        0
      )

      return {
        totalRegistros,
        totalVentas: 0,
        totalPagado: 0,
        totalPendiente: 0,
        totalStock,
        valorInventario,
        valorInventarioMinorista,
        valorInventarioMayorista,
        valorInventarioDistribuidores,
        valorInventarioEspecial,
      }
    }

    return {
      totalRegistros,
      totalVentas: 0,
      totalPagado: 0,
      totalPendiente: 0,
      totalStock: 0,
      valorInventario: 0,
      valorInventarioMinorista: 0,
      valorInventarioMayorista: 0,
      valorInventarioDistribuidores: 0,
      valorInventarioEspecial: 0,
    }
  }, [data, selectedReport])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '24px' }}
    >
      {contextHolder}
      <Card
        variant='outlined'
        style={{
          borderRadius: '15px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <PageHeader title='Reportes' showNewButton={false} />

        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <Title level={4}>Seleccionar Tipo de Reporte</Title>
            <Select
              style={{ width: '100%', marginBottom: '5px', height: '75px' }}
              value={selectedReport}
              onChange={handleReportChange}
              //size='large'
            >
              {reportTypes.map(report => (
                <Option key={report.key} value={report.key}>
                  <div style={{}}>
                    <Text strong>
                      {report.icon} {report.title}
                    </Text>
                    <br />
                    <Text type='secondary'>{report.description}</Text>
                  </div>
                  {/* </Space> */}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Divider />

        {/* Tarjetas de Estadísticas */}
        <Row
          gutter={[16, 16]}
          justify='center'
          style={{ marginBottom: '24px' }}
        >
          <Col xs={24} sm={12} md={6}>
            <Card
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
              }}
            >
              <Statistic
                title={
                  <span style={{ color: 'white', opacity: 0.9 }}>
                    Total Registros
                  </span>
                }
                value={reportStats.totalRegistros}
                prefix={<DatabaseOutlined style={{ color: 'white' }} />}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>

          {selectedReport === 'ventas-con-pagos' && (
            <>
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
                        Total Ventas
                      </span>
                    }
                    value={reportStats.totalVentas}
                    precision={2}
                    prefix={<DollarOutlined style={{ color: 'white' }} />}
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
                        Total Pagado
                      </span>
                    }
                    value={reportStats.totalPagado}
                    precision={2}
                    prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
                    valueStyle={{ color: 'white' }}
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
                        Saldo Pendiente
                      </span>
                    }
                    value={reportStats.totalPendiente}
                    precision={2}
                    prefix={
                      <ExclamationCircleOutlined style={{ color: 'white' }} />
                    }
                    valueStyle={{ color: 'white' }}
                  />
                </Card>
              </Col>
            </>
          )}

          {selectedReport === 'stock-actual' && (
            <>
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
                        Total Stock
                      </span>
                    }
                    value={reportStats.totalStock}
                    prefix={<InboxOutlined style={{ color: 'white' }} />}
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
                        Valor Inventario (Precio Sugerido)
                      </span>
                    }
                    value={reportStats.valorInventario}
                    precision={2}
                    prefix={<DollarOutlined style={{ color: 'white' }} />}
                    valueStyle={{ color: 'white' }}
                  />
                </Card>
              </Col>
            </>
          )}
        </Row>

        {/* Segunda fila de estadísticas para stock actual */}
        {selectedReport === 'stock-actual' && (
          <Row
            gutter={[16, 16]}
            justify='center'
            style={{ marginBottom: '24px' }}
          >
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
                      Valor Inventario (Minorista)
                    </span>
                  }
                  value={reportStats.valorInventarioMinorista}
                  precision={2}
                  prefix={<DollarOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
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
                      Valor Inventario (Mayorista)
                    </span>
                  }
                  value={reportStats.valorInventarioMayorista}
                  precision={2}
                  prefix={<DollarOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  background:
                    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: 'white', opacity: 0.9 }}>
                      Valor Inventario (Distribuidores)
                    </span>
                  }
                  value={reportStats.valorInventarioDistribuidores}
                  precision={2}
                  prefix={<DollarOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  background:
                    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: 'white', opacity: 0.9 }}>
                      Valor Inventario (Especial)
                    </span>
                  }
                  value={reportStats.valorInventarioEspecial}
                  precision={2}
                  prefix={<DollarOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col span={24}>
            <Space style={{ marginBottom: '16px' }}>
              <Button
                onClick={handleExportExcel}
                type='primary'
                icon={<DownloadOutlined />}
                loading={loading}
              >
                Exportar Excel
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
          onEdit={() => {}} // No edit functionality for reports
          onDelete={() => {}} // No delete functionality for reports
          showActions={false}
        />
      </Card>
    </motion.div>
  )
}

export default withAuth(ReportesPage)
