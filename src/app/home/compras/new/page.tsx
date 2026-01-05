'use client'
import '@ant-design/v5-patch-for-react-19'
import { useEffect, useState, useMemo, useCallback } from 'react'
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
  Radio,
  DatePicker,
  Tag,
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { createCompra, CompraItem } from '@/app/api/compras'
import { ProductSelect } from '@/app/components/ProductSelect'
import { motion } from 'framer-motion'
import { PageHeader } from '@/app/components/PageHeader'
import { SupplierSelect } from '@/app/components/SupplierSelect'
import { MonedaSelect } from '@/app/components/MonedaSelect'
import { useEmpresa } from '@/app/empresaContext'
import { useUsuario } from '@/app/usuarioContext'
import {
  formatCurrency,
  convertirAMonedaBase,
  convertirDesdeMonedaBase,
  obtenerMonedaBase,
} from '@/app/utils/currency'
import { getMonedas, Moneda } from '@/app/api/monedas'
import { withAuth } from '@/app/auth/withAuth'
import dayjs from 'dayjs'

interface CompraDetail {
  producto_id: number
  cantidad: number
  costo_unitario: number
  subtotal: number
  producto_descripcion: string
  codigo: string
  stock?: number
  precio_sugerido?: number // Precio sugerido en VES (moneda local)
  precio_sugerido_convertido?: number // Precio sugerido convertido a la moneda seleccionada
  key: number
}

function NewCompra() {
  const [isLoading, setIsLoading] = useState(false)
  const [form] = Form.useForm()
  const router = useRouter()
  const [details, setDetails] = useState<CompraDetail[]>([])
  const [tipoPago, setTipoPago] = useState<'contado' | 'credito'>('contado')
  const { empresaId } = useEmpresa()
  const { usuarioId } = useUsuario()
  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [monedaSeleccionada, setMonedaSeleccionada] = useState<Moneda | null>(
    null
  )
  const [monedaVES, setMonedaVES] = useState<Moneda | null>(null)

  const total = useMemo(() => {
    return Number(
      details.reduce((sum, item) => sum + (item.subtotal || 0), 0).toFixed(2)
    )
  }, [details])

  // Cargar monedas al montar el componente
  useEffect(() => {
    const loadMonedas = async () => {
      try {
        const monedasData = await getMonedas()
        setMonedas(monedasData)
        const ves = monedasData.find(m => m.codigo === 'VES')
        if (ves) {
          setMonedaVES(ves)
        }
      } catch (error) {
        console.error('Error loading monedas:', error)
      }
    }
    loadMonedas()
  }, [])

  // Función para convertir de VES a la moneda seleccionada
  const convertirVESAMonedaSeleccionada = useCallback(
    (
      montoVES: number,
      monedaDestino: Moneda | null,
      monedaVES: Moneda | null
    ): number => {
      if (!monedaDestino || !monedaVES || montoVES <= 0) {
        return 0
      }

      if (monedaDestino.codigo === 'VES') {
        return montoVES
      }

      // Convertir usando la fórmula: tasa = tasa_ves / tasa_moneda_destino
      // monto_convertido = monto_ves * tasa
      const tasaVES = parseFloat(monedaVES.tasa_vs_base)
      const tasaDestino = parseFloat(monedaDestino.tasa_vs_base)

      if (!tasaVES || !tasaDestino || tasaVES <= 0 || tasaDestino <= 0) {
        return 0
      }

      const tasa = tasaVES / tasaDestino
      const decimales = monedaDestino.decimales || 2
      return Number((montoVES * tasa).toFixed(decimales))
    },
    []
  )

  // Actualizar moneda seleccionada cuando cambia en el formulario
  useEffect(() => {
    const monedaId = form.getFieldValue('moneda_id')
    if (monedaId && monedas.length > 0) {
      const moneda = monedas.find(m => m.id === monedaId)
      if (moneda) {
        setMonedaSeleccionada(moneda)
      }
    }
  }, [form.getFieldValue('moneda_id'), monedas])

  // Recalcular precios convertidos cuando cambia la moneda seleccionada
  // Solo actualiza precio_sugerido_convertido, NO modifica costo_unitario
  useEffect(() => {
    if (monedaSeleccionada && monedaVES && details.length > 0) {
      const newDetails = details.map(detail => {
        if (detail.precio_sugerido && detail.precio_sugerido > 0) {
          const precioConvertido = convertirVESAMonedaSeleccionada(
            detail.precio_sugerido,
            monedaSeleccionada,
            monedaVES
          )
          return {
            ...detail,
            precio_sugerido_convertido: precioConvertido,
            // NO modificar costo_unitario aquí - mantener el valor que el usuario editó
          }
        }
        return detail
      })
      setDetails(newDetails)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monedaSeleccionada, monedaVES, convertirVESAMonedaSeleccionada])

  useEffect(() => {
    form.setFieldsValue({
      fecha: dayjs(),
      empresa_id: empresaId,
    })
  }, [empresaId, form])

  // No agregar producto inicial automáticamente - el usuario debe seleccionar proveedor y moneda primero

  const handleProductChange = async (
    value: number,
    product: any,
    index: number
  ) => {
    // Check if the product is already in the details array
    const isProductAlreadyAdded = details.some(
      (detail, i) => detail.producto_id === value && i !== index
    )

    if (isProductAlreadyAdded) {
      message.error('Este producto ya ha sido agregado a la compra')
      return
    }

    const newDetails = [...details]

    // Obtener stock actual del producto
    let currentStock = 0
    let precioSugeridoVES = 0 // Precio sugerido siempre está en VES

    if (product) {
      currentStock = product.stock || 0
      precioSugeridoVES = product.precio || 0 // Este precio ya está en VES
    } else {
      // Si no viene en el product, obtenerlo del backend
      try {
        const { getProducts } = await import('@/app/api/products')
        const products = await getProducts(
          { product_id: value },
          empresaId || 1
        )
        const selectedProduct = products.find(p => Number(p.id) === value)
        if (selectedProduct) {
          currentStock = selectedProduct.stock || 0
          precioSugeridoVES = selectedProduct.precio || 0 // Este precio ya está en VES
        }
      } catch (error) {
        console.error('Error loading product details:', error)
      }
    }

    // Convertir precio sugerido (VES) a la moneda seleccionada
    const precioSugeridoConvertido = convertirVESAMonedaSeleccionada(
      precioSugeridoVES,
      monedaSeleccionada,
      monedaVES
    )

    const cantidad = newDetails[index].cantidad || 1
    // Auto-rellenar costo_unitario con el precio sugerido convertido SOLO si:
    // 1. El producto es nuevo (producto_id cambió de 0 a un valor)
    // 2. O si el costo_unitario actual es 0 o no está definido
    // NO sobrescribir si el usuario ya editó el costo_unitario
    const productoAnterior = newDetails[index].producto_id
    const costoUnitarioActual = newDetails[index].costo_unitario || 0
    const esProductoNuevo = productoAnterior === 0 || productoAnterior !== value
    const costoUnitario =
      !esProductoNuevo && costoUnitarioActual > 0
        ? costoUnitarioActual // Mantener el valor editado por el usuario
        : precioSugeridoConvertido || 0 // Solo usar sugerido si es producto nuevo o costo es 0

    newDetails[index] = {
      ...newDetails[index],
      producto_id: value,
      producto_descripcion: product?.descripcion || '',
      codigo: product?.codigo || '',
      stock: currentStock,
      precio_sugerido: precioSugeridoVES, // Precio en VES
      precio_sugerido_convertido: precioSugeridoConvertido, // Precio convertido a moneda seleccionada
      costo_unitario: costoUnitario,
      subtotal: Number((costoUnitario * cantidad).toFixed(2)),
    }
    setDetails(newDetails)
  }

  const handleQuantityChange = (value: number | null, index: number) => {
    const newDetails = [...details]
    const cantidad = value || 0
    const costoUnitario = newDetails[index].costo_unitario || 0
    newDetails[index] = {
      ...newDetails[index],
      cantidad,
      subtotal: Number((costoUnitario * cantidad).toFixed(2)),
    }
    setDetails(newDetails)
  }

  const handleCostChange = (value: number | null, index: number) => {
    const newDetails = [...details]
    const costo = value || 0
    const cantidad = newDetails[index].cantidad || 0
    newDetails[index] = {
      ...newDetails[index],
      costo_unitario: costo,
      subtotal: Number((costo * cantidad).toFixed(2)),
    }
    setDetails(newDetails)
  }

  const canAddNewProduct = () => {
    if (details.length === 0) return true
    const lastDetail = details[details.length - 1]
    return (
      lastDetail.producto_id > 0 &&
      lastDetail.cantidad > 0 &&
      lastDetail.costo_unitario > 0
    )
  }

  const handleAddDetail = () => {
    // Validar que proveedor y moneda estén seleccionados
    const proveedorId = form.getFieldValue('proveedor_id')
    const monedaId = form.getFieldValue('moneda_id')

    if (!proveedorId) {
      message.error('Debe seleccionar un proveedor antes de agregar productos')
      return
    }

    if (!monedaId) {
      message.error('Debe seleccionar una moneda antes de agregar productos')
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
        costo_unitario: 0,
        subtotal: 0,
        stock: undefined,
        precio_sugerido: undefined,
        precio_sugerido_convertido: undefined,
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

      // Validar que todos los productos estén completos
      const incompleteProducts = details.filter(
        d => !d.producto_id || d.cantidad <= 0 || d.costo_unitario <= 0
      )
      if (incompleteProducts.length > 0) {
        message.error('Por favor complete todos los productos')
        return
      }

      if (!empresaId) {
        message.error('Debe seleccionar una empresa')
        return
      }

      if (!values.proveedor_id) {
        message.error('Debe seleccionar un proveedor')
        return
      }

      if (!values.moneda_id) {
        message.error('Debe seleccionar una moneda')
        return
      }

      const items: CompraItem[] = details.map(d => ({
        producto_id: d.producto_id,
        cantidad: d.cantidad,
        costo_unitario: d.costo_unitario,
      }))

      const data = {
        empresa_id: empresaId,
        proveedor_id: values.proveedor_id,
        usuario_id: usuarioId || undefined,
        fecha: values.fecha ? values.fecha.format('YYYY-MM-DD') : undefined,
        moneda_id: values.moneda_id,
        tipo_pago: tipoPago,
        fecha_vencimiento:
          tipoPago === 'credito' && values.fecha_vencimiento
            ? values.fecha_vencimiento.format('YYYY-MM-DD')
            : undefined,
        comentario: values.comentario || undefined,
        items,
      }

      setIsLoading(true)
      await createCompra(data)
      message.success('Compra creada exitosamente')
      router.push('/home/compras')
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
      render: (_: any, record: CompraDetail, index: number) => (
        <ProductSelect
          empresaId={empresaId || 1}
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
      width: 120,
      align: 'center' as const,
      render: (value: number | undefined) => (
        <span
          style={{
            fontWeight: 'bold',
            color: value !== undefined && value >= 0 ? '#52c41a' : '#8c8c8c',
          }}
        >
          {value !== undefined ? value : '-'}
        </span>
      ),
    },
    {
      title: 'Precio Sugerido (Local)',
      dataIndex: 'precio_sugerido',
      width: 160,
      align: 'right' as const,
      render: (value: number | undefined) => {
        return (
          <span style={{ color: '#1890ff', fontWeight: 500 }}>
            {value !== undefined ? formatCurrency('VES', value) : '-'}
          </span>
        )
      },
    },
    {
      title: `Precio Sugerido (${monedaSeleccionada?.codigo || 'Moneda'})`,
      dataIndex: 'precio_sugerido_convertido',
      width: 180,
      align: 'right' as const,
      render: (value: number | undefined, record: CompraDetail) => {
        const codigoMoneda = monedaSeleccionada?.codigo || 'USD'
        return (
          <span style={{ color: '#52c41a', fontWeight: 500 }}>
            {value !== undefined && value > 0
              ? formatCurrency(codigoMoneda, value)
              : '-'}
          </span>
        )
      },
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      width: 120,
      render: (_: any, record: CompraDetail, index: number) => (
        <InputNumber
          min={1}
          value={record.cantidad}
          onChange={value => handleQuantityChange(value, index)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Costo Unitario',
      dataIndex: 'costo_unitario',
      width: 180,
      render: (_: any, record: CompraDetail, index: number) => (
        <Space direction='vertical' size='small' style={{ width: '100%' }}>
          <InputNumber
            min={0}
            step={0.01}
            value={record.costo_unitario}
            onChange={value => handleCostChange(value, index)}
            style={{ width: '100%' }}
            formatter={value => {
              const simbolo = monedaSeleccionada?.simbolo || '$'
              return `${simbolo} ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            }}
            parser={value => {
              if (!value) return NaN
              const simbolo = monedaSeleccionada?.simbolo || '$'
              // Escapar caracteres especiales del símbolo para la expresión regular
              const simboloEscapado = simbolo.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
              )
              // Remover el símbolo y las comas, mantener solo números y punto decimal
              const cleaned = value.replace(
                new RegExp(`${simboloEscapado}\\s?|,`, 'g'),
                ''
              )
              const parsed = parseFloat(cleaned)
              return isNaN(parsed) ? NaN : parsed
            }}
          />
          {record.precio_sugerido_convertido !== undefined &&
            record.precio_sugerido_convertido > 0 &&
            record.costo_unitario !== record.precio_sugerido_convertido && (
              <Button
                type='link'
                size='small'
                onClick={() => {
                  const newDetails = [...details]
                  const cantidad = newDetails[index].cantidad || 1
                  const precioSugeridoConvertido =
                    record.precio_sugerido_convertido || 0
                  newDetails[index] = {
                    ...newDetails[index],
                    costo_unitario: precioSugeridoConvertido,
                    subtotal: Number(
                      (precioSugeridoConvertido * cantidad).toFixed(2)
                    ),
                  }
                  setDetails(newDetails)
                }}
                style={{ padding: 0, height: 'auto', fontSize: '11px' }}
              >
                Usar sugerido (
                {formatCurrency(
                  monedaSeleccionada?.codigo || 'USD',
                  record.precio_sugerido_convertido
                )}
                )
              </Button>
            )}
        </Space>
      ),
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      width: 200,
      align: 'right' as const,
      render: (value: number, record: CompraDetail) => {
        // Calcular subtotal en moneda local (VES)
        let subtotalVES = 0
        if (monedaSeleccionada && monedaVES && value > 0) {
          if (monedaSeleccionada.codigo === 'VES') {
            subtotalVES = value
          } else {
            // Convertir a moneda base primero, luego a VES
            const monedaBase = obtenerMonedaBase(monedas)
            if (monedaBase) {
              // Convertir de moneda seleccionada a base
              const montoEnBase = convertirAMonedaBase(
                value,
                monedaSeleccionada,
                monedaBase
              )
              // Convertir de base a VES
              if (monedaVES.id === monedaBase.id) {
                subtotalVES = montoEnBase
              } else {
                // Si VES no es la base, convertir desde la base a VES
                // tasa_vs_base de VES indica cuántas unidades de VES = 1 unidad de base
                const tasaVES = parseFloat(monedaVES.tasa_vs_base)
                subtotalVES = montoEnBase * tasaVES
              }
            } else {
              // Si no hay moneda base, usar conversión directa
              const tasaOrigen = parseFloat(monedaSeleccionada.tasa_vs_base)
              const tasaVES = parseFloat(monedaVES.tasa_vs_base)
              subtotalVES = (value * tasaVES) / tasaOrigen
            }
          }
        }

        const simboloMoneda = monedaSeleccionada?.simbolo || '$'
        const codigoMoneda = monedaSeleccionada?.codigo || 'USD'

        return (
          <Space direction='vertical' size={2} style={{ width: '100%' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {formatCurrency(codigoMoneda, value)}
            </span>
            {monedaSeleccionada?.codigo !== 'VES' && monedaVES && (
              <span
                style={{
                  fontSize: '12px',
                  color: '#8c8c8c',
                  fontStyle: 'italic',
                }}
              >
                {formatCurrency('VES', subtotalVES)} (local)
              </span>
            )}
          </Space>
        )
      },
    },
    {
      title: 'Acciones',
      width: 100,
      render: (_: any, record: CompraDetail, index: number) => (
        <Button
          type='link'
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveDetail(index)}
        >
          Eliminar
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader title='Nueva Compra' showNewButton={false} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Form
          form={form}
          layout='vertical'
          onFinish={onFinish}
          initialValues={{
            fecha: dayjs(),
            tipo_pago: 'contado',
          }}
        >
          <Row gutter={24}>
            {/* Información General */}
            <Col xs={24} lg={12}>
              <Card
                title='Información General'
                style={{ marginBottom: '24px' }}
              >
                <Form.Item
                  name='fecha'
                  label='Fecha'
                  rules={[{ required: true, message: 'La fecha es requerida' }]}
                >
                  <DatePicker style={{ width: '100%' }} format='DD/MM/YYYY' />
                </Form.Item>

                <Form.Item
                  name='proveedor_id'
                  label='Proveedor'
                  rules={[
                    { required: true, message: 'El proveedor es requerido' },
                  ]}
                >
                  <SupplierSelect />
                </Form.Item>

                <Form.Item
                  name='moneda_id'
                  label='Moneda'
                  rules={[
                    { required: true, message: 'La moneda es requerida' },
                  ]}
                >
                  <MonedaSelect
                    onChange={value => {
                      const moneda = monedas.find(m => m.id === value)
                      if (moneda) {
                        setMonedaSeleccionada(moneda)
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item label='Tipo de Compra'>
                  <Radio.Group
                    value={tipoPago}
                    onChange={e => setTipoPago(e.target.value)}
                  >
                    <Radio value='contado'>Contado</Radio>
                    <Radio value='credito'>Crédito</Radio>
                  </Radio.Group>
                </Form.Item>

                {tipoPago === 'credito' && (
                  <Form.Item
                    name='fecha_vencimiento'
                    label='Fecha de Vencimiento'
                    rules={[
                      {
                        required: tipoPago === 'credito',
                        message:
                          'La fecha de vencimiento es requerida para crédito',
                      },
                    ]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      format='DD/MM/YYYY'
                      disabledDate={current => {
                        const fechaCompra = form.getFieldValue('fecha')
                        if (!fechaCompra) return false
                        return current && current < fechaCompra.startOf('day')
                      }}
                    />
                  </Form.Item>
                )}

                <Form.Item name='comentario' label='Comentario'>
                  <Input.TextArea rows={3} placeholder='Notas adicionales...' />
                </Form.Item>
              </Card>
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
                    <strong>Tipo de Pago:</strong>{' '}
                    <Tag color={tipoPago === 'contado' ? 'green' : 'blue'}>
                      {tipoPago === 'contado' ? 'Contado' : 'Crédito'}
                    </Tag>
                  </div>
                  <div>
                    <strong>Total de Productos:</strong> {details.length}
                  </div>
                  <div>
                    <strong>Total:</strong>{' '}
                    <span
                      style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#52c41a',
                      }}
                    >
                      {formatCurrency(monedaSeleccionada?.codigo || '', total)}
                    </span>
                  </div>
                  {tipoPago === 'credito' && (
                    <div
                      style={{
                        padding: '12px',
                        background: '#e6f7ff',
                        borderRadius: '4px',
                      }}
                    >
                      <strong>
                        ℹ️ Esta compra generará una cuenta por pagar
                      </strong>
                    </div>
                  )}
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Detalle de Productos */}
          <Card
            title='Detalle de Productos'
            extra={
              <Button
                type='dashed'
                icon={<PlusOutlined />}
                onClick={handleAddDetail}
                disabled={
                  !form.getFieldValue('proveedor_id') ||
                  !form.getFieldValue('moneda_id')
                }
              >
                Agregar Producto
              </Button>
            }
            style={{ marginBottom: '24px' }}
          >
            <Table
              columns={columns}
              dataSource={details}
              pagination={false}
              rowKey='key'
              locale={{
                emptyText:
                  'No hay productos agregados. Haga clic en "Agregar Producto" para comenzar.',
              }}
            />
          </Card>

          {/* Acciones */}
          <Card>
            <Space>
              <Button onClick={() => router.back()}>Cancelar</Button>
              <Button
                type='primary'
                htmlType='submit'
                loading={isLoading}
                disabled={details.length === 0 || total === 0}
              >
                Guardar Compra
              </Button>
            </Space>
          </Card>
        </Form>
      </motion.div>
    </div>
  )
}

export default withAuth(NewCompra)
