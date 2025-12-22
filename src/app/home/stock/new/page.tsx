'use client'
import '@ant-design/v5-patch-for-react-19'
import { Form, Input, Select, Button, message, Card, Spin } from 'antd'
import { useRouter } from 'next/navigation'
import { createStock } from '@/app/api/stock'
import { PageHeader } from '@/app/components/PageHeader'
import { useState, useEffect, useRef } from 'react'
import { queryClient, QueryKey } from '@/app/utils/query'
import { motion } from 'framer-motion'
import { getProducts } from '@/app/api/products'
import { SearchSelect } from '@/app/components/SearchSelect'
import { useEmpresa } from '@/app/empresaContext'

const { TextArea } = Input

const movementTypes = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'ajuste', label: 'Ajuste (Re-stock)' },
]

export default function NewStockMovement() {
  const [form] = Form.useForm()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStock, setCurrentStock] = useState<number | null>(null)
  const { empresaId } = useEmpresa()
  const prevEmpresaIdRef = useRef<number | null>(empresaId)

  // Resetear todos los valores cuando cambia la sucursal
  useEffect(() => {
    // Solo resetear si ya había una empresa seleccionada y cambió
    if (prevEmpresaIdRef.current !== null && prevEmpresaIdRef.current !== empresaId) {
      // Resetear el formulario
      form.resetFields()
      // Resetear el stock actual
      setCurrentStock(null)
    }
    // Actualizar la referencia
    prevEmpresaIdRef.current = empresaId
  }, [empresaId, form])

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      const stockData = {
        ...values,
        empresa_id: empresaId ?? 1,
        user_id: 1, // This should be replaced with the actual user ID from your auth system
        // Asegurar que precio_compra y compra_id se envíen correctamente
        precio_compra: values.precio_compra
          ? parseFloat(values.precio_compra)
          : null,
        compra_id: values.compra_id ? parseInt(values.compra_id) : null,
      }
      await createStock(stockData)
      await queryClient.invalidateQueries({ queryKey: [QueryKey.stockInfo] })
      await queryClient.invalidateQueries({ queryKey: [QueryKey.productsInfo] })

      // Si es un movimiento tipo entrada con compra_id, refrescar cuentas por pagar
      if (values.movement_type === 'entrada' && values.compra_id) {
        await queryClient.invalidateQueries({
          queryKey: [QueryKey.cuentasPorPagarInfo],
        })
        message.success(
          'Movimiento de inventario creado exitosamente. Se generó/actualizó automáticamente una cuenta por pagar para esta compra.'
        )
      } else {
        message.success('Movimiento de inventario creado exitosamente')
      }

      router.push('/home/stock')
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.toString() || 'Error desconocido'
      message.error(`Error al crear el movimiento: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async (search: string) => {
    const hasNumbers = /\d/.test(search)
    const filters: Record<string, any> = {}
    filters.estado = 'activo'

    if (hasNumbers) {
      filters.codigo = search
    } else {
      filters.descripcion = search
    }

    const products = await getProducts(filters, empresaId ?? 1)

    return products
  }

  const handleProductSelect = async (value: any, option: any) => {
    // El producto completo está en option.details según SearchSelect
    const product = option?.details || option
    if (product && value) {
      // Obtener el stock actualizado del producto
      try {
        const products = await getProducts({ product_id: value }, empresaId ?? 1)
        const selectedProduct = products.find(p => Number(p.id) === Number(value))
        setCurrentStock(selectedProduct?.stock ?? 0)
      } catch (error) {
        console.error('Error al obtener el stock del producto:', error)
        // Si falla, usar el stock del producto de la búsqueda
        setCurrentStock(product.stock ?? 0)
      }
    } else {
      setCurrentStock(null)
    }
  }

  const handleProductChange = (value: any) => {
    // Si se limpia la selección, resetear el stock
    if (!value) {
      setCurrentStock(null)
    }
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
        <PageHeader
          title='Nuevo Movimiento de Inventario'
          showNewButton={true}
          onNewClick={() => router.back()}
          newButtonText='Volver'
        />

        <Form
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          style={{ maxWidth: '60%', margin: '0 auto' }}
        >
          <Form.Item
            name='product_id'
            label='Producto'
            rules={[
              {
                required: true,
                message: 'Por favor seleccione un producto',
              },
            ]}
          >
            <SearchSelect
              form={form}
              name='product_id'
              fetchOptions={fetchProducts}
              placeholder='Busque un producto por descripción o código'
              onSelect={handleProductSelect}
              onChange={handleProductChange}
            />
          </Form.Item>

          <Form.Item
            label='Stock Actual'
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.product_id !== currentValues.product_id
            }
          >
            {({ getFieldValue }) => {
              const productId = getFieldValue('product_id')
              if (!productId || currentStock === null) {
                return (
                  <Input
                    disabled
                    placeholder='Seleccione un producto para ver el stock actual'
                  />
                )
              }
              return (
                <Input
                  disabled
                  value={currentStock}
                  style={{ fontWeight: 'bold', color: '#722ed1' }}
                />
              )
            }}
          </Form.Item>

          <Form.Item
            name='movement_type'
            label='Tipo de Movimiento'
            rules={[
              {
                required: true,
                message: 'Por favor seleccione el tipo de movimiento',
              },
            ]}
          >
            <Select options={movementTypes} />
          </Form.Item>

          <Form.Item
            name='quantity'
            label='Cantidad'
            rules={[
              {
                required: true,
                message: 'Por favor ingrese la cantidad',
              },
            ]}
          >
            <Input type='number' min={1} />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.movement_type !== currentValues.movement_type
            }
          >
            {({ getFieldValue }) => {
              const movementType = getFieldValue('movement_type')
              if (movementType === 'entrada') {
                return (
                  <>
                    <Form.Item
                      name='precio_compra'
                      label='Precio de Compra'
                      rules={[
                        {
                          required: true,
                          message:
                            'Para movimientos tipo entrada, el precio de compra es requerido',
                        },
                        {
                          validator: (_, value) => {
                            if (
                              value === undefined ||
                              value === null ||
                              value === ''
                            ) {
                              return Promise.reject(
                                new Error(
                                  'El precio de compra es requerido para movimientos tipo entrada'
                                )
                              )
                            }
                            const numValue = parseFloat(value)
                            if (isNaN(numValue) || numValue < 0) {
                              return Promise.reject(
                                new Error(
                                  'El precio de compra debe ser mayor o igual a 0'
                                )
                              )
                            }
                            return Promise.resolve()
                          },
                        },
                      ]}
                    >
                      <Input type='number' min={0} step={0.01} />
                    </Form.Item>
                  </>
                )
              }
              return null
            }}
          </Form.Item>

          <Form.Item
            name='comment'
            label='Comentario'
            rules={[
              {
                required: true,
                message: 'Por favor ingrese un comentario',
              },
            ]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Button type='primary' htmlType='submit' loading={loading}>
              Crear Movimiento
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </motion.div>
  )
}
