import React from 'react'
import { Select } from 'antd'
import { getMetodosPago } from '@/app/api/metodos-pago'

interface MetodoPagoSelectProps {
  value?: number
  onChange?: (value: number, metodoPago: any) => void
  labelValue?: string
  placeholder?: string
  allowClear?: boolean
  disabled?: boolean
}

export const MetodoPagoSelect: React.FC<MetodoPagoSelectProps> = ({
  value,
  onChange,
  labelValue,
  placeholder = 'Seleccionar método de pago',
  allowClear = true,
  disabled = false,
}) => {
  const [options, setOptions] = React.useState<
    { label: string; value: number; metodoPago: any }[]
  >([])

  const fetchMetodosPago = async (search?: string) => {
    try {
      const filters: Record<string, any> = { activo: 1 }

      if (search) {
        filters.nombre = search
      }

      const metodosPago = await getMetodosPago(filters)

      const formattedOptions = metodosPago.map(metodo => ({
        label: metodo.nombre,
        value: metodo.id,
        metodoPago: metodo,
      }))
      setOptions(formattedOptions)
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      setOptions([])
    }
  }

  React.useEffect(() => {
    fetchMetodosPago()
  }, [])

  // Find the current option to display the correct label
  const currentOption = options.find(option => option.value === value)

  const handleSearch = (value: string) => {
    if (value) {
      fetchMetodosPago(value)
    } else {
      fetchMetodosPago()
    }
  }

  const handleChange = (selectedValue: number, option: any) => {
    if (onChange && option) {
      onChange(selectedValue, option.metodoPago)
    }
  }

  return (
    <Select
      style={{ width: '100%' }}
      value={value}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      showSearch
      onSearch={handleSearch}
      filterOption={false}
      notFoundContent={null}
      loading={false}
      allowClear={allowClear}
      disabled={disabled}
      getPopupContainer={trigger => trigger.parentElement}
    />
  )
}
