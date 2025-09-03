'use client'
import '@ant-design/v5-patch-for-react-19'
import { Form, Input, Select, Button, message, Card } from 'antd'
import { useRouter } from 'next/navigation'
import { createProduct } from '@/app/api/products'
import { PageHeader } from '@/app/components/PageHeader'
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

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      const productData = {
        ...values,
        empresa_id: 1,
      }
      await createProduct(productData)

      await queryClient.invalidateQueries({ queryKey: [QueryKey.productsInfo] })

      message.success('Producto creado exitosamente')
      router.push('/home/products')
    } catch (error) {
      message.error(`${error}`)
    } finally {
      setLoading(false)
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
          title='Nuevo Producto'
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
            name='codigo'
            label='Código'
            rules={[{ required: true, message: 'Por favor ingrese el código' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name='serie'
            label='Serie'
            rules={[{ required: true, message: 'Por favor ingrese la serie' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name='categoria'
            label='Categoría'
            rules={[
              { required: true, message: 'Por favor seleccione la categoría' },
            ]}
          >
            <Select options={categories} />
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
            rules={[{ required: true, message: 'Por favor ingrese el stock' }]}
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
            ]}
          >
            <Input type='number' />
          </Form.Item>

          <Form.Item>
            <Button type='primary' htmlType='submit' loading={loading}>
              Crear Producto
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </motion.div>
  )
}
