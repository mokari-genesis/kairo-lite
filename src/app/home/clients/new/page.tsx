'use client'

import '@ant-design/v5-patch-for-react-19'
import { PageHeader } from '@/app/components/PageHeader'
import { withAuth } from '@/app/auth/withAuth'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Form, Input, Select, Button, message, Space } from 'antd'
import { motion } from 'framer-motion'
import { createClient } from '@/app/api/clients'
import { useEmpresa } from '@/app/empresaContext'

function NewClient() {
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { empresaId } = useEmpresa()

  const handleBack = () => {
    router.push('/home/clients')
  }

  const handleSubmit = async (values: any) => {
    try {
      setIsLoading(true)
      await createClient({
        empresa_id: empresaId ?? 1,
        name: values.nombre,
        type: values.tipo,
        nit: values.nit,
        email: values.email,
        phone: values.telefono,
        address: values.direccion,
      })
      message.success('Cliente creado exitosamente')
      router.push('/home/clients')
    } catch (error: any) {
      message.error(error.message || 'Error al crear el cliente')
    } finally {
      setIsLoading(false)
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
        <Space direction='vertical' size='large' style={{ width: '100%' }}>
          <PageHeader
            title='Nuevo Cliente'
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
              rules={[
                { required: true, message: 'Por favor ingrese el nombre' },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name='tipo'
              label='Tipo de Cliente'
              rules={[
                { required: true, message: 'Por favor seleccione el tipo' },
              ]}
            >
              <Select
                options={[
                  { value: 'empresa', label: 'Empresa' },
                  { value: 'persona', label: 'Persona' },
                ]}
              />
            </Form.Item>

            <Form.Item
              name='nit'
              label='NIT'
              rules={[{ required: true, message: 'Por favor ingrese el NIT' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name='email'
              label='Email'
              rules={[
                { required: true, message: 'Por favor ingrese el email' },
                { type: 'email', message: 'Por favor ingrese un email válido' },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name='telefono'
              label='Teléfono'
              rules={[
                { required: true, message: 'Por favor ingrese el teléfono' },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name='direccion'
              label='Dirección'
              rules={[
                { required: true, message: 'Por favor ingrese la dirección' },
              ]}
            >
              <Input.TextArea />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type='primary' htmlType='submit' loading={isLoading}>
                  Crear Cliente
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </motion.div>
  )
}

export default withAuth(NewClient)
