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
import { useClients } from '@/app/hooks/useHooks'
import { useRouter } from 'next/navigation'
import { queryClient, QueryKey } from '@/app/utils/query'
import { Card, message, Space } from 'antd'
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
          <PageHeader title='Clientes' onNewClick={handleNewClick} />

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
