import React, { forwardRef } from 'react'
import { Select } from 'antd'
import { getMonedas } from '@/app/api/monedas'

interface MonedaSelectProps {
  value?: number
  onChange?: (value: number, moneda: any) => void
  labelValue?: string
  placeholder?: string
  allowClear?: boolean
  disabled?: boolean
  dropdownStyle?: React.CSSProperties
}

export const MonedaSelect = forwardRef<any, MonedaSelectProps>(
  (
    {
      value,
      onChange,
      labelValue,
      placeholder = 'Seleccionar moneda',
      allowClear = true,
      disabled = false,
      dropdownStyle,
    },
    ref
  ) => {
    const [options, setOptions] = React.useState<
      { label: string; value: number; moneda: any }[]
    >([])

    const fetchMonedas = async (search?: string) => {
      try {
        const filters: Record<string, any> = { activo: 1 }

        // Solo agregar filtro de nombre si hay búsqueda
        if (search && search.trim()) {
          filters.nombre = search.trim()
        }

        console.log('Fetching currencies with filters:', filters)
        const monedas = await getMonedas(filters)
        console.log('Received currencies:', monedas)

        const formattedOptions = monedas.map(moneda => ({
          label: `${moneda.codigo} - ${moneda.nombre} ${
            moneda.simbolo ? `(${moneda.simbolo})` : ''
          }`,
          value: moneda.id,
          moneda: moneda,
        }))
        console.log('Formatted currency options:', formattedOptions)
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
      // Si hay texto de búsqueda, buscar por nombre
      // Si no hay texto, mostrar todas las monedas activas
      fetchMonedas(value || undefined)
    }

    const handleChange = (selectedValue: number, option: any) => {
      console.log('MonedaSelect handleChange:', { selectedValue, option })
      if (onChange) {
        // Buscar la moneda completa en las opciones
        const monedaCompleta = options.find(
          opt => opt.value === selectedValue
        )?.moneda
        console.log('Moneda completa encontrada:', monedaCompleta)
        onChange(selectedValue, monedaCompleta)
      }
    }

    return (
      <Select
        ref={ref}
        style={{ width: '100%' }}
        value={value}
        onChange={(selectedValue, option) => {
          console.log('Select onChange directo Moneda:', {
            selectedValue,
            option,
          })
          handleChange(selectedValue, option)
        }}
        options={options}
        placeholder={placeholder}
        showSearch
        onSearch={handleSearch}
        filterOption={false}
        notFoundContent={null}
        loading={false}
        allowClear={allowClear}
        disabled={disabled}
        getPopupContainer={trigger => document.body}
        dropdownStyle={{
          zIndex: 9999,
          maxHeight: '300px',
          ...dropdownStyle,
        }}
        popupMatchSelectWidth={false}
        dropdownAlign={{ offset: [0, 4] }}
      />
    )
  }
)
