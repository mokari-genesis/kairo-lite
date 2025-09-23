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
import { useState, useMemo } from 'react'
import { useClients } from '@/app/hooks/useHooks'
import { useRouter } from 'next/navigation'
import { queryClient, QueryKey } from '@/app/utils/query'
import {
  Card,
  message,
  Space,
  Row,
  Col,
  Statistic,
  Badge,
  Tag,
  Button,
} from 'antd'
import { motion } from 'framer-motion'
import {
  ClientColumns,
  ClientFilterConfigs,
} from '@/app/model/clientsTableModel'
import {
  deleteClient,
  updateClient,
  UpdateClientRequest,
} from '@/app/api/clients'
import { TeamOutlined, UserOutlined, BankOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'

function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})

  const router = useRouter()

  const handleNewClick = () => {
    router.push('/home/clients/new')
  }

  const handleEdit = async (record: any) => {
    try {
      setIsLoading(true)
      const updateData: UpdateClientRequest = {
        id: record.id,
        name: record.nombre,
        type: record.tipo,
        nit: record.nit,
        email: record.email,
        phone: record.telefono,
        address: record.direccion,
      }
      await updateClient(updateData)
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.clientsInfo, filters],
      })
      message.success('Cliente actualizado exitosamente')
    } catch (error: any) {
      message.error(error.message || 'Error al actualizar el cliente')
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
      message.error('No se puede eliminar el cliente')
      return
    }
    setIsLoading(true)
    await deleteClient(record.id)
    await queryClient.invalidateQueries({ queryKey: [QueryKey.clientsInfo] })
    message.success('Cliente eliminado exitosamente')
    setIsLoading(false)
  }

  const onFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  const { data: dataCLients, isLoading: clientLoading } = useClients(filters)

  // Calcular estadísticas de clientes
  const clientsStats = useMemo(() => {
    if (!dataCLients || dataCLients.length === 0) {
      return {
        totalClientes: 0,
        clientesEmpresa: 0,
        clientesPersona: 0,
      }
    }

    const totalClientes = dataCLients.length
    const clientesEmpresa = dataCLients.filter(
      client => client.tipo === 'empresa'
    ).length
    const clientesPersona = dataCLients.filter(
      client => client.tipo === 'persona'
    ).length

    return {
      totalClientes,
      clientesEmpresa,
      clientesPersona,
    }
  }, [dataCLients])

  const handleExportExcel = () => {
    if (!dataCLients || dataCLients.length === 0) {
      message.warning('No hay datos para exportar')
      return
    }

    // Preparar los datos para Excel
    const excelData = dataCLients.map(client => ({
      ID: client.id,
      Nombre: client.nombre,
      Tipo: client.tipo,
      NIT: client.nit,
      Email: client.email,
      Teléfono: client.telefono,
      Dirección: client.direccion,
    }))

    // Crear libro de Excel
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes')

    // Generar archivo
    XLSX.writeFile(wb, 'clientes.xlsx')
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
            <PageHeader title='Clientes' onNewClick={handleNewClick} />
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
                      Total Clientes
                    </span>
                  }
                  value={clientsStats.totalClientes}
                  prefix={<TeamOutlined style={{ color: 'white' }} />}
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
                      Empresas
                    </span>
                  }
                  value={clientsStats.clientesEmpresa}
                  prefix={<BankOutlined style={{ color: 'white' }} />}
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
                      Personas
                    </span>
                  }
                  value={clientsStats.clientesPersona}
                  prefix={<UserOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
          </Row>

          <FilterSection
            filters={ClientFilterConfigs}
            onFilterChange={onFilterChange}
          />

          <DataTable
            data={dataCLients || []}
            columns={ClientColumns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={clientLoading || isLoading}
            pagination={{
              total: dataCLients?.length || 0,
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
