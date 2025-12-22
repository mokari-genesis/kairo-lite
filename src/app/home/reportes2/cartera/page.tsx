/**
 *  REPORTES2 - CARTERA PAGE (CxC/CxP)
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
import { formatCurrency } from '@/app/utils/currency'
import {
  getReporteCxcAging,
  getReporteCxpAging,
  getReporteFlujoCaja,
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
  BankOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'

const { Title, Text } = Typography
const { Option } = Select

function Reportes2CarteraPage() {
  const { empresaId } = useEmpresa()
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<string>('cxc-aging')
  const [columns, setColumns] = useState<any[]>([])

  const reportTypes = [
    {
      key: 'cxc-aging',
      title: 'Envejecimiento CxC',
      description: 'Análisis de cuentas por cobrar por antigüedad',
      icon: <BankOutlined />,
    },
    {
      key: 'cxp-aging',
      title: 'Envejecimiento CxP',
      description: 'Análisis de cuentas por pagar por antigüedad',
      icon: <BankOutlined />,
    },
    {
      key: 'flujo-caja',
      title: 'Flujo de Caja Proyectado',
      description: 'Proyección de cobros y pagos por vencimiento',
      icon: <ExclamationCircleOutlined />,
    },
  ]

  const cxcAgingColumns = [
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
      key: 'total_saldo',
      title: 'Total Saldo',
      dataIndex: 'total_saldo',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
    {
      key: 'saldo_0_30',
      title: '0-30 días',
      dataIndex: 'saldo_0_30',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
    {
      key: 'saldo_31_60',
      title: '31-60 días',
      dataIndex: 'saldo_31_60',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
    {
      key: 'saldo_61_90',
      title: '61-90 días',
      dataIndex: 'saldo_61_90',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
    {
      key: 'saldo_mas_90',
      title: '>90 días',
      dataIndex: 'saldo_mas_90',
      type: 'text',
      render: (value: number) => (
        <span style={{ color: '#ff4d4f' }}>
          {formatCurrency(undefined, value)}
        </span>
      ),
    },
    {
      key: 'dias_promedio_atraso',
      title: 'Días Promedio Atraso',
      dataIndex: 'dias_promedio_atraso',
      type: 'text',
      render: (value: number) => (
        <Tag color={value > 90 ? 'error' : value > 60 ? 'warning' : 'default'}>
          {Math.round(value || 0)} días
        </Tag>
      ),
    },
  ]

  const cxpAgingColumns = [
    {
      key: 'proveedor_nombre',
      title: 'Proveedor',
      dataIndex: 'proveedor_nombre',
      type: 'text',
    },
    {
      key: 'total_saldo',
      title: 'Total Saldo',
      dataIndex: 'total_saldo',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
    {
      key: 'saldo_0_30',
      title: '0-30 días',
      dataIndex: 'saldo_0_30',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
    {
      key: 'saldo_31_60',
      title: '31-60 días',
      dataIndex: 'saldo_31_60',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
    {
      key: 'saldo_61_90',
      title: '61-90 días',
      dataIndex: 'saldo_61_90',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
    {
      key: 'saldo_mas_90',
      title: '>90 días',
      dataIndex: 'saldo_mas_90',
      type: 'text',
      render: (value: number) => (
        <span style={{ color: '#ff4d4f' }}>
          {formatCurrency(undefined, value)}
        </span>
      ),
    },
  ]

  const flujoCajaColumns = [
    {
      key: 'periodo',
      title: 'Período',
      dataIndex: 'periodo',
      type: 'text',
    },
    {
      key: 'tipo',
      title: 'Tipo',
      dataIndex: 'tipo',
      type: 'text',
      render: (tipo: string) => (
        <Tag color={tipo === 'cobro' ? 'success' : 'error'}>
          {tipo === 'cobro' ? 'Cobro' : 'Pago'}
        </Tag>
      ),
    },
    {
      key: 'monto_estimado',
      title: 'Monto Estimado',
      dataIndex: 'monto_estimado',
      type: 'text',
      render: (value: number) => formatCurrency(undefined, value),
    },
  ]

  const handleReportChange = (value: string) => {
    setSelectedReport(value)
    setColumns(getColumnsForReport(value))
    fetchData(value)
  }

  const getColumnsForReport = (reportType: string) => {
    switch (reportType) {
      case 'cxc-aging':
        return cxcAgingColumns
      case 'cxp-aging':
        return cxpAgingColumns
      case 'flujo-caja':
        return flujoCajaColumns
      default:
        return cxcAgingColumns
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
        case 'cxc-aging':
          result = await getReporteCxcAging(filtersWithEmpresa)
          break
        case 'cxp-aging':
          result = await getReporteCxpAging(filtersWithEmpresa)
          break
        case 'flujo-caja':
          result = await getReporteFlujoCaja(filtersWithEmpresa)
          break
        default:
          result = await getReporteCxcAging(filtersWithEmpresa)
      }

      setData(result)
    } catch (error) {
      console.error('Error fetching report data:', error)
      message.error('Error al cargar el reporte')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setColumns(getColumnsForReport(selectedReport))
    fetchData()
  }, [filters, empresaId, selectedReport])

  const reportStats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        saldoTotal: 0,
        saldoVencido: 0,
        porcentajeVencido: 0,
        saldoMas90: 0,
      }
    }

    if (selectedReport === 'cxc-aging' || selectedReport === 'cxp-aging') {
      const saldoTotal = data.reduce(
        (sum, record) => sum + Number(record.total_saldo || 0),
        0
      )
      const saldoVencido = data.reduce(
        (sum, record) => sum + Number(record.saldo_mas_90 || 0),
        0
      )
      const saldoMas90 = data.reduce(
        (sum, record) => sum + Number(record.saldo_mas_90 || 0),
        0
      )
      const porcentajeVencido =
        saldoTotal > 0 ? (saldoVencido / saldoTotal) * 100 : 0

      return {
        saldoTotal,
        saldoVencido,
        porcentajeVencido,
        saldoMas90,
      }
    }

    return {
      saldoTotal: 0,
      saldoVencido: 0,
      porcentajeVencido: 0,
      saldoMas90: 0,
    }
  }, [data, selectedReport])

  const handleExportExcel = () => {
    const reportType = reportTypes.find(r => r.key === selectedReport)
    const fileName = `reportes2_cartera_${reportType?.title
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

  const filterConfigs = [
    {
      type: 'dateRange' as const,
      key: 'fecha',
      placeholder: 'Rango de fechas',
      width: '30%',
    },
  ]

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
        <PageHeader title='Análisis de Cartera' showNewButton={false} />

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
        {(selectedReport === 'cxc-aging' || selectedReport === 'cxp-aging') && (
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
                      Saldo Total
                    </span>
                  }
                  value={reportStats.saldoTotal}
                  precision={2}
                  prefix={<BankOutlined style={{ color: 'white' }} />}
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
                      Saldo Vencido
                    </span>
                  }
                  value={reportStats.saldoVencido}
                  precision={2}
                  prefix={
                    <ExclamationCircleOutlined style={{ color: 'white' }} />
                  }
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
                      % Vencido
                    </span>
                  }
                  value={reportStats.porcentajeVencido}
                  precision={2}
                  suffix='%'
                  prefix={
                    <ExclamationCircleOutlined style={{ color: 'white' }} />
                  }
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
                    <span
                      style={{ color: 'white', opacity: 0.9 }}
                    >{`Saldo >90 días`}</span>
                  }
                  value={reportStats.saldoMas90}
                  precision={2}
                  prefix={
                    <ExclamationCircleOutlined style={{ color: 'white' }} />
                  }
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

export default withAuth(Reportes2CarteraPage)
