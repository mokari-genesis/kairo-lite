'use client'
import '../../globals.css'
import '@ant-design/v5-patch-for-react-19'
import { DataTable } from '../../components/DataTable'
import { FilterSection } from '../../components/FilterSection'
import { PageHeader } from '../../components/PageHeader'
import { withAuth } from '../../auth/withAuth'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getTransferencias,
  confirmarTransferencia,
  cancelarTransferencia,
  deleteTransferencia,
  Transferencia,
} from '@/app/api/transferencias'
import { queryClient, QueryKey } from '@/app/utils/query'
import {
  Card,
  message,
  Space,
  Button,
  Modal,
  Tag,
  Descriptions,
  Table,
} from 'antd'
import { motion } from 'framer-motion'
import { columns, filterConfigs } from '@/app/model/transferenciasTableModel'
import {
  SwapOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons'

function TransferenciasPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [transferencias, setTransferencias] = useState<Transferencia[]>([])
  const [selectedTransferencia, setSelectedTransferencia] =
    useState<Transferencia | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  useEffect(() => {
    loadTransferencias()
  }, [filters])

  const loadTransferencias = async () => {
    try {
      setIsLoading(true)
      const data = await getTransferencias(filters)
      setTransferencias(data)
    } catch (error: any) {
      message.error(error.message || 'Error al cargar transferencias')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewClick = () => {
    router.push('/home/transferencias/new')
  }

  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page)
    setPageSize(pageSize)
  }

  const handleViewDetails = (record: Transferencia) => {
    setSelectedTransferencia(record)
    setDetailModalVisible(true)
  }

  const handleConfirm = async (record: Transferencia) => {
    if (record.estado === 'confirmada') {
      message.warning('La transferencia ya está confirmada')
      return
    }

    if (record.estado === 'cancelada') {
      message.warning('No se puede confirmar una transferencia cancelada')
      return
    }

    Modal.confirm({
      title: 'Confirmar Transferencia',
      content:
        '¿Está seguro de que desea confirmar esta transferencia? Esto moverá el stock entre sucursales.',
      onOk: async () => {
        try {
          setIsLoading(true)
          await confirmarTransferencia(record.id, record.usuario_id || 999)
          message.success('Transferencia confirmada exitosamente')
          await loadTransferencias()
        } catch (error: any) {
          message.error(error.message || 'Error al confirmar la transferencia')
        } finally {
          setIsLoading(false)
        }
      },
    })
  }

  const handleCancel = async (record: Transferencia) => {
    if (record.estado === 'cancelada') {
      message.warning('La transferencia ya está cancelada')
      return
    }

    if (record.estado === 'confirmada') {
      Modal.confirm({
        title: 'Cancelar Transferencia Confirmada',
        content:
          'Esta transferencia ya está confirmada. Al cancelarla, su estado cambiará a "cancelada" según las reglas del sistema. ¿Está seguro?',
        onOk: async () => {
          try {
            setIsLoading(true)
            await cancelarTransferencia(record.id)
            message.success('Transferencia cancelada exitosamente')
            await loadTransferencias()
          } catch (error: any) {
            message.error(error.message || 'Error al cancelar la transferencia')
          } finally {
            setIsLoading(false)
          }
        },
      })
    } else {
      Modal.confirm({
        title: 'Cancelar Transferencia',
        content: '¿Está seguro de que desea cancelar esta transferencia?',
        onOk: async () => {
          try {
            setIsLoading(true)
            await cancelarTransferencia(record.id)
            message.success('Transferencia cancelada exitosamente')
            await loadTransferencias()
          } catch (error: any) {
            message.error(error.message || 'Error al cancelar la transferencia')
          } finally {
            setIsLoading(false)
          }
        },
      })
    }
  }

  const handleDelete = async (record: Transferencia) => {
    // if (record.estado === 'confirmada') {
    //   message.warning('No se puede eliminar una transferencia confirmada')
    //   return
    // }

    Modal.confirm({
      title: 'Eliminar Transferencia',
      content: '¿Está seguro de que desea eliminar esta transferencia?',
      okType: 'danger',
      onOk: async () => {
        try {
          setIsLoading(true)
          await deleteTransferencia(record.id)
          message.success('Transferencia eliminada exitosamente')
          await loadTransferencias()
        } catch (error: any) {
          message.error(error.message || 'Error al eliminar la transferencia')
        } finally {
          setIsLoading(false)
        }
      },
    })
  }

  const onFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  // Columnas con acciones
  const columnsWithActions = [
    ...columns,
    {
      key: 'acciones',
      title: 'Acciones',
      dataIndex: 'acciones',
      type: 'action' as const,
      render: (_: any, record: Transferencia) => (
        <Space>
          <Button
            type='text'
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            title='Ver Detalles'
          />
          {record.estado === 'borrador' && (
            <>
              <Button
                type='text'
                icon={<CheckCircleOutlined />}
                onClick={() => handleConfirm(record)}
                title='Confirmar'
                style={{ color: '#52c41a' }}
              />
            </>
          )}
          {record.estado !== 'cancelada' && record.estado !== 'confirmada' && (
            <Button
              type='text'
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleCancel(record)}
              title='Cancelar'
            />
          )}
          <Button
            type='text'
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            title='Eliminar'
          />
        </Space>
      ),
    },
  ]

  const detailColumns = [
    {
      title: 'Producto',
      dataIndex: 'producto_descripcion',
      key: 'producto_descripcion',
    },
    {
      title: 'Código',
      dataIndex: 'producto_codigo',
      key: 'producto_codigo',
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      key: 'cantidad',
      render: (value: number) => (
        <Tag color='blue' style={{ fontWeight: 'bold' }}>
          {value}
        </Tag>
      ),
    },
  ]

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
          <PageHeader
            title='Transferencias entre Sucursales'
            onNewClick={handleNewClick}
          />

          <FilterSection
            filters={filterConfigs}
            onFilterChange={onFilterChange}
          />

          <DataTable
            data={transferencias || []}
            columns={columnsWithActions}
            loading={isLoading}
            pagination={{
              total: transferencias?.length || 0,
              pageSize,
              current: currentPage,
              onChange: handlePageChange,
            }}
            showActions={false}
          />
        </Space>
      </Card>

      {/* Modal de Detalles */}
      <Modal
        title='Detalles de Transferencia'
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTransferencia && (
          <Space direction='vertical' size='large' style={{ width: '100%' }}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label='ID'>
                #{selectedTransferencia.id}
              </Descriptions.Item>
              <Descriptions.Item label='Estado'>
                <Tag
                  color={
                    selectedTransferencia.estado === 'confirmada'
                      ? 'success'
                      : selectedTransferencia.estado === 'cancelada'
                      ? 'error'
                      : 'default'
                  }
                >
                  {selectedTransferencia.estado}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label='Sucursal Origen'>
                {selectedTransferencia.empresa_origen_nombre || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label='Sucursal Destino'>
                {selectedTransferencia.empresa_destino_nombre || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label='Usuario'>
                {selectedTransferencia.usuario_nombre || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label='Fecha'>
                {selectedTransferencia.fecha || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label='Comentario' span={2}>
                {selectedTransferencia.comentario || 'Sin comentario'}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <h4>Productos Transferidos</h4>
              <Table
                columns={detailColumns}
                dataSource={selectedTransferencia.detalles || []}
                rowKey='id'
                pagination={false}
                size='small'
              />
            </div>
          </Space>
        )}
      </Modal>
    </motion.div>
  )
}

export default withAuth(TransferenciasPage)
