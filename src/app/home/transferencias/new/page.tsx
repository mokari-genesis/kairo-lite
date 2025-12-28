'use client'
import '@ant-design/v5-patch-for-react-19'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  message,
  Table,
  InputNumber,
  Row,
  Col,
  Modal,
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { createTransferencia } from '@/app/api/transferencias'
import { ProductSelect } from '@/app/components/ProductSelect'
import { EmpresaSelect } from '@/app/components/EmpresaSelect'
import { motion } from 'framer-motion'
import { PageHeader } from '@/app/components/PageHeader'
import { getProducts, ProductType } from '@/app/api/products'
import { EnterpriseType } from '@/app/api/enterprise'
import { useUsuario } from '@/app/usuarioContext'

interface TransferenciaDetail {
  producto_id: number
  cantidad: number
  producto_descripcion: string
  codigo: string
  stock?: number
  key: number
}

export default function NewTransferencia() {
  const { usuarioId } = useUsuario()
  const [isLoading, setIsLoading] = useState(false)
  const [modal, contextHolder] = Modal.useModal()
  const [form] = Form.useForm()
  const router = useRouter()
  const [details, setDetails] = useState<TransferenciaDetail[]>([])
  const [empresaOrigen, setEmpresaOrigen] = useState<EnterpriseType | null>(
    null
  )
  const [empresaDestino, setEmpresaDestino] = useState<EnterpriseType | null>(
    null
  )
  const [stockData, setStockData] = useState<ProductType[]>([])
  const [hasInsufficientStock, setHasInsufficientStock] = useState(false)

  // Cargar stock cuando cambia la empresa origen
  useEffect(() => {
    if (empresaOrigen?.id) {
      loadStock(empresaOrigen.id)
    } else {
      setStockData([])
    }
  }, [empresaOrigen])

  // Verificar stock insuficiente cuando cambian los detalles
  useEffect(() => {
    const hasInsufficient = details.some(
      detail => detail.producto_id > 0 && (detail.stock || 0) < detail.cantidad
    )
    setHasInsufficientStock(hasInsufficient)
  }, [details])

  const loadStock = async (empresa_id: number) => {
    try {
      const data = await getProducts(undefined, empresa_id)
      setStockData(data)
    } catch (error) {
      console.error('Error loading stock:', error)
      message.error('Error al cargar el stock')
    }
  }

  const getStockForProduct = (producto_id: number): number => {
    const stock = stockData.find(s => Number(s.id) === producto_id)
    if (!stock) return 0
    return stock.stock || 0
  }

  const handleProductChange = (value: number, product: any, index: number) => {
    // Verificar si el producto ya está agregado
    const isProductAlreadyAdded = details.some(
      (detail, i) => detail.producto_id === value && i !== index
    )

    if (isProductAlreadyAdded) {
      message.error('Este producto ya ha sido agregado a la transferencia')
      return
    }

    const newDetails = [...details]
    if (product) {
      const stock = getStockForProduct(value)
      newDetails[index] = {
        ...newDetails[index],
        producto_id: value,
        producto_descripcion: product.descripcion,
        codigo: product.codigo,
        cantidad: newDetails[index].cantidad || 1,
        stock,
        key: newDetails[index].key,
      }
      setDetails(newDetails)
    }
  }

  const handleQuantityChange = (value: number | null, index: number) => {
    if (value === null) return

    const newDetails = [...details]
    const currentDetail = newDetails[index]
    const stockDisponible = currentDetail.stock || 0

    // Actualizar siempre el detalle para que el useEffect pueda verificar
    newDetails[index] = {
      ...newDetails[index],
      cantidad: value,
      key: newDetails[index].key,
    }
    setDetails(newDetails)

    // Validar después de actualizar
    if (value > stockDisponible) {
      message.error(
        `Stock insuficiente. Disponible en sucursal origen: ${stockDisponible}`
      )
      return
    }

    if (value <= 0) {
      message.error('La cantidad debe ser mayor a 0')
      return
    }
  }

  const canAddNewProduct = () => {
    if (details.length === 0) return true
    const lastDetail = details[details.length - 1]
    return lastDetail.producto_id > 0 && lastDetail.cantidad > 0
  }

  const handleAddDetail = () => {
    if (!empresaOrigen) {
      message.error('Debe seleccionar una sucursal origen primero')
      return
    }

    if (!canAddNewProduct()) {
      message.error(
        'Por favor complete todos los campos del producto actual antes de agregar uno nuevo'
      )
      return
    }
    setDetails([
      ...details,
      {
        key: details.length,
        producto_id: 0,
        producto_descripcion: '',
        codigo: '',
        cantidad: 1,
        stock: 0,
      },
    ])
  }

  const handleRemoveDetail = (index: number) => {
    const newDetails = [...details]
    newDetails.splice(index, 1)
    setDetails(newDetails)
  }

  const validateStock = (): boolean => {
    if (!empresaOrigen) {
      message.error('Debe seleccionar una sucursal origen')
      return false
    }

    if (details.length === 0) {
      message.error('Debe agregar al menos un producto')
      return false
    }

    // Validar que todos los productos tengan stock suficiente
    const productosConStockInsuficiente = details.filter(
      detail => (detail.stock || 0) < detail.cantidad
    )

    if (productosConStockInsuficiente.length > 0) {
      const mensaje = productosConStockInsuficiente
        .map(
          detail =>
            `${detail.producto_descripcion}: Disponible ${
              detail.stock || 0
            }, solicitado ${detail.cantidad}`
        )
        .join('\n')
      message.error(`Stock insuficiente en sucursal origen:\n${mensaje}`, 10)
      return false
    }

    // Validar que todos los productos estén completos
    const productosIncompletos = details.filter(
      detail => !detail.producto_id || !detail.cantidad || detail.cantidad <= 0
    )

    if (productosIncompletos.length > 0) {
      message.error('Debe completar todos los productos')
      return false
    }

    return true
  }

  const onFinish = async (values: any) => {
    try {
      if (!validateStock()) {
        return
      }

      const data = {
        empresa_origen_id: empresaOrigen!.id,
        empresa_destino_id: empresaDestino!.id,
        usuario_id: usuarioId ?? null,
        estado: 'borrador' as const,
        comentario: values.comentario || '',
        detalles: details.map(detail => ({
          producto_id: detail.producto_id,
          cantidad: detail.cantidad,
        })),
      }

      const confirm = await modal.confirm({
        title: 'Crear Transferencia',
        content:
          '¿Desea crear esta transferencia? Puede confirmarla más tarde desde el listado.',
      })

      if (!confirm) return

      setIsLoading(true)

      try {
        await createTransferencia(data)
        message.success('Transferencia creada exitosamente')
        router.push('/home/transferencias')
      } catch (error: any) {
        message.error(error.message || 'Error al crear la transferencia')
      }
    } catch (error: any) {
      message.error(error.message || 'Error al crear la transferencia')
    } finally {
      setIsLoading(false)
    }
  }

  const columns = [
    {
      title: 'Producto',
      dataIndex: 'producto_id',
      width: 300,
      render: (_: any, record: TransferenciaDetail, index: number) => (
        <ProductSelect
          value={record.producto_id}
          labelValue={`${record.producto_descripcion} - ${record.codigo}`}
          onChange={(value, product) =>
            handleProductChange(value, product, index)
          }
          // Usar siempre la sucursal origen para las búsquedas de productos
          empresaId={empresaOrigen?.id}
        />
      ),
    },
    {
      title: 'Stock Disponible (Origen)',
      dataIndex: 'stock',
      width: 200,
      render: (_: any, record: TransferenciaDetail) => (
        <Input
          value={record.stock?.toString() || '0'}
          disabled
          style={{
            color:
              (record.stock || 0) < record.cantidad ? '#ff4d4f' : undefined,
            fontWeight:
              (record.stock || 0) < record.cantidad ? 'bold' : undefined,
          }}
        />
      ),
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      width: 150,
      render: (_: any, record: TransferenciaDetail, index: number) => (
        <InputNumber
          min={1}
          value={record.cantidad}
          onChange={value => handleQuantityChange(value, index)}
        />
      ),
    },
    {
      title: 'Acciones',
      render: (_: any, __: any, index: number) => (
        <Button
          type='text'
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveDetail(index)}
        />
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
        <PageHeader title='Nueva Transferencia' showNewButton={false} />
        <Form form={form} layout='vertical' onFinish={onFinish}>
          <Space direction='vertical' size='large' style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Space direction='vertical' style={{ width: '100%' }}>
                  <label>Sucursal Origen *</label>
                  <Form.Item
                    style={{ marginBottom: 0 }}
                    rules={[
                      {
                        required: true,
                        message: 'Por favor seleccione una sucursal origen',
                      },
                    ]}
                  >
                    <EmpresaSelect
                      value={empresaOrigen?.id}
                      onChange={(value, empresa) => {
                        setEmpresaOrigen(empresa)
                        // Limpiar detalles cuando cambia la sucursal origen
                        setDetails([])
                      }}
                      placeholder='Seleccione la sucursal origen'
                    />
                  </Form.Item>
                  {empresaOrigen && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      <strong>NIT:</strong> {empresaOrigen.nit} |{' '}
                      <strong>Dirección:</strong> {empresaOrigen.direccion}
                    </div>
                  )}
                </Space>
              </Col>
              <Col span={12}>
                <Space direction='vertical' style={{ width: '100%' }}>
                  <label>Sucursal Destino *</label>
                  <Form.Item
                    style={{ marginBottom: 0 }}
                    rules={[
                      {
                        required: true,
                        message: 'Por favor seleccione una sucursal destino',
                      },
                    ]}
                  >
                    <EmpresaSelect
                      value={empresaDestino?.id}
                      onChange={(value, empresa) => setEmpresaDestino(empresa)}
                      excludeId={empresaOrigen?.id}
                      placeholder='Seleccione la sucursal destino'
                    />
                  </Form.Item>
                  {empresaDestino && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      <strong>NIT:</strong> {empresaDestino.nit} |{' '}
                      <strong>Dirección:</strong> {empresaDestino.direccion}
                    </div>
                  )}
                </Space>
              </Col>
            </Row>

            {empresaOrigen &&
              empresaDestino &&
              empresaOrigen.id === empresaDestino.id && (
                <div style={{ color: '#ff4d4f', marginTop: '-16px' }}>
                  ⚠️ La sucursal origen y destino no pueden ser la misma
                </div>
              )}

            <Row>
              <Col span={24}>
                <Space direction='vertical' style={{ width: '100%' }}>
                  <label>Comentario (Opcional)</label>
                  <Form.Item style={{ marginBottom: 0 }} name='comentario'>
                    <Input placeholder='Notas adicionales sobre la transferencia' />
                  </Form.Item>
                </Space>
              </Col>
            </Row>

            {empresaOrigen &&
              empresaDestino &&
              empresaOrigen.id !== empresaDestino.id && (
                <div>
                  <Button
                    type='dashed'
                    onClick={handleAddDetail}
                    icon={<PlusOutlined />}
                    style={{ marginBottom: '16px' }}
                    loading={isLoading}
                    disabled={!empresaOrigen}
                  >
                    Agregar Producto
                  </Button>
                  <div
                    style={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      border: '1px solid #e9ecef',
                      fontSize: '13px',
                      color: '#6c757d',
                      fontStyle: 'italic',
                      marginBottom: '16px',
                      padding: '8px',
                    }}
                  >
                    💡 <strong>Nota:</strong> El stock mostrado corresponde a la
                    sucursal origen. Asegúrese de que haya suficiente stock
                    antes de crear la transferencia.
                  </div>
                  <Table
                    loading={isLoading}
                    columns={columns}
                    dataSource={details}
                    rowKey='key'
                    pagination={false}
                  />
                </div>
              )}

            <Form.Item>
              <Space>
                <Button
                  loading={isLoading}
                  onClick={() => router.push('/home/transferencias')}
                >
                  Regresar
                </Button>
                <Button
                  loading={isLoading}
                  type='primary'
                  htmlType='submit'
                  disabled={
                    !empresaOrigen ||
                    !empresaDestino ||
                    empresaOrigen.id === empresaDestino.id ||
                    hasInsufficientStock
                  }
                >
                  Crear Transferencia
                </Button>
              </Space>
            </Form.Item>
          </Space>
        </Form>
      </Card>
      {contextHolder}
    </motion.div>
  )
}
