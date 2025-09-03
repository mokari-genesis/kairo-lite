'use client'
import '@ant-design/v5-patch-for-react-19'
import { Form, Input, Select, Button, message, Card, Spin } from 'antd'
import { useRouter } from 'next/navigation'
import { createStock } from '@/app/api/stock'
import { PageHeader } from '@/app/components/PageHeader'
import { useState } from 'react'
import { queryClient, QueryKey } from '@/app/utils/query'
import { motion } from 'framer-motion'
import { getProducts } from '@/app/api/products'
import { SearchSelect } from '@/app/components/SearchSelect'

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

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      const stockData = {
        ...values,
        empresa_id: 1,
        user_id: 1, // This should be replaced with the actual user ID from your auth system
      }
      await createStock(stockData)
      await queryClient.invalidateQueries({ queryKey: [QueryKey.stockInfo] })
      await queryClient.invalidateQueries({ queryKey: [QueryKey.productsInfo] })
      message.success('Movimiento de inventario creado exitosamente')
      router.push('/home/stock')
    } catch (error) {
      message.error(`${error}`)
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

    const products = await getProducts(filters)

    return products
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
            />
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
            <Input type='number' />
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
