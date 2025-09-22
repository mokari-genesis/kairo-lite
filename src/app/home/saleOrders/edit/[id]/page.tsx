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
import { TipoPrecioSelector } from '@/app/components/TipoPrecioSelector'
import { motion } from 'framer-motion'
import { PageHeader } from '@/app/components/PageHeader'
import { SearchSelect } from '@/app/components/SearchSelect'
import { ClientsTypeResponse, getClients } from '@/app/api/clients'
import { getSalesFlat } from '@/app/api/sales'
import { getProductosPreciosByProduct } from '@/app/api/productos-precios'
import { getReporteStockActual } from '@/app/api/reportes'
import { use } from 'react'
import { PaymentsSection } from '@/app/components/pagos/PaymentsSection'
import { Venta, VentaPago, listPayments } from '@/app/api/pagos'

interface PurchaseDetail {
  producto_id: number
  cantidad: number
  precio_unitario: number
  subtotal: number
  producto_descripcion: string
  codigo: string
  stock?: number // Stock disponible (stock actual + cantidad original)
  stock_actual?: number // Stock actual del WS
  cantidad_original?: number // Cantidad original en la venta
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
  const [ventaData, setVentaData] = useState<Venta | null>(null)
  const [pagos, setPagos] = useState<VentaPago[]>([])

  useEffect(() => {
    const fetchSaleData = async () => {
      try {
        const sales = await getSalesFlat({ id: resolvedParams.id })
        if (sales && sales.length > 0) {
          const sale = sales[0]
          setSaleData(sale)

          // Crear objeto Venta para la sección de pagos
          const venta: Venta = {
            id: sale.id,
            total: parseFloat(sale.total_venta),
            estado: sale.estado_venta as 'vendido' | 'cancelado',
            moneda_id: 1, // Por defecto GTQ
            pagos: [], // Se cargará dinámicamente
            totalPagado: 0,
            saldoPendiente: parseFloat(sale.total_venta),
          }
          setVentaData(venta)

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
              referencia_pago: (sale as any).referencia_pago,
            })
          }

          // Load stock information for all products
          const stockData = await getReporteStockActual()

          setDetails(
            sale.productos.map((producto: any, index: number) => {
              // Find stock for this product

              const productStock = stockData.find(
                stock => stock.producto_id === producto.producto_id
              )

              // Calculate available stock: current stock + original quantity in sale
              const currentStock = productStock?.stock_actual || 0
              const originalQuantity = producto.cantidad || 0
              const availableStock = currentStock + originalQuantity

              return {
                key: index,
                producto_id: producto.producto_id,
                producto_descripcion: producto.descripcion,
                codigo: producto.codigo,
                cantidad: producto.cantidad,
                precio_unitario: producto.precio_unitario,
                subtotal: producto.subtotal,
                stock: producto.stock, // Stock disponible = stock actual + cantidad original
                stock_actual: currentStock, // Stock actual del WS
                cantidad_original: originalQuantity, // Cantidad original en la venta
                precio_no_encontrado:
                  (producto as any).tipo_precio_aplicado !== 'sugerido', // Solo habilitar si es sugerido
                precio_realmente_no_encontrado: false, // Inicializar como false
                tipo_precio_aplicado:
                  (producto as any).tipo_precio_aplicado || 'sugerido',
              }
            })
          )

          // Cargar pagos existentes
          try {
            const existingPagos = await listPayments(
              parseInt(resolvedParams.id)
            )
            setPagos(existingPagos)
          } catch (error) {
            console.error('Error loading payments:', error)
            setPagos([])
          }
        }
      } catch (error) {
        message.error('Error al cargar los datos de la venta')
        router.push('/home/saleOrders')
      }
    }

    fetchSaleData()
  }, [resolvedParams.id, form, router])

  // Actualizar el total de la venta cuando cambien los productos
  useEffect(() => {
    if (ventaData && details.length > 0) {
      const newTotal = details.reduce((acc, curr) => acc + curr.subtotal, 0)
      setVentaData(prev => (prev ? { ...prev, total: newTotal } : null))
    }
  }, [details])

  // Monitorear cambios en el estado de pagos
  useEffect(() => {
    console.log('=== PAGOS STATE CHANGED ===')
    console.log('New pagos state:', pagos)
    console.log('Pagos length:', pagos.length)
  }, [pagos])

  // Función para sincronizar pagos desde PaymentsSection
  const syncPayments = async () => {
    try {
      const updatedPagos = await listPayments(parseInt(resolvedParams.id))
      setPagos(updatedPagos)
    } catch (error) {
      console.error('Error syncing payments:', error)
    }
  }

  // Funciones para manejar pagos localmente
  const handleAddPayment = (payment: Omit<VentaPago, 'id'>) => {
    const newPayment: VentaPago = {
      ...payment,
      id: Date.now(), // ID temporal para pagos nuevos
    }
    console.log('=== ADDING PAYMENT ===')
    console.log('New payment:', newPayment)
    console.log('Current pagos before:', pagos)

    setPagos(prev => {
      const updated = [...prev, newPayment]
      console.log('Updated pagos state:', updated)
      console.log('=== PAYMENT ADDED ===')
      return updated
    })
  }

  const handleEditPayment = (
    paymentId: number,
    payment: Partial<VentaPago>
  ) => {
    setPagos(prev =>
      prev.map(p => (p.id === paymentId ? { ...p, ...payment } : p))
    )
  }

  const handleDeletePayment = (paymentId: number) => {
    setPagos(prev => prev.filter(p => p.id !== paymentId))
  }

  const handleProductChange = async (
    value: number,
    product: any,
    index: number
  ) => {
    const isProductAlreadyAdded = details.some(
      (detail, i) => detail.producto_id === value && i !== index
    )

    if (isProductAlreadyAdded) {
      message.error('Este producto ya ha sido agregado a la venta')
      return
    }

    const newDetails = [...details]
    if (product) {
      // Load current stock for the selected product
      let currentStock = 0
      try {
        const stockData = await getReporteStockActual()
        const productStock = stockData.find(
          stock => stock.producto_id === value
        )
        currentStock =
          (productStock as any)?.stock || productStock?.stock_actual || 0
      } catch (error) {
        console.error('Error loading stock:', error)
        message.error('Error al cargar el stock del producto')
      }

      // For new products, available stock is just the current stock
      // For existing products, it's current stock + original quantity
      const originalQuantity = newDetails[index].cantidad_original || 0
      const availableStock = currentStock + originalQuantity

      newDetails[index] = {
        ...newDetails[index],
        producto_id: value,
        producto_descripcion: product.descripcion,
        precio_unitario: product.precio || 0,
        cantidad: newDetails[index].cantidad || 1,
        subtotal: (product.precio || 0) * (newDetails[index].cantidad || 1),
        codigo: product.codigo,
        stock: availableStock, // Stock disponible
        stock_actual: currentStock, // Stock actual del WS
        cantidad_original: originalQuantity, // Cantidad original (0 para productos nuevos)
        tipo_precio_aplicado: 'sugerido', // Auto-seleccionar tipo "sugerido" cuando se auto-popula el precio
      }
      setDetails(newDetails)
    }
  }

  const handleQuantityChange = (value: number | null, index: number) => {
    if (value === null) return
    const newDetails = [...details]
    const currentDetail = newDetails[index]

    // Check if quantity exceeds available stock
    if (value > (currentDetail.stock || 0)) {
      message.error(
        `Stock insuficiente. Disponible: ${currentDetail.stock || 0}`
      )
    }

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
          message.success(`Precio actualizado a $.${precioNumerico.toFixed(2)}`)
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
        stock: 0,
        stock_actual: 0,
        cantidad_original: 0,
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

      // Calcular el total actualizado
      const updatedTotal = details.reduce((acc, curr) => acc + curr.subtotal, 0)

      // Check for insufficient stock
      const insufficientStock = details.some(
        detail => detail.cantidad > (detail.stock || 0)
      )
      if (insufficientStock) {
        message.error(
          'No se puede actualizar la venta: hay productos con stock insuficiente. El stock disponible incluye el stock actual + la cantidad original de la venta.'
        )
        return
      }

      // Validar que si hay pagos, la suma no exceda el total
      const totalVenta = updatedTotal

      // Filtrar pagos válidos (que tengan metodo_pago_id, moneda_id y monto > 0)
      console.log('Pagos originales:', JSON.stringify(pagos))

      const pagosValidos = pagos.filter(pago => {
        const isValid =
          pago.metodo_pago_id !== undefined &&
          pago.metodo_pago_id !== null &&
          pago.metodo_pago_id > 0 &&
          pago.moneda_id !== undefined &&
          pago.moneda_id !== null &&
          pago.moneda_id > 0 &&
          pago.monto !== undefined &&
          pago.monto !== null &&
          pago.monto > 0

        console.log(`Pago ${JSON.stringify(pago)} es válido:`, isValid)
        return isValid
      })

      console.log('Pagos válidos:', pagosValidos)

      const totalPagos = pagosValidos.reduce(
        (acc, pago) => acc + (pago.monto || 0),
        0
      )

      if (pagosValidos.length > 0 && totalPagos > totalVenta) {
        message.error(
          'La suma de los pagos no puede exceder el total de la venta'
        )
        return
      }

      // Si hay pagos inválidos, mostrar advertencia
      if (pagos.length > 0 && pagosValidos.length !== pagos.length) {
        const pagosInvalidos = pagos.filter(
          pago =>
            pago.metodo_pago_id === undefined ||
            pago.metodo_pago_id === null ||
            pago.metodo_pago_id <= 0 ||
            pago.moneda_id === undefined ||
            pago.moneda_id === null ||
            pago.moneda_id <= 0 ||
            pago.monto === undefined ||
            pago.monto === null ||
            pago.monto <= 0
        )

        let mensaje = 'Algunos pagos no están completos y serán omitidos:\n'
        pagosInvalidos.forEach((pago, index) => {
          const faltantes = []
          if (!pago.metodo_pago_id) faltantes.push('método de pago')
          if (!pago.moneda_id) faltantes.push('moneda')
          if (!pago.monto || pago.monto <= 0) faltantes.push('monto')

          mensaje += `Pago ${index + 1}: Falta ${faltantes.join(', ')}\n`
        })

        message.warning(mensaje)
      }

      console.log('Final pagos state before sending:', pagos)
      console.log('Pagos válidos to send:', pagosValidos)

      const data = {
        venta_id: parseInt(resolvedParams.id),
        empresa_id: 1,
        cliente_id: values.cliente_id.value || values.cliente_id,
        usuario_id: 1,
        total: updatedTotal,
        estado: 'vendido', //saleData?.estado_venta || 'vendida',
        detalle: details,
        moneda_id: 1,
        moneda: '$',
        referencia_pago: values.referencia_pago || '',
        pagos: pagosValidos.length > 0 ? pagosValidos : undefined, // Solo incluir pagos válidos
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
      title: 'Stock Disponible',
      dataIndex: 'stock',
      width: 200,
      render: (_: any, record: PurchaseDetail) => (
        <div>
          <Input
            value={`${record.stock?.toString() || '0'} (Disponible)`}
            disabled
            style={{ marginBottom: '4px' }}
          />
        </div>
      ),
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      width: 150,
      render: (_: any, record: PurchaseDetail, index: number) => (
        <div>
          <InputNumber
            min={1}
            value={record.cantidad}
            onChange={value => handleQuantityChange(value, index)}
            status={record.cantidad > (record.stock || 0) ? 'error' : undefined}
          />
          {record.cantidad > (record.stock || 0) && (
            <div
              style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}
            >
              Stock insuficiente. Disponible: {record.stock || 0}
            </div>
          )}
        </div>
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
      render: (value: number) => `$ ${value.toFixed(2)}`,
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
        <PageHeader title='Editar Venta' showNewButton={false} />
        <Form
          form={form}
          layout='vertical'
          onFinish={onFinish}
          initialValues={{
            cliente_id: saleData?.cliente_id,
          }}
        >
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
                        if (option && option.details) {
                          setClient(option.details)
                        }
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
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef',
                  fontSize: '13px',
                  color: '#6c757d',
                  fontStyle: 'italic',
                }}
              >
                💡 <strong>Nota:</strong> El precio unitario se actualiza
                automáticamente cuando se selecciona un producto. Se puede
                editar manualmente solo cuando el tipo de precio es "Sugerido".
              </div>
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
                Total: ${' '}
                {details
                  .reduce((acc, curr) => acc + curr.subtotal, 0)
                  .toFixed(2)}
              </h3>
            </div>

            {/* Sección de Pagos */}
            {ventaData && (
              <PaymentsSection
                venta={{
                  ...ventaData,
                  total: details.reduce((acc, curr) => acc + curr.subtotal, 0),
                }}
                pagos={pagos}
                onAddPayment={handleAddPayment}
                onEditPayment={handleEditPayment}
                onDeletePayment={handleDeletePayment}
                onPaymentsChange={syncPayments}
              />
            )}

            <Form.Item>
              <Space>
                <Button
                  loading={isLoading}
                  onClick={() => router.push('/home/saleOrders')}
                >
                  Regresar
                </Button>
                <Button loading={isLoading} type='primary' htmlType='submit'>
                  Actualizar
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
