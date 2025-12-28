'use client'

import '@ant-design/v5-patch-for-react-19'
import { PageHeader } from '@/app/components/PageHeader'
import { withAuth } from '@/app/auth/withAuth'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Form, Input, Button, message, Space } from 'antd'
import { motion } from 'framer-motion'
import { createEnterprise } from '@/app/api/enterprise'
import { useCurrentUser } from '@/app/usuarioContext'
import { useEffect } from 'react'

function NewEnterprise() {
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { isMaster, loading: userLoading } = useCurrentUser()

  // Redirigir si no es master
  useEffect(() => {
    if (!userLoading && !isMaster) {
      message.error('No tienes permisos para crear sucursales')
      router.push('/home/enterprises')
    }
  }, [isMaster, userLoading, router])

  const handleBack = () => {
    router.push('/home/enterprises')
  }

  const handleSubmit = async (values: any) => {
    // Validación adicional de seguridad
    if (!isMaster) {
      message.error('No tienes permisos para crear sucursales')
      router.push('/home/enterprises')
      return
    }

    try {
      setIsLoading(true)
      await createEnterprise({
        nombre: values.nombre,
        nit: values.nit,
        direccion: values.direccion,
        telefono: values.telefono,
        email: values.email,
      })
      message.success('Sucursal creada exitosamente')
      router.push('/home/enterprises')
    } catch (error: any) {
      message.error(error.message || 'Error al crear la sucursal')
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar loading mientras se verifica el rol
  if (userLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Card>
          <Space direction='vertical' size='large'>
            <div>Cargando...</div>
          </Space>
        </Card>
      </div>
    )
  }

  // No mostrar el formulario si no es master
  if (!isMaster) {
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
        <Space direction='vertical' size='large' style={{ width: '100%' }}>
          <PageHeader
            title='Nueva Sucursal'
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
              <Input placeholder='Nombre de la sucursal' />
            </Form.Item>

            <Form.Item
              name='nit'
              label='NIT'
              rules={[{ required: true, message: 'Por favor ingrese el NIT' }]}
            >
              <Input placeholder='NIT de la sucursal' />
            </Form.Item>

            <Form.Item
              name='email'
              label='Email'
              rules={[
                { required: true, message: 'Por favor ingrese el email' },
                { type: 'email', message: 'Por favor ingrese un email válido' },
              ]}
            >
              <Input placeholder='Email de la sucursal' />
            </Form.Item>

            <Form.Item
              name='telefono'
              label='Teléfono'
              rules={[
                { required: true, message: 'Por favor ingrese el teléfono' },
              ]}
            >
              <Input placeholder='Teléfono de la sucursal' />
            </Form.Item>

            <Form.Item
              name='direccion'
              label='Dirección'
              rules={[
                { required: true, message: 'Por favor ingrese la dirección' },
              ]}
            >
              <Input.TextArea placeholder='Dirección de la sucursal' rows={3} />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button onClick={handleBack}>Cancelar</Button>
                <Button type='primary' htmlType='submit' loading={isLoading}>
                  Crear Sucursal
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </motion.div>
  )
}

export default withAuth(NewEnterprise)
