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
import { useEffect, useState, useRef, useMemo } from 'react'
import { useProducts } from '@/app/hooks/useHooks'
import { useRouter } from 'next/navigation'
import {
  deleteProduct,
  updateProduct,
  UpdateProductRequest,
} from '@/app/api/products'
import { queryClient, QueryKey } from '@/app/utils/query'
import {
  Card,
  message,
  notification,
  Space,
  Button,
  Row,
  Col,
  Modal,
  Statistic,
  Badge,
  Tag,
} from 'antd'
import { motion } from 'framer-motion'
import { columns } from '@/app/model/productsTableModel'
import { filterConfigs } from '@/app/model/productsTableModel'
import { ProductoPreciosManager } from '@/app/components/ProductoPreciosManager'
import * as XLSX from 'xlsx'
import {
  ProductOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BankOutlined,
  InboxOutlined,
  TagOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import { formatCurrency } from '@/app/utils/currency'
import { useEmpresa } from '@/app/empresaContext'

function Home() {
  const [api, contextHolder] = notification.useNotification()
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const hasCheckedStock = useRef(false)
  const [preciosModalVisible, setPreciosModalVisible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  const router = useRouter()
  const { empresaId } = useEmpresa()

  const handleNewClick = () => {
    router.push('/home/products/new')
  }

  const handleEdit = async (record: any) => {
    try {
      setIsLoading(true)
      const updateData: UpdateProductRequest = {
        product_id: record.id,
        empresa_id: empresaId ?? 1,
        codigo: record.codigo,
        serie: record.serie,
        descripcion: record.descripcion,
        categoria: record.categoria,
        estado: record.estado,
        // stock ya no se envía al backend - se gestiona únicamente por movimientos_inventario
        precio: record.precio,
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
    try {
      setIsLoading(true)
      await deleteProduct(record.id)
      await queryClient.invalidateQueries({ queryKey: [QueryKey.productsInfo] })
      message.success('Producto eliminado exitosamente')
    } catch (error: any) {
      message.error(error.message || 'Error al eliminar el producto')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManagePrecios = (record: any) => {
    setSelectedProduct(record)
    setPreciosModalVisible(true)
  }

  const handleProductUpdate = async (updatedProduct: any) => {
    // Invalidar las queries para refrescar la tabla de productos
    await queryClient.invalidateQueries({
      queryKey: [QueryKey.productsInfo, filters],
    })
    // Actualizar el producto seleccionado con los nuevos datos
    setSelectedProduct(updatedProduct)
  }

  const onFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  const { data: dataProducts, isLoading: productLoading } = useProducts(filters)

  // Calcular estadísticas de productos
  const productsStats = useMemo(() => {
    if (!dataProducts || dataProducts.length === 0) {
      return {
        totalProductos: 0,
        productosActivos: 0,
        productosInactivos: 0,
        stockTotal: 0,
        stockBajo: 0,
        stockAgotado: 0,
        valorInventario: 0,
      }
    }

    const totalProductos = dataProducts.length
    const productosActivos = dataProducts.filter(
      product => product.estado === 'activo'
    ).length
    const productosInactivos = dataProducts.filter(
      product => product.estado === 'inactivo'
    ).length

    const stockTotal = dataProducts.reduce(
      (sum, product) => sum + product.stock,
      0
    )
    const stockBajo = dataProducts.filter(
      product => product.stock > 0 && product.stock <= 5
    ).length
    const stockAgotado = dataProducts.filter(
      product => product.stock === 0
    ).length

    const valorInventario = dataProducts.reduce(
      (sum, product) => sum + product.stock * product.precio,
      0
    )

    return {
      totalProductos,
      productosActivos,
      productosInactivos,
      stockTotal,
      stockBajo,
      stockAgotado,
      valorInventario,
    }
  }, [dataProducts])

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
      Precio_sugerido: formatCurrency('VES', product.precio),
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
              message: `Producto sin stock`,
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
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <PageHeader title='Productos' onNewClick={handleNewClick} />
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
          <Row gutter={[16, 16]}>
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
                      Total Productos
                    </span>
                  }
                  value={productsStats.totalProductos}
                  prefix={<ProductOutlined style={{ color: 'white' }} />}
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
                      Productos Activos
                    </span>
                  }
                  value={productsStats.productosActivos}
                  prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
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
                      Productos Inactivos
                    </span>
                  }
                  value={productsStats.productosInactivos}
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
                    <span style={{ color: 'white', opacity: 0.9 }}>
                      Stock Total (Sucursal)
                    </span>
                  }
                  value={productsStats.stockTotal}
                  prefix={<InboxOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Segunda fila de estadísticas */}
          <Row gutter={[16, 16]}>
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
                      Stock Bajo (Sucursal)
                    </span>
                  }
                  value={productsStats.stockBajo}
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
                      Stock Agotado (Sucursal)
                    </span>
                  }
                  value={productsStats.stockAgotado}
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
                    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#333',
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: '#333', opacity: 0.8 }}>
                      Valor Inventario Sucursal (precio sugerido)
                    </span>
                  }
                  value={formatCurrency('VES', productsStats.valorInventario)}
                  precision={2}
                  prefix={<BankOutlined style={{ color: '#333' }} />}
                  valueStyle={{ color: '#333' }}
                />
              </Card>
            </Col>
          </Row>

          <FilterSection
            filters={filterConfigs}
            onFilterChange={onFilterChange}
          />

          <DataTable
            data={dataProducts || []}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onManagePrecios={handleManagePrecios}
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

        <Modal
          title='Gestión de Precios'
          open={preciosModalVisible}
          onCancel={() => setPreciosModalVisible(false)}
          footer={null}
          width='80%'
          style={{ top: 20 }}
        >
          {selectedProduct && (
            <ProductoPreciosManager
              productoId={selectedProduct.id}
              productoDescripcion={selectedProduct.descripcion}
              productoData={selectedProduct}
              onClose={() => setPreciosModalVisible(false)}
              onProductUpdate={handleProductUpdate}
            />
          )}
        </Modal>
      </Card>
      {contextHolder}
    </motion.div>
  )
}

export default withAuth(Home)
