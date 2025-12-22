'use client'
import { Modal, Button, Space, Typography, Card } from 'antd'
import {
  InfoCircleOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { motion } from 'framer-motion'

const { Text, Paragraph, Title } = Typography

interface TemplateInfoModalProps {
  visible: boolean
  onClose: () => void
}

export const TemplateInfoModal: React.FC<TemplateInfoModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      open={visible}
      footer={[
        <Button
          key='ok'
          type='primary'
          size='large'
          onClick={onClose}
          style={{
            height: '40px',
            fontSize: '15px',
            fontWeight: 'bold',
          }}
        >
          Entendido
        </Button>,
      ]}
      width={550}
      closable={false}
      maskClosable={false}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Space direction='vertical' size='middle' style={{ width: '100%' }}>
          {/* Icono animado */}
          <motion.div
            style={{ textAlign: 'center', marginBottom: '12px' }}
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            <InfoCircleOutlined
              style={{
                fontSize: '48px',
                color: '#1890ff',
                marginBottom: '12px',
              }}
            />
          </motion.div>

          <Title
            level={4}
            style={{
              textAlign: 'center',
              marginBottom: '8px',
              color: '#1890ff',
            }}
          >
            ¡Importante!
          </Title>

          <Paragraph
            style={{
              textAlign: 'center',
              fontSize: '14px',
              marginBottom: '20px',
              fontWeight: 500,
            }}
          >
            La plantilla incluye <Text strong>3 hojas</Text> que debes revisar
            antes de completar tus productos:
          </Paragraph>

          {/* Lista de hojas con animación */}
          <Space direction='vertical' size='small' style={{ width: '100%' }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card
                hoverable
                size='small'
                style={{
                  borderLeft: '4px solid #52c41a',
                  borderRadius: '6px',
                }}
              >
                <Space size='small'>
                  <FileTextOutlined
                    style={{ fontSize: '20px', color: '#52c41a' }}
                  />
                  <div>
                    <Text strong style={{ fontSize: '14px' }}>
                      Hoja "Categorías y Estados"
                    </Text>
                    <br />
                    <Text type='secondary' style={{ fontSize: '12px' }}>
                      Consulta los valores permitidos para las columnas{' '}
                      <Text strong>Categoría</Text> y <Text strong>Estado</Text>
                    </Text>
                  </div>
                </Space>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card
                hoverable
                size='small'
                style={{
                  borderLeft: '4px solid #1890ff',
                  borderRadius: '6px',
                }}
              >
                <Space size='small'>
                  <FileTextOutlined
                    style={{ fontSize: '20px', color: '#1890ff' }}
                  />
                  <div>
                    <Text strong style={{ fontSize: '14px' }}>
                      Hoja "Proveedores"
                    </Text>
                    <br />
                    <Text type='secondary' style={{ fontSize: '12px' }}>
                      Revisa la lista completa de proveedores disponibles con
                      sus nombres para usar en la columna{' '}
                      <Text strong>Nombre Proveedor</Text>
                    </Text>
                  </div>
                </Space>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card
                hoverable
                size='small'
                style={{
                  borderLeft: '4px solid #faad14',
                  borderRadius: '6px',
                }}
              >
                <Space size='small'>
                  <FileTextOutlined
                    style={{ fontSize: '20px', color: '#faad14' }}
                  />
                  <div>
                    <Text strong style={{ fontSize: '14px' }}>
                      Hoja "Productos"
                    </Text>
                    <br />
                    <Text type='secondary' style={{ fontSize: '12px' }}>
                      Completa esta hoja con los datos de tus productos usando
                      los valores de las otras hojas como referencia
                    </Text>
                  </div>
                </Space>
              </Card>
            </motion.div>
          </Space>

          {/* Mensaje final animado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#e6f7ff',
              borderRadius: '6px',
              border: '1px solid #91d5ff',
            }}
          >
            <Space size='small'>
              <CheckCircleOutlined
                style={{ fontSize: '18px', color: '#1890ff' }}
              />
              <Text strong style={{ color: '#1890ff', fontSize: '13px' }}>
                Usa EXACTAMENTE los valores mostrados en las hojas de referencia
                para evitar errores al cargar tus productos
              </Text>
            </Space>
          </motion.div>
        </Space>
      </motion.div>
    </Modal>
  )
}
