'use client'

import React, { useState, useCallback } from 'react'
import {
  Card,
  Tabs,
  Alert,
  Spin,
  Button,
  Space,
  Typography,
  Modal,
  Descriptions,
  Tag,
  Divider,
  message,
  Result,
} from 'antd'
import {
  TableOutlined,
  BarChartOutlined,
  FileTextOutlined,
  PrinterOutlined,
  ReloadOutlined,
  ExportOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { MetodoPagoUnificado } from '../../api/metodos-pago-unificado'
import { UnifiedPaymentMethodsFilters } from '../../components/metodos-pago-unificado/UnifiedPaymentMethodsFilters'
import { UnifiedPaymentMethodsTable } from '../../components/metodos-pago-unificado/UnifiedPaymentMethodsTable'
import { UnifiedPaymentMethodsSummary } from '../../components/metodos-pago-unificado/UnifiedPaymentMethodsSummary'
import { formatCurrency } from '../../utils/currency'
import {
  useUnifiedPaymentMethods,
  usePagination,
} from '../../hooks/useUnifiedPaymentMethods'

const { Title, Text } = Typography
const { TabPane } = Tabs

export default function MetodosPagoUnificadoPage() {
  // State management using custom hook
  const {
    tableData,
    summaryData,
    loading,
    error,
    filters,
    summaryFilters,
    loadTableData,
    loadSummaryData,
    updateFilters,
    updateSummaryFilters,
    clearError,
    refreshData,
  } = useUnifiedPaymentMethods()

  // Local state
  const [activeTab, setActiveTab] = useState('table')
  const [selectedRecord, setSelectedRecord] =
    useState<MetodoPagoUnificado | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  // Pagination hook
  const { currentPage, pageSize, handlePageChange, resetPagination } =
    usePagination()

  // Handle filters change
  const handleFiltersChange = useCallback(
    (newFilters: any) => {
      updateFilters(newFilters)
      resetPagination()
      if (activeTab === 'table') {
        loadTableData(newFilters)
      }
    },
    [activeTab, loadTableData, updateFilters, resetPagination]
  )

  // Handle summary filters change
  const handleSummaryFiltersChange = useCallback(
    (newFilters: any) => {
      updateSummaryFilters(newFilters)
      loadSummaryData(newFilters)
    },
    [updateSummaryFilters, loadSummaryData]
  )

  // Handle pagination change
  const handlePaginationChange = useCallback(
    (page: number, newPageSize: number) => {
      handlePageChange(page, newPageSize)
      const newFilters = {
        ...filters,
        limit: newPageSize,
        offset: (page - 1) * newPageSize,
      }
      updateFilters(newFilters)
      loadTableData(newFilters)
    },
    [filters, loadTableData, updateFilters, handlePageChange]
  )

  // Handle tab change
  const handleTabChange = useCallback(
    (key: string) => {
      setActiveTab(key)

      if (key === 'table' && (!tableData.data || tableData.data.length === 0)) {
        loadTableData()
      } else if (key === 'summary' && !summaryData) {
        loadSummaryData()
      }
    },
    [tableData.data?.length, summaryData, loadTableData, loadSummaryData]
  )

  // Handle view details
  const handleViewDetails = useCallback((record: MetodoPagoUnificado) => {
    setSelectedRecord(record)
    setDetailModalVisible(true)
  }, [])

  // Handle print ticket
  const handlePrintTicket = useCallback((record: MetodoPagoUnificado) => {
    // Implement print functionality
    message.info(
      `Función de impresión para venta ${record.venta_id} en desarrollo`
    )
  }, [])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (activeTab === 'table') {
      loadTableData()
    } else if (activeTab === 'summary') {
      loadSummaryData()
    }
  }, [activeTab, loadTableData, loadSummaryData])

  // Handle export
  const handleExport = useCallback(() => {
    message.info('Función de exportación en desarrollo')
  }, [])

  const renderDetailModal = () => (
    <Modal
      title={`Detalles de Venta ${selectedRecord?.venta_id}`}
      open={detailModalVisible}
      onCancel={() => setDetailModalVisible(false)}
      footer={[
        <Button
          key='print'
          icon={<PrinterOutlined />}
          onClick={() => {
            if (selectedRecord) {
              handlePrintTicket(selectedRecord)
            }
          }}
        >
          Imprimir
        </Button>,
        <Button key='close' onClick={() => setDetailModalVisible(false)}>
          Cerrar
        </Button>,
      ]}
      width={800}
    >
      {selectedRecord && (
        <div>
          <Descriptions bordered column={2}>
            <Descriptions.Item label='ID Venta' span={1}>
              <Text code>{selectedRecord.venta_id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label='Cliente' span={1}>
              {selectedRecord.cliente_nombre}
            </Descriptions.Item>
            <Descriptions.Item label='Teléfono' span={1}>
              {selectedRecord.cliente_telefono || 'No disponible'}
            </Descriptions.Item>
            <Descriptions.Item label='Email' span={1}>
              {selectedRecord.cliente_email || 'No disponible'}
            </Descriptions.Item>
            <Descriptions.Item label='Usuario' span={1}>
              {selectedRecord.usuario_nombre}
            </Descriptions.Item>
            <Descriptions.Item label='Método de Pago' span={1}>
              {selectedRecord.metodo_pago}
            </Descriptions.Item>
            <Descriptions.Item label='Moneda' span={1}>
              {selectedRecord.moneda_nombre} ({selectedRecord.moneda_simbolo})
            </Descriptions.Item>
            <Descriptions.Item label='Fecha de Venta' span={1}>
              {new Date(selectedRecord.fecha_venta).toLocaleDateString('es-GT')}
            </Descriptions.Item>
            <Descriptions.Item label='Fecha de Pago' span={1}>
              {selectedRecord.fecha_pago
                ? new Date(selectedRecord.fecha_pago).toLocaleDateString(
                    'es-GT'
                  )
                : 'No pagado'}
            </Descriptions.Item>
            <Descriptions.Item label='Estado de Venta' span={1}>
              <Tag
                color={
                  selectedRecord.estado_venta === 'completada'
                    ? 'success'
                    : selectedRecord.estado_venta === 'pendiente'
                    ? 'warning'
                    : selectedRecord.estado_venta === 'cancelada'
                    ? 'error'
                    : 'processing'
                }
              >
                {selectedRecord.estado_venta.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label='Estado de Pago' span={1}>
              <Tag
                color={
                  selectedRecord.estado_pago === 'pagado'
                    ? 'success'
                    : selectedRecord.estado_pago === 'pendiente'
                    ? 'warning'
                    : selectedRecord.estado_pago === 'parcial'
                    ? 'processing'
                    : 'error'
                }
              >
                {selectedRecord.estado_pago.toUpperCase()}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Title level={5}>Información Financiera</Title>
          <Descriptions bordered column={1}>
            <Descriptions.Item label='Monto Total'>
              <Text strong>
                {formatCurrency(
                  selectedRecord.moneda_simbolo,
                  parseFloat(selectedRecord.total_venta)
                )}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label='Monto Pagado'>
              <Text style={{ color: '#52c41a' }}>
                {formatCurrency(
                  selectedRecord.moneda_simbolo,
                  parseFloat(selectedRecord.total_pagado_venta)
                )}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label='Monto Pendiente'>
              <Text
                style={{
                  color:
                    parseFloat(selectedRecord.saldo_pendiente_venta) > 0
                      ? '#ff4d4f'
                      : '#52c41a',
                }}
              >
                {formatCurrency(
                  selectedRecord.moneda_simbolo,
                  parseFloat(selectedRecord.saldo_pendiente_venta)
                )}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label='Progreso de Pago'>
              <div>
                <div
                  style={{
                    width: '100%',
                    height: '20px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${
                        (parseFloat(selectedRecord.total_pagado_venta) /
                          parseFloat(selectedRecord.total_venta)) *
                        100
                      }%`,
                      height: '100%',
                      backgroundColor:
                        parseFloat(selectedRecord.total_pagado_venta) ===
                        parseFloat(selectedRecord.total_venta)
                          ? '#52c41a'
                          : '#1890ff',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <Text
                  style={{
                    fontSize: '12px',
                    marginTop: '4px',
                    display: 'block',
                  }}
                >
                  {Math.round(
                    (parseFloat(selectedRecord.total_pagado_venta) /
                      parseFloat(selectedRecord.total_venta)) *
                      100
                  )}
                  % completado
                </Text>
              </div>
            </Descriptions.Item>
          </Descriptions>

          {selectedRecord.comentario_venta && (
            <>
              <Divider />
              <Title level={5}>Observaciones</Title>
              <Text>{selectedRecord.comentario_venta}</Text>
            </>
          )}
        </div>
      )}
    </Modal>
  )

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <TableOutlined /> Métodos de Pago Unificados
        </Title>
        <Text type='secondary'>
          Vista unificada de métodos de pago con capacidades de filtrado
          avanzado y resúmenes estadísticos
        </Text>
      </div>

      {/* Filters */}
      <UnifiedPaymentMethodsFilters
        onFiltersChange={handleFiltersChange}
        loading={loading}
        initialFilters={filters}
      />

      {/* Error Alert */}
      {error && (
        <Alert
          message='Error al cargar los datos'
          description={error}
          type='error'
          showIcon
          closable
          onClose={clearError}
          style={{ marginBottom: '16px' }}
          action={
            <Button size='small' danger onClick={handleRefresh}>
              Reintentar
            </Button>
          }
        />
      )}

      {/* Loading State */}
      {loading && !error && (
        <Card style={{ marginBottom: '16px' }}>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size='large' />
            <div style={{ marginTop: 16 }}>
              <Text>Cargando datos...</Text>
            </div>
          </div>
        </Card>
      )}

      {/* No Data State */}
      {!loading &&
        !error &&
        activeTab === 'table' &&
        (!tableData.data || tableData.data.length === 0) && (
          <Card style={{ marginBottom: '16px' }}>
            <Result
              icon={<TableOutlined />}
              title='No hay datos disponibles'
              subTitle='No se encontraron registros con los filtros aplicados. Intenta ajustar los filtros de búsqueda.'
              extra={
                <Button type='primary' onClick={handleRefresh}>
                  Actualizar
                </Button>
              }
            />
          </Card>
        )}

      {/* Main Content Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          tabBarExtraContent={
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
              >
                Actualizar
              </Button>
              <Button icon={<ExportOutlined />} onClick={handleExport}>
                Exportar
              </Button>
            </Space>
          }
        >
          <TabPane
            tab={
              <span>
                <TableOutlined />
                Tabla de Datos
                {tableData.total > 0 && (
                  <Tag color='blue' style={{ marginLeft: '8px' }}>
                    {tableData.total}
                  </Tag>
                )}
              </span>
            }
            key='table'
          >
            <UnifiedPaymentMethodsTable
              data={tableData}
              loading={loading}
              onViewDetails={handleViewDetails}
              onPrintTicket={handlePrintTicket}
              onPaginationChange={handlePaginationChange}
              showSummary={true}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                Resúmenes Estadísticos
              </span>
            }
            key='summary'
          >
            <UnifiedPaymentMethodsSummary
              filters={summaryFilters}
              onFiltersChange={handleSummaryFiltersChange}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                Reportes
              </span>
            }
            key='reports'
          >
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <FileTextOutlined
                style={{ fontSize: '48px', color: '#d9d9d9' }}
              />
              <div style={{ marginTop: '16px' }}>
                <Title level={4} type='secondary'>
                  Reportes Avanzados
                </Title>
                <Text type='secondary'>
                  Funcionalidad de reportes personalizados en desarrollo
                </Text>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Detail Modal */}
      {renderDetailModal()}
    </div>
  )
}
