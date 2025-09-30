import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  Space,
  message,
  Typography,
  Card,
  Row,
  Col,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  getProductosPreciosByProduct,
  createProductoPrecio,
  updateProductoPrecio,
  deleteProductoPrecio,
  ProductoPrecio,
  CreateProductoPrecioRequest,
  UpdateProductoPrecioRequest,
} from '@/app/api/productos-precios'
import { updateProduct } from '@/app/api/products'

const { Title } = Typography

interface ProductoPreciosManagerProps {
  productoId: number
  productoDescripcion: string
  productoData?: any // Datos completos del producto para actualización
  onClose?: () => void
  onProductUpdate?: (updatedProduct: any) => void // Callback para notificar actualización
}

const tiposPrecio = [
  { value: 'mayorista', label: 'Mayorista' },
  { value: 'minorista', label: 'Minorista' },
  { value: 'distribuidores', label: 'Distribuidores' },
  { value: 'especial', label: 'Especial' },
]

export const ProductoPreciosManager: React.FC<ProductoPreciosManagerProps> = ({
  productoId,
  productoDescripcion,
  productoData,
  onClose,
  onProductUpdate,
}) => {
  const [precios, setPrecios] = useState<ProductoPrecio[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPrecio, setEditingPrecio] = useState<ProductoPrecio | null>(
    null
  )
  const [form] = Form.useForm()

  const fetchPrecios = async () => {
    try {
      setLoading(true)
      const result = await getProductosPreciosByProduct(productoId)
      setPrecios(result)
    } catch (error) {
      message.error('Error al cargar los precios del producto')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (productoId) {
      fetchPrecios()
    }
  }, [productoId])

  const handleCreate = () => {
    setEditingPrecio(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (precio: ProductoPrecio) => {
    setEditingPrecio(precio)
    form.setFieldsValue({
      tipo: precio.tipo,
      precio: precio.precio,
    })
    setModalVisible(true)
  }

  const handleDelete = async (precio: ProductoPrecio) => {
    try {
      await deleteProductoPrecio(precio.id)
      message.success('Precio eliminado exitosamente')
      fetchPrecios()
    } catch (error) {
      message.error('Error al eliminar el precio')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingPrecio) {
        // Update existing price
        const updateData: UpdateProductoPrecioRequest = {
          id: editingPrecio.id,
          producto_id: productoId,
          tipo: values.tipo,
          precio: values.precio,
        }
        await updateProductoPrecio(updateData)

        // Si es precio sugerido, actualizar también el precio del producto
        if (values.tipo === 'sugerido' && productoData && onProductUpdate) {
          try {
            const updatedProductData = {
              ...productoData,
              precio: values.precio,
            }
            await updateProduct({
              product_id: parseInt(productoData.id),
              empresa_id: 1,
              codigo: productoData.codigo,
              serie: productoData.serie,
              descripcion: productoData.descripcion,
              categoria: productoData.categoria,
              estado: productoData.estado,
              stock: productoData.stock,
              precio: values.precio,
              proveedor_id: productoData.proveedor_id,
            })
            onProductUpdate(updatedProductData)
            message.success(
              'Precio sugerido actualizado exitosamente. El precio del producto también se ha actualizado.'
            )
          } catch (productError) {
            console.error('Error updating product price:', productError)
            message.success('Precio actualizado exitosamente')
          }
        } else {
          message.success('Precio actualizado exitosamente')
        }
      } else {
        // Check if price type already exists
        const existingPrice = precios.find(p => p.tipo === values.tipo)
        if (existingPrice) {
          message.error('Ya existe un precio para este tipo')
          return
        }

        // Create new price
        const createData: CreateProductoPrecioRequest = {
          producto_id: productoId,
          tipo: values.tipo,
          precio: values.precio,
        }
        await createProductoPrecio(createData)
        message.success('Precio creado exitosamente')
      }

      setModalVisible(false)
      form.resetFields()
      fetchPrecios()
    } catch (error) {
      message.error('Error al guardar el precio')
    }
  }

  const columns = [
    {
      title: 'Tipo de Precio',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo: string) => {
        const tipoInfo = tiposPrecio.find(t => t.value === tipo)
        return tipoInfo?.label || tipo
      },
    },
    {
      title: 'Precio',
      dataIndex: 'precio',
      key: 'precio',
      render: (precio: number | string | null | undefined) => {
        const numPrecio =
          typeof precio === 'string' ? parseFloat(precio) : precio
        return numPrecio && !isNaN(numPrecio)
          ? `Bs.${numPrecio.toFixed(2)}`
          : 'Bs.0.00'
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: any, record: ProductoPrecio) => (
        <Space>
          <Button
            type='text'
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          {record.tipo !== 'sugerido' && (
            <Button
              type='text'
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card>
      <Row
        justify='space-between'
        align='middle'
        style={{ marginBottom: '16px' }}
      >
        <Col>
          <Title level={4}>Precios para: {productoDescripcion}</Title>
        </Col>
        <Col>
          <Space>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Agregar Precio
            </Button>
            {onClose && <Button onClick={onClose}>Cerrar</Button>}
          </Space>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={precios}
        loading={loading}
        rowKey='id'
        pagination={false}
        size='small'
      />

      <Modal
        title={editingPrecio ? 'Editar Precio' : 'Nuevo Precio'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        footer={null}
      >
        <Form form={form} layout='vertical' onFinish={handleSubmit}>
          <Form.Item
            name='tipo'
            label='Tipo de Precio'
            rules={[
              { required: true, message: 'Seleccione el tipo de precio' },
            ]}
          >
            <Select
              options={tiposPrecio}
              disabled={!!editingPrecio} // Don't allow changing type when editing
            />
          </Form.Item>

          <Form.Item
            name='precio'
            label='Precio'
            rules={[
              { required: true, message: 'Ingrese el precio' },
              {
                type: 'number',
                min: 0,
                message: 'El precio debe ser mayor a 0',
              },
            ]}
          >
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: '100%' }}
              formatter={value =>
                `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
              parser={value =>
                (parseFloat(value!.replace(/\$\s?|(,*)/g, '')) || 0) as any
              }
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancelar</Button>
              <Button type='primary' htmlType='submit'>
                {editingPrecio ? 'Actualizar' : 'Crear'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
