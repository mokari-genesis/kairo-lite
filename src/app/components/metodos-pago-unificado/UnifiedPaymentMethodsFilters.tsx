'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  Button,
  Space,
  Row,
  Col,
  Collapse,
  InputNumber,
} from 'antd'
import {
  FilterOutlined,
  ClearOutlined,
  SearchOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { RangePickerProps } from 'antd/es/date-picker'
import dayjs from 'dayjs'
import { MetodosPagoUnificadoFilters } from '../../api/metodos-pago-unificado'
import { getClients } from '../../api/clients'
import { getMetodosPago } from '../../api/metodos-pago'
import { getMonedas } from '../../api/monedas'

const { RangePicker } = DatePicker
const { Option } = Select

interface UnifiedPaymentMethodsFiltersProps {
  onFiltersChange: (filters: MetodosPagoUnificadoFilters) => void
  loading?: boolean
  initialFilters?: Partial<MetodosPagoUnificadoFilters>
}

interface SelectOption {
  value: string | number
  label: string
}

export const UnifiedPaymentMethodsFilters: React.FC<
  UnifiedPaymentMethodsFiltersProps
> = ({ onFiltersChange, loading = false, initialFilters = {} }) => {
  const [form] = Form.useForm()
  const [clients, setClients] = useState<SelectOption[]>([])
  const [paymentMethods, setPaymentMethods] = useState<SelectOption[]>([])
  const [currencies, setCurrencies] = useState<SelectOption[]>([])
  const [filtersVisible, setFiltersVisible] = useState(false)

  // Load initial data for select options
  useEffect(() => {
    const loadSelectOptions = async () => {
      try {
        const [clientsData, paymentMethodsData, currenciesData] =
          await Promise.all([
            getClients({ limit: 1000 }),
            getMetodosPago(),
            getMonedas(),
          ])

        setClients(
          clientsData.map(client => ({
            value: client.id,
            label: `${client.nombre} - ${client.telefono || 'Sin teléfono'}`,
          }))
        )

        setPaymentMethods(
          paymentMethodsData.map(method => ({
            value: method.id,
            label: method.nombre,
          }))
        )

        setCurrencies(
          currenciesData.map(currency => ({
            value: currency.id,
            label: `${currency.nombre} (${currency.simbolo})`,
          }))
        )
      } catch (error) {
        console.error('Error loading select options:', error)
      }
    }

    loadSelectOptions()
  }, [])

  // Set initial form values
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      const formValues: any = { ...initialFilters }

      // Convert date strings to dayjs objects for date pickers
      if (initialFilters.fecha_venta_inicio && initialFilters.fecha_venta_fin) {
        formValues.fecha_venta = [
          dayjs(initialFilters.fecha_venta_inicio),
          dayjs(initialFilters.fecha_venta_fin),
        ]
      }

      form.setFieldsValue(formValues)
    }
  }, [initialFilters, form])

  const handleFormChange = useCallback(() => {
    const values = form.getFieldsValue()

    // Convert dayjs objects back to date strings
    const filters: MetodosPagoUnificadoFilters = {
      empresa_id: 1, // Default empresa_id
      venta_id: values.venta_id,
      cliente_id: values.cliente_id,
      usuario_id: values.usuario_id,
      metodo_pago_id: values.metodo_pago_id,
      moneda_id: values.moneda_id,
      estado_venta: values.estado_venta,
      limit: 100, // Fixed limit since we removed the limit filter
      offset: 0,
    }

    // Handle date ranges
    if (values.fecha_venta && values.fecha_venta.length === 2) {
      filters.fecha_venta_inicio = values.fecha_venta[0].format('YYYY-MM-DD')
      filters.fecha_venta_fin = values.fecha_venta[1].format('YYYY-MM-DD')
    }

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof MetodosPagoUnificadoFilters] === undefined) {
        delete filters[key as keyof MetodosPagoUnificadoFilters]
      }
    })

    onFiltersChange(filters)
  }, [form, onFiltersChange])

  const handleClearFilters = () => {
    form.resetFields()
    onFiltersChange({ empresa_id: 1 })
  }

  const disabledDate: RangePickerProps['disabledDate'] = current => {
    return current && current > dayjs().endOf('day')
  }

  return (
    <Card
      size='small'
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <FilterOutlined />
          Filtros Avanzados
          <Button
            type='link'
            size='small'
            onClick={() => setFiltersVisible(!filtersVisible)}
          >
            {filtersVisible ? 'Ocultar' : 'Mostrar'}
          </Button>
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<SearchOutlined />}
            type='primary'
            onClick={handleFormChange}
            loading={loading}
          >
            Buscar
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
            Limpiar
          </Button>
        </Space>
      }
    >
      <Collapse
        activeKey={filtersVisible ? ['filters'] : []}
        onChange={keys => setFiltersVisible(keys.includes('filters'))}
        items={[
          {
            key: 'filters',
            label: 'Filtros de Búsqueda',
            children: (
              <Form
                form={form}
                layout='vertical'
                onValuesChange={handleFormChange}
                initialValues={{
                  empresa_id: 1,
                }}
              >
                <Row gutter={[16, 16]}>
                  {/* Basic Filters */}
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item label='ID de Venta' name='venta_id'>
                      <InputNumber
                        placeholder='ID de venta'
                        style={{ width: '100%' }}
                        min={1}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item label='Cliente' name='cliente_id'>
                      <Select
                        placeholder='Seleccionar cliente'
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? '')
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        options={clients}
                        allowClear
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item label='Método de Pago' name='metodo_pago_id'>
                      <Select
                        placeholder='Seleccionar método'
                        options={paymentMethods}
                        allowClear
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item label='Moneda' name='moneda_id'>
                      <Select
                        placeholder='Seleccionar moneda'
                        options={currencies}
                        allowClear
                      />
                    </Form.Item>
                  </Col>

                  {/* Status Filters */}
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item label='Estado de Venta' name='estado_venta'>
                      <Select placeholder='Estado de venta' allowClear>
                        <Option value='pendiente'>Pendiente</Option>
                        <Option value='completada'>Completada</Option>
                        <Option value='cancelada'>Cancelada</Option>
                        <Option value='en_proceso'>En Proceso</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item label='ID de Usuario' name='usuario_id'>
                      <InputNumber
                        placeholder='ID de usuario'
                        style={{ width: '100%' }}
                        min={1}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Date Filters */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={12} lg={8}>
                    <Form.Item
                      label='Rango de Fecha de Venta'
                      name='fecha_venta'
                    >
                      <RangePicker
                        style={{ width: '100%' }}
                        format='YYYY-MM-DD'
                        placeholder={['Fecha inicio', 'Fecha fin']}
                        disabledDate={disabledDate}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Quick Filter Buttons */}
                <Row gutter={[8, 8]}>
                  <Col>
                    <Button
                      size='small'
                      onClick={() => {
                        form.setFieldsValue({
                          fecha_venta: [dayjs().subtract(30, 'day'), dayjs()],
                        })
                        handleFormChange()
                      }}
                    >
                      Últimos 30 días
                    </Button>
                  </Col>
                  <Col>
                    <Button
                      size='small'
                      onClick={() => {
                        form.setFieldsValue({
                          fecha_venta: [
                            dayjs().startOf('month'),
                            dayjs().endOf('month'),
                          ],
                        })
                        handleFormChange()
                      }}
                    >
                      Mes Actual
                    </Button>
                  </Col>
                </Row>
              </Form>
            ),
          },
        ]}
      />
    </Card>
  )
}
