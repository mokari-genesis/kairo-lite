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
import { useStock } from '@/app/hooks/useHooks'
import { useRouter } from 'next/navigation'
import { queryClient, QueryKey } from '@/app/utils/query'
import { Card, message, Space, Button, Row, Col, Statistic, Tag } from 'antd'
import { motion } from 'framer-motion'
import {
  deleteStock,
  StockTypeUpdate,
  updateStock,
  StockType,
} from '@/app/api/stock'
import { StockColumns, StockFilterConfigs } from '../../model/stockTableModel'
import {
  InboxOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'
import { useTheme } from '../../themeContext'
import { generateColorForId, getUniqueRowColor } from '../../utils/themeColors'
import { getMonedas, Moneda } from '@/app/api/monedas'
import {
  formatCurrency,
  convertirAMonedaBase,
  obtenerMonedaBase,
} from '@/app/utils/currency'
import { ColumnConfig } from '@/app/components/DataTable'

function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [monedaBase, setMonedaBase] = useState<Moneda | null>(null)

  const router = useRouter()

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

  const handleNewClick = () => {
    router.push('/home/stock/new')
  }

  const handleEdit = async (record: any) => {
    try {
      setIsLoading(true)
      const updateData: StockTypeUpdate = {
        id: record.id,
        product_id: record.producto_id,
        movement_type: record.tipo_movimiento,
        quantity: record.cantidad,
        comment: record.comentario,
      }
      await updateStock(updateData)
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.stockInfo, filters],
      })
      await queryClient.invalidateQueries({ queryKey: [QueryKey.productsInfo] })
      message.success('Movimiento actualizado exitosamente')
    } catch (error: any) {
      message.error(error.message || 'Error al actualizar el movimiento')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page)
    setPageSize(pageSize)
  }

  const handleDelete = async (record: any) => {
    if (!record.id) {
      message.error('No se puede eliminar el movimiento')
      return
    }
    setIsLoading(true)
    await deleteStock(record.id)
    await queryClient.invalidateQueries({
      queryKey: [QueryKey.stockInfo, filters],
    })
    await queryClient.invalidateQueries({ queryKey: [QueryKey.productsInfo] })
    message.success('Producto eliminado exitosamente')
    setIsLoading(false)
  }

  const onFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  const handleExportExcel = () => {
    if (!dataStock || dataStock.length === 0) {
      message.warning('No hay datos para exportar')
      return
    }

    // Preparar los datos para Excel
    const excelData = dataStock.map(stock => ({
      'ID de venta': stock.venta_id,
      'ID Compra': stock.compra_id || '',
      'ID Sucursal': stock.empresa_id,
      Sucursal: stock.empresa,
      Producto: stock.producto,
      'Producto ID': stock.producto_id,
      'Codigo Producto  ': stock.codigo_producto,
      'Creado por (Usuario)': stock.usuario,
      'Cantidad del movimiento': stock.cantidad,
      'Precio Compra': stock.precio_compra || 0,
      Moneda: stock.moneda_codigo || 'USD',
      'Total Compra': stock.total_compra || 0,
      'Stock Actual': stock.stock_actual,
      'Stock antes del Movimiento': stock.stock_movimiento,
      'Tipo de Movimiento': stock.tipo_movimiento,
      Fecha: stock.fecha,
      Comentario: stock.comentario,
    }))

    // Crear libro de Excel
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos de Stock')

    // Generar archivo
    XLSX.writeFile(wb, 'movimientos_stock.xlsx')
    message.success('Archivo exportado exitosamente')
  }

  const { data: dataStock, isLoading: stockLoading } = useStock(filters)

  // Columnas personalizadas con conversión a moneda base
  const columnsWithCurrencyConversion = useMemo(() => {
    // Función helper para calcular monto en moneda base (USD)
    const calcularMontoBase = (value: number, record: StockType): number => {
      if (!monedas || !monedaBase || value <= 0 || !record.moneda_codigo) {
        return 0
      }

      const monedaMovimiento = monedas.find(
        m => m.codigo === record.moneda_codigo
      )
      if (!monedaMovimiento) return 0

      // Si la moneda del movimiento es la base, retornar directamente
      if (monedaMovimiento.id === monedaBase.id) {
        return value
      }

      // Convertir de moneda movimiento a base (USD)
      return convertirAMonedaBase(value, monedaMovimiento, monedaBase)
    }

    // Reemplazar las columnas de precio_compra y total_compra con versiones personalizadas
    const columnsWithCustomCurrency = StockColumns.map(col => {
      if (col.key === 'precio_compra' || col.key === 'total_compra') {
        return {
          ...col,
          render: (value: any, record: StockType) => {
            const monedaCodigo = record.moneda_codigo || 'USD'
            const montoBase = calcularMontoBase(value, record)

            return (
              <Space direction='vertical' size={2} style={{ width: '100%' }}>
                <Space>
                  <DollarOutlined style={{ color: '#faad14' }} />
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {formatCurrency(monedaCodigo, Number(value || 0))}
                  </span>
                  {record.moneda_codigo && record.moneda_codigo !== 'USD' && (
                    <Tag
                      color='blue'
                      style={{ fontSize: '10px', marginLeft: '4px' }}
                    >
                      {monedaCodigo}
                    </Tag>
                  )}
                </Space>
                {monedaBase &&
                  record.moneda_codigo &&
                  record.moneda_codigo !== monedaBase.codigo &&
                  montoBase > 0 && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#8c8c8c',
                        fontStyle: 'italic',
                        marginLeft: '20px',
                      }}
                    >
                      {formatCurrency(monedaBase.codigo || 'USD', montoBase)}{' '}
                      (Moneda base)
                    </span>
                  )}
              </Space>
            )
          },
        }
      }
      return col
    })

    return columnsWithCustomCurrency
  }, [monedas, monedaBase])

  // Calcular estadísticas de movimientos
  const stockStats = useMemo(() => {
    if (!dataStock || dataStock.length === 0) {
      return {
        totalMovimientos: 0,
        movimientosEntrada: 0,
        movimientosSalida: 0,
        movimientosAjuste: 0,
      }
    }

    const totalMovimientos = dataStock.length
    const movimientosEntrada = dataStock.filter(
      stock => stock.tipo_movimiento === 'entrada'
    ).length
    const movimientosSalida = dataStock.filter(
      stock => stock.tipo_movimiento === 'salida'
    ).length
    const movimientosAjuste = dataStock.filter(
      stock => stock.tipo_movimiento === 'ajuste'
    ).length

    return {
      totalMovimientos,
      movimientosEntrada,
      movimientosSalida,
      movimientosAjuste,
    }
  }, [dataStock])

  const { theme: currentTheme } = useTheme()
  const isDark = currentTheme === 'dark'

  // Función para obtener la clase CSS de la fila basada en el ID de venta
  const getRowClassName = (record: any, index: number): string => {
    const salesId = record.venta_id
    if (!salesId) return ''

    // Contar cuántas veces aparece este ID de venta
    const salesIdCount =
      dataStock?.filter(stock => stock.venta_id === salesId).length || 0

    // Si solo aparece una vez, usar clase blanca
    if (salesIdCount === 1) {
      return 'stock-row-unique'
    }

    return `stock-row-${salesId}`
  }

  // Generar estilos CSS dinámicos para las filas agrupadas por ID de venta
  useEffect(() => {
    if (!dataStock || dataStock.length === 0) return

    // Obtener IDs de venta únicos
    const uniqueSalesIds = [...new Set(dataStock.map(stock => stock.venta_id))]

    // Filtrar solo los IDs que aparecen más de una vez (ventas con múltiples productos)
    const groupedSalesIds = uniqueSalesIds.filter(salesId => {
      const count = dataStock.filter(stock => stock.venta_id === salesId).length
      return count > 1
    })

    // Crear estilos CSS dinámicos
    const styleId = 'stock-row-styles'
    let styleElement = document.getElementById(styleId)

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    // Generar CSS: solo aplicar colores adaptativos en modo dark
    // En modo light, usar colores originales
    const cssRules = isDark
      ? [
          // Estilo para filas únicas (solo en dark mode)
          `.stock-row-unique { background-color: ${getUniqueRowColor(
            true
          )} !important; }`,
          // Estilos para ventas agrupadas (solo en dark mode)
          ...groupedSalesIds.map(salesId => {
            const backgroundColor = generateColorForId(salesId, true)
            return `.stock-row-${salesId} { background-color: ${backgroundColor} !important; }`
          }),
        ].join('\n')
      : [
          // En modo light, solo aplicar estilos para filas agrupadas (colores originales)
          ...groupedSalesIds.map(salesId => {
            const backgroundColor = generateColorForId(salesId, false)
            return `.stock-row-${salesId} { background-color: ${backgroundColor} !important; }`
          }),
        ].join('\n')

    styleElement.textContent = cssRules
  }, [dataStock, isDark])

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
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <PageHeader
              title='Historial de Movimientos'
              onNewClick={handleNewClick}
              showSucursalSelect={false}
            />
            <div
              style={{
                margin: 10,
                width: '100%',
                textAlign: 'right',
              }}
            >
              <Button
                type='primary'
                onClick={handleExportExcel}
                icon={<span>📊</span>}
              >
                Exportar a Excel
              </Button>
            </div>
          </div>

          {/* Tarjetas de Estadísticas */}
          <Row gutter={[16, 16]} justify='center'>
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
                      Total Movimientos
                    </span>
                  }
                  value={stockStats.totalMovimientos}
                  prefix={<InboxOutlined style={{ color: 'white' }} />}
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
                      Entradas
                    </span>
                  }
                  value={stockStats.movimientosEntrada}
                  prefix={<ArrowUpOutlined style={{ color: 'white' }} />}
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
                      Salidas
                    </span>
                  }
                  value={stockStats.movimientosSalida}
                  prefix={<ArrowDownOutlined style={{ color: 'white' }} />}
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
                      Ajustes
                    </span>
                  }
                  value={stockStats.movimientosAjuste}
                  prefix={<ToolOutlined style={{ color: 'white' }} />}
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
            pertenecen a la misma venta. Las filas blancas representan
            movimientos de ventas con un solo producto.
          </div>
          <FilterSection
            filters={StockFilterConfigs}
            onFilterChange={onFilterChange}
          />
          <DataTable
            data={dataStock || []}
            columns={columnsWithCurrencyConversion}
            onDelete={handleDelete}
            loading={stockLoading || isLoading}
            rowClassName={getRowClassName}
            pagination={{
              total: dataStock?.length || 0,
              pageSize,
              current: currentPage,
              onChange: handlePageChange,
            }}
            showActions={true}
          />
        </Space>
      </Card>
    </motion.div>
  )
}

export default withAuth(Home)
