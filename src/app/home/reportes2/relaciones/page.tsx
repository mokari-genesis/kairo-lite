/**
 *  REPORTES2 - CLIENTES Y PROVEEDORES PAGE
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
  getReporteTopClientes,
  getReporteTopProveedores,
  getReporteClientesRiesgo,
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
  Tag,
} from 'antd'
import { motion } from 'framer-motion'
import {
  FileTextOutlined,
  TeamOutlined,
  ShopOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'

const { Title, Text } = Typography
const { Option } = Select

function Reportes2RelacionesPage() {
  const { empresaId } = useEmpresa()
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<string>('top-clientes')
  const [columns, setColumns] = useState<any[]>([])

  const reportTypes = [
    {
      key: 'top-clientes',
      title: 'Top Clientes',
      description: 'Clientes con mayor volumen de ventas',
      icon: <TeamOutlined />,
    },
    {
      key: 'top-proveedores',
      title: 'Top Proveedores',
      description: 'Proveedores con mayor volumen de compras',
      icon: <ShopOutlined />,
    },
    {
      key: 'clientes-riesgo',
      title: 'Clientes con Riesgo',
      description: 'Clientes con alto riesgo de mora',
      icon: <ExclamationCircleOutlined />,
    },
  ]

  const topClientesColumns = [
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
      key: 'total_ventas',
      title: 'Total Ventas',
      dataIndex: 'total_ventas',
      type: 'text',
      render: (value: number) =>
        value != null ? formatCurrency(undefined, value) : 'N/A',
    },
    {
      key: 'numero_ventas',
      title: 'Número Ventas',
      dataIndex: 'numero_ventas',
      type: 'text',
      render: (value: number) => (value != null ? value : 'N/A'),
    },
    {
      key: 'ticket_promedio',
      title: 'Ticket Promedio',
      dataIndex: 'ticket_promedio',
      type: 'text',
      render: (value: number) =>
        value != null ? formatCurrency(undefined, value) : 'N/A',
    },
    {
      key: 'porcentaje_participacion',
      title: '% Participación',
      dataIndex: 'porcentaje_participacion',
      type: 'text',
      render: (value: number) =>
        value != null && !isNaN(value) ? `${value.toFixed(2)}%` : 'N/A',
    },
  ]

  const topProveedoresColumns = [
    {
      key: 'proveedor_nombre',
      title: 'Proveedor',
      dataIndex: 'proveedor_nombre',
      type: 'text',
    },
    {
      key: 'total_compras',
      title: 'Total Compras',
      dataIndex: 'total_compras',
      type: 'text',
      render: (value: number) =>
        value != null ? formatCurrency(undefined, value) : 'N/A',
    },
    {
      key: 'numero_compras',
      title: 'Número Compras',
      dataIndex: 'numero_compras',
      type: 'text',
      render: (value: number) => (value != null ? value : 'N/A'),
    },
    {
      key: 'promedio_compra',
      title: 'Promedio Compra',
      dataIndex: 'promedio_compra',
      type: 'text',
      render: (value: number) =>
        value != null ? formatCurrency(undefined, value) : 'N/A',
    },
    {
      key: 'porcentaje_participacion',
      title: '% Participación',
      dataIndex: 'porcentaje_participacion',
      type: 'text',
      render: (value: number) =>
        value != null && !isNaN(value) ? `${value.toFixed(2)}%` : 'N/A',
    },
  ]

  const clientesRiesgoColumns = [
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
      key: 'saldo_vencido_total',
      title: 'Saldo Vencido',
      dataIndex: 'saldo_vencido_total',
      type: 'text',
      render: (value: number) =>
        value != null ? formatCurrency(undefined, value) : 'N/A',
    },
    {
      key: 'dias_atraso_promedio',
      title: 'Días Atraso Promedio',
      dataIndex: 'dias_atraso_promedio',
      type: 'text',
      render: (value: number) =>
        value != null && !isNaN(value) ? Math.round(value) : 'N/A',
    },
    {
      key: 'numero_cuentas_vencidas',
      title: 'Cuentas Vencidas',
      dataIndex: 'numero_cuentas_vencidas',
      type: 'text',
      render: (value: number) => (value != null ? value : 'N/A'),
    },
    {
      key: 'riesgo_nivel',
      title: 'Nivel Riesgo',
      dataIndex: 'riesgo_nivel',
      type: 'text',
      render: (nivel: string) => (
        <Tag
          color={
            nivel === 'Alto'
              ? 'error'
              : nivel === 'Medio'
              ? 'warning'
              : nivel === 'Bajo'
              ? 'default'
              : 'success'
          }
        >
          {nivel}
        </Tag>
      ),
    },
  ]

  const handleReportChange = (value: string) => {
    setSelectedReport(value)
    setColumns(getColumnsForReport(value))
    fetchData(value)
  }

  const getColumnsForReport = (reportType: string) => {
    switch (reportType) {
      case 'top-clientes':
        return topClientesColumns
      case 'top-proveedores':
        return topProveedoresColumns
      case 'clientes-riesgo':
        return clientesRiesgoColumns
      default:
        return topClientesColumns
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
        case 'top-clientes':
          result = await getReporteTopClientes(filtersWithEmpresa)
          break
        case 'top-proveedores':
          result = await getReporteTopProveedores(filtersWithEmpresa)
          break
        case 'clientes-riesgo':
          result = await getReporteClientesRiesgo(filtersWithEmpresa)
          break
        default:
          result = await getReporteTopClientes(filtersWithEmpresa)
      }

      // Calcular % participación en el frontend cuando el backend no lo envía
      if (reportType === 'top-clientes') {
        const totalGlobal = result.reduce(
          (acc, row) => acc + (Number(row.total_ventas) || 0),
          0
        )
        result = result.map(row => ({
          ...row,
          porcentaje_participacion:
            totalGlobal > 0
              ? ((Number(row.total_ventas) || 0) / totalGlobal) * 100
              : 0,
        }))
      } else if (reportType === 'top-proveedores') {
        const totalGlobal = result.reduce(
          (acc, row) => acc + (Number(row.total_compras) || 0),
          0
        )
        result = result.map(row => ({
          ...row,
          porcentaje_participacion:
            totalGlobal > 0
              ? ((Number(row.total_compras) || 0) / totalGlobal) * 100
              : 0,
        }))
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

  const handleExportExcel = () => {
    const reportType = reportTypes.find(r => r.key === selectedReport)
    const fileName = `reportes2_relaciones_${reportType?.title
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
        <PageHeader
          title='Análisis de Clientes y Proveedores'
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

export default withAuth(Reportes2RelacionesPage)
