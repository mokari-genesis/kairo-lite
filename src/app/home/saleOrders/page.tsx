'use client'
import '@ant-design/v5-patch-for-react-19'
import React, { useState } from 'react'
import { Card, message, Modal, Space, Input } from 'antd'
import { motion } from 'framer-motion'
import { FilterSection } from '../../components/FilterSection'
import { DataTable } from '../../components/DataTable'
import { PageHeader } from '../../components/PageHeader'
import { useSalesFlat } from '../../hooks/useHooks'
import {
  SalesFlatcolumns,
  SalesFlatfilterConfigs,
  expandedRowRender,
} from '@/app/model/salesFlatTableModel'
import { useRouter } from 'next/navigation'
import { queryClient } from '@/app/utils/query'
import { QueryKey } from '@/app/utils/query'
import {
  cancelSale,
  removeSale,
  updateSale,
  updateSaleStatus,
} from '@/app/api/sales'
import { UpdateStateRequest } from '@/app/api/products'
import { ticketTemplate } from '@/app/templates/ticket-template'
const pageSize = 10

export default function SaleOrders() {
  const [modal, contextHolder] = Modal.useModal()
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const router = useRouter()
  const { data: salesData, isLoading: salesLoading } = useSalesFlat(filters)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const onFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  const handleNewClick = () => {
    router.push('/home/saleOrders/new')
  }

  const handleEdit = (record: any) => {
    router.push(`/home/saleOrders/edit/${record.id}`)
  }

  const handleCancel = async (record: any) => {
    try {
      const confirm = await modal.confirm({
        title: 'Confirmación',
        content:
          '¿Estás seguro de cancelar la venta?, esto se registrara en movimientos de inventario y regresara los articulos a su stock.',
      })

      if (!confirm) return

      if (!record.id) {
        message.error('No se puede eliminar la venta')
        return
      }
      setIsLoading(true)
      const deleteObj = {
        venta_id: record.id,
      }
      await cancelSale(deleteObj)
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.salesFlatInfo, filters],
      })
      message.success('Venta Cancelada')
      setIsLoading(false)
    } catch (error: any) {
      message.error(error.message || 'Error al eliminar la venta')
      setIsLoading(false)
    }
  }

  const handleDelete = async (record: any) => {
    try {
      const confirm = await modal.confirm({
        title: 'Confirmación',
        content:
          '¿Estás seguro de Eliminar la venta?, esto se registrara en movimientos de inventario,regresara los articulos a su stock y el registro de venta se eliminara',
      })

      if (!confirm) return

      if (!record.id) {
        message.error('No se puede eliminar la venta')
        return
      }
      setIsLoading(true)
      await removeSale(record.id)
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.salesFlatInfo, filters],
      })
      message.warning('Venta Eliminada')
      setIsLoading(false)
    } catch (error: any) {
      message.error(error.message || 'Error al eliminar la venta')
      setIsLoading(false)
    }
  }

  const handleCheck = async (record: any) => {
    try {
      const confirm = await modal.confirm({
        title: 'Confirmación',
        content: '¿Estás seguro de confirmar la venta?',
      })

      if (!confirm) return

      setIsLoading(true)

      const updateData: UpdateStateRequest = {
        venta_id: record.id,
        estado: 'vendido',
      }

      if (record.estado_venta === 'cancelado') {
        await updateSale(updateData)
      } else if (record.estado_venta === 'generado') {
        await updateSaleStatus(updateData)
      } else {
        message.warning('Ya se encuentra vendido')
        return
      }

      await queryClient.invalidateQueries({
        queryKey: [QueryKey.salesFlatInfo, filters],
      })
      message.success('Venta confirmada')
    } catch (error: any) {
      message.error(error.message || 'Error al actualizar la venta')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintTicket = async (record: any) => {
    try {
      // Show modal to get description
      const { description } = await new Promise<{ description: string }>(
        (resolve, reject) => {
          const modalInstance = Modal.confirm({
            title: 'Imprimir Etiqueta',
            content: (
              <div style={{ marginTop: '16px' }}>
                <p>Ingrese una descripción para la etiqueta:</p>
                <Input.TextArea
                  id='ticket-description'
                  placeholder='(Opcional)'
                  rows={3}
                  style={{ marginTop: '8px' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      const description = (e.target as HTMLTextAreaElement)
                        .value
                      modalInstance.destroy()
                      resolve({ description })
                    }
                  }}
                />
              </div>
            ),
            onOk: () => {
              const description =
                (
                  document.getElementById(
                    'ticket-description'
                  ) as HTMLTextAreaElement
                )?.value || ''
              resolve({ description })
            },
            onCancel: () => {
              reject(new Error('User cancelled'))
            },
            okText: 'Imprimir',
            cancelText: 'Cancelar',
          })
        }
      )

      // Show success message
      message.success(`Imprimiendo ticket para la venta #${record.id}`)
      let ticket = ticketTemplate.replace('@@clientName', record.cliente_nombre)
      ticket = ticket.replace('@@phone', record.cliente_telefono)
      ticket = ticket.replace('@@address', record.cliente_direccion)
      ticket = ticket.replace('@@code', record.id)
      ticket = ticket.replace('@@details', description || 'Sin descripción')

      let mywindow = window.open('', 'PRINT', 'height=650,width=600')
      if (mywindow) {
        mywindow.document.write(ticket)
        mywindow.document.close()
        mywindow.focus()
        return
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled') {
        message.error('Error al imprimir el ticket')
      }
    }
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
          <PageHeader title='Órdenes de Venta' onNewClick={handleNewClick} />

          <FilterSection
            filters={SalesFlatfilterConfigs}
            onFilterChange={onFilterChange}
          />

          <DataTable
            data={salesData || []}
            columns={SalesFlatcolumns}
            loading={salesLoading || isLoading}
            pagination={{
              total: salesData?.length || 0,
              pageSize,
              current: currentPage,
              onChange: handlePageChange,
            }}
            expandable={{
              expandedRowRender,
            }}
            showActions={true}
            showDelete={true}
            onDelete={handleDelete}
            onCheck={handleCheck}
            onView={handleEdit}
            showView={true}
            onCancel={handleCancel}
            onPrintTicket={handlePrintTicket}
            showPrintTicket={false}
            deleteTooltip='Eliminar Venta'
            cancelTooltip='Cancelar Venta'
            viewTooltip='Ver / Editar Venta'
            printTicketTooltip='Imprimir Etiqueta'
          />
        </Space>
      </Card>
      {contextHolder}
    </motion.div>
  )
}
