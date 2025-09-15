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
import { createPurchase } from '@/app/api/sales'
import { ProductSelect } from '@/app/components/ProductSelect'
import { MetodoPagoSelect } from '@/app/components/MetodoPagoSelect'
import { TipoPrecioSelector } from '@/app/components/TipoPrecioSelector'
import { motion } from 'framer-motion'
import { PageHeader } from '@/app/components/PageHeader'
import { SearchSelect } from '@/app/components/SearchSelect'
import { ClientsTypeResponse, getClients } from '@/app/api/clients'
import { getProductosPreciosByProduct } from '@/app/api/productos-precios'

interface PurchaseDetail {
  producto_id: number
  cantidad: number
  precio_unitario: number
  subtotal: number
  producto_descripcion: string
  codigo: string
  stock?: number
  precio_no_encontrado?: boolean // Flag para indicar si no se encontró precio para el tipo
  precio_realmente_no_encontrado?: boolean // Flag para mostrar mensaje de "no encontrado"
  tipo_precio_aplicado?:
    | 'sugerido'
    | 'mayorista'
    | 'minorista'
    | 'distribuidores'
    | 'especial'
  key: number
}

export default function NewPurchase() {
  const [isLoading, setIsLoading] = useState(false)
  const [modal, contextHolder] = Modal.useModal()
  const [form] = Form.useForm()
  const router = useRouter()
  const [details, setDetails] = useState<PurchaseDetail[]>([])
  const [client, setClient] = useState<ClientsTypeResponse>()
  const [metodoPago, setMetodoPago] = useState<any>()

  const handleProductChange = (value: number, product: any, index: number) => {
    // Check if the product is already in the details array
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
        precio_no_encontrado: false, // Inicializar como false (tipo sugerido por defecto)
        precio_realmente_no_encontrado: false, // Inicializar como false
        tipo_precio_aplicado: 'sugerido', // Auto-seleccionar tipo "sugerido" cuando se auto-popula el precio
        key: newDetails[index].key,
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
      key: newDetails[index].key,
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
      key: newDetails[index].key,
    }
    setDetails(newDetails)
  }

  const handlePriceTypeChange = async (value: string, index: number) => {
    const newDetails = [...details]
    const currentDetail = newDetails[index]

    // Actualizar el tipo de precio
    newDetails[index] = {
      ...currentDetail,
      tipo_precio_aplicado: value as
        | 'sugerido'
        | 'mayorista'
        | 'minorista'
        | 'distribuidores'
        | 'especial',
      key: currentDetail.key,
    }

    // Si hay un producto seleccionado, buscar el precio correspondiente
    if (currentDetail.producto_id > 0 && value) {
      try {
        const precios = await getProductosPreciosByProduct(
          currentDetail.producto_id
        )
        const precioEncontrado = precios.find(p => p.tipo === value)

        if (precioEncontrado) {
          // Convertir el precio a número para asegurar compatibilidad
          const precioNumerico = parseFloat(precioEncontrado.precio.toString())

          // Actualizar el precio unitario con el precio encontrado
          newDetails[index] = {
            ...newDetails[index],
            precio_unitario: precioNumerico,
            subtotal: precioNumerico * currentDetail.cantidad,
            precio_no_encontrado: value !== 'sugerido', // Solo habilitar si es sugerido
            precio_realmente_no_encontrado: false, // No mostrar mensaje de "no encontrado"
          }
          message.success(`Precio actualizado a Q.${precioNumerico.toFixed(2)}`)
        } else {
          // Establecer precio en 0 cuando no se encuentra el precio
          newDetails[index] = {
            ...newDetails[index],
            precio_unitario: 0,
            subtotal: 0,
            precio_no_encontrado: value !== 'sugerido', // Solo habilitar si es sugerido
            precio_realmente_no_encontrado: true, // Mostrar mensaje de "no encontrado"
          }

          // Solo mostrar mensaje de "no encontrado" cuando realmente no se encuentra
          message.warning(
            `No se encontró precio para el tipo "${value}" de este producto. Precio establecido en 0.`
          )
        }
      } catch (error) {
        message.error('Error al obtener los precios del producto')
        console.error('Error fetching product prices:', error)
      }
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
        precio_no_encontrado: false,
        precio_realmente_no_encontrado: false,
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
            !detail.producto_id ||
            !detail.cantidad ||
            !detail.precio_unitario ||
            !detail.tipo_precio_aplicado
        )
      ) {
        message.error(
          'Debe seleccionar un producto y completar los campos del detalle'
        )
        return
      }

      const data = {
        ...values,
        empresa_id: 1,
        usuario_id: 1,
        total: details.reduce((acc, curr) => acc + curr.subtotal, 0),
        estado: 'generado',
        metodo_pago_id: values.metodo_pago_id,
        moneda_id: 1,
        moneda: 'Q',
        referencia_pago: values.referencia_pago || '',
        detalle: details,
      }

      const confirm = await modal.confirm({
        title: 'Generar venta',
      })

      if (!confirm) return

      setIsLoading(true)

      try {
        await createPurchase(data)
        message.success('Compra creada exitosamente')
        router.push('/home/saleOrders')
      } catch (error: any) {
        message.error(error.message || 'Error al crear la compra')
      }
    } catch (error: any) {
      message.error(error.message || 'Error al crear la compra')
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
      title: 'Stock Actual',
      dataIndex: 'stock',
      width: 150,
      render: (_: any, record: PurchaseDetail) => (
        <Input value={record.stock?.toString() || ''} disabled />
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
      title: 'Tipo Precio',
      dataIndex: 'tipo_precio_aplicado',
      width: 150,
      render: (_: any, record: PurchaseDetail, index: number) => (
        <TipoPrecioSelector
          value={record.tipo_precio_aplicado}
          onChange={value => handlePriceTypeChange(value, index)}
        />
      ),
    },
    {
      title: 'Precio Unitario',
      dataIndex: 'precio_unitario',
      width: 200,
      render: (_: any, record: PurchaseDetail, index: number) => (
        <div>
          <InputNumber
            min={0}
            value={record.precio_unitario}
            onChange={value => handlePriceChange(value, index)}
            disabled={record.precio_no_encontrado}
            status={record.precio_realmente_no_encontrado ? 'error' : undefined}
          />
          {record.precio_realmente_no_encontrado && (
            <div
              style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}
            >
              Precio no encontrado para este tipo
            </div>
          )}
          {record.tipo_precio_aplicado === 'sugerido' &&
            !record.precio_no_encontrado &&
            record.precio_unitario === 0 && (
              <div
                style={{ color: '#1890ff', fontSize: '12px', marginTop: '4px' }}
              >
                Puede editar el precio manualmente
              </div>
            )}
        </div>
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
        <PageHeader title='Generar Venta' showNewButton={false} />
        <Form form={form} layout='vertical' onFinish={onFinish}>
          <Space direction='vertical' size='large' style={{ width: '100%' }}>
            <Row>
              <Col span={12}>
                <Space direction='vertical' style={{ width: '90%' }}>
                  <label>Cliente</label>
                  <Form.Item
                    style={{ marginBottom: 0 }}
                    name='cliente_id'
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
                      labelFormatter={item => `${item.nombre} (${item.nit})`}
                      onSelect={(_, option) => {
                        setClient(option.details)
                      }}
                    />
                  </Form.Item>
                  <label>Nit</label>
                  <Input value={client?.nit} disabled />
                  <label>Tipo Cliente</label>
                  <Input value={client?.tipo} disabled />
                </Space>
              </Col>
              <Col span={12}>
                <Space direction='vertical' style={{ width: '90%' }}>
                  <label>Telefono</label>
                  <Input value={client?.telefono} disabled />
                  <label>Email</label>
                  <Input value={client?.email} disabled />
                  <label>Direccion</label>
                  <Input value={client?.direccion} disabled />
                </Space>
              </Col>
            </Row>

            <Row>
              <Col span={12}>
                <Space direction='vertical' style={{ width: '90%' }}>
                  <label>Método de Pago</label>
                  <Form.Item
                    style={{ marginBottom: 0 }}
                    name='metodo_pago_id'
                    rules={[
                      {
                        required: true,
                        message: 'Por favor seleccione un método de pago',
                      },
                    ]}
                  >
                    <MetodoPagoSelect
                      onChange={(value, metodo) => setMetodoPago(metodo)}
                    />
                  </Form.Item>
                </Space>
              </Col>
            </Row>

            <Row>
              <Col span={24}>
                <Space direction='vertical' style={{ width: '100%' }}>
                  <label>Referencia de Pago (Opcional)</label>
                  <Form.Item style={{ marginBottom: 0 }} name='referencia_pago'>
                    <Input placeholder='Número de transacción, cheque, etc.' />
                  </Form.Item>
                </Space>
              </Col>
            </Row>

            <div>
              <Button
                type='dashed'
                onClick={handleAddDetail}
                icon={<PlusOutlined />}
                style={{ marginBottom: '16px' }}
                loading={isLoading}
              >
                Agregar Producto
              </Button>

              <Table
                loading={isLoading}
                columns={columns}
                dataSource={details}
                rowKey='key'
                pagination={false}
              />
            </div>

            <div style={{ textAlign: 'right' }}>
              <h3>
                Total: Q{' '}
                {details
                  .reduce((acc, curr) => acc + curr.subtotal, 0)
                  .toFixed(2)}
              </h3>
            </div>

            <Form.Item>
              <Space>
                <Button
                  loading={isLoading}
                  onClick={() => router.push('/home/sales')}
                >
                  Regresar
                </Button>
                <Button loading={isLoading} type='primary' htmlType='submit'>
                  Generar
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
