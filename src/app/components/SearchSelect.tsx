'use client'
import { Select, Spin, message } from 'antd'
import { useState, useRef, useEffect } from 'react'

interface SearchSelectProps {
  value?: any
  onChange?: (value: any) => void
  onSelect?: (value: any, option: any) => void
  placeholder?: string
  fetchOptions: (search: string) => Promise<any[]>
  optionLabelProp?: string
  optionValueProp?: string
  optionSelectedProp?: string
  objectSelected?: any
  labelFormatter?: (item: any) => string
  form?: any
  name?: string
  rules?: any[]
  label?: string
  disabled?: boolean
}

export const SearchSelect = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Buscar...',
  fetchOptions,
  optionLabelProp = 'label',
  optionValueProp = 'value',
  optionSelectedProp = 'details',
  labelFormatter = item => `${item.descripcion} (${item.codigo})`,
  form,
  name,
  rules,
  label,
  disabled = false,
}: SearchSelectProps) => {
  const [options, setOptions] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleSearch = async (value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        if (!value) {
          setOptions([])
          setHasSearched(false)
          return
        }

        setIsSearching(true)
        const data = await fetchOptions(value)
        setOptions(data)
        setHasSearched(true)
      } catch (error) {
        message.error('Error al buscar opciones')
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }

  const handleChange = (value: any) => {
    if (onChange) {
      onChange(value)
    }
  }

  const selectOptions = options.map(item => ({
    [optionValueProp]: item.id,
    [optionLabelProp]: labelFormatter(item),
    [optionSelectedProp]: item,
  }))

  return (
    <Select
      onSelect={onSelect}
      value={value}
      onChange={handleChange}
      options={selectOptions}
      showSearch
      onSearch={handleSearch}
      filterOption={false}
      placeholder={placeholder}
      loading={isSearching}
      disabled={disabled}
      notFoundContent={
        isSearching ? (
          <Spin size='small' />
        ) : hasSearched ? (
          'No se encontraron resultados'
        ) : (
          'Escriba para buscar'
        )
      }
    />
  )
}
