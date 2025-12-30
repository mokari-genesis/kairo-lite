'use client'
import '@ant-design/v5-patch-for-react-19'
import { useEffect, useState, useMemo, useRef } from 'react'
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
import { TipoPrecioSelector } from '@/app/components/TipoPrecioSelector'
import { motion } from 'framer-motion'
import { PageHeader } from '@/app/components/PageHeader'
import { SearchSelect } from '@/app/components/SearchSelect'
import { ClientsTypeResponse, getClients } from '@/app/api/clients'
import { getProductosPreciosByProduct } from '@/app/api/productos-precios'
import { PaymentsSection } from '@/app/components/pagos/PaymentsSection'
import { Venta, VentaPago } from '@/app/api/pagos'
import { getMetodosPago } from '@/app/api/metodos-pago'
import { getMonedas } from '@/app/api/monedas'
import {
  sumPagosConConversion,
  obtenerMonedaBase,
  convertirAMonedaBase,
  convertirDesdeMonedaBase,
  formatCurrency,
} from '@/app/utils/currency'
import { useEmpresa } from '@/app/empresaContext'
import { useUsuario } from '@/app/usuarioContext'

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
  const [pagos, setPagos] = useState<VentaPago[]>([])
  const [ventaData, setVentaData] = useState<Venta | null>(null)
  const [monedas, setMonedas] = useState<any[]>([])
  const [monedaBase, setMonedaBase] = useState<any>(null)
  const { empresaId } = useEmpresa()
  const { usuarioId } = useUsuario()
  console.log(' LA CHIMIBA PARCE ', empresaId)
  const previousEmpresaIdRef = useRef<number | null>(empresaId)

  // Limpiar productos y pagos cuando cambia la sucursal
  useEffect(() => {
    const previousEmpresaId = previousEmpresaIdRef.current
    // Solo limpiar si cambió de una sucursal válida a otra diferente
    if (
      previousEmpresaId !== null &&
      previousEmpresaId !== undefined &&
      empresaId !== null &&
      empresaId !== undefined &&
      previousEmpresaId !== empresaId
    ) {
      // Limpiar productos si hay alguno agregado
      if (details.length > 0) {
        setDetails([])
      }
      // Limpiar pagos si hay alguno agregado
      if (pagos.length > 0) {
        setPagos([])
      }
    }
    previousEmpresaIdRef.current = empresaId
  }, [empresaId, details.length, pagos.length])

  // Cargar monedas al montar el componente
  useEffect(() => {
    const cargarMonedas = async () => {
      try {
        const monedasData = await getMonedas({ activo: 1 })
        setMonedas(monedasData)
        const base = obtenerMonedaBase(monedasData)
        setMonedaBase(base)
      } catch (error) {
        console.error('Error cargando monedas:', error)
      }
    }
    cargarMonedas()
  }, [])

  // Crear objeto Venta para la sección de pagos
  useEffect(() => {
    const total = details.reduce((acc, curr) => acc + curr.subtotal, 0)

    // Calcular total pagado con conversión si hay moneda base
    const totalPagado = monedaBase
      ? sumPagosConConversion(pagos, monedaBase, monedas)
      : pagos.reduce((acc, pago) => acc + (pago.monto || 0), 0)

    const venta: Venta = {
      id: 0, // ID temporal para ventas nuevas
      total,
      estado: 'pendiente',
      moneda_id: 1, // Por defecto VES (Bolívares Fuertes)
      pagos: pagos,
      totalPagado,
      saldoPendiente: total - totalPagado,
    }
    setVentaData(venta)
  }, [details, pagos, monedaBase, monedas])

  // Memoizar el objeto venta para evitar re-renders
  const ventaMemoizada = useMemo(() => {
    if (!ventaData) return null
    return ventaData
  }, [ventaData])

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
    const currentDetail = newDetails[index]
    const stockDisponible = currentDetail.stock || 0

    if (value > stockDisponible) {
      message.error(
        `Stock insuficiente. Disponible en esta sucursal: ${stockDisponible}`
      )
      return
    }

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

  // Funciones auxiliares para obtener nombres de métodos de pago y monedas
  const getMetodoPagoNombre = async (metodoPagoId: number): Promise<string> => {
    try {
      const metodosPago = await getMetodosPago({ activo: 1 })
      const metodo = metodosPago.find(m => m.id === metodoPagoId)
      return metodo?.nombre || `Método ${metodoPagoId}`
    } catch (error) {
      console.error('Error getting payment method name:', error)
      return `Método ${metodoPagoId}`
    }
  }

  const getMonedaCodigo = async (monedaId: number): Promise<string> => {
    try {
      const monedas = await getMonedas({ activo: 1 })
      const moneda = monedas.find(m => m.id === monedaId)
      return moneda?.codigo || `Moneda ${monedaId}`
    } catch (error) {
      console.error('Error getting currency code:', error)
      return `Moneda ${monedaId}`
    }
  }

  // Función para calcular monto_en_moneda_venta
  const calcularMontoEnMonedaVenta = (
    monto: number,
    monedaPagoId: number,
    monedaVentaId: number = 1 // Por defecto VES (Bolívares Fuertes)
  ): string => {
    if (monedaPagoId === monedaVentaId) {
      return monto.toFixed(2)
    }

    // Buscar las monedas del pago y de la venta
    const monedaPago = monedas.find(m => m.id === monedaPagoId)
    const monedaVenta = monedas.find(m => m.id === monedaVentaId)

    if (!monedaPago || !monedaVenta || !monedaBase) {
      return monto.toFixed(2)
    }

    // Convertir de la moneda del pago a la moneda base, luego a la moneda de la venta
    const montoEnBase = convertirAMonedaBase(monto, monedaPago, monedaBase)
    const montoEnMonedaVenta = convertirDesdeMonedaBase(
      montoEnBase,
      monedaVenta,
      monedaBase
    )

    return montoEnMonedaVenta.toFixed(2)
  }

  // Handlers para gestión de pagos
  const handleAddPayment = async (payment: Omit<VentaPago, 'id'>) => {
    try {
      // Obtener nombres de método de pago y moneda
      const [metodoPagoNombre, monedaCodigo] = await Promise.all([
        getMetodoPagoNombre(
          payment.metodo_pago_id || payment.metodoPagoId || 0
        ),
        getMonedaCodigo(payment.moneda_id || payment.monedaId || 0),
      ])

      // Calcular monto_en_moneda_venta
      const monedaVentaId = 1 // Por defecto VES (Bolívares Fuertes)
      const montoEnMonedaVenta = calcularMontoEnMonedaVenta(
        payment.monto,
        payment.moneda_id || payment.monedaId || 0,
        monedaVentaId
      )

      const newPayment: VentaPago = {
        ...payment,
        id: Date.now(), // ID temporal para pagos nuevos
        metodoPagoNombre,
        monedaCodigo,
        fecha: new Date().toISOString(), // Fecha actual
        monto_en_moneda_venta: montoEnMonedaVenta,
      }

      setPagos(prev => [...prev, newPayment])
    } catch (error) {
      console.error('Error adding payment:', error)
      message.error('Error al agregar el pago')
    }
  }

  const handleEditPayment = async (
    paymentId: number,
    payment: Partial<VentaPago>
  ) => {
    try {
      let updatedPayment = { ...payment }

      // Si se cambió el método de pago, obtener el nombre
      if (payment.metodo_pago_id || payment.metodoPagoId) {
        const metodoPagoNombre = await getMetodoPagoNombre(
          payment.metodo_pago_id || payment.metodoPagoId || 0
        )
        updatedPayment.metodoPagoNombre = metodoPagoNombre
      }

      // Si se cambió la moneda, obtener el código
      if (payment.moneda_id || payment.monedaId) {
        const monedaCodigo = await getMonedaCodigo(
          payment.moneda_id || payment.monedaId || 0
        )
        updatedPayment.monedaCodigo = monedaCodigo
      }

      // Recalcular monto_en_moneda_venta si cambió el monto o la moneda
      if (
        payment.monto !== undefined ||
        payment.moneda_id !== undefined ||
        payment.monedaId !== undefined
      ) {
        const monedaVentaId = 1 // Por defecto VES (Bolívares Fuertes)
        const montoFinal =
          payment.monto !== undefined
            ? payment.monto
            : pagos.find(p => p.id === paymentId)?.monto || 0
        const monedaPagoId =
          payment.moneda_id ||
          payment.monedaId ||
          pagos.find(p => p.id === paymentId)?.moneda_id ||
          0

        const montoEnMonedaVenta = calcularMontoEnMonedaVenta(
          montoFinal,
          monedaPagoId,
          monedaVentaId
        )
        updatedPayment.monto_en_moneda_venta = montoEnMonedaVenta
      }

      setPagos(prev =>
        prev.map(p => (p.id === paymentId ? { ...p, ...updatedPayment } : p))
      )
    } catch (error) {
      console.error('Error editing payment:', error)
      message.error('Error al editar el pago')
    }
  }

  const handleDeletePayment = (paymentId: number) => {
    setPagos(prev => prev.filter(p => p.id !== paymentId))
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

      // Validar stock disponible antes de crear la venta
      const stockInsuficiente = details.some(
        detail => (detail.stock || 0) < detail.cantidad
      )

      if (stockInsuficiente) {
        const productosConStockInsuficiente = details.filter(
          detail => (detail.stock || 0) < detail.cantidad
        )
        const mensaje = productosConStockInsuficiente
          .map(
            detail =>
              `${detail.producto_descripcion}: Disponible ${
                detail.stock || 0
              }, solicitado ${detail.cantidad}`
          )
          .join('\n')
        message.error(`Stock insuficiente en esta sucursal:\n${mensaje}`, 10)
        return
      }

      // Validar que si hay pagos, la suma no exceda el total
      const totalVenta = parseFloat(
        details.reduce((acc, curr) => acc + curr.subtotal, 0).toFixed(2)
      )

      const pagosValidos = pagos.filter(pago => {
        const isValid =
          pago.metodo_pago_id !== undefined &&
          pago.metodo_pago_id !== null &&
          pago.metodo_pago_id > 0 &&
          pago.moneda_id !== undefined &&
          pago.moneda_id !== null &&
          pago.moneda_id > 0 &&
          pago.monto > 0
        return isValid
      })

      const totalPagos = parseFloat(
        (monedaBase
          ? sumPagosConConversion(pagosValidos, monedaBase, monedas)
          : pagosValidos.reduce((acc, pago) => acc + (pago.monto || 0), 0)
        ).toFixed(2)
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
            pago.monto <= 0
        )

        let mensaje = 'Algunos pagos no están completos y serán omitidos:\n'
        pagosInvalidos.forEach((pago, index) => {
          const faltantes = []
          if (!pago.metodo_pago_id) faltantes.push('método de pago')
          if (!pago.moneda_id) faltantes.push('moneda')
          if (pago.monto <= 0) faltantes.push('monto')
          mensaje += `- Pago ${index + 1}: falta ${faltantes.join(', ')}\n`
        })

        message.warning(mensaje)
      }

      const data = {
        ...values,
        empresa_id: empresaId ?? 1,
        usuario_id: usuarioId ?? null,
        total: totalVenta,
        estado: 'vendido',
        moneda_id: 1, // Por defecto VES (Bolívares Fuertes)
        moneda: 'Bs',
        comentario: values.comentario || '',
        detalle: details,
        pagos: pagosValidos.length > 0 ? pagosValidos : undefined, // Solo incluir pagos válidos
      }

      const confirm = await modal.confirm({
        title: 'Generar venta',
        content:
          'Quieres generar esta venta ahora? Recuerda marcarla como “vendida” cuando completes el cobro.',
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
      title: 'Stock Disponible (Sucursal)',
      dataIndex: 'stock',
      width: 180,
      render: (_: any, record: PurchaseDetail) => (
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
            step={0.01}
            value={record.precio_unitario}
            onChange={value => handlePriceChange(value, index)}
            disabled={record.precio_no_encontrado}
            status={record.precio_realmente_no_encontrado ? 'error' : undefined}
            formatter={value => {
              const simbolo = 'Bs.'
              const numValue = Number(value || 0)
              return `${simbolo} ${numValue.toFixed(2)}`.replace(
                /\B(?=(\d{3})+(?!\d))/g,
                ','
              )
            }}
            parser={value => {
              return value!.replace(/Bs\.\s?|(,*)/g, '')
            }}
            style={{ width: '100%' }}
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
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ fontWeight: 'bold' }}>
          {formatCurrency('VES', value)}
        </span>
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

  const fetchClients = async (search: string) => {
    const hasNumbers = /\d/.test(search)
    const filters: Record<string, any> = {}

    if (hasNumbers) {
      filters.nit = search
    } else {
      filters.name = search
    }

    const clients = await getClients(filters, empresaId ?? 1)
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
              <Col span={24}>
                <Space direction='vertical' style={{ width: '100%' }}>
                  <label>Comentario (Opcional)</label>
                  <Form.Item style={{ marginBottom: 0 }} name='comentario'>
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
                Total:{' '}
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                  {formatCurrency(
                    'VES',
                    details.reduce((acc, curr) => acc + curr.subtotal, 0)
                  )}
                </span>
              </h3>
            </div>

            {/* Sección de Pagos */}
            {ventaMemoizada && (
              <PaymentsSection
                venta={ventaMemoizada}
                pagos={pagos}
                onAddPayment={handleAddPayment}
                onEditPayment={handleEditPayment}
                onDeletePayment={handleDeletePayment}
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
