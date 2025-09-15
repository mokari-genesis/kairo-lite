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
import { useState } from 'react'
import { useSales } from '@/app/hooks/useHooks'
import { Card, Col, Row, Space, Button, message } from 'antd'
import { motion } from 'framer-motion'
import { Salescolumns, SalesfilterConfigs } from '@/app/model/salesTableModel'
import { SummaryCards } from '../../components/SummaryCards'
import * as XLSX from 'xlsx'

function HomeSales() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})

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
            filters={SalesfilterConfigs}
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
                prefix: 'Q ',
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
                prefix: 'Q ',
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
                prefix: 'Q ',
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
        </Space>
      </Card>
    </motion.div>
  )
}

export default withAuth(HomeSales)
