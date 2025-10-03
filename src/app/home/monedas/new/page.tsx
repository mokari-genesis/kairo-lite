'use client'
import '@ant-design/v5-patch-for-react-19'
import {
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  message,
  Card,
  Space,
} from 'antd'
import { useRouter } from 'next/navigation'
import { createMoneda } from '@/app/api/monedas'
import { PageHeader } from '@/app/components/PageHeader'
import { useState } from 'react'
import { queryClient, QueryKey } from '@/app/utils/query'
import { motion } from 'framer-motion'

export default function NewMoneda() {
  const [form] = Form.useForm()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      const monedaData = {
        codigo: values.codigo,
        nombre: values.nombre,
        simbolo: values.simbolo,
        decimales: 2, // values.decimales || 2,
        tasa_vs_base: values.tasa || 1,
        es_base: 0,
        activo: values.activo ?? true,
        tasa_actualizada: new Date().toISOString(),
      }
      await createMoneda(monedaData)

      await queryClient.invalidateQueries({ queryKey: [QueryKey.monedasInfo] })

      message.success('Moneda creada exitosamente')
      router.push('/home/monedas')
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
          title='Nueva Moneda'
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
            label='Código ISO'
            rules={[
              { required: true, message: 'Por favor ingrese el código ISO' },
              { max: 3, message: 'El código debe tener máximo 3 caracteres' },
            ]}
          >
            <Input
              placeholder='Ej: VES, USD, EUR'
              maxLength={3}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>

          <Form.Item
            name='nombre'
            label='Nombre'
            rules={[{ required: true, message: 'Por favor ingrese el nombre' }]}
          >
            <Input placeholder='Ej: Quetzal Guatemalteco, Dólar Americano' />
          </Form.Item>

          <Form.Item
            name='simbolo'
            label='Símbolo'
            rules={[
              { max: 5, message: 'El símbolo debe tener máximo 5 caracteres' },
            ]}
          >
            <Input placeholder='Ej: Q, $, €' maxLength={5} />
          </Form.Item>

          <Form.Item
            name='tasa'
            label='Tasa de conversión'
            rules={[
              {
                required: true,
                message: 'Por favor ingrese la tasa de conversión',
              },
            ]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
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
                Crear Moneda
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </motion.div>
  )
}
