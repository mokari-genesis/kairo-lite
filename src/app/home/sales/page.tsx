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
import { useState, useEffect } from 'react'
import { useSales, useMetodosPago } from '@/app/hooks/useHooks'
import { Card, Col, Row, Space, Button, message } from 'antd'
import { motion } from 'framer-motion'
import { Salescolumns, SalesfilterConfigs } from '@/app/model/salesTableModel'
import { SummaryCards } from '../../components/SummaryCards'
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
      'Metodo de pago': sale.metodo_pago,
      'Tipo de precio aplicado': sale.tipo_precio_aplicado,
      Precio: sale.precio_unitario,
      'Total venta': sale.total_venta,
      'Referencia de pago': sale.referencia_pago,
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
        const method = curr.metodo_pago || 'Sin método'
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

    // Debug: mostrar los métodos encontrados
    console.log('Métodos de pago encontrados:', sortedMethods)

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
            <PageHeader title='Reporte de Ventas' showNewButton={false} />
            <Button
              type='primary'
              onClick={handleExportExcel}
              icon={<span>📊</span>}
            >
              Exportar a Excel
            </Button>
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

          <SummaryCards
            items={[
              {
                title: 'Total ventas generadas',
                value:
                  dataSales
                    ?.filter(sale => sale.estado_venta === 'generado')
                    .reduce(
                      (acc, curr) => acc + (parseFloat(curr.total_venta) || 0),
                      0
                    ) || 0,
                prefix: '$ ',
                color: '#1890ff',
              },
              {
                title: 'Total ventas confirmadas',
                value:
                  dataSales
                    ?.filter(sale => sale.estado_venta === 'vendido')
                    .reduce(
                      (acc, curr) => acc + (parseFloat(curr.total_venta) || 0),
                      0
                    ) || 0,
                prefix: '$ ',
                color: '#52c41a',
              },
              {
                title: 'Total ventas canceladas',
                value:
                  dataSales
                    ?.filter(sale => sale.estado_venta === 'cancelado')
                    .reduce(
                      (acc, curr) => acc + (parseFloat(curr.total_venta) || 0),
                      0
                    ) || 0,
                prefix: '$ ',
                color: '#f5222d',
              },
            ]}
          />
          <SummaryCards
            items={[
              {
                title: 'Producto más vendido',
                value: (() => {
                  const soldProducts =
                    dataSales?.filter(
                      sale => sale.estado_venta === 'vendido'
                    ) || []
                  if (soldProducts.length === 0) return 'No hay ventas'

                  const productCounts = soldProducts.reduce(
                    (acc: Record<string, number>, curr) => {
                      const productName =
                        curr.producto_descripcion || 'Desconocido'
                      acc[productName] =
                        (acc[productName] || 0) + (curr.cantidad || 0)
                      return acc
                    },
                    {}
                  )

                  const sortedProducts = Object.entries(productCounts).sort(
                    (a, b) => b[1] - a[1]
                  )
                  const [mostSoldProduct, quantity] = sortedProducts[0] || [
                    'No hay ventas',
                    0,
                  ]

                  return `${mostSoldProduct} (${quantity} unidades)`
                })(),
                color: '#112345',
              },
            ]}
          />

          {/* Métodos de Pago Section */}
          <SummaryCards
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
          />
        </Space>
      </Card>
    </motion.div>
  )
}

export default withAuth(HomeSales)
