import React from 'react'
import { Select } from 'antd'
import { getSuppliers } from '@/app/api/supplier'

interface SupplierSelectProps {
  value?: number
  onChange?: (value: number, supplier: any) => void
  labelValue?: string
}

export const SupplierSelect: React.FC<SupplierSelectProps> = ({
  value,
  onChange,
  labelValue,
}) => {
  const [options, setOptions] = React.useState<
    { label: string; value: number; supplier: any }[]
  >([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchSuppliers = async (search?: string) => {
    try {
      setLoading(true)
      setError(null)

      const filters: Record<string, any> = {}

      if (search) {
        filters.nombre = search
      }

      // If no search, limit to 5 suppliers, otherwise get all matching results
      const limit = search ? undefined : 5
      const suppliers = await getSuppliers(filters, limit)

      const formattedOptions = suppliers.map(supplier => ({
        label: supplier.nombre,
        value: supplier.id,
        supplier: supplier,
      }))
      setOptions(formattedOptions)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      setError('Error al cargar los proveedores')
      setOptions([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar los primeros 5 proveedores al montar el componente
  React.useEffect(() => {
    fetchSuppliers()
  }, [])

  const handleSearch = (value: string) => {
    if (value) {
      fetchSuppliers(value)
    } else {
      // Si no hay búsqueda, mostrar los primeros 5 proveedores
      fetchSuppliers()
    }
  }

  const handleChange = (selectedValue: number, option: any) => {
    if (onChange && option) {
      onChange(selectedValue, option.supplier)
    }
  }

  return (
    <Select
      style={{ width: '100%' }}
      value={value}
      onChange={handleChange}
      options={options}
      placeholder='Busque un proveedor por nombre'
      showSearch
      onSearch={handleSearch}
      filterOption={false}
      notFoundContent={error || 'No se encontraron proveedores'}
      loading={loading}
      optionLabelProp='label'
    />
  )
}
