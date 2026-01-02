'use client'
import '@ant-design/v5-patch-for-react-19'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Card,
  Button,
  Space,
  message,
  Table,
  Row,
  Col,
  Tag,
  Descriptions,
  Modal,
  Spin,
} from 'antd'
import {
  ArrowLeftOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarCircleOutlined,
  ShoppingOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import { getCompra, anularCompra, CompraResponse } from '@/app/api/compras'
import { motion } from 'framer-motion'
import { PageHeader } from '@/app/components/PageHeader'
import { formatCurrency } from '@/app/utils/currency'
import { QueryKey, queryClient } from '@/app/utils/query'
import dayjs from 'dayjs'

export default function CompraDetailPage() {
  const params = useParams()
  const router = useRouter()
  const compraId = Number(params.id)
  const [compra, setCompra] = useState<CompraResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [anulando, setAnulando] = useState(false)

  useEffect(() => {
    const fetchCompra = async () => {
      try {
        setLoading(true)
        const data = await getCompra(compraId)
        console.log('Compra data recibida:', data)
        console.log('Detalles recibidos:', data.detalles)
        console.log('Número de detalles:', data.detalles?.length || 0)
        setCompra(data)
      } catch (error: any) {
        console.error('Error al cargar compra:', error)
        message.error(error.message || 'Error al cargar la compra')
        router.push('/home/compras')
      } finally {
        setLoading(false)
      }
    }

    if (compraId && !isNaN(compraId)) {
      fetchCompra()
    } else {
      message.error('ID de compra inválido')
      router.push('/home/compras')
    }
  }, [compraId, router])

  const handleAnular = () => {
    if (!compra) return

    if (compra.estado === 'anulada') {
      message.warning('La compra ya está anulada')
      return
    }

    // Construir mensaje de confirmación
    let warningMessage = `¿Está seguro de que desea anular la compra #${compra.id}?`

    warningMessage += `\n\n⚠️ Esta acción:`
    warningMessage += `\n• Quitará el stock agregado por esta compra`
    warningMessage += `\n• Revertirá los movimientos de inventario`

    if (compra.cuenta_por_pagar && compra.cuenta_por_pagar.saldo > 0) {
      warningMessage += `\n• Anulará la cuenta por pagar asociada (saldo pendiente: ${formatCurrency(
        compra.moneda_codigo,
        compra.cuenta_por_pagar.saldo
      )})`
    }

    warningMessage += `\n\nNota: Si el stock actual es menor que la cantidad comprada, el stock quedará negativo.`

    Modal.confirm({
      title: 'Anular compra',
      content: warningMessage,
      okText: 'Anular',
      okType: 'danger',
      cancelText: 'Cancelar',
      width: 500,
      onOk: async () => {
        try {
          setAnulando(true)
          await anularCompra(compra.id)
          message.success('Compra anulada exitosamente')
          await queryClient.invalidateQueries({
            queryKey: [QueryKey.comprasInfo],
          })
          router.push('/home/compras')
        } catch (error: any) {
          message.error(error.message || 'Error al anular la compra')
        } finally {
          setAnulando(false)
        }
      },
    })
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size='large' />
      </div>
    )
  }

  if (!compra) {
    return null
  }

  const columns = [
    {
      title: 'Producto',
      dataIndex: 'producto_descripcion',
      key: 'producto_descripcion',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ color: '#8c8c8c', fontSize: '12px' }}>
            {record.producto_codigo}
            {record.producto_serie && ` - Serie: ${record.producto_serie}`}
          </div>
        </div>
      ),
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      key: 'cantidad',
      align: 'right' as const,
    },
    {
      title: 'Costo Unitario',
      dataIndex: 'costo_unitario',
      key: 'costo_unitario',
      align: 'right' as const,
      render: (value: number) => formatCurrency(compra.moneda_codigo, value),
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ fontWeight: 'bold' }}>
          {formatCurrency(compra.moneda_codigo, value)}
        </span>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Compra #{compra.id}</h1>
          <p style={{ margin: '4px 0 0 0', color: '#8c8c8c' }}>
            Detalle de la compra
          </p>
        </div>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            Volver
          </Button>
          {compra.estado !== 'anulada' && (
            <Button
              danger
              icon={<StopOutlined />}
              onClick={handleAnular}
              loading={anulando}
            >
              Anular Compra
            </Button>
          )}
        </Space>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Row gutter={24}>
          {/* Información General */}
          <Col xs={24} lg={12}>
            <Card title='Información General' style={{ marginBottom: '24px' }}>
              <Descriptions column={1} bordered>
                <Descriptions.Item label='ID'>#{compra.id}</Descriptions.Item>
                <Descriptions.Item label='Fecha'>
                  {dayjs(compra.fecha).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label='Proveedor'>
                  <Space>
                    <ShoppingOutlined />
                    {compra.proveedor_nombre}
                    {compra.proveedor_nit && (
                      <span style={{ color: '#8c8c8c' }}>
                        ({compra.proveedor_nit})
                      </span>
                    )}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label='Moneda'>
                  <Tag color='blue'>
                    {compra.moneda_codigo} {compra.moneda_simbolo}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label='Tipo de Pago'>
                  {compra.tipo_pago ? (
                    <Tag
                      color={compra.tipo_pago === 'contado' ? 'green' : 'blue'}
                    >
                      {compra.tipo_pago === 'contado' ? 'Contado' : 'Crédito'}
                    </Tag>
                  ) : (
                    <Tag color='default'>No especificado</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label='Estado'>
                  <Tag
                    color={compra.estado === 'registrada' ? 'success' : 'error'}
                    icon={
                      compra.estado === 'registrada' ? (
                        <CheckCircleOutlined />
                      ) : (
                        <CloseCircleOutlined />
                      )
                    }
                  >
                    {compra.estado === 'registrada' ? 'Registrada' : 'Anulada'}
                  </Tag>
                </Descriptions.Item>
                {compra.comentario && (
                  <Descriptions.Item label='Comentario'>
                    {compra.comentario}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Cuenta por Pagar */}
            {compra.cuenta_por_pagar && (
              <Card title='Cuenta por Pagar' style={{ marginBottom: '24px' }}>
                <Descriptions column={1} bordered>
                  <Descriptions.Item label='ID'>
                    <a
                      href={`/home/cuentasPorPagar?id=${compra.cuenta_por_pagar.id}`}
                      onClick={e => {
                        e.preventDefault()
                        router.push(
                          `/home/cuentasPorPagar?id=${
                            compra.cuenta_por_pagar!.id
                          }`
                        )
                      }}
                      style={{
                        color: '#1890ff',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      #{compra.cuenta_por_pagar.id}
                      <LinkOutlined style={{ fontSize: '12px' }} />
                    </a>
                  </Descriptions.Item>
                  <Descriptions.Item label='Total'>
                    {formatCurrency(
                      compra.moneda_codigo,
                      compra.cuenta_por_pagar.total
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label='Saldo'>
                    <span
                      style={{
                        fontWeight: 'bold',
                        color:
                          compra.cuenta_por_pagar.saldo > 0
                            ? '#ff4d4f'
                            : '#52c41a',
                      }}
                    >
                      {formatCurrency(
                        compra.moneda_codigo,
                        compra.cuenta_por_pagar.saldo
                      )}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label='Estado'>
                    <Tag
                      color={
                        compra.cuenta_por_pagar.estado === 'cancelada'
                          ? 'success'
                          : compra.cuenta_por_pagar.estado === 'vencida'
                          ? 'error'
                          : 'processing'
                      }
                    >
                      {compra.cuenta_por_pagar.estado}
                    </Tag>
                  </Descriptions.Item>
                  {compra.cuenta_por_pagar.fecha_vencimiento && (
                    <Descriptions.Item label='Fecha de Vencimiento'>
                      {dayjs(compra.cuenta_por_pagar.fecha_vencimiento).format(
                        'DD/MM/YYYY'
                      )}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}
          </Col>

          {/* Resumen */}
          <Col xs={24} lg={12}>
            <Card title='Resumen' style={{ marginBottom: '24px' }}>
              <Space
                direction='vertical'
                style={{ width: '100%' }}
                size='large'
              >
                <div>
                  <strong>Total de Productos:</strong>{' '}
                  {compra.detalles?.length || 0}
                </div>

                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  <DollarCircleOutlined style={{ color: '#52c41a' }} /> Total:{' '}
                  <span style={{ color: '#52c41a' }}>
                    {formatCurrency(compra.moneda_codigo, compra.total)}
                  </span>
                </div>
                {compra.tipo_pago === 'credito' && compra.cuenta_por_pagar && (
                  <div
                    style={{
                      padding: '12px',
                      background: '#e6f7ff',
                      borderRadius: '4px',
                      border: '1px solid #91d5ff',
                    }}
                  >
                    <strong>ℹ️ Esta compra generó una cuenta por pagar</strong>
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>
                      ID:{' '}
                      <a
                        href={`/home/cuentasPorPagar?id=${compra.cuenta_por_pagar.id}`}
                        onClick={e => {
                          e.preventDefault()
                          router.push(
                            `/home/cuentasPorPagar?id=${
                              compra.cuenta_por_pagar!.id
                            }`
                          )
                        }}
                        style={{
                          color: '#1890ff',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        #{compra.cuenta_por_pagar.id}
                        <LinkOutlined style={{ fontSize: '10px' }} />
                      </a>{' '}
                      | Saldo:{' '}
                      {formatCurrency(
                        compra.moneda_codigo,
                        compra.cuenta_por_pagar.saldo
                      )}
                    </div>
                  </div>
                )}
                {compra.tipo_pago === 'contado' && (
                  <div
                    style={{
                      padding: '12px',
                      background: '#f6ffed',
                      borderRadius: '4px',
                      border: '1px solid #b7eb8f',
                    }}
                  >
                    <strong>
                      ✓ Compra a contado - No genera cuenta por pagar
                    </strong>
                  </div>
                )}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Detalle de Productos */}
        <Card title='Detalle de Productos'>
          {compra.detalles && compra.detalles.length > 0 ? (
            <Table
              columns={columns}
              dataSource={compra.detalles}
              pagination={false}
              rowKey='id'
              locale={{
                emptyText: 'No hay productos en esta compra',
              }}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <strong>Total</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align='right'>
                      <strong style={{ fontSize: '16px', color: '#52c41a' }}>
                        {formatCurrency(compra.moneda_codigo, compra.total)}
                      </strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          ) : (
            <div
              style={{ padding: '20px', textAlign: 'center', color: '#8c8c8c' }}
            >
              No hay productos registrados en esta compra
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
