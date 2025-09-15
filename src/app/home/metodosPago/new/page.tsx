'use client'
import '@ant-design/v5-patch-for-react-19'
import { Form, Input, Switch, Button, message, Card, Space } from 'antd'
import { useRouter } from 'next/navigation'
import { createMetodoPago } from '@/app/api/metodos-pago'
import { PageHeader } from '@/app/components/PageHeader'
import { useState } from 'react'
import { queryClient, QueryKey } from '@/app/utils/query'
import { motion } from 'framer-motion'

export default function NewMetodoPago() {
  const [form] = Form.useForm()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      const metodoPagoData = {
        nombre: values.nombre,
        activo: values.activo ?? true,
      }
      await createMetodoPago(metodoPagoData)

      await queryClient.invalidateQueries({
        queryKey: [QueryKey.metodosPagoInfo],
      })

      message.success('Método de pago creado exitosamente')
      router.push('/home/metodosPago')
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
          title='Nuevo Método de Pago'
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
            name='nombre'
            label='Nombre'
            rules={[{ required: true, message: 'Por favor ingrese el nombre' }]}
          >
            <Input placeholder='Ej: Efectivo, Tarjeta de Crédito, Transferencia' />
          </Form.Item>

          <Form.Item
            name='activo'
            label='Estado'
            valuePropName='checked'
            initialValue={true}
          >
            <Switch checkedChildren='Activo' unCheckedChildren='Inactivo' />
          </Form.Item>

          <Form.Item style={{ textAlign: 'center', marginTop: '32px' }}>
            <Space>
              <Button onClick={() => router.back()}>Cancelar</Button>
              <Button type='primary' htmlType='submit' loading={loading}>
                Crear Método de Pago
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </motion.div>
  )
}
