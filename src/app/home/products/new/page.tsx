'use client'
import '@ant-design/v5-patch-for-react-19'
import {
  Form,
  Input,
  Select,
  Button,
  message,
  Card,
  Steps,
  Divider,
} from 'antd'
import { useRouter } from 'next/navigation'
import { createProduct } from '@/app/api/products'
import { PageHeader } from '@/app/components/PageHeader'
import { SupplierSelect } from '@/app/components/SupplierSelect'
import { ProductoPreciosManager } from '@/app/components/ProductoPreciosManager'
import { createProductoPrecio } from '@/app/api/productos-precios'
import { useState } from 'react'
import { queryClient, QueryKey } from '@/app/utils/query'
import { motion } from 'framer-motion'

const { TextArea } = Input

const categories = [
  { value: 'juguete', label: 'Juguete' },
  { value: 'ropa', label: 'Ropa' },
  { value: 'accesorio', label: 'Accesorio' },
  { value: 'artículo_pinata', label: 'Artículo piñata' },
  { value: 'utensilio_cocina', label: 'Utensilio de cocina' },
  { value: 'material_educativo', label: 'Material educativo' },
  { value: 'material_didactico', label: 'Material didáctico' },
  { value: 'otros', label: 'Otros' },
]

const estados = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
]

export default function NewProduct() {
  const [form] = Form.useForm()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [createdProduct, setCreatedProduct] = useState<any>(null)

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      const productData = {
        ...values,
        empresa_id: 1,
        proveedor_id: selectedSupplier?.id,
      }
      const response = await createProduct(productData)

      // Si hay un precio sugerido, crear automáticamente el tipo de precio "sugerido"
      if (values.precio && values.precio > 0) {
        try {
          await createProductoPrecio({
            producto_id: parseInt(response.data.id),
            tipo: 'sugerido',
            precio: parseFloat(values.precio),
          })
          console.log('Precio sugerido creado exitosamente')
        } catch (priceError) {
          console.error('Error creating suggested price:', priceError)
          // No mostramos error al usuario ya que el producto ya se creó exitosamente
        }
      }

      // Guardar el producto creado para la gestión de precios
      setCreatedProduct(response.data)
      setCurrentStep(1)

      await queryClient.invalidateQueries({ queryKey: [QueryKey.productsInfo] })

      // Invalidar también las queries de precios para que se actualice la lista
      if (values.precio && values.precio > 0) {
        await queryClient.invalidateQueries({
          queryKey: ['productos-precios', parseInt(response.data.id)],
        })
      }

      const successMessage =
        values.precio && values.precio > 0
          ? 'Producto creado exitosamente con precio sugerido. Ahora puedes gestionar otros precios.'
          : 'Producto creado exitosamente. Ahora puedes gestionar los precios.'

      message.success(successMessage)
    } catch (error) {
      message.error(`${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    message.success('Proceso completado exitosamente')
    router.push('/home/products')
  }

  const handleBackToForm = () => {
    setCurrentStep(0)
    setCreatedProduct(null)
  }

  const steps = [
    {
      title: 'Información del Producto',
      description: 'Completar datos básicos del producto',
    },
    {
      title: 'Gestión de Precios',
      description: 'Configurar precios por tipo',
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
        <PageHeader
          title='Nuevo Producto'
          showNewButton={true}
          onNewClick={() => router.back()}
          newButtonText='Volver'
        />

        <Steps
          current={currentStep}
          items={steps}
          style={{ marginBottom: '32px' }}
        />

        {currentStep === 0 && (
          <Form
            form={form}
            layout='vertical'
            onFinish={handleSubmit}
            style={{ maxWidth: '60%', margin: '0 auto' }}
          >
            <Form.Item
              name='codigo'
              label='Código'
              rules={[
                { required: true, message: 'Por favor ingrese el código' },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name='serie'
              label='Serie'
              rules={[
                { required: true, message: 'Por favor ingrese la serie' },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name='categoria'
              label='Categoría'
              rules={[
                {
                  required: true,
                  message: 'Por favor seleccione la categoría',
                },
              ]}
            >
              <Select options={categories} />
            </Form.Item>

            <Form.Item
              name='proveedor_id'
              label='Proveedor'
              rules={[
                {
                  required: true,
                  message: 'Por favor seleccione un proveedor',
                },
              ]}
            >
              <SupplierSelect
                value={selectedSupplier?.id}
                onChange={(value, supplier) => {
                  setSelectedSupplier(supplier)
                  form.setFieldValue('proveedor_id', value)
                }}
              />
            </Form.Item>

            <Form.Item
              name='descripcion'
              label='Descripción'
              rules={[
                { required: true, message: 'Por favor ingrese la descripción' },
              ]}
            >
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name='estado'
              label='Estado'
              rules={[
                { required: true, message: 'Por favor seleccione el estado' },
              ]}
            >
              <Select options={estados} />
            </Form.Item>

            <Form.Item
              name='stock'
              label='Stock'
              rules={[
                { required: true, message: 'Por favor ingrese el stock' },
              ]}
            >
              <Input type='number' />
            </Form.Item>

            <Form.Item
              name='precio'
              label='Precio sugerido'
              rules={[
                {
                  required: false,
                  message: 'Por favor ingrese un precio sugerido',
                },
                {
                  validator: (_, value) => {
                    if (value === undefined || value === null || value === '') {
                      return Promise.resolve()
                    }
                    const numValue = parseFloat(value)
                    if (isNaN(numValue) || numValue < 0) {
                      return Promise.reject(
                        new Error('El precio debe ser mayor o igual a 0')
                      )
                    }
                    return Promise.resolve()
                  },
                },
              ]}
              extra='Este precio se agregará automáticamente como tipo "Sugerido" en la gestión de precios'
            >
              <Input type='number' min={0} step={0.01} />
            </Form.Item>

            <Form.Item>
              <Button type='primary' htmlType='submit' loading={loading}>
                Crear Producto
              </Button>
            </Form.Item>
          </Form>
        )}

        {currentStep === 1 && createdProduct && (
          <div>
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <h3>
                Producto creado exitosamente: {createdProduct.descripcion}
              </h3>
              <p>
                Código: {createdProduct.codigo} | Serie: {createdProduct.serie}
              </p>
            </div>

            <Divider />

            <ProductoPreciosManager
              productoId={parseInt(createdProduct.id)}
              productoDescripcion={createdProduct.descripcion}
              productoData={createdProduct}
              onProductUpdate={updatedProduct => {
                setCreatedProduct(updatedProduct)
              }}
            />

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Button onClick={handleBackToForm} style={{ marginRight: '8px' }}>
                Volver al Formulario
              </Button>
              <Button type='primary' onClick={handleFinish}>
                Finalizar
              </Button>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
