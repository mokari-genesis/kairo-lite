import React, { forwardRef } from 'react'
import { Select } from 'antd'
import { getMetodosPago } from '@/app/api/metodos-pago'

interface MetodoPagoSelectProps {
  value?: number
  onChange?: (value: number, metodoPago: any) => void
  labelValue?: string
  placeholder?: string
  allowClear?: boolean
  disabled?: boolean
  dropdownStyle?: React.CSSProperties
}

export const MetodoPagoSelect = forwardRef<any, MetodoPagoSelectProps>(
  (
    {
      value,
      onChange,
      labelValue,
      placeholder = 'Seleccionar método de pago',
      allowClear = true,
      disabled = false,
      dropdownStyle,
    },
    ref
  ) => {
    const [options, setOptions] = React.useState<
      { label: string; value: number; metodoPago: any }[]
    >([])

    const fetchMetodosPago = async (search?: string) => {
      try {
        const filters: Record<string, any> = { activo: 1 }

        // Solo agregar filtro de nombre si hay búsqueda
        if (search && search.trim()) {
          filters.nombre = search.trim()
        }

        console.log('Fetching payment methods with filters:', filters)
        const metodosPago = await getMetodosPago(filters)
        console.log('Received payment methods:', metodosPago)

        const formattedOptions = metodosPago.map(metodo => ({
          label: metodo.nombre,
          value: metodo.id,
          metodoPago: metodo,
        }))
        console.log('Formatted options:', formattedOptions)
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
      // Si hay texto de búsqueda, buscar por nombre
      // Si no hay texto, mostrar todos los métodos activos
      fetchMetodosPago(value || undefined)
    }

    const handleChange = (selectedValue: number, option: any) => {
      console.log('MetodoPagoSelect handleChange:', { selectedValue, option })
      if (onChange) {
        // Buscar el método de pago completo en las opciones
        const metodoCompleto = options.find(
          opt => opt.value === selectedValue
        )?.metodoPago
        console.log('Método completo encontrado:', metodoCompleto)
        onChange(selectedValue, metodoCompleto)
      }
    }

    return (
      <Select
        ref={ref}
        style={{ width: '100%' }}
        value={value}
        onChange={(selectedValue, option) => {
          console.log('Select onChange directo:', { selectedValue, option })
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
