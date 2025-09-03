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
import { useStock } from '@/app/hooks/useHooks'
import { useRouter } from 'next/navigation'
import { queryClient, QueryKey } from '@/app/utils/query'
import { Card, message, Space, Button } from 'antd'
import { motion } from 'framer-motion'
import { deleteStock, StockTypeUpdate, updateStock } from '@/app/api/stock'
import { StockColumns, StockFilterConfigs } from '../../model/stockTableModel'
import * as XLSX from 'xlsx'

function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})

  const router = useRouter()

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
      Producto: stock.producto,
      'Producto ID': stock.producto_id,
      'Codigo Producto  ': stock.codigo_producto,
      'Creado por (Usuario)': stock.usuario,
      'Cantidad del movimiento': stock.cantidad,
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
              title='Historial de Movimientos'
              onNewClick={handleNewClick}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: -30,
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

          <FilterSection
            filters={StockFilterConfigs}
            onFilterChange={onFilterChange}
          />

          <DataTable
            data={dataStock || []}
            columns={StockColumns}
            onDelete={handleDelete}
            loading={stockLoading || isLoading}
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
