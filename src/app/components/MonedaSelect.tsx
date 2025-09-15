import React from 'react'
import { Select } from 'antd'
import { getMonedas } from '@/app/api/monedas'

interface MonedaSelectProps {
  value?: number
  onChange?: (value: number, moneda: any) => void
  labelValue?: string
  placeholder?: string
  allowClear?: boolean
}

export const MonedaSelect: React.FC<MonedaSelectProps> = ({
  value,
  onChange,
  labelValue,
  placeholder = 'Seleccionar moneda',
  allowClear = true,
}) => {
  const [options, setOptions] = React.useState<
    { label: string; value: number; moneda: any }[]
  >([])

  const fetchMonedas = async (search?: string) => {
    try {
      const filters: Record<string, any> = { activo: 1 }

      if (search) {
        filters.nombre = search
      }

      const monedas = await getMonedas(filters)

      const formattedOptions = monedas.map(moneda => ({
        label: `${moneda.codigo} - ${moneda.nombre} ${
          moneda.simbolo ? `(${moneda.simbolo})` : ''
        }`,
        value: moneda.id,
        moneda: moneda,
      }))
      setOptions(formattedOptions)
    } catch (error) {
      console.error('Error fetching currencies:', error)
      setOptions([])
    }
  }

  React.useEffect(() => {
    fetchMonedas()
  }, [])

  // Find the current option to display the correct label
  const currentOption = options.find(option => option.value === value)

  const handleSearch = (value: string) => {
    if (value) {
      fetchMonedas(value)
    } else {
      fetchMonedas()
    }
  }

  const handleChange = (selectedValue: number, option: any) => {
    if (onChange && option) {
      onChange(selectedValue, option.moneda)
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
      getPopupContainer={trigger => trigger.parentElement}
    />
  )
}
