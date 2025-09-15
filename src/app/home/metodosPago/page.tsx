/**
 *  MÉTODOS DE PAGO PAGE
 * */
'use client'
import '../../globals.css'
import '@ant-design/v5-patch-for-react-19'
import { DataTable } from '../../components/DataTable'
import { FilterSection } from '../../components/FilterSection'
import { PageHeader } from '../../components/PageHeader'
import { withAuth } from '../../auth/withAuth'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  getMetodosPago,
  createMetodoPago,
  updateMetodoPago,
  deleteMetodoPago,
  MetodoPago,
  CreateMetodoPagoRequest,
  UpdateMetodoPagoRequest,
} from '@/app/api/metodos-pago'
import { queryClient, QueryKey } from '@/app/utils/query'
import { Card, message, notification, Space, Button, Row, Col } from 'antd'
import { motion } from 'framer-motion'
import { columns, filterConfigs } from '@/app/model/metodosPagoTableModel'
import * as XLSX from 'xlsx'

function MetodosPagoPage() {
  const [api, contextHolder] = notification.useNotification()
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [data, setData] = useState<MetodoPago[]>([])
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleNewClick = () => {
    router.push('/home/metodosPago/new')
  }

  const handleEdit = async (record: any) => {
    try {
      setIsLoading(true)
      const updateData: UpdateMetodoPagoRequest = {
        id: record.id,
        nombre: record.nombre,
        activo:
          record.activo === true ||
          record.activo === 1 ||
          record.activo === '1' ||
          record.activo === 'true',
      }
      await updateMetodoPago(updateData)
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.metodosPagoInfo, filters],
      })
      // Recargar los datos de la tabla
      await fetchData()
      message.success('Método de pago actualizado exitosamente')
    } catch (error: any) {
      message.error(error.message || 'Error al actualizar el método de pago')
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
      message.error('No se puede eliminar el método de pago')
      return
    }
    setIsLoading(true)
    await deleteMetodoPago(record.id)
    await queryClient.invalidateQueries({
      queryKey: [QueryKey.metodosPagoInfo],
    })
    message.success('Método de pago eliminado exitosamente')
    setIsLoading(false)
  }

  const onFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const result = await getMetodosPago(filters)
      setData(result)
    } catch (error) {
      message.error('Error al cargar los métodos de pago')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters])

  const handleExportExcel = () => {
    const exportData = data.map(item => ({
      ID: item.id,
      Nombre: item.nombre,
      Estado: item.activo ? 'Activo' : 'Inactivo',
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Métodos de Pago')
    XLSX.writeFile(workbook, 'metodos_pago.xlsx')
    message.success('Archivo exportado exitosamente')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '24px' }}
    >
      {contextHolder}
      <Card
        variant='outlined'
        style={{
          borderRadius: '15px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <PageHeader
          title='Métodos de Pago'
          showNewButton={true}
          onNewClick={handleNewClick}
          newButtonText='Nuevo Método de Pago'
        />

        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col span={24}>
            <FilterSection
              filters={filterConfigs}
              onFilterChange={onFilterChange}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Space style={{ marginBottom: '16px' }}>
              <Button onClick={handleExportExcel} type='primary'>
                Exportar Excel
              </Button>
            </Space>
          </Col>
        </Row>

        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          pagination={{
            total: data.length,
            pageSize,
            current: currentPage,
            onChange: handlePageChange,
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>
    </motion.div>
  )
}

export default withAuth(MetodosPagoPage)
