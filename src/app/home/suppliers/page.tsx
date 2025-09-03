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
import { useState } from 'react'
import { useSuppliers } from '@/app/hooks/useHooks'
import { useRouter } from 'next/navigation'
import { queryClient, QueryKey } from '@/app/utils/query'
import { Card, message, Space } from 'antd'
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
    setIsLoading(true)
    await deleteSupplier(record.id)
    await queryClient.invalidateQueries({ queryKey: [QueryKey.suppliersInfo] })
    message.success('Proveedor eliminado exitosamente')
    setIsLoading(false)
  }

  const onFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  const { data: dataSuppliers, isLoading: supplierLoading } =
    useSuppliers(filters)

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
          <PageHeader title='Proveedores' onNewClick={handleNewClick} />

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
