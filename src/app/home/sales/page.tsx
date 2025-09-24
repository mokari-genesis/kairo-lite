/**
 *  PRODUCTOS PAGE
 * */
'use client'
import '../../globals.css'
import '@ant-design/v5-patch-for-react-19'
import { DataTable } from '../../components/DataTable'
import { FilterSection } from '../../components/FilterSection'
import { PageHeader } from '../../components/PageHeader'
import { withAuth } from '../../auth/withAuth'
import { useState, useEffect, useMemo } from 'react'
import { useSales, useMetodosPago } from '@/app/hooks/useHooks'
import { Card, Col, Row, Space, Button, message, Statistic } from 'antd'
import { motion } from 'framer-motion'
import {
  ShoppingCartOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { Salescolumns, SalesfilterConfigs } from '@/app/model/salesTableModel'
import * as XLSX from 'xlsx'

function HomeSales() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [filterConfigs, setFilterConfigs] = useState(SalesfilterConfigs)

  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page)
    setPageSize(pageSize)
  }

  const onFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  const handleExportExcel = () => {
    if (!dataSales || dataSales.length === 0) {
      message.warning('No hay datos para exportar')
      return
    }

    // Preparar los datos para Excel
    const excelData = dataSales.map(sale => ({
      'ID Venta': sale.id_venta,
      'Nombre Cliente': sale.cliente_nombre,
      'NIT Cliente': sale.cliente_nit,
      'Email Cliente': sale.cliente_email,
      'Tipo Cliente': sale.cliente_tipo,
      'Teléfono Cliente': sale.cliente_telefono,
      'Fecha de Venta': sale.fecha_venta,
      'Código Producto': sale.producto_codigo,
      'Serie Producto': sale.producto_serie,
      'Categoría Producto': sale.producto_categoria,
      'Descripción Producto': sale.producto_descripcion,
      'Estado de la venta': sale.estado_venta,
      'Cantidad vendida': sale.cantidad,
      'Metodo de pago': sale.metodos_pago,
      'Tipo de precio aplicado': sale.tipo_precio_aplicado,
      Precio: sale.precio_unitario,
      'Total venta': sale.total_venta,
      Comentario: sale.comentario,
    }))

    // Crear libro de Excel
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas')

    // Generar archivo
    XLSX.writeFile(wb, 'Reporte de ventas.xlsx')
    message.success('Archivo exportado exitosamente')
  }

  const { data: dataSales, isLoading: salesLoading } = useSales(filters)
  const { data: metodosPago, isLoading: metodosPagoLoading } = useMetodosPago()

  // Función para calcular estadísticas de métodos de pago
  const getPaymentMethodStats = () => {
    if (!dataSales || dataSales.length === 0) {
      return { mostUsed: null, leastUsed: null }
    }

    const soldSales = dataSales.filter(sale => sale.estado_venta === 'vendido')

    if (soldSales.length === 0) {
      return { mostUsed: null, leastUsed: null }
    }

    // Agrupar por método de pago
    const paymentMethodCounts = soldSales.reduce(
      (acc: Record<string, { count: number; total: number }>, curr) => {
        const method = curr.metodos_pago || 'Sin método'
        if (!acc[method]) {
          acc[method] = { count: 0, total: 0 }
        }
        acc[method].count += 1
        acc[method].total += parseFloat(curr.total_venta) || 0
        return acc
      },
      {}
    )

    // Convertir a array y ordenar por cantidad de ventas
    const sortedMethods = Object.entries(paymentMethodCounts)
      .map(([method, stats]) => ({
        method,
        count: Math.round(stats.count), // Asegurar que sea entero
        total: Math.round(stats.total * 100) / 100, // Redondear a 2 decimales
      }))
      .sort((a, b) => b.count - a.count)

    // Si solo hay un método de pago, mostrar solo el más usado
    if (sortedMethods.length === 1) {
      return {
        mostUsed: sortedMethods[0],
        leastUsed: null, // No hay método menos usado si solo hay uno
      }
    }

    // Si hay múltiples métodos, mostrar el más y menos usado
    return {
      mostUsed: sortedMethods[0] || null,
      leastUsed: sortedMethods[sortedMethods.length - 1] || null,
    }
  }

  const paymentStats = getPaymentMethodStats()

  // Calcular estadísticas de ventas
  const salesStats = useMemo(() => {
    if (!dataSales || dataSales.length === 0) {
      return {
        totalRegistros: 0,
        totalVentasConfirmadas: 0,
        totalVentasCanceladas: 0,
        promedioVenta: 0,
        ventasCompletadas: 0,
        totalClientes: 0,
      }
    }

    const totalRegistros = dataSales.length
    const ventasConfirmadas = dataSales.filter(
      sale => sale.estado_venta === 'vendido'
    )
    const ventasCanceladas = dataSales.filter(
      sale => sale.estado_venta === 'cancelado'
    )

    const totalVentasConfirmadas = ventasConfirmadas.reduce(
      (sum, sale) => sum + (parseFloat(sale.total_venta) || 0),
      0
    )
    const totalVentasCanceladas = ventasCanceladas.reduce(
      (sum, sale) => sum + (parseFloat(sale.total_venta) || 0),
      0
    )

    const promedioVenta =
      ventasConfirmadas.length > 0
        ? totalVentasConfirmadas / ventasConfirmadas.length
        : 0

    const ventasCompletadas = ventasConfirmadas.length
    const totalClientes = new Set(dataSales.map(sale => sale.cliente_nombre))
      .size

    return {
      totalRegistros,
      totalVentasConfirmadas,
      totalVentasCanceladas,
      promedioVenta,
      ventasCompletadas,
      totalClientes,
    }
  }, [dataSales])

  // Función para generar colores únicos basados en el ID de venta
  const generateColorForSalesId = (salesId: string | number): string => {
    const colors = [
      '#d6f7ff', // Azul más fuerte
      '#d9f7be', // Verde más fuerte
      '#ffd8bf', // Naranja más fuerte
      '#efdbff', // Púrpura más fuerte
      '#fff1b8', // Amarillo más fuerte
      '#bae7ff', // Azul más visible
      '#d9f7be', // Verde más visible
      '#ffccc7', // Rojo más visible
      '#efdbff', // Púrpura más visible
      '#fff1b8', // Amarillo más visible
    ]

    // Convertir el ID a un número y usar módulo para obtener un índice
    const idStr = String(salesId)
    let hash = 0
    for (let i = 0; i < idStr.length; i++) {
      const char = idStr.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convertir a 32bit integer
    }

    return colors[Math.abs(hash) % colors.length]
  }

  // Función para obtener la clase CSS de la fila basada en el ID de venta
  const getRowClassName = (record: any, index: number): string => {
    const salesId = record.id_venta
    if (!salesId) return ''

    // Contar cuántas veces aparece este ID de venta
    const salesIdCount =
      dataSales?.filter(sale => sale.id_venta === salesId).length || 0

    // Si solo aparece una vez, usar clase blanca
    if (salesIdCount === 1) {
      return 'sales-row-unique'
    }

    return `sales-row-${salesId}`
  }

  // Cargar opciones de métodos de pago dinámicamente
  useEffect(() => {
    if (metodosPago && metodosPago.length > 0) {
      const paymentMethodOptions = metodosPago
        .filter(metodo => metodo.activo)
        .map(metodo => ({
          value: metodo.nombre,
          label: metodo.nombre,
        }))

      setFilterConfigs(prevConfigs =>
        prevConfigs.map(config =>
          config.key === 'metodo_pago'
            ? { ...config, options: paymentMethodOptions }
            : config
        )
      )
    }
  }, [metodosPago])

  // Generar estilos CSS dinámicos para las filas agrupadas por ID de venta
  useEffect(() => {
    if (!dataSales || dataSales.length === 0) return

    // Obtener IDs de venta únicos
    const uniqueSalesIds = [...new Set(dataSales.map(sale => sale.id_venta))]

    // Filtrar solo los IDs que aparecen más de una vez (ventas con múltiples productos)
    const groupedSalesIds = uniqueSalesIds.filter(salesId => {
      const count = dataSales.filter(sale => sale.id_venta === salesId).length
      return count > 1
    })

    // Crear estilos CSS dinámicos
    const styleId = 'sales-row-styles'
    let styleElement = document.getElementById(styleId)

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    // Generar CSS: blanco para filas únicas y colores para ventas agrupadas
    const cssRules = [
      // Estilo para filas únicas (blanco)
      '.sales-row-unique { background-color: #ffffff !important; }',
      // Estilos para ventas agrupadas (con colores)
      ...groupedSalesIds.map(salesId => {
        const backgroundColor = generateColorForSalesId(salesId)
        return `.sales-row-${salesId} { background-color: ${backgroundColor} !important; }`
      }),
    ].join('\n')

    styleElement.textContent = cssRules
  }, [dataSales])

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
        <Space direction='vertical' size='large' style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <PageHeader
              title='Reporte de Ventas (Productos)'
              showNewButton={false}
            />
            <Button
              type='primary'
              onClick={handleExportExcel}
              icon={<span>📊</span>}
            >
              Exportar a Excel
            </Button>
          </div>

          {/* Tarjetas de Estadísticas */}
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
                      Total Registros
                    </span>
                  }
                  value={salesStats.totalRegistros}
                  prefix={<DatabaseOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
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
                      Ventas Confirmadas
                    </span>
                  }
                  value={salesStats.totalVentasConfirmadas}
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
                      Ventas Canceladas
                    </span>
                  }
                  value={salesStats.totalVentasCanceladas}
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
                    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: 'white', opacity: 0.9 }}>
                      Promedio por Venta
                    </span>
                  }
                  value={salesStats.promedioVenta}
                  precision={2}
                  prefix={<BarChartOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Segunda fila de estadísticas */}
          <Row
            gutter={[16, 16]}
            justify='center'
            style={{ marginBottom: '24px' }}
          >
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
                      Ventas Completadas
                    </span>
                  }
                  value={salesStats.ventasCompletadas}
                  prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
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
                      Total Clientes
                    </span>
                  }
                  value={salesStats.totalClientes}
                  prefix={<UserOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
          </Row>

          <div
            style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              fontSize: '13px',
              color: '#6c757d',
              fontStyle: 'italic',
            }}
          >
            💡 <strong>Nota:</strong> Las filas con el mismo color de fondo
            pertenecen a la misma venta. Las filas blancas representan ventas
            con un solo producto.
          </div>
          <FilterSection
            filters={filterConfigs}
            onFilterChange={onFilterChange}
          />

          <DataTable
            data={dataSales || []}
            showActions={false}
            columns={Salescolumns}
            loading={salesLoading}
            rowClassName={getRowClassName}
            pagination={{
              total: dataSales?.length || 0,
              pageSize,
              current: currentPage,
              onChange: handlePageChange,
            }}
            expandable={{
              expandedRowRender: record => (
                <div
                  style={{
                    padding: '16px',
                    background: '#fafafa',
                    borderRadius: '4px',
                    margin: '8px 0',
                  }}
                >
                  <Row>
                    <Col span={12}>
                      <h4 style={{ marginBottom: '12px' }}>
                        Detalles del cliente
                      </h4>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <p style={{ margin: 0 }}>
                          <strong>NIT Cliente:</strong> {record.cliente_nit}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>Email Cliente:</strong> {record.cliente_email}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>Telefono Cliente:</strong>{' '}
                          {record.cliente_telefono}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>Tipo Cliente:</strong> {record.cliente_tipo}
                        </p>
                      </div>
                    </Col>
                    <Col span={12}>
                      <h4 style={{ marginBottom: '12px' }}>
                        Detalles de la venta
                      </h4>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <p style={{ margin: 0 }}>
                          <strong>Codigo producto:</strong>{' '}
                          {record.producto_codigo}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>Serie Producto:</strong>{' '}
                          {record.producto_serie}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>Categoria Producto:</strong>{' '}
                          {record.producto_categoria}
                        </p>
                      </div>
                    </Col>
                  </Row>
                </div>
              ),
              expandRowByClick: false,
              rowExpandable: () => true,
            }}
          />

          {/* Métodos de Pago Section */}
          {/* <SummaryCards
            items={[
              {
                title: 'Método Más Usado',
                value: paymentStats.mostUsed?.method || 'No hay datos',
                color: '#52c41a',
              },
              {
                title: 'Cantidad de Ventas',
                value: paymentStats.mostUsed?.count || 0,
                prefix: '',
                color: '#52c41a',
                isInteger: true,
              },
              {
                title: 'Total Ventas',
                value: paymentStats.mostUsed?.total || 0,
                prefix: '$ ',
                color: '#52c41a',
              },
              {
                title: 'Método Menos Usado',
                value: paymentStats.leastUsed?.method || 'Solo hay un método',
                color: '#ff4d4f',
              },
              {
                title: 'Cantidad de Ventas',
                value: paymentStats.leastUsed?.count || 0,
                prefix: '',
                color: '#ff4d4f',
                isInteger: true,
              },
              {
                title: 'Total Ventas',
                value: paymentStats.leastUsed?.total || 0,
                prefix: '$ ',
                color: '#ff4d4f',
              },
            ]}
            style={{
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
            }}
          /> */}
        </Space>
      </Card>
    </motion.div>
  )
}

export default withAuth(HomeSales)
