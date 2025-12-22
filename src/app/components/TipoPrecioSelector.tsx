import React from 'react'
import { Select } from 'antd'

interface TipoPrecioSelectorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  allowClear?: boolean
  disabled?: boolean
}

const tiposPrecio = [
  { value: 'sugerido', label: 'Sugerido' },
  { value: 'mayorista', label: 'Mayorista' },
  { value: 'minorista', label: 'Minorista' },
  { value: 'distribuidores', label: 'Distribuidores' },
  { value: 'especial', label: 'Especial' },
]

export const TipoPrecioSelector: React.FC<TipoPrecioSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Seleccionar tipo de precio',
  allowClear = true,
  disabled = false,
}) => {
  return (
    <Select
      style={{ width: '100%' }}
      value={value}
      onChange={onChange}
      options={tiposPrecio}
      placeholder={placeholder}
      allowClear={allowClear}
      disabled={disabled}
    />
  )
}
