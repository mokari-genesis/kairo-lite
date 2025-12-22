'use client'
import '../../globals.css'
import '@ant-design/v5-patch-for-react-19'
import { DataTable } from '../../components/DataTable'
import { FilterSection } from '../../components/FilterSection'
import { PageHeader } from '../../components/PageHeader'
import { withAuth } from '../../auth/withAuth'
import { useState, useMemo } from 'react'
import { useEnterprises } from '@/app/hooks/useHooks'
import { useRouter } from 'next/navigation'
import { queryClient, QueryKey } from '@/app/utils/query'
import { Card, message, Space, Row, Col, Statistic, Button, Modal } from 'antd'
import { motion } from 'framer-motion'
import { columns, filterConfigs } from '@/app/model/enterprisesTableModel'
import {
  deleteEnterprise,
  updateEnterprise,
  UpdateEnterpriseRequest,
} from '@/app/api/enterprise'
import { ShopOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'

function EnterprisesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})

  const router = useRouter()

  const handleNewClick = () => {
    router.push('/home/enterprises/new')
  }

  const handleEdit = async (record: any) => {
    try {
      setIsLoading(true)
      const updateData: UpdateEnterpriseRequest = {
        id: record.id,
        nombre: record.nombre,
        nit: record.nit,
        direccion: record.direccion,
        telefono: record.telefono,
        email: record.email,
      }
      await updateEnterprise(updateData)
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.enterprisesInfo, filters],
      })
      message.success('Sucursal actualizada exitosamente')
    } catch (error: any) {
      message.error(error.message || 'Error al actualizar la sucursal')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page)
    setPageSize(pageSize)
  }

  const handleDelete = (record: any) => {
    if (!record.id) {
      message.error('No se puede eliminar la sucursal')
      return
    }
    Modal.confirm({
      title: 'Eliminar sucursal',
      content:
        'Si eliminas esta sucursal se borrará toda la información relacionada a esa sucursal. ¿Deseas continuar?',
      okText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      okType: 'danger',
      centered: true,
      onOk: async () => {
        setIsLoading(true)
        try {
          await deleteEnterprise(record.id)
          await queryClient.invalidateQueries({
            queryKey: [QueryKey.enterprisesInfo],
          })
          message.success('Sucursal eliminada exitosamente')
        } catch (error: any) {
          message.error(error.message || 'Error al eliminar la sucursal')
        } finally {
          setIsLoading(false)
        }
      },
    })
  }

  const onFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  const { data: dataEnterprises, isLoading: enterprisesLoading } =
    useEnterprises(filters)

  // Calcular estadísticas
  const enterprisesStats = useMemo(() => {
    if (!dataEnterprises || dataEnterprises.length === 0) {
      return {
        totalSucursales: 0,
      }
    }

    const totalSucursales = dataEnterprises.length

    return {
      totalSucursales,
    }
  }, [dataEnterprises])

  const handleExportExcel = () => {
    if (!dataEnterprises || dataEnterprises.length === 0) {
      message.warning('No hay datos para exportar')
      return
    }

    // Preparar los datos para Excel
    const excelData = dataEnterprises.map(enterprise => ({
      ID: enterprise.id,
      Nombre: enterprise.nombre,
      NIT: enterprise.nit,
      Email: enterprise.email,
      Teléfono: enterprise.telefono,
      Dirección: enterprise.direccion,
    }))

    // Crear libro de Excel
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(wb, ws, 'Sucursales')

    // Generar archivo
    XLSX.writeFile(wb, 'sucursales.xlsx')
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
            <PageHeader
              title='Sucursales'
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
                      Total Sucursales
                    </span>
                  }
                  value={enterprisesStats.totalSucursales}
                  prefix={<ShopOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
          </Row>

          <FilterSection
            filters={filterConfigs}
            onFilterChange={onFilterChange}
          />

          <DataTable
            data={dataEnterprises || []}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={enterprisesLoading || isLoading}
            pagination={{
              total: dataEnterprises?.length || 0,
              pageSize,
              current: currentPage,
              onChange: handlePageChange,
            }}
            showActions={true}
            showDelete={false}
          />
        </Space>
      </Card>
    </motion.div>
  )
}

export default withAuth(EnterprisesPage)
