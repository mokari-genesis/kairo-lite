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
import { useEffect, useState, useRef } from 'react'
import { useProducts } from '@/app/hooks/useHooks'
import { useRouter } from 'next/navigation'
import {
  deleteProduct,
  updateProduct,
  UpdateProductRequest,
} from '@/app/api/products'
import { queryClient, QueryKey } from '@/app/utils/query'
import { Card, message, notification, Space, Button, Row, Col } from 'antd'
import { motion } from 'framer-motion'
import { columns } from '@/app/model/productsTableModel'
import { filterConfigs } from '@/app/model/productsTableModel'
import * as XLSX from 'xlsx'

function Home() {
  const [api, contextHolder] = notification.useNotification()
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const hasCheckedStock = useRef(false)

  const router = useRouter()

  const handleNewClick = () => {
    router.push('/home/products/new')
  }

  const handleEdit = async (record: any) => {
    try {
      setIsLoading(true)
      const updateData: UpdateProductRequest = {
        product_id: record.id,
        empresa_id: 1,
        codigo: record.codigo,
        serie: record.serie,
        descripcion: record.descripcion,
        categoria: record.categoria,
        estado: record.estado,
        stock: record.stock,
        proveedor_id: record.proveedor_id,
      }
      await updateProduct(updateData)
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.productsInfo, filters],
      })
      message.success('Producto actualizado exitosamente')
    } catch (error: any) {
      message.error(error.message || 'Error al actualizar el producto')
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
      message.error('No se puede eliminar el producto')
      return
    }
    setIsLoading(true)
    await deleteProduct(record.id)
    await queryClient.invalidateQueries({ queryKey: [QueryKey.productsInfo] })
    message.success('Producto eliminado exitosamente')
    setIsLoading(false)
  }

  const onFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  const { data: dataProducts, isLoading: productLoading } = useProducts(filters)

  const handleExportExcel = () => {
    if (!dataProducts || dataProducts.length === 0) {
      message.warning('No hay datos para exportar')
      return
    }

    // Preparar los datos para Excel
    const excelData = dataProducts.map(product => ({
      Código: product.codigo,
      Serie: product.serie,
      Descripción: product.descripcion,
      Categoría: product.categoria,
      Proveedor: product.nombre_proveedor || 'Sin proveedor',
      Estado: product.estado,
      Stock: product.stock,
    }))

    // Crear libro de Excel
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(wb, ws, 'Productos')

    // Generar archivo
    XLSX.writeFile(wb, 'productos.xlsx')
    message.success('Archivo exportado exitosamente')
  }

  useEffect(() => {
    if (
      !productLoading &&
      dataProducts &&
      dataProducts?.length > 0 &&
      !hasCheckedStock.current
    ) {
      const productsWithZeroStock = dataProducts.filter(
        product => product.stock === 0
      )
      if (productsWithZeroStock.length > 0) {
        productsWithZeroStock.forEach((item, index) => {
          setTimeout(() => {
            api.warning({
              message: `Producto con stock agotado`,
              description: `${item.descripcion}`,
              duration: 0,
            })
          }, (index + 1) * 1000)
        })
      }
      hasCheckedStock.current = true
    }
  }, [productLoading, dataProducts, api])

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
            <PageHeader title='Productos' onNewClick={handleNewClick} />
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
            filters={filterConfigs}
            onFilterChange={onFilterChange}
          />

          <DataTable
            data={dataProducts || []}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={productLoading || isLoading}
            pagination={{
              total: dataProducts?.length || 0,
              pageSize,
              current: currentPage,
              onChange: handlePageChange,
            }}
            showActions={true}
            showDelete={true}
          />
        </Space>
      </Card>
      {contextHolder}
    </motion.div>
  )
}

export default withAuth(Home)
