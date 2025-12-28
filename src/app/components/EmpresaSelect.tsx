import React from 'react'
import { Select } from 'antd'
import { getEnterprises, EnterpriseType } from '@/app/api/enterprise'

interface EmpresaSelectProps {
  value?: number
  onChange?: (value: number, empresa: EnterpriseType | null) => void
  labelValue?: string
  excludeId?: number // ID de empresa a excluir (útil para evitar seleccionar la misma empresa)
  placeholder?: string
  disabled?: boolean // Deshabilitar el selector
}

export const EmpresaSelect: React.FC<EmpresaSelectProps> = ({
  value,
  onChange,
  labelValue,
  excludeId,
  placeholder = 'Busque una sucursal por nombre',
  disabled = false,
}) => {
  const [options, setOptions] = React.useState<
    { label: string; value: number; empresa: EnterpriseType }[]
  >([])
  const [loading, setLoading] = React.useState(false)

  const fetchEmpresas = async (search: string) => {
    try {
      setLoading(true)
      const filters: Record<string, any> = {}

      if (search) {
        filters.nombre = search
      }

      const empresas = await getEnterprises(filters)

      // Filtrar la empresa excluida si existe
      const empresasFiltradas = excludeId
        ? empresas.filter(emp => emp.id !== excludeId)
        : empresas

      const formattedOptions = empresasFiltradas.map(empresa => ({
        label: empresa.nombre,
        value: Number(empresa.id),
        empresa: empresa,
      }))
      setOptions(formattedOptions)
    } catch (error) {
      console.error('Error fetching empresas:', error)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    if (value) {
      fetchEmpresas(value)
    } else {
      // Si no hay búsqueda, cargar todas las empresas
      fetchEmpresas('')
    }
  }

  const handleChange = (selectedValue: number, option: any) => {
    if (onChange) {
      const empresa = option?.empresa || null
      onChange(selectedValue, empresa)
    }
  }

  // Cargar empresas al montar el componente
  React.useEffect(() => {
    fetchEmpresas('')
  }, [excludeId])

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
      notFoundContent={loading ? 'Cargando...' : 'No se encontraron sucursales'}
      loading={loading}
      optionLabelProp='label'
      disabled={disabled}
      labelRender={label => {
        if (labelValue) return labelValue
        if (typeof label === 'string') return label
        if (label && typeof label === 'object' && 'label' in label) {
          return label.label as string
        }
        return ''
      }}
    />
  )
}
