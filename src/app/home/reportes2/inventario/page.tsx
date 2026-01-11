/**
 *  REPORTES2 - INVENTARIO AVANZADO PAGE
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
  getReporteInventarioRotacion,
  getReporteInventarioCompras,
  getReporteInventarioBajaRotacion,
  getReporteInventarioRupturas,
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
  DatabaseOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'

const { Title, Text } = Typography
const { Option } = Select

function Reportes2InventarioPage() {
  const { empresaId } = useEmpresa()
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<string>('rotacion')
  const [columns, setColumns] = useState<any[]>([])
  const [categorias, setCategorias] = useState<string[]>([])

  const reportTypes = [
    {
      key: 'rotacion',
      title: 'Rotación de Inventario',
      description: 'Análisis de rotación por producto',
      icon: <DatabaseOutlined />,
    },
    {
      key: 'compras',
      title: 'Compras por Producto',
      description: 'Análisis de compras realizadas',
      icon: <FileTextOutlined />,
    },
    {
      key: 'baja-rotacion',
      title: 'Productos de Baja Rotación',
      description: 'Productos obsoletos o lentos',
      icon: <InboxOutlined />,
    },
    {
      key: 'rupturas',
      title: 'Rupturas de Stock',
      description: 'Productos con stock bajo o agotado',
      icon: <ExclamationCircleOutlined />,
    },
  ]

  const rotacionColumns = [
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
      key: 'stock_actual',
      title: 'Stock Actual',
      dataIndex: 'stock_actual',
      type: 'text',
      render: (value: number | string | null) => {
        if (value === null || value === undefined) return '0'
        const numValue =
          typeof value === 'number' ? value : parseFloat(String(value))
        return (
          <Tag
            color={
              numValue === 0 ? 'error' : numValue <= 5 ? 'warning' : 'success'
            }
          >
            {isNaN(numValue) ? '0' : Math.round(numValue)}
          </Tag>
        )
      },
    },
    {
      key: 'precio_unitario',
      title: 'Precio Sugerido para Venta',
      dataIndex: 'precio_unitario',
      type: 'text',
      render: (value: number | string | null) => {
        if (value === null || value === undefined) return '-'
        const numValue =
          typeof value === 'number' ? value : parseFloat(String(value))
        return isNaN(numValue) ? '-' : formatCurrency('USD', numValue)
      },
    },
    {
      key: 'valor_inventario',
      title: 'Valor Inventario Actual',
      dataIndex: 'valor_inventario',
      type: 'text',
      render: (value: number | string | null) => {
        if (value === null || value === undefined) return '-'
        const numValue =
          typeof value === 'number' ? value : parseFloat(String(value))
        return isNaN(numValue) ? '-' : formatCurrency('USD', numValue)
      },
    },
    {
      key: 'unidades_vendidas',
      title: 'Unidades Vendidas',
      dataIndex: 'unidades_vendidas',
      type: 'text',
    },
  ]

  const comprasColumns = [
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
      key: 'compra_id',
      title: 'ID Compra',
      dataIndex: 'compra_id',
      type: 'text',
      render: (value: number) => (
        <Tag color="blue">#{value}</Tag>
      ),
    },
    {
      key: 'fecha_compra',
      title: 'Fecha Compra',
      dataIndex: 'fecha_compra',
      type: 'text',
      render: (value: string) => {
        if (!value) return '-'
        return new Date(value).toLocaleDateString('es-ES')
      },
    },
    {
      key: 'moneda_codigo',
      title: 'Moneda',
      dataIndex: 'moneda_codigo',
      type: 'text',
      render: (value: string, record: any) => (
        <div>
          <Tag color="purple">{value}</Tag>
          {record.moneda_simbolo && (
            <span style={{ marginLeft: '4px', fontSize: '12px' }}>
              {record.moneda_simbolo}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'cantidad',
      title: 'Cantidad',
      dataIndex: 'cantidad',
      type: 'text',
      align: 'right' as const,
    },
    {
      key: 'costo_unitario',
      title: 'Costo Unitario',
      dataIndex: 'costo_unitario',
      type: 'text',
      render: (value: number | string | null, record: any) => {
        if (value === null || value === undefined) return '-'
        const numValue =
          typeof value === 'number' ? value : parseFloat(String(value))
        if (isNaN(numValue)) return '-'

        const costoBase = record.costo_unitario_base || 0
        const monedaCodigo = record.moneda_codigo || 'USD'

        return (
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {formatCurrency(monedaCodigo, numValue)}
            </div>
            {costoBase > 0 && costoBase !== numValue && (
              <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                {formatCurrency('USD', costoBase)} (base)
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'subtotal',
      title: 'Subtotal',
      dataIndex: 'subtotal',
      type: 'text',
      render: (value: number | string | null, record: any) => {
        if (value === null || value === undefined) return '-'
        const numValue =
          typeof value === 'number' ? value : parseFloat(String(value))
        if (isNaN(numValue)) return '-'

        const subtotalBase = record.subtotal_base || 0
        const monedaCodigo = record.moneda_codigo || 'USD'

        return (
          <div>
            <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
              {formatCurrency(monedaCodigo, numValue)}
            </div>
            {subtotalBase > 0 && subtotalBase !== numValue && (
              <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                {formatCurrency('USD', subtotalBase)} (base)
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'proveedor_nombre',
      title: 'Proveedor',
      dataIndex: 'proveedor_nombre',
      type: 'text',
      render: (value: string, record: any) => (
        <div>
          <div>{value || '-'}</div>
          {record.proveedor_nit && (
            <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
              NIT: {record.proveedor_nit}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'usuario_nombre',
      title: 'Usuario',
      dataIndex: 'usuario_nombre',
      type: 'text',
    },
    {
      key: 'tipo_pago',
      title: 'Tipo Pago',
      dataIndex: 'tipo_pago',
      type: 'text',
      render: (value: string) => (
        <Tag color={value === 'contado' ? 'green' : 'orange'}>
          {value || '-'}
        </Tag>
      ),
    },
    {
      key: 'estado_compra',
      title: 'Estado',
      dataIndex: 'estado_compra',
      type: 'text',
      render: (value: string) => (
        <Tag color={value === 'completa' ? 'success' : 'warning'}>
          {value || '-'}
        </Tag>
      ),
    },
  ]

  const bajaRotacionColumns = [
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
      key: 'dias_sin_rotacion',
      title: 'Días Sin Rotación',
      dataIndex: 'dias_sin_rotacion',
      type: 'text',
      render: (value: number | string | null) => {
        const numValue =
          typeof value === 'number' ? value : parseFloat(String(value || 0))
        return (
          <Tag
            color={
              numValue > 90 ? 'error' : numValue > 60 ? 'warning' : 'default'
            }
          >
            {isNaN(numValue) ? 'N/A' : `${numValue} días`}
          </Tag>
        )
      },
    },
    {
      key: 'stock_actual',
      title: 'Stock Actual',
      dataIndex: 'stock_actual',
      type: 'text',
      render: (value: number | string | null) => {
        const numValue =
          typeof value === 'number' ? value : parseFloat(String(value || 0))
        return (
          <Tag
            color={
              numValue === 0 ? 'error' : numValue <= 5 ? 'warning' : 'success'
            }
          >
            {isNaN(numValue) ? 'N/A' : numValue}
          </Tag>
        )
      },
    },
  ]

  const rupturasColumns = [
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
      key: 'categoria',
      title: 'Categoría',
      dataIndex: 'categoria',
      type: 'text',
    },
    {
      key: 'stock_actual',
      title: 'Stock Actual',
      dataIndex: 'stock_actual',
      type: 'text',
    },
    {
      key: 'estado',
      title: 'Estado',
      dataIndex: 'estado',
      type: 'text',
      render: (estado: string) => (
        <Tag
          color={
            estado === 'Agotado'
              ? 'error'
              : estado === 'Bajo'
              ? 'warning'
              : 'success'
          }
        >
          {estado}
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
      case 'rotacion':
        return rotacionColumns
      case 'compras':
        return comprasColumns
      case 'baja-rotacion':
        return bajaRotacionColumns
      case 'rupturas':
        return rupturasColumns
      default:
        return rotacionColumns
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
        case 'rotacion':
          result = await getReporteInventarioRotacion(filtersWithEmpresa)
          break
        case 'compras':
          result = await getReporteInventarioCompras(filtersWithEmpresa)
          break
        case 'baja-rotacion':
          // Convertir dias_minimos a número si viene como string
          const diasMinimos = filters['dias_minimos']
            ? parseInt(String(filters['dias_minimos']), 10)
            : undefined
          // Si categoría está vacía, no enviar el filtro
          const categoriaFilter =
            filters['categoria'] && filters['categoria'].trim() !== ''
              ? filters['categoria']
              : undefined
          result = await getReporteInventarioBajaRotacion({
            ...filtersWithEmpresa,
            categoria: categoriaFilter,
            dias_minimos: diasMinimos,
          })
          break
        case 'rupturas':
          result = await getReporteInventarioRupturas(filtersWithEmpresa)
          break
        default:
          result = await getReporteInventarioRotacion(filtersWithEmpresa)
      }

      setData(result)

      // Extraer categorías únicas de los datos para el dropdown
      if (reportType === 'baja-rotacion' && result && result.length > 0) {
        const categoriasUnicas = new Set<string>()
        result.forEach((item: any) => {
          if (item.categoria) {
            categoriasUnicas.add(item.categoria)
          }
        })
        setCategorias(Array.from(categoriasUnicas).sort())
      }
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

  // Resetear filtros cuando cambia el tipo de reporte
  useEffect(() => {
    setFilters({})
  }, [selectedReport])

  const handleExportExcel = () => {
    const reportType = reportTypes.find(r => r.key === selectedReport)
    const fileName = `reportes2_inventario_${reportType?.title
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

  // Preparar opciones de categorías para el dropdown
  const categoriasDisponibles = useMemo(() => {
    return categorias.map(cat => ({ value: cat, label: cat }))
  }, [categorias])

  const getFilterConfigs = () => {
    // Agregar filtro de categoría como dropdown solo para baja rotación
    if (selectedReport === 'baja-rotacion') {
      return [
        {
          type: 'select' as const,
          key: 'categoria',
          placeholder: 'Seleccionar categoría',
          width: '25%',
          options: [
            { value: '', label: 'Todas las categorías' },
            ...categoriasDisponibles,
          ],
          allowClear: true,
        },
        {
          type: 'text' as const,
          key: 'dias_minimos',
          placeholder: 'Días mínimos sin rotación (default: 30)',
          width: '25%',
        },
      ]
    }

    // Para otros reportes, mantener el filtro de texto de categoría
    return [
      {
        type: 'text' as const,
        key: 'categoria',
        placeholder: 'Categoría',
        width: '25%',
      },
    ]
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
        <PageHeader title='Inventario Avanzado' showNewButton={false} />

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

export default withAuth(Reportes2InventarioPage)
