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
  Modal,
  Space,
  Typography,
} from 'antd'
import { useRouter } from 'next/navigation'
import { createProduct } from '@/app/api/products'
import { PageHeader } from '@/app/components/PageHeader'
import { SupplierSelect } from '@/app/components/SupplierSelect'
import { ProductoPreciosManager } from '@/app/components/ProductoPreciosManager'
import { TemplateInfoModal } from '@/app/components/TemplateInfoModal'
import { BulkUploadModal } from '@/app/components/BulkUploadModal'
import { createProductoPrecio } from '@/app/api/productos-precios'
import { useState } from 'react'
import { queryClient, QueryKey } from '@/app/utils/query'
import { motion } from 'framer-motion'
import { useEmpresa } from '@/app/empresaContext'
import { useUsuario } from '@/app/usuarioContext'

const { Title, Paragraph, Text } = Typography

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
  const [bulkUploadModalVisible, setBulkUploadModalVisible] = useState(false)
  const [summaryModalVisible, setSummaryModalVisible] = useState(false)
  const [summaryData, setSummaryData] = useState<{
    successCount: number
    totalRows: number
    errors: string[]
  } | null>(null)
  const [templateInfoModalVisible, setTemplateInfoModalVisible] =
    useState(false)
  const { empresaId, empresa } = useEmpresa()
  const { usuarioId } = useUsuario()

  const handleSubmit = async (values: any) => {
    try {
      if (!empresaId) {
        message.error(
          'Debe seleccionar una sucursal antes de crear un producto.'
        )
        return
      }

      setLoading(true)
      const productData = {
        ...values,
        empresa_id: empresaId,
        proveedor_id: selectedSupplier?.id,
        usuario_id: usuarioId || 1,
      }

      const response = await createProduct(productData, empresaId)

      // Si hay un precio sugerido, crear automáticamente el tipo de precio "sugerido"
      if (values.precio && values.precio > 0) {
        try {
          await createProductoPrecio({
            producto_id: parseInt(response.data.id),
            tipo: 'sugerido',
            precio: parseFloat(values.precio),
          })
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

  const preSubmit = async (values: any) => {
    try {
      return new Promise<void>((resolve, reject) => {
        Modal.confirm({
          title: 'Confirmar Sucursal',
          content: `La sucursal donde será registrado este producto es: ${empresa?.nombre}`,
          okText: 'Continuar',
          cancelText: 'Cancelar',
          onOk: async () => {
            try {
              await handleSubmit(values)
              resolve()
            } catch (error) {
              message.error(`${error}`)
              reject(error)
            }
          },
          onCancel: () => {
            resolve() // Resolvemos sin hacer nada si cancela
          },
        })
      })
    } catch (error) {
      message.error(`${error}`)
    }
  }

  // Handler para cuando se descarga la plantilla
  const handleTemplateDownloaded = () => {
    setTemplateInfoModalVisible(true)
  }

  // Handler para cuando se completa el procesamiento
  const handleProcessComplete = (data: {
    successCount: number
    totalRows: number
    errors: string[]
  }) => {
    setSummaryData(data)
    setSummaryModalVisible(true)
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

        {currentStep === 0 && (
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <Button
              type='default'
              size='large'
              onClick={() => setBulkUploadModalVisible(true)}
              style={{
                marginBottom: '16px',
                backgroundColor: '#f0f0f0',
                borderColor: '#d9d9d9',
              }}
            >
              📦 Carga Masiva
            </Button>
          </div>
        )}

        <Steps
          current={currentStep}
          items={steps}
          style={{ marginBottom: '32px' }}
        />

        {currentStep === 0 && (
          <Form
            form={form}
            layout='vertical'
            onFinish={async values => await preSubmit(values)}
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

        {/* Modal de Carga Masiva */}
        <BulkUploadModal
          visible={bulkUploadModalVisible}
          onClose={() => setBulkUploadModalVisible(false)}
          empresaId={empresaId}
          usuarioId={usuarioId}
          categories={categories}
          estados={estados}
          onTemplateDownloaded={handleTemplateDownloaded}
          onProcessComplete={handleProcessComplete}
        />

        {/* Modal de Resumen */}
        <Modal
          title={
            <Title level={4} style={{ margin: 0 }}>
              Resumen de Carga Masiva
            </Title>
          }
          open={summaryModalVisible}
          onOk={() => {
            setSummaryModalVisible(false)
            setSummaryData(null)
            router.push('/home/products')
          }}
          okText='Aceptar'
          cancelButtonProps={{ style: { display: 'none' } }}
          width={600}
        >
          {summaryData && (
            <Space direction='vertical' size='large' style={{ width: '100%' }}>
              <div>
                <Title level={5}>Resultados de la carga:</Title>
                <Paragraph>
                  <Text strong>
                    {summaryData.successCount} de {summaryData.totalRows}{' '}
                    productos
                  </Text>{' '}
                  se cargaron exitosamente.
                </Paragraph>
                {summaryData.errors.length > 0 && (
                  <div>
                    <Text type='warning' strong>
                      Se encontraron {summaryData.errors.length} error(es):
                    </Text>
                    <div
                      style={{
                        marginTop: '12px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        padding: '12px',
                        backgroundColor: '#fff7e6',
                        borderRadius: '4px',
                        border: '1px solid #ffe58f',
                      }}
                    >
                      {summaryData.errors.slice(0, 10).map((error, index) => (
                        <div key={index} style={{ marginBottom: '8px' }}>
                          <Text type='warning' style={{ fontSize: '12px' }}>
                            • {error}
                          </Text>
                        </div>
                      ))}
                      {summaryData.errors.length > 10 && (
                        <Text type='secondary' style={{ fontSize: '12px' }}>
                          ... y {summaryData.errors.length - 10} error(es) más
                        </Text>
                      )}
                    </div>
                  </div>
                )}
                {summaryData.errors.length === 0 && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px',
                      backgroundColor: '#f6ffed',
                      borderRadius: '4px',
                      border: '1px solid #b7eb8f',
                    }}
                  >
                    <Text type='success' strong>
                      ✓ Todos los productos se cargaron correctamente
                    </Text>
                  </div>
                )}
              </div>
            </Space>
          )}
        </Modal>

        {/* Modal Informativo de Plantilla */}
        <TemplateInfoModal
          visible={templateInfoModalVisible}
          onClose={() => setTemplateInfoModalVisible(false)}
        />
      </Card>
    </motion.div>
  )
}
