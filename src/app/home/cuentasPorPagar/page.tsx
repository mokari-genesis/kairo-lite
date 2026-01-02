'use client'
import '../../globals.css'
import '@ant-design/v5-patch-for-react-19'
import { useMemo, useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { withAuth } from '../../auth/withAuth'
import { PageHeader } from '../../components/PageHeader'
import { FilterSection } from '../../components/FilterSection'
import { DataTable } from '../../components/DataTable'
import { SupplierSelect } from '../../components/SupplierSelect'
import { AbonosManagerCxp } from '../../components/AbonosManagerCxp'
import { MonedaSelect } from '../../components/MonedaSelect'
import {
  CuentasPorPagarColumns,
  CuentasPorPagarFilterConfigs,
} from '../../model/cuentasPorPagarTableModel'
import type { ColumnConfig } from '../../components/DataTable'
import {
  useCuentasPorPagar,
  useCuentasPorPagarResumenProveedores,
} from '../../hooks/useHooks'
import { QueryKey, queryClient } from '../../utils/query'
import {
  CuentaPorPagarTypeResponse,
  createCuentaPorPagar,
  CreateCuentaPorPagarRequest,
} from '../../api/cuentas-por-pagar'
import { useEmpresa } from '../../empresaContext'
import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Tag,
  message,
  Modal,
  Form,
  InputNumber,
  Input,
  DatePicker,
  Select,
} from 'antd'
import dayjs from 'dayjs'
import {
  DollarCircleOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import { formatCurrency } from '@/app/utils/currency'
import * as XLSX from 'xlsx'

const DATE_FORMAT = 'DD/MM/YYYY'

function CuentasPorPagarPage() {
  const { empresaId } = useEmpresa()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [idInputValue, setIdInputValue] = useState<string>('')
  const idDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoadRef = useRef<boolean>(true)
  const [abonosModalOpen, setAbonosModalOpen] = useState(false)
  const [selectedCuentaId, setSelectedCuentaId] = useState<number | null>(null)
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form] = Form.useForm()

  // Leer el parámetro ID de la URL al cargar la página
  useEffect(() => {
    const idFromUrl = searchParams.get('id')
    if (idFromUrl) {
      setIdInputValue(idFromUrl)
      setFilters(prev => ({
        ...prev,
        id: idFromUrl,
      }))
    }
    // Marcar que la carga inicial ya se hizo después de un pequeño delay
    // para permitir que el debounce funcione en ediciones posteriores
    const timer = setTimeout(() => {
      isInitialLoadRef.current = false
    }, 100)
    return () => clearTimeout(timer)
  }, [searchParams])

  // Debounce para el campo ID (solo cuando el usuario escribe manualmente)
  useEffect(() => {
    // No aplicar debounce en la carga inicial desde URL
    if (isInitialLoadRef.current) {
      return
    }

    if (idDebounceRef.current) {
      clearTimeout(idDebounceRef.current)
    }

    const timer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        id: idInputValue || undefined,
      }))
    }, 1000)

    idDebounceRef.current = timer

    return () => {
      if (idDebounceRef.current) {
        clearTimeout(idDebounceRef.current)
      }
    }
  }, [idInputValue])

  const { data: cuentas, isLoading } = useCuentasPorPagar(filters)
  const { data: resumenProveedores } =
    useCuentasPorPagarResumenProveedores(filters)

  const stats = useMemo(() => {
    if (!cuentas || cuentas.length === 0) {
      return {
        totalCuentas: 0,
        totalSaldo: 0,
        saldoPendiente: 0,
        totalPagado: 0,
      }
    }
    return cuentas.reduce(
      (acc, cxp) => {
        acc.totalCuentas += 1
        acc.totalSaldo += Number(cxp.total)
        acc.saldoPendiente += Number(cxp.saldo)
        acc.totalPagado += Number(cxp.total_pagado)
        return acc
      },
      { totalCuentas: 0, totalSaldo: 0, saldoPendiente: 0, totalPagado: 0 }
    )
  }, [cuentas])

  const groupedByProveedor = useMemo(() => {
    if (!resumenProveedores) return []
    return [...resumenProveedores].sort(
      (a, b) => b.saldo_pendiente - a.saldo_pendiente
    )
  }, [resumenProveedores])

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleProveedorFilter = (proveedorId?: number) => {
    if (proveedorId) {
      setFilters(prev => ({ ...prev, proveedor_id: proveedorId }))
    } else {
      const { proveedor_id, ...rest } = filters
      setFilters(rest)
    }
  }

  const handleOpenAbonos = (cuenta: CuentaPorPagarTypeResponse) => {
    setSelectedCuentaId(cuenta.id)
    setAbonosModalOpen(true)
  }

  const handleCloseAbonos = () => {
    setAbonosModalOpen(false)
    setSelectedCuentaId(null)
    // Refrescar los datos
    queryClient.invalidateQueries({ queryKey: [QueryKey.cuentasPorPagarInfo] })
    queryClient.invalidateQueries({
      queryKey: [QueryKey.cuentasPorPagarResumenProveedoresInfo],
    })
  }

  const handleAbonosChange = () => {
    // Refrescar los datos cuando cambien los abonos
    queryClient.invalidateQueries({ queryKey: [QueryKey.cuentasPorPagarInfo] })
    queryClient.invalidateQueries({
      queryKey: [QueryKey.cuentasPorPagarResumenProveedoresInfo],
    })
  }

  const handleNewClick = () => {
    form.resetFields()
    form.setFieldsValue({
      empresa_id: empresaId,
      fecha_emision: dayjs(),
    })
    setNewModalOpen(true)
  }

  const handleCloseNewModal = () => {
    setNewModalOpen(false)
    form.resetFields()
  }

  const handleSubmitNew = async () => {
    try {
      const values = await form.validateFields()
      if (!empresaId) {
        message.error('Debe seleccionar una empresa')
        return
      }

      setIsSaving(true)
      const payload: CreateCuentaPorPagarRequest = {
        empresa_id: empresaId,
        proveedor_id: values.proveedor_id,
        compra_id: values.compra_id || null,
        moneda_id: values.moneda_id,
        total: Number(values.total),
        fecha_emision: values.fecha_emision.format('YYYY-MM-DD'),
        fecha_vencimiento: values.fecha_vencimiento
          ? values.fecha_vencimiento.format('YYYY-MM-DD')
          : null,
        comentario: values.comentario || null,
      }

      await createCuentaPorPagar(payload)
      message.success('Cuenta por pagar creada exitosamente')
      handleCloseNewModal()
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.cuentasPorPagarInfo],
      })
    } catch (error: any) {
      message.error(error.message || 'Error al crear la cuenta por pagar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportExcel = () => {
    if (!cuentas || cuentas.length === 0) {
      message.warning('No hay datos para exportar')
      return
    }

    // Preparar los datos para Excel
    const excelData = cuentas.map(cxp => ({
      ID: cxp.id,
      Proveedor: cxp.proveedor_nombre,
      'NIT Proveedor': cxp.proveedor_nit || 'N/A',
      Empresa: cxp.empresa_nombre,
      'Producto ID': cxp.producto_id || 'N/A',
      Producto: cxp.producto_descripcion || 'N/A',
      Total: cxp.total,
      Saldo: cxp.saldo,
      Pagado: cxp.total_pagado,
      Estado: cxp.estado,
      'Estado Pago': cxp.estado_pago_clasificacion,
      'Fecha Emisión': cxp.fecha_emision,
      'Fecha Vencimiento': cxp.fecha_vencimiento || 'N/A',
      'Compra ID': cxp.compra_id || 'N/A',
      Moneda: cxp.moneda_codigo,
      Comentario: cxp.comentario || 'N/A',
    }))

    // Crear libro de Excel
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(wb, ws, 'Cuentas por Pagar')

    // Generar archivo
    XLSX.writeFile(wb, 'cuentas-por-pagar.xlsx')
    message.success('Archivo exportado exitosamente')
  }

  const columns: ColumnConfig[] = useMemo(
    () => [
      ...CuentasPorPagarColumns,
      {
        key: 'actions',
        title: 'Acciones',
        dataIndex: 'actions',
        type: 'action',
        render: (_: any, record: CuentaPorPagarTypeResponse) => (
          <Button
            type='primary'
            size='small'
            onClick={() => handleOpenAbonos(record)}
          >
            Ver abonos
          </Button>
        ),
      } as ColumnConfig,
    ],
    []
  )

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
              title='Cuentas por Pagar'
              onNewClick={handleNewClick}
              showNewButton={false}
              newButtonText='Nueva Cuenta'
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

          {/* Tarjetas de estadísticas */}
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
                      Total cuentas
                    </span>
                  }
                  value={stats.totalCuentas}
                  prefix={<WalletOutlined style={{ color: 'white' }} />}
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
                      Saldo pendiente
                    </span>
                  }
                  value={stats.saldoPendiente}
                  prefix={<WarningOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                  formatter={value => formatCurrency('VES', Number(value))}
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
                    <span style={{ color: 'white', opacity: 0.9 }}>Pagado</span>
                  }
                  value={stats.totalPagado}
                  prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                  formatter={value => formatCurrency('VES', Number(value))}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  background:
                    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: 'white', opacity: 0.9 }}>
                      Total facturado
                    </span>
                  }
                  value={stats.totalSaldo}
                  prefix={<DollarCircleOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                  formatter={value => formatCurrency('VES', Number(value))}
                />
              </Card>
            </Col>
          </Row>

          {/* Filtros */}
          <Card size='small' title='Filtros' style={{ marginBottom: '16px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <SupplierSelect
                  value={filters.proveedor_id}
                  onChange={handleProveedorFilter}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Input
                  placeholder='Buscar por ID'
                  value={idInputValue}
                  onChange={e => {
                    setIdInputValue(e.target.value)
                  }}
                  allowClear
                  onClear={() => {
                    setIdInputValue('')
                    setFilters(prev => {
                      const { id, ...rest } = prev
                      return rest
                    })
                  }}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  allowClear
                  placeholder='Estado'
                  style={{ width: '100%' }}
                  onChange={value =>
                    handleFilterChange({
                      ...filters,
                      estado: value || undefined,
                    })
                  }
                  value={filters.estado || undefined}
                  options={[
                    { value: 'abierta', label: 'Abierta' },
                    { value: 'parcial', label: 'Parcial' },
                    { value: 'cancelada', label: 'Cancelada' },
                    { value: 'vencida', label: 'Vencida' },
                    { value: 'anulada', label: 'Anulada' },
                  ]}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <DatePicker.RangePicker
                  style={{ width: '100%' }}
                  onChange={(_, dateStrings) => {
                    handleFilterChange({
                      ...filters,
                      fecha_inicio: dateStrings[0] || undefined,
                      fecha_fin: dateStrings[1] || undefined,
                    })
                  }}
                  format='YYYY-MM-DD'
                  placeholder={['Inicio', 'Fin']}
                />
              </Col>
            </Row>
          </Card>

          {/* Resumen por Proveedor */}
          {groupedByProveedor.length > 0 && (
            <Card
              size='small'
              title='Resumen por Proveedor'
              style={{ marginBottom: '16px' }}
            >
              <Space
                direction='vertical'
                size='small'
                style={{ width: '100%' }}
              >
                {groupedByProveedor.slice(0, 5).map(group => (
                  <div
                    key={group.proveedor_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      background: '#f5f5f5',
                      borderRadius: '6px',
                    }}
                  >
                    <Space>
                      <Tag color='blue'>{group.cuentas} cuenta(s)</Tag>
                      <span style={{ fontWeight: 500 }}>
                        {group.proveedor_nombre}
                      </span>
                      {group.proveedor_nit && <Tag>{group.proveedor_nit}</Tag>}
                    </Space>
                    <span style={{ fontWeight: 'bold', color: '#ff4d4f' }}>
                      <span style={{ marginRight: 4 }}>Saldo:</span>
                      {formatCurrency(
                        group.moneda_codigo,
                        group.saldo_pendiente
                      )}
                    </span>
                  </div>
                ))}
                {groupedByProveedor.length > 5 && (
                  <div style={{ textAlign: 'center', color: '#8c8c8c' }}>
                    ... y {groupedByProveedor.length - 5} proveedor(es) más
                  </div>
                )}
              </Space>
            </Card>
          )}

          {/* Tabla de cuentas por pagar */}
          <Card>
            <DataTable
              data={cuentas || []}
              columns={columns}
              loading={isLoading}
              showActions={false}
              pagination={undefined}
              onOpenAbonos={handleOpenAbonos}
              expandable={{
                expandedRowRender: record => (
                  <Space
                    direction='vertical'
                    size='small'
                    style={{ width: '100%' }}
                  >
                    <Space size='small'>
                      <Tag color='blue'>Empresa: {record.empresa_nombre}</Tag>
                      {record.compra_id && (
                        <Tag color='purple'>Compra #{record.compra_id}</Tag>
                      )}
                      {record.compra_fecha && (
                        <Tag color='geekblue'>
                          Fecha compra: {record.compra_fecha}
                        </Tag>
                      )}
                    </Space>
                    <div>
                      Comentario:{' '}
                      <span style={{ color: '#595959' }}>
                        {record.comentario || 'Sin comentario'}
                      </span>
                    </div>
                    {record.abonos && record.abonos.length > 0 && (
                      <div>
                        <strong>Abonos registrados:</strong>{' '}
                        {record.abonos.length}
                      </div>
                    )}
                  </Space>
                ),
              }}
              rowClassName={(record: CuentaPorPagarTypeResponse) => {
                if (record.estado === 'vencida') return 'row-vencida'
                if (record.estado === 'cancelada') return 'row-cancelada'
                if (record.estado === 'anulada') return 'row-anulada'
                return ''
              }}
            />
          </Card>
        </Space>
      </Card>

      <style jsx global>{`
        .row-vencida {
          background-color: #fff1f0 !important;
        }
        .row-cancelada {
          background-color: #f6ffed !important;
        }
        .row-anulada {
          background-color: #f5f5f5 !important;
          opacity: 0.6;
        }
      `}</style>

      {/* Modal de gestión de abonos */}
      {selectedCuentaId && (
        <AbonosManagerCxp
          open={abonosModalOpen}
          onCancel={handleCloseAbonos}
          cuentaId={selectedCuentaId}
          onAbonosChange={handleAbonosChange}
        />
      )}

      {/* Modal para crear nueva cuenta por pagar */}
      <Modal
        open={newModalOpen}
        title='Nueva Cuenta por Pagar'
        onCancel={handleCloseNewModal}
        onOk={handleSubmitNew}
        okText='Crear'
        cancelText='Cancelar'
        confirmLoading={isSaving}
        width={600}
      >
        <Form
          form={form}
          layout='vertical'
          initialValues={{
            fecha_emision: dayjs(),
          }}
        >
          <Form.Item
            label='Proveedor'
            name='proveedor_id'
            rules={[{ required: true, message: 'Seleccione un proveedor' }]}
          >
            <SupplierSelect />
          </Form.Item>

          <Form.Item
            label='Moneda'
            name='moneda_id'
            rules={[{ required: true, message: 'Seleccione una moneda' }]}
          >
            <MonedaSelect />
          </Form.Item>

          <Form.Item
            label='Total'
            name='total'
            rules={[
              { required: true, message: 'Ingrese el total' },
              {
                type: 'number',
                min: 0.01,
                message: 'El total debe ser mayor a 0',
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              step={0.01}
              precision={2}
              placeholder='0.00'
            />
          </Form.Item>

          <Form.Item
            label='Fecha de Emisión'
            name='fecha_emision'
            rules={[
              { required: true, message: 'Seleccione la fecha de emisión' },
            ]}
          >
            <DatePicker style={{ width: '100%' }} format={DATE_FORMAT} />
          </Form.Item>

          <Form.Item label='Fecha de Vencimiento' name='fecha_vencimiento'>
            <DatePicker style={{ width: '100%' }} format={DATE_FORMAT} />
          </Form.Item>

          <Form.Item label='Compra ID (Opcional)' name='compra_id'>
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder='ID de la compra relacionada'
            />
          </Form.Item>

          <Form.Item label='Comentario (Opcional)' name='comentario'>
            <Input.TextArea
              rows={3}
              placeholder='Comentarios adicionales'
              maxLength={255}
            />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  )
}

export default withAuth(CuentasPorPagarPage)
