'use client'
import '@ant-design/v5-patch-for-react-19'
import { useState, useEffect } from 'react'
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
import { editSale } from '@/app/api/sales'
import { ProductSelect } from '@/app/components/ProductSelect'
import { motion } from 'framer-motion'
import { PageHeader } from '@/app/components/PageHeader'
import { SearchSelect } from '@/app/components/SearchSelect'
import { ClientsTypeResponse, getClients } from '@/app/api/clients'
import { getSalesFlat } from '@/app/api/sales'
import { use } from 'react'

interface PurchaseDetail {
  producto_id: number
  cantidad: number
  precio_unitario: number
  subtotal: number
  producto_descripcion: string
  codigo: string
  stock?: number
  key: number
}

export default function EditPurchase({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const [isLoading, setIsLoading] = useState(false)
  const [modal, contextHolder] = Modal.useModal()
  const [form] = Form.useForm()
  const router = useRouter()
  const [details, setDetails] = useState<PurchaseDetail[]>([])
  const [client, setClient] = useState<ClientsTypeResponse>()
  const [saleData, setSaleData] = useState<any>(null)

  useEffect(() => {
    const fetchSaleData = async () => {
      try {
        const sales = await getSalesFlat({ id: resolvedParams.id })
        if (sales && sales.length > 0) {
          const sale = sales[0]
          setSaleData(sale)

          // Cargar los datos del cliente
          const clients = await getClients({ nit: sale.cliente_nit })
          if (clients && clients.length > 0) {
            const currentClient = clients[0]
            setClient(currentClient)
            form.setFieldsValue({
              cliente_id: {
                value: currentClient.id,
                label: `${currentClient.nombre} - ${currentClient.nit}`,
                details: currentClient,
              },
            })
          }

          setDetails(
            sale.productos.map((producto: any, index: number) => ({
              key: index,
              producto_id: producto.producto_id,
              producto_descripcion: producto.descripcion,
              codigo: producto.codigo,
              cantidad: producto.cantidad,
              precio_unitario: producto.precio_unitario,
              subtotal: producto.subtotal,
            }))
          )
        }
      } catch (error) {
        message.error('Error al cargar los datos de la venta')
        router.push('/home/saleOrders')
      }
    }

    fetchSaleData()
  }, [resolvedParams.id, form, router])

  const handleProductChange = (value: number, product: any, index: number) => {
    const isProductAlreadyAdded = details.some(
      (detail, i) => detail.producto_id === value && i !== index
    )

    if (isProductAlreadyAdded) {
      message.error('Este producto ya ha sido agregado a la venta')
      return
    }

    const newDetails = [...details]
    if (product) {
      newDetails[index] = {
        ...newDetails[index],
        producto_id: value,
        producto_descripcion: product.descripcion,
        precio_unitario: product.precio || 0,
        cantidad: newDetails[index].cantidad || 1,
        subtotal: (product.precio || 0) * (newDetails[index].cantidad || 1),
        codigo: product.codigo,
        stock: product.stock,
      }
      setDetails(newDetails)
    }
  }

  const handleQuantityChange = (value: number | null, index: number) => {
    if (value === null) return
    const newDetails = [...details]
    newDetails[index] = {
      ...newDetails[index],
      cantidad: value,
      subtotal: newDetails[index].precio_unitario * value,
    }
    setDetails(newDetails)
  }

  const handlePriceChange = (value: number | null, index: number) => {
    if (value === null) return
    const newDetails = [...details]
    newDetails[index] = {
      ...newDetails[index],
      precio_unitario: value,
      subtotal: value * newDetails[index].cantidad,
    }
    setDetails(newDetails)
  }

  const canAddNewProduct = () => {
    if (details.length === 0) return true
    const lastDetail = details[details.length - 1]
    return (
      lastDetail.producto_id > 0 &&
      lastDetail.cantidad > 0 &&
      lastDetail.precio_unitario > 0
    )
  }

  const handleAddDetail = () => {
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
        precio_unitario: 0,
        subtotal: 0,
      },
    ])
  }

  const handleRemoveDetail = (index: number) => {
    const newDetails = [...details]
    newDetails.splice(index, 1)
    setDetails(newDetails)
  }

  const onFinish = async (values: any) => {
    try {
      if (details.length === 0) {
        message.error('Debe agregar al menos un producto')
        return
      }

      if (
        details.some(
          detail =>
            !detail.producto_id || !detail.cantidad || !detail.precio_unitario
        )
      ) {
        message.error(
          'Debe seleccionar un producto y completar los campos del detalle'
        )
        return
      }

      const data = {
        venta_id: parseInt(resolvedParams.id),
        empresa_id: 1,
        cliente_id: values.cliente_id.value || values.cliente_id,
        usuario_id: 1,
        total: details.reduce((acc, curr) => acc + curr.subtotal, 0),
        estado: 'generado', //saleData?.estado_venta || 'generado',
        detalle: details,
      }

      const confirm = await modal.confirm({
        title: 'Actualizar venta',
        content: '¿Está seguro de actualizar esta venta?',
      })

      if (!confirm) return

      setIsLoading(true)

      try {
        await editSale(data)
        message.success('Venta actualizada exitosamente')
        router.push('/home/saleOrders')
      } catch (error: any) {
        message.error(error.message || 'Error al actualizar la venta')
      }
    } catch (error: any) {
      message.error(error.message || 'Error al actualizar la venta')
    } finally {
      setIsLoading(false)
    }
  }

  const columns = [
    {
      title: 'Producto',
      dataIndex: 'producto_id',
      width: 250,
      render: (_: any, record: PurchaseDetail, index: number) => (
        <ProductSelect
          value={record.producto_id}
          labelValue={`${record.producto_descripcion} - ${record.codigo}`}
          onChange={(value, product) =>
            handleProductChange(value, product, index)
          }
        />
      ),
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      width: 150,
      render: (_: any, record: PurchaseDetail, index: number) => (
        <InputNumber
          min={1}
          value={record.cantidad}
          onChange={value => handleQuantityChange(value, index)}
        />
      ),
    },
    {
      title: 'Precio Unitario',
      dataIndex: 'precio_unitario',
      width: 250,
      render: (_: any, record: PurchaseDetail, index: number) => (
        <InputNumber
          min={0}
          value={record.precio_unitario}
          onChange={value => handlePriceChange(value, index)}
        />
      ),
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      render: (value: number) => `Q ${value.toFixed(2)}`,
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

  const fetchClients = async (search: string) => {
    const hasNumbers = /\d/.test(search)
    const filters: Record<string, any> = {}

    if (hasNumbers) {
      filters.nit = search
    } else {
      filters.name = search
    }

    const clients = await getClients(filters)
    return clients
  }

  if (!saleData) {
    return null
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
          <PageHeader title='Editar Venta' showNewButton={false} />

          <Form
            form={form}
            layout='vertical'
            onFinish={onFinish}
            initialValues={{
              cliente_id: saleData?.cliente_id,
            }}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name='cliente_id'
                  label='Cliente'
                  rules={[
                    {
                      required: true,
                      message: 'Por favor seleccione un cliente',
                    },
                  ]}
                >
                  <SearchSelect
                    form={form}
                    name='cliente_id'
                    fetchOptions={fetchClients}
                    placeholder='Busque un Cliente por nombre o NIT'
                    labelFormatter={item => `${item.nombre} - ${item.nit}`}
                    onSelect={(_, option) => {
                      if (option && option.details) {
                        setClient(option.details)
                      }
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label='Nombre del Cliente'>
                  <Input value={client?.nombre} disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label='NIT del Cliente'>
                  <Input value={client?.nit} disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label='Email del Cliente'>
                  <Input value={client?.email} disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label='Teléfono del Cliente'>
                  <Input value={client?.telefono} disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label='Dirección del Cliente'>
                  <Input value={client?.direccion} disabled />
                </Form.Item>
              </Col>
            </Row>

            <Table
              columns={columns}
              dataSource={details}
              pagination={false}
              footer={() => (
                <Button
                  type='dashed'
                  onClick={handleAddDetail}
                  block
                  icon={<PlusOutlined />}
                >
                  Agregar Producto
                </Button>
              )}
            />

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <Space>
                <Button onClick={() => router.push('/home/saleOrders')}>
                  Cancelar
                </Button>
                <Button type='primary' htmlType='submit' loading={isLoading}>
                  Actualizar Venta
                </Button>
              </Space>
            </div>
          </Form>
        </Space>
      </Card>
      {contextHolder}
    </motion.div>
  )
}
