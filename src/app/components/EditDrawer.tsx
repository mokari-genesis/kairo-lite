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
import { SupplierSelect } from './SupplierSelect'
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

// Helper function to normalize values for comparison
const normalizeValue = (value: any): boolean | string | number => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') {
    // Convert 1/0 to boolean for comparison with boolean options
    if (value === 1) return true
    if (value === 0) return false
    return value
  }
  if (typeof value === 'string') {
    if (value === 'true' || value === '1') return true
    if (value === 'false' || value === '0') return false
    return value
  }
  return value
}

interface EditDrawerProps {
  showView?: boolean
  visible: boolean
  onClose: () => void
  data: any
  onSave: (values: any) => Promise<void>
  fields: {
    key: string
    label: string
    type: 'text' | 'select' | 'date' | 'supplier' | 'action'
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
  const [selectedSupplierId, setSelectedSupplierId] = useState<
    number | undefined
  >(undefined)

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
        if (field.type === 'supplier' && initialValues[field.key]) {
          // Set the selected supplier ID for supplier fields
          setSelectedSupplierId(initialValues[field.key])
        }
        if (
          field.type === 'select' &&
          field.options &&
          initialValues[field.key] !== undefined
        ) {
          // Convert the value to match the options format
          const currentValue = initialValues[field.key]
          const matchingOption = field.options.find(option => {
            // Normalize values for comparison
            const normalizedCurrent = normalizeValue(currentValue)
            const normalizedOption = normalizeValue(option.value)
            return normalizedCurrent === normalizedOption
          })

          if (matchingOption) {
            initialValues[field.key] = matchingOption.value
          }
        }
      })
      form.setFieldsValue(initialValues)
    }
  }, [visible, data, form, fields])

  const handleClose = () => {
    form.resetFields()
    setSelectedSupplierId(undefined)
    onClose()
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      // Add supplier_id to values if a supplier is selected
      if (selectedSupplierId) {
        values.proveedor_id = selectedSupplierId
      }
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
      case 'supplier':
        return (
          <SupplierSelect
            value={selectedSupplierId}
            onChange={(value, supplier) => {
              setSelectedSupplierId(value)
              form.setFieldValue(field.key, value)
            }}
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
            borderRadius: borderRadiusLG,
            backgroundColor: colorBgContainer,
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
