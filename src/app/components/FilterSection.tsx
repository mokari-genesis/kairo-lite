'use client'

import React, { useState, useCallback } from 'react'
import { Input, DatePicker, Select } from 'antd'

const { RangePicker } = DatePicker

interface SelectOption {
  value: string
  label: string
}

export interface FilterConfig {
  type: 'text' | 'dateRange' | 'select'
  key: string
  placeholder?: string
  options?: SelectOption[]
  width?: string | number
}

interface FilterSectionProps {
  filters: FilterConfig[]
  onFilterChange?: (filters: Record<string, any>) => void
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  filters: filterConfigs,
  onFilterChange,
}) => {
  const [filters, setFilters] = useState<Record<string, any>>(() => {
    const initialState: Record<string, any> = {}
    filterConfigs.forEach(filter => {
      initialState[filter.key] = filter.type === 'dateRange' ? null : ''
    })
    return initialState
  })

  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return (...args: any) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  const updateFilters = useCallback(
    (newFilters: typeof filters) => {
      setFilters(newFilters)
      onFilterChange?.(newFilters)
    },
    [onFilterChange]
  )

  const debouncedUpdate = useCallback(debounce(updateFilters, 1000), [
    updateFilters,
  ])

  const handleChange = (key: string, value: any, immediate = false) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    if (immediate) {
      onFilterChange?.(newFilters)
    } else {
      debouncedUpdate(newFilters)
    }
  }

  const handleChangeDateRange = (
    value1: any,
    value2: any,
    immediate = false
  ) => {
    const newFilters = {
      ...filters,
      fecha_inicio: value1,
      fecha_fin: value2,
    }
    setFilters(newFilters)
    if (immediate) {
      onFilterChange?.(newFilters)
    } else {
      debouncedUpdate(newFilters)
    }
  }

  const renderFilter = (filter: FilterConfig) => {
    const commonStyle = {
      borderRadius: '10px',
      width: filter.width || '25%',
    }

    switch (filter.type) {
      case 'text':
        return (
          <Input
            key={filter.key}
            placeholder={filter.placeholder}
            style={commonStyle}
            onChange={e => handleChange(filter.key, e.target.value)}
            value={filters[filter.key]}
            allowClear
          />
        )
      case 'dateRange':
        return (
          <RangePicker
            key={filter.key}
            style={commonStyle}
            onChange={(_, dateStrings) =>
              handleChangeDateRange(dateStrings[0], dateStrings[1], true)
            }
            format='YYYY-MM-DD'
            placeholder={['Inicio', 'Fin']}
          />
        )
      case 'select':
        return (
          <Select
            allowClear
            key={filter.key}
            placeholder={filter.placeholder}
            style={commonStyle}
            onChange={value => handleChange(filter.key, value, true)}
            value={filters[filter.key] || undefined}
            options={filter.options}
          />
        )
      default:
        return null
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '20px',
        gap: '16px',
      }}
    >
      {filterConfigs.map(filter => renderFilter(filter))}
    </div>
  )
}
