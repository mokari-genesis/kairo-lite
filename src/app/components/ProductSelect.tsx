import React from 'react'
import { Select } from 'antd'
import { getProducts } from '@/app/api/products'

interface ProductSelectProps {
  value?: number
  onChange?: (value: number, product: any) => void
  labelValue?: string
}

export const ProductSelect: React.FC<ProductSelectProps> = ({
  value,
  onChange,
  labelValue,
}) => {
  const [options, setOptions] = React.useState<
    { label: string; value: number; product: any }[]
  >([])

  const fetchProducts = async (search: string) => {
    try {
      const hasNumbers = /\d/.test(search)
      const filters: Record<string, any> = {}
      filters.estado = 'activo'

      if (hasNumbers) {
        filters.codigo = search
      } else {
        filters.descripcion = search
      }

      const products = await getProducts(filters)

      const formattedOptions = products.map(product => ({
        label: `${product.codigo} - ${product.descripcion}`,
        value: Number(product.id),
        product: product,
      }))
      setOptions(formattedOptions)
    } catch (error) {
      console.error('Error fetching products:', error)
      setOptions([])
    }
  }

  const handleSearch = (value: string) => {
    if (value) {
      fetchProducts(value)
    } else {
      setOptions([])
    }
  }

  const handleChange = (selectedValue: number, option: any) => {
    if (onChange && option) {
      onChange(selectedValue, option.product)
    }
  }

  return (
    <Select
      style={{ width: '100%' }}
      value={value}
      onChange={handleChange}
      options={options}
      placeholder='Busque un producto por descripción o código'
      showSearch
      onSearch={handleSearch}
      filterOption={false}
      notFoundContent={null}
      loading={false}
      optionLabelProp='label'
      //labelInValue={true}
      labelRender={label => labelValue}
    />
  )
}
