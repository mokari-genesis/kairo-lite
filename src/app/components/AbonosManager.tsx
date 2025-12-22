'use client'
import React, { useEffect, useState } from 'react'
import {
  Modal,
  Form,
  InputNumber,
  Input,
  Button,
  Space,
  message,
  Table,
  Popconfirm,
  Tag,
  Statistic,
  Card,
} from 'antd'
import { DeleteOutlined, PlusOutlined, DollarOutlined } from '@ant-design/icons'
import { MetodoPagoSelect } from './MetodoPagoSelect'
import { MonedaSelect } from './MonedaSelect'
import {
  CuentaPorCobrarTypeResponse,
  AbonoType,
  CreateAbonoCxcRequest,
  getCuentaPorCobrar,
  addAbonoCuentaPorCobrar,
  deleteAbonoCuentaPorCobrar,
} from '@/app/api/cuentas-por-cobrar'
import { Moneda, getMonedas } from '@/app/api/monedas'
import {
  formatCurrency,
  convertirAMonedaBase,
  obtenerMonedaBase,
  formatearTasa,
} from '@/app/utils/currency'
import dayjs from 'dayjs'

interface AbonosManagerProps {
  open: boolean
  onCancel: () => void
  cuentaId: number
  onAbonosChange?: () => void
}

export const AbonosManager: React.FC<AbonosManagerProps> = ({
  open,
  onCancel,
  cuentaId,
  onAbonosChange,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [cuenta, setCuenta] = useState<CuentaPorCobrarTypeResponse | null>(null)
  const [loadingCuenta, setLoadingCuenta] = useState(false)
  const [monto, setMonto] = useState<number | undefined>()
  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [monedaBase, setMonedaBase] = useState<Moneda | null>(null)
  const [monedaSeleccionada, setMonedaSeleccionada] = useState<Moneda | null>(
    null
  )
  const [montoConvertido, setMontoConvertido] = useState<number | undefined>()
  const [showForm, setShowForm] = useState(false)

  // Cargar cuenta y monedas al abrir el modal
  useEffect(() => {
    if (open && cuentaId) {
      loadCuenta()
      loadMonedas()
    } else {
      setCuenta(null)
      setShowForm(false)
      form.resetFields()
    }
  }, [open, cuentaId])

  const loadCuenta = async () => {
    try {
      setLoadingCuenta(true)
      const cuentaData = await getCuentaPorCobrar(cuentaId)
      setCuenta(cuentaData)
    } catch (error) {
      console.error('Error cargando cuenta:', error)
      message.error('Error al cargar la cuenta por cobrar')
    } finally {
      setLoadingCuenta(false)
    }
  }

  const loadMonedas = async () => {
    try {
      const monedasData = await getMonedas({ activo: 1 })
      setMonedas(monedasData)
      const base = obtenerMonedaBase(monedasData)
      setMonedaBase(base)
    } catch (error) {
      console.error('Error cargando monedas:', error)
      message.error('Error al cargar las monedas')
    }
  }

  // Calcular conversión cuando cambia el monto o la moneda
  useEffect(() => {
    if (monto && monedaSeleccionada && monedaBase && cuenta) {
      const convertido = convertirAMonedaBase(
        monto,
        monedaSeleccionada,
        monedaBase
      )
      setMontoConvertido(convertido)
    } else {
      setMontoConvertido(undefined)
    }
  }, [monto, monedaSeleccionada, monedaBase, cuenta])

  const saldoPendiente = cuenta ? Number(cuenta.saldo) : 0

  const handleAddAbono = () => {
    setShowForm(true)
    form.resetFields()
    setMonto(undefined)
    setMontoConvertido(undefined)
    setMonedaSeleccionada(null)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    form.resetFields()
    setMonto(undefined)
    setMontoConvertido(undefined)
    setMonedaSeleccionada(null)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // Calcular monto_en_moneda_cxc y tasa_cambio si hay conversión
      let montoEnMonedaCxc: number | undefined
      let tasaCambio: number | undefined

      if (montoConvertido && monedaSeleccionada && monedaBase && cuenta) {
        montoEnMonedaCxc = Number(montoConvertido.toFixed(2))

        // Calcular tasa_cambio si las monedas son diferentes
        if (
          monedaSeleccionada.id !== monedaBase.id &&
          monedaSeleccionada.tasa_vs_base
        ) {
          tasaCambio = Number(monedaSeleccionada.tasa_vs_base)
        }
      } else if (
        monto &&
        monedaSeleccionada &&
        monedaBase &&
        cuenta &&
        monedaSeleccionada.id === monedaBase.id
      ) {
        // Misma moneda, monto_en_moneda_cxc es igual al monto
        montoEnMonedaCxc = Number(monto.toFixed(2))
      }

      const payload: CreateAbonoCxcRequest = {
        moneda_id: values.moneda_id,
        monto: Number(values.monto.toFixed(2)),
        metodo_pago_id: values.metodo_pago_id || null,
        tasa_cambio: tasaCambio || null,
        referencia: values.referencia || null,
        fecha: values.fecha || dayjs().format('YYYY-MM-DD'),
      }

      await addAbonoCuentaPorCobrar(cuentaId, payload)
      message.success('Abono agregado exitosamente')
      handleCancelForm()
      await loadCuenta()
      if (onAbonosChange) {
        onAbonosChange()
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error('Por favor complete todos los campos requeridos')
      } else {
        message.error(error.message || 'Error al guardar el abono')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAbono = async (abonoId: number) => {
    try {
      setLoading(true)
      await deleteAbonoCuentaPorCobrar(cuentaId, abonoId)
      message.success('Abono eliminado exitosamente')
      await loadCuenta()
      if (onAbonosChange) {
        onAbonosChange()
      }
    } catch (error: any) {
      message.error(error.message || 'Error al eliminar el abono')
    } finally {
      setLoading(false)
    }
  }

  const handleMontoChange = (value: number | null) => {
    const montoValor = value ? Number(value.toFixed(2)) : 0
    setMonto(montoValor)
  }

  const handleMonedaChange = (value: number, moneda: Moneda) => {
    setMonedaSeleccionada(moneda)
  }

  const abonosColumns = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (fecha: string) => {
        try {
          return dayjs(fecha).format('DD/MM/YYYY')
        } catch {
          return fecha
        }
      },
    },
    {
      title: 'Monto',
      dataIndex: 'monto',
      key: 'monto',
      align: 'right' as const,
      render: (monto: number, record: AbonoType) =>
        formatCurrency(record.moneda_codigo, monto),
    },
    {
      title: 'Moneda',
      dataIndex: 'moneda_codigo',
      key: 'moneda_codigo',
    },
    {
      title: 'Monto en Moneda CXC',
      dataIndex: 'monto_en_moneda_cxc',
      key: 'monto_en_moneda_cxc',
      align: 'right' as const,
      render: (monto: number, record: AbonoType) =>
        formatCurrency(cuenta?.moneda_codigo || record.moneda_codigo, monto),
    },
    {
      title: 'Método de Pago',
      dataIndex: 'metodo_pago',
      key: 'metodo_pago',
      render: (metodo: string | null) =>
        metodo ? <Tag>{metodo}</Tag> : <Tag color='default'>N/A</Tag>,
    },
    {
      title: 'Referencia',
      dataIndex: 'referencia',
      key: 'referencia',
      render: (ref: string | null) => ref || '-',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: any, record: AbonoType) => (
        <Popconfirm
          title='¿Está seguro de eliminar este abono?'
          onConfirm={() => handleDeleteAbono(record.id)}
          okText='Sí'
          cancelText='No'
        >
          <Button
            type='text'
            danger
            icon={<DeleteOutlined />}
            loading={loading}
          >
            Eliminar
          </Button>
        </Popconfirm>
      ),
    },
  ]

  if (!cuenta && loadingCuenta) {
    return (
      <Modal
        title='Gestión de Abonos'
        open={open}
        onCancel={onCancel}
        footer={null}
        width={900}
      >
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando...</div>
      </Modal>
    )
  }

  if (!cuenta) {
    return null
  }

  const abonos = cuenta.abonos || []

  return (
    <Modal
      title='Gestión de Abonos / Pagos'
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1000}
    >
      <Space direction='vertical' size='large' style={{ width: '100%' }}>
        {/* Información de la cuenta */}
        <Card size='small' title='Información de la Cuenta'>
          <Space size='large' wrap>
            <Statistic
              title='Total'
              value={cuenta.total}
              formatter={value =>
                formatCurrency(cuenta.moneda_codigo, value as number)
              }
            />
            <Statistic
              title='Total Pagado'
              value={cuenta.total_pagado}
              formatter={value =>
                formatCurrency(cuenta.moneda_codigo, value as number)
              }
            />
            <Statistic
              title='Saldo Pendiente'
              value={saldoPendiente}
              formatter={value =>
                formatCurrency(cuenta.moneda_codigo, value as number)
              }
              valueStyle={{
                color: saldoPendiente > 0 ? '#cf1322' : '#52c41a',
              }}
            />
            <Statistic
              title='Estado'
              value={cuenta.estado_pago_clasificacion}
              formatter={value => (
                <Tag
                  color={
                    value === 'pagada'
                      ? 'green'
                      : value === 'parcial'
                      ? 'orange'
                      : 'red'
                  }
                >
                  {value === 'pagada'
                    ? 'Pagada'
                    : value === 'parcial'
                    ? 'Parcial'
                    : 'Pendiente'}
                </Tag>
              )}
            />
          </Space>
        </Card>

        {/* Botón para agregar abono */}
        {!showForm && (
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={handleAddAbono}
            block
          >
            Agregar Abono
          </Button>
        )}

        {/* Formulario para agregar abono */}
        {showForm && (
          <Card size='small' title='Nuevo Abono'>
            <Form form={form} layout='vertical'>
              <Form.Item
                label='Método de Pago'
                name='metodo_pago_id'
                rules={[
                  { required: true, message: 'Seleccione un método de pago' },
                ]}
              >
                <MetodoPagoSelect />
              </Form.Item>

              <Form.Item
                label='Moneda'
                name='moneda_id'
                rules={[{ required: true, message: 'Seleccione una moneda' }]}
              >
                <MonedaSelect onChange={handleMonedaChange} />
              </Form.Item>

              <Form.Item
                label='Monto'
                name='monto'
                rules={[
                  { required: true, message: 'Ingrese el monto' },
                  {
                    type: 'number',
                    min: 0.01,
                    message: 'El monto debe ser mayor a 0',
                  },
                  {
                    validator: (_, value) => {
                      if (value && value > saldoPendiente) {
                        return Promise.reject(
                          new Error(
                            `El monto no puede exceder el saldo pendiente (${formatCurrency(
                              cuenta.moneda_codigo,
                              saldoPendiente
                            )})`
                          )
                        )
                      }
                      return Promise.resolve()
                    },
                  },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0.01}
                  max={saldoPendiente}
                  step={0.01}
                  precision={2}
                  onChange={handleMontoChange}
                  placeholder='0.00'
                  formatter={value =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={value =>
                    parseFloat(value!.replace(/\$\s?|(,*)/g, '')) || 0
                  }
                />
              </Form.Item>

              <Form.Item label='Referencia (Opcional)' name='referencia'>
                <Input
                  placeholder='Número de transacción, cheque, etc.'
                  maxLength={50}
                />
              </Form.Item>

              {montoConvertido &&
                monedaSeleccionada &&
                monedaBase &&
                monedaSeleccionada.id !== monedaBase.id && (
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#e6f7ff',
                      borderRadius: '6px',
                      border: '1px solid #91d5ff',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#1890ff' }}>
                      <strong>Conversión:</strong>{' '}
                      {formatCurrency(monedaSeleccionada.codigo, monto)} ={' '}
                      {formatCurrency(monedaBase.codigo, montoConvertido)}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#8c8c8c',
                        marginTop: '2px',
                      }}
                    >
                      Tasa: 1 {monedaSeleccionada.codigo} ={' '}
                      {formatearTasa(monedaSeleccionada.tasa_vs_base)}{' '}
                      {monedaBase.codigo}
                    </div>
                  </div>
                )}

              <Space>
                <Button
                  type='primary'
                  loading={loading}
                  onClick={handleSubmit}
                  icon={<DollarOutlined />}
                >
                  Guardar Abono
                </Button>
                <Button onClick={handleCancelForm}>Cancelar</Button>
              </Space>
            </Form>
          </Card>
        )}

        {/* Tabla de abonos */}
        <Card size='small' title={`Abonos Registrados (${abonos.length})`}>
          {abonos.length > 0 ? (
            <Table
              columns={abonosColumns}
              dataSource={abonos}
              rowKey='id'
              pagination={false}
              loading={loading}
              size='small'
            />
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '20px',
                color: '#8c8c8c',
              }}
            >
              No hay abonos registrados
            </div>
          )}
        </Card>
      </Space>
    </Modal>
  )
}
