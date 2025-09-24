/**
 *  PROVEEDORES PAGE
 * */
'use client'
import '../../globals.css'
import '@ant-design/v5-patch-for-react-19'
import { DataTable } from '../../components/DataTable'
import { FilterSection } from '../../components/FilterSection'
import { PageHeader } from '../../components/PageHeader'
import { withAuth } from '../../auth/withAuth'
import { useState, useMemo } from 'react'
import { useSuppliers } from '@/app/hooks/useHooks'
import { useRouter } from 'next/navigation'
import { queryClient, QueryKey } from '@/app/utils/query'
import { Card, message, Space, Row, Col, Statistic, Button } from 'antd'
import { motion } from 'framer-motion'
import {
  SupplierColumns,
  SupplierFilterConfigs,
} from '@/app/model/suppliersTableModel'
import {
  deleteSupplier,
  updateSupplier,
  UpdateSupplierRequest,
} from '@/app/api/supplier'
import { ShopOutlined, GlobalOutlined, HomeOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'

function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})

  const router = useRouter()

  const handleNewClick = () => {
    router.push('/home/suppliers/new')
  }

  const handleEdit = async (record: any) => {
    try {
      setIsLoading(true)
      const updateData: UpdateSupplierRequest = {
        id: record.id,
        nombre: record.nombre,
        nit: record.nit,
        email: record.email,
        telefono: record.telefono,
        direccion: record.direccion,
        tipo: record.tipo,
      }
      await updateSupplier(updateData)
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.suppliersInfo, filters],
      })
      message.success('Proveedor actualizado exitosamente')
    } catch (error: any) {
      message.error(error.message || 'Error al actualizar el proveedor')
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
      message.error('No se puede eliminar el proveedor')
      return
    }
    try {
      setIsLoading(true)
      await deleteSupplier(record.id)
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.suppliersInfo],
      })
      message.success('Proveedor eliminado exitosamente')
    } catch (error: any) {
      console.error('Error deleting supplier:', error)

      // Check if it's a foreign key constraint error
      if (
        error.message &&
        (error.message.includes('foreign key') ||
          error.message.includes('llave foránea') ||
          error.message.includes('constraint') ||
          error.message.includes('referenced'))
      ) {
        message.error(
          'No se puede eliminar el proveedor porque tiene productos asociados. Primero elimine o cambie el proveedor de los productos relacionados.'
        )
      } else {
        message.error(error.message || 'Error al eliminar el proveedor')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const onFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  const { data: dataSuppliers, isLoading: supplierLoading } =
    useSuppliers(filters)

  // Calcular estadísticas de proveedores
  const suppliersStats = useMemo(() => {
    if (!dataSuppliers || dataSuppliers.length === 0) {
      return {
        totalProveedores: 0,
        proveedoresNacionales: 0,
        proveedoresInternacionales: 0,
      }
    }

    const totalProveedores = dataSuppliers.length
    const proveedoresNacionales = dataSuppliers.filter(
      supplier => supplier.tipo === 'nacional'
    ).length
    const proveedoresInternacionales = dataSuppliers.filter(
      supplier => supplier.tipo === 'internacional'
    ).length

    return {
      totalProveedores,
      proveedoresNacionales,
      proveedoresInternacionales,
    }
  }, [dataSuppliers])

  const handleExportExcel = () => {
    if (!dataSuppliers || dataSuppliers.length === 0) {
      message.warning('No hay datos para exportar')
      return
    }

    // Preparar los datos para Excel
    const excelData = dataSuppliers.map(supplier => ({
      ID: supplier.id,
      Nombre: supplier.nombre,
      NIT: supplier.nit,
      Email: supplier.email,
      Teléfono: supplier.telefono,
      Dirección: supplier.direccion,
      Tipo: supplier.tipo,
    }))

    // Crear libro de Excel
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(wb, ws, 'Proveedores')

    // Generar archivo
    XLSX.writeFile(wb, 'proveedores.xlsx')
    message.success('Archivo exportado exitosamente')
  }

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
            <PageHeader title='Proveedores' onNewClick={handleNewClick} />
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
                      Total Proveedores
                    </span>
                  }
                  value={suppliersStats.totalProveedores}
                  prefix={<ShopOutlined style={{ color: 'white' }} />}
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
                      Nacionales
                    </span>
                  }
                  value={suppliersStats.proveedoresNacionales}
                  prefix={<HomeOutlined style={{ color: 'white' }} />}
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
                      Internacionales
                    </span>
                  }
                  value={suppliersStats.proveedoresInternacionales}
                  prefix={<GlobalOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
          </Row>

          <FilterSection
            filters={SupplierFilterConfigs}
            onFilterChange={onFilterChange}
          />

          <DataTable
            data={dataSuppliers || []}
            columns={SupplierColumns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={supplierLoading || isLoading}
            pagination={{
              total: dataSuppliers?.length || 0,
              pageSize,
              current: currentPage,
              onChange: handlePageChange,
            }}
            showActions={true}
            showDelete={true}
          />
        </Space>
      </Card>
    </motion.div>
  )
}

export default withAuth(Home)
