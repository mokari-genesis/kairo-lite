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
import { useEffect, useState } from 'react'
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
} from 'antd'
import { motion } from 'framer-motion'
import {
  DownloadOutlined,
  FileTextOutlined,
  BarChartOutlined,
  DatabaseOutlined,
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
      type: 'text',
    },
    {
      key: 'proveedor_nombre',
      title: 'Proveedor',
      dataIndex: 'proveedor_nombre',
      type: 'text',
    },
    {
      key: 'stock',
      title: 'Stock Actual',
      dataIndex: 'stock',
      type: 'text',
    },
    {
      key: 'precio_sugerido',
      title: 'Precio Sugerido',
      dataIndex: 'precio_sugerido',
      type: 'text',
      render: (value: number) => `$.${value}`,
    },
    {
      key: 'precio_minorista',
      title: 'Precio Minorista',
      dataIndex: 'precio_minorista',
      type: 'text',
      render: (value: number) => `$.${value || 0}`,
    },
    {
      key: 'precio_mayorista',
      title: 'Precio Mayorista',
      dataIndex: 'precio_mayorista',
      type: 'text',
      render: (value: number) => `$.${value || 0}`,
    },
    {
      key: 'precio_distribuidores',
      title: 'Precio Distribuidores',
      dataIndex: 'precio_distribuidores',
      type: 'text',
      render: (value: number) => `$.${value || 0}`,
    },
    {
      key: 'precio_especial',
      title: 'Precio Especial',
      dataIndex: 'precio_especial',
      type: 'text',
      render: (value: number) => `$.${value || 0}`,
    },
    {
      key: 'valor_stock_sugerido',
      title: 'Valor Total (Precio sugerido)',
      dataIndex: 'valor_stock_sugerido',
      type: 'text',
      render: (value: number) => `$.${value || 0}`,
    },
    {
      key: 'valor_stock_minorista',
      title: 'Valor Total (Precio minorista)',
      dataIndex: 'valor_stock_minorista',
      type: 'text',
      render: (value: number) => `$.${value || 0}`,
    },
    {
      key: 'valor_stock_mayorista',
      title: 'Valor Total (Precio mayorista)',
      dataIndex: 'valor_stock_mayorista',
      type: 'text',
      render: (value: number) => `$.${value || 0}`,
    },
    {
      key: 'valor_stock_distribuidores',
      title: 'Valor Total (Precio distribuidores)',
      dataIndex: 'valor_stock_distribuidores',
      type: 'text',
      render: (value: number) => `$.${value || 0}`,
    },
    {
      key: 'valor_stock_especial',
      title: 'Valor Total (Precio especial)',
      dataIndex: 'valor_stock_especial',
      type: 'text',
      render: (value: number) => `$.${value || 0}`,
    },
  ]

  const ventasConPagosColumns = [
    {
      key: 'id',
      title: 'ID Venta',
      dataIndex: 'id',
      type: 'text',
    },
    {
      key: 'fecha_venta',
      title: 'Fecha de Venta',
      dataIndex: 'fecha_venta',
      type: 'text',
    },
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
      key: 'estado_venta',
      title: 'Estado',
      dataIndex: 'estado_venta',
      type: 'text',
      render: (estado: string) => {
        const colors: Record<string, string> = {
          vendido: '#87d068',
          cancelado: '#f50',
        }
        return (
          <span
            style={{
              color: colors[estado] || '#666',
              fontWeight: 'bold',
            }}
          >
            {estado?.charAt(0).toUpperCase() + estado?.slice(1)}
          </span>
        )
      },
    },
    {
      key: 'total_venta',
      title: 'Total de Venta',
      dataIndex: 'total_venta',
      type: 'text',
      render: (total: string) => formatCurrency(undefined, parseFloat(total)),
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
        return formatCurrency(undefined, Number(totalPagado))
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
    {
      key: 'usuario_nombre',
      title: 'Vendedor',
      dataIndex: 'usuario_nombre',
      type: 'text',
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
