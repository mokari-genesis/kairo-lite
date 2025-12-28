'use client'

import '@ant-design/v5-patch-for-react-19'
import { PageHeader } from '@/app/components/PageHeader'
import { withAuth } from '@/app/auth/withAuth'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Form, Input, Select, Button, message, Space, Switch } from 'antd'
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { createUsuario } from '@/app/api/usuarios'
import { useEmpresa } from '@/app/empresaContext'

function NewUsuario() {
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { empresaId } = useEmpresa()

  const handleBack = () => {
    router.push('/home/usuarios')
  }

  const handleSubmit = async (values: any) => {
    try {
      setIsLoading(true)
      await createUsuario({
        empresa_id: empresaId ?? null,
        nombre: values.nombre,
        email: values.email,
        rol: values.rol,
        password: values.password,
        activo: values.activo !== undefined ? (values.activo ? 1 : 0) : 1,
      })
      message.success(
        'Usuario creado exitosamente en Cognito y sincronizado con la base de datos'
      )
      router.push('/home/usuarios')
    } catch (error: any) {
      message.error(error.message || 'Error al crear el usuario')
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
            title='Nuevo Usuario'
            showNewButton={true}
            onNewClick={() => router.back()}
            newButtonText='Volver'
          />

          <Form
            form={form}
            layout='vertical'
            onFinish={handleSubmit}
            style={{ maxWidth: '60%', margin: '0 auto' }}
            initialValues={{
              activo: true,
            }}
          >
            <Form.Item
              name='nombre'
              label='Nombre'
              rules={[
                { required: true, message: 'Por favor ingrese el nombre' },
              ]}
            >
              <Input placeholder='Ingrese el nombre completo' />
            </Form.Item>

            <Form.Item
              name='email'
              label='Email'
              rules={[
                { required: true, message: 'Por favor ingrese el email' },
                { type: 'email', message: 'Por favor ingrese un email válido' },
              ]}
            >
              <Input placeholder='usuario@ejemplo.com' />
            </Form.Item>

            <Form.Item
              name='password'
              label='Contraseña'
              rules={[
                { required: true, message: 'Por favor ingrese la contraseña' },
                {
                  min: 8,
                  message: 'La contraseña debe tener al menos 8 caracteres',
                },
              ]}
            >
              <Input.Password
                placeholder='Ingrese la contraseña (mínimo 8 caracteres)'
                iconRender={visible =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
              />
            </Form.Item>

            <Form.Item
              name='rol'
              label='Rol'
              rules={[
                { required: true, message: 'Por favor seleccione el rol' },
              ]}
            >
              <Select
                placeholder='Seleccione el rol del usuario'
                options={[
                  { value: 'admin', label: 'Administrador' },
                  { value: 'vendedor', label: 'Vendedor' },
                  { value: 'bodega', label: 'Bodega' },
                  { value: 'master', label: 'Master' },
                ]}
              />
            </Form.Item>

            <Form.Item name='activo' label='Estado' valuePropName='checked'>
              <Switch checkedChildren='Activo' unCheckedChildren='Inactivo' />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type='primary' htmlType='submit' loading={isLoading}>
                  Crear Usuario
                </Button>
                <Button onClick={handleBack}>Cancelar</Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </motion.div>
  )
}

export default withAuth(NewUsuario)
