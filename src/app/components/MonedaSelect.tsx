import React, { forwardRef } from 'react'
import { Select } from 'antd'
import { getMonedas } from '@/app/api/monedas'
import { obtenerMonedaBase } from '@/app/utils/currency'

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
    const [monedaBase, setMonedaBase] = React.useState<any>(null)
    const [hasAutoSelected, setHasAutoSelected] = React.useState(false)

    const fetchMonedas = async (search?: string) => {
      try {
        const filters: Record<string, any> = { activo: 1 }

        // Solo agregar filtro de nombre si hay búsqueda
        if (search && search.trim()) {
          filters.nombre = search.trim()
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
        
        // Obtener moneda base
        const base = obtenerMonedaBase(monedas)
        if (base) {
          setMonedaBase(base)
        }
      } catch (error) {
        console.error('Error fetching currencies:', error)
        setOptions([])
      }
    }

    React.useEffect(() => {
      fetchMonedas()
    }, [])

    // Auto-seleccionar moneda base cuando no hay valor y hay moneda base disponible
    React.useEffect(() => {
      if (
        !hasAutoSelected &&
        (value === undefined || value === null) &&
        monedaBase &&
        onChange &&
        options.length > 0
      ) {
        const baseOption = options.find(opt => opt.value === monedaBase.id)
        if (baseOption) {
          setHasAutoSelected(true)
          // Usar setTimeout para asegurar que el Form.Item esté listo
          setTimeout(() => {
            onChange(monedaBase.id, monedaBase)
          }, 0)
        }
      }
    }, [value, monedaBase, options, onChange, hasAutoSelected])

    // Find the current option to display the correct label
    const currentOption = options.find(option => option.value === value)

    const handleSearch = (value: string) => {
      // Si hay texto de búsqueda, buscar por nombre
      // Si no hay texto, mostrar todas las monedas activas
      fetchMonedas(value || undefined)
    }

    const handleChange = (selectedValue: number, option: any) => {
      if (onChange) {
        // Buscar la moneda completa en las opciones
        const monedaCompleta = options.find(
          opt => opt.value === selectedValue
        )?.moneda
        onChange(selectedValue, monedaCompleta)
      }
    }

    // Usar moneda base si no hay valor y hay moneda base disponible
    const displayValue = value !== undefined ? value : (monedaBase?.id || undefined)

    return (
      <Select
        ref={ref}
        style={{ width: '100%' }}
        value={displayValue}
        onChange={(selectedValue, option) => {
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
