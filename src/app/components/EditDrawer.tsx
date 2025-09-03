'use client'

import React, { useState, useEffect } from 'react'
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Space,
  Spin,
  DatePicker,
  Card,
  theme,
} from 'antd'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

interface EditDrawerProps {
  showView?: boolean
  visible: boolean
  onClose: () => void
  data: any
  onSave: (values: any) => Promise<void>
  fields: {
    key: string
    label: string
    type: 'text' | 'select' | 'date'
    options?: { value: string; label: string }[]
    hidden?: boolean
    disabled?: boolean
  }[]
}

export const EditDrawer: React.FC<EditDrawerProps> = ({
  showView,
  visible,
  onClose,
  data,
  onSave,
  fields,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && data) {
      const initialValues = { ...data }
      fields.forEach(field => {
        if (field.type === 'date' && initialValues[field.key]) {
          // Parse the date string with the correct format
          const dateValue = dayjs(
            initialValues[field.key],
            'DD/MM/YYYY hh:mm:ss A'
          )
          if (dateValue.isValid()) {
            // Convert to local timezone
            initialValues[field.key] = dateValue.tz(dayjs.tz.guess())
          } else {
            console.warn(
              `Invalid date string for field ${field.key}:`,
              initialValues[field.key]
            )
            initialValues[field.key] = null
          }
        }
      })
      form.setFieldsValue(initialValues)
    }
  }, [visible, data, form, fields])

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      await onSave(values)
      handleClose()
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderFormItem = (field: EditDrawerProps['fields'][0]) => {
    if (field.hidden) return null

    const commonProps = {
      disabled: field.disabled,
      style: { width: '100%' },
    }

    switch (field.type) {
      case 'text':
        return <Input {...commonProps} />
      case 'select':
        return <Select {...commonProps} options={field.options} />
      case 'date':
        return (
          <DatePicker
            {...commonProps}
            showTime
            format='DD/MM/YYYY hh:mm:ss A'
          />
        )
      default:
        return null
    }
  }

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  return (
    <Drawer
      style={{ backgroundColor: '#d1d1d1' }}
      title={showView ? 'Detalle' : 'Editar Registro'}
      placement='right'
      onClose={handleClose}
      open={visible}
      width={400}
      extra={
        <Space>
          {showView && (
            <Button onClick={handleClose}>
              {showView ? 'Volver' : 'Cancelar'}
            </Button>
          )}
          {!showView && (
            <>
              <Button onClick={handleClose}>Cancelar</Button>
              <Button type='primary' onClick={handleSave} loading={loading}>
                Guardar
              </Button>
            </>
          )}
        </Space>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          variant='outlined'
          style={{
            borderRadius: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Form form={form} layout='vertical'>
            <Spin spinning={loading}>
              {fields.map(
                field =>
                  !field.hidden && (
                    <Form.Item
                      key={field.key}
                      name={field.key}
                      label={field.label}
                      rules={[
                        {
                          required: !field.disabled,
                          message: `Por favor ingrese ${field.label.toLowerCase()}`,
                        },
                      ]}
                    >
                      {renderFormItem(field)}
                    </Form.Item>
                  )
              )}
            </Spin>
          </Form>
        </Card>
      </motion.div>
    </Drawer>
  )
}
