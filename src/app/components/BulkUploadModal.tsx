'use client'
import { useState } from 'react'
import {
  Modal,
  Button,
  Space,
  Typography,
  Divider,
  Upload,
  message,
} from 'antd'
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import * as XLSX from 'xlsx'
import { getSuppliers } from '@/app/api/supplier'
import { createProduct } from '@/app/api/products'
import { createProductoPrecio } from '@/app/api/productos-precios'
import { queryClient, QueryKey } from '@/app/utils/query'

const { Dragger } = Upload
const { Title, Paragraph, Text } = Typography

interface BulkUploadModalProps {
  visible: boolean
  onClose: () => void
  empresaId: number | null
  usuarioId: number | null
  categories: Array<{ value: string; label: string }>
  estados: Array<{ value: string; label: string }>
  onTemplateDownloaded: () => void
  onProcessComplete: (data: {
    successCount: number
    totalRows: number
    errors: string[]
  }) => void
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  visible,
  onClose,
  empresaId,
  usuarioId,
  categories,
  estados,
  onTemplateDownloaded,
  onProcessComplete,
}) => {
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  // Función para descargar la plantilla Excel
  const downloadTemplate = async () => {
    try {
      // Obtener lista de proveedores para incluir en la plantilla
      const suppliers = await getSuppliers({}, undefined)

      // Crear datos de ejemplo para la plantilla
      const templateData = [
        {
          Código: 'PROD001',
          Serie: 'SER001',
          Descripción: 'Ejemplo de producto',
          Categoría: 'juguete',
          'NIT Proveedor': suppliers.length > 0 ? suppliers[0].nit : '',
          Estado: 'activo',
          'Precio Sugerido': '0.00',
        },
        {
          Código: 'PROD002',
          Serie: 'SER002',
          Descripción: 'Otro ejemplo de producto',
          Categoría: 'ropa',
          'NIT Proveedor': suppliers.length > 1 ? suppliers[1].nit : '',
          Estado: 'activo',
          'Precio Sugerido': '0.00',
        },
      ]

      // Crear libro de Excel
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(templateData)

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 15 }, // Código
        { wch: 15 }, // Serie
        { wch: 30 }, // Descripción
        { wch: 20 }, // Categoría
        { wch: 20 }, // NIT Proveedor
        { wch: 12 }, // Estado
        { wch: 18 }, // Precio Sugerido
      ]
      ws['!cols'] = colWidths

      // Crear hoja de referencia con categorías y estados
      const referenceData: (string | undefined)[][] = [
        ['REFERENCIA: Categorías y Estados Permitidos'],
        [
          'IMPORTANTE: Use EXACTAMENTE estos valores (en minúsculas) en las columnas Categoría y Estado de la hoja Productos',
        ],
        [''], // Fila vacía
        ['Categorías Permitidas', 'Estados Permitidos'], // Encabezados
      ]

      // Determinar el número máximo de filas para alinear las columnas
      const maxRows = Math.max(categories.length, estados.length)

      // Agregar categorías y estados en filas paralelas
      for (let i = 0; i < maxRows; i++) {
        const categoria = i < categories.length ? categories[i].value : ''
        const estado = i < estados.length ? estados[i].value : ''
        referenceData.push([categoria, estado])
      }

      const wsRef = XLSX.utils.aoa_to_sheet(referenceData)

      // Aplicar formato en negrita a títulos y encabezados
      const boldStyle = {
        font: { bold: true },
      }

      // Título (fila 1, columna A - A1)
      if (wsRef['A1']) {
        wsRef['A1'].s = boldStyle
      }

      // Encabezados (fila 4, columnas A y B - A4 y B4)
      if (wsRef['A4']) {
        wsRef['A4'].s = boldStyle
      }
      if (wsRef['B4']) {
        wsRef['B4'].s = boldStyle
      }

      // Ajustar ancho de columnas
      wsRef['!cols'] = [
        { wch: 35 }, // Categorías Permitidas
        { wch: 25 }, // Estados Permitidos
      ]

      // Crear hoja de proveedores
      const suppliersData: (string | number | undefined)[][] = [
        ['REFERENCIA: Proveedores Disponibles'],
        [
          'IMPORTANTE: Use el NIT Proveedor en la hoja Productos. El NIT es un identificador único.',
        ],
        [''], // Fila vacía
        ['NIT Proveedor', 'Nombre Proveedor'], // Encabezados (Nombre solo como referencia)
      ]

      // Agregar proveedores
      suppliers.forEach(supplier => {
        suppliersData.push([supplier.nit, supplier.nombre])
      })

      const wsSuppliers = XLSX.utils.aoa_to_sheet(suppliersData)

      // Aplicar formato en negrita a títulos y encabezados de proveedores
      if (wsSuppliers['A1']) {
        wsSuppliers['A1'].s = boldStyle
      }
      if (wsSuppliers['A4']) {
        wsSuppliers['A4'].s = boldStyle
      }
      if (wsSuppliers['B4']) {
        wsSuppliers['B4'].s = boldStyle
      }

      // Ajustar ancho de columnas de proveedores
      wsSuppliers['!cols'] = [
        { wch: 20 }, // NIT Proveedor
        { wch: 30 }, // Nombre Proveedor
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Productos')
      XLSX.utils.book_append_sheet(wb, wsRef, 'Categorías y Estados')
      XLSX.utils.book_append_sheet(wb, wsSuppliers, 'Proveedores')
      XLSX.writeFile(wb, 'plantilla_productos.xlsx')
      message.success('Plantilla descargada exitosamente')

      // Llamar callback para mostrar modal informativo
      onTemplateDownloaded()
    } catch (error) {
      console.error('Error al generar plantilla:', error)
      message.error('Error al generar la plantilla')
    }
  }

  // Función para procesar el archivo Excel y crear productos
  const handleProcessFile = async () => {
    if (fileList.length === 0 || !fileList[0].originFileObj) {
      message.error('Por favor seleccione un archivo primero')
      return
    }

    const file = fileList[0].originFileObj
    try {
      if (!empresaId) {
        message.error(
          'Debe seleccionar una sucursal antes de cargar productos.'
        )
        return
      }

      setUploading(true)

      // Leer el archivo Excel
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (!jsonData || jsonData.length === 0) {
        message.error('El archivo está vacío o no tiene datos válidos')
        setUploading(false)
        return
      }

      // Obtener lista de proveedores para validar NITs
      const suppliers = await getSuppliers({}, undefined)
      const supplierMapByNit = new Map(suppliers.map(s => [s.nit, s.id]))

      // Validar y procesar cada fila
      const errors: string[] = []
      const successCount = { count: 0 }
      const totalRows = jsonData.length

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any
        const rowNumber = i + 2 // +2 porque la fila 1 es el encabezado y empezamos desde 0

        try {
          // Validar campos requeridos
          if (
            !row.Código ||
            !row.Serie ||
            !row.Descripción ||
            !row.Categoría ||
            !row.Estado
          ) {
            errors.push(
              `Fila ${rowNumber}: Faltan campos requeridos (Código, Serie, Descripción, Categoría, Estado)`
            )
            continue
          }

          // Validar categoría
          const validCategories = categories.map(c => c.value)
          if (!validCategories.includes(row.Categoría)) {
            errors.push(
              `Fila ${rowNumber}: Categoría "${
                row.Categoría
              }" no es válida. Valores permitidos: ${validCategories.join(
                ', '
              )}`
            )
            continue
          }

          // Validar estado
          const validEstados = estados.map(e => e.value)
          if (!validEstados.includes(row.Estado)) {
            errors.push(
              `Fila ${rowNumber}: Estado "${
                row.Estado
              }" no es válido. Valores permitidos: ${validEstados.join(', ')}`
            )
            continue
          }

          // Validar proveedor por NIT
          let proveedorId: number | undefined
          if (row['NIT Proveedor']) {
            const nitStr = row['NIT Proveedor'].toString().trim()
            if (supplierMapByNit.has(nitStr)) {
              proveedorId = supplierMapByNit.get(nitStr)
            } else {
              errors.push(
                `Fila ${rowNumber}: NIT de Proveedor "${nitStr}" no existe. Consulte la hoja "Proveedores" para ver los NITs disponibles.`
              )
              continue
            }
          } else {
            errors.push(
              `Fila ${rowNumber}: Debe especificar NIT Proveedor. Consulte la hoja "Proveedores" para ver los NITs disponibles.`
            )
            continue
          }

          // Validar precio
          let precio = 0
          if (row['Precio Sugerido']) {
            const precioValue = parseFloat(row['Precio Sugerido'])
            if (!isNaN(precioValue) && precioValue >= 0) {
              precio = precioValue
            } else {
              errors.push(
                `Fila ${rowNumber}: Precio Sugerido debe ser un número mayor o igual a 0`
              )
              continue
            }
          }

          // Validar que proveedorId esté definido (debería estar después de la validación anterior)
          if (!proveedorId) {
            errors.push(
              `Fila ${rowNumber}: No se pudo determinar el proveedor.`
            )
            continue
          }

          // Validar que usuarioId esté definido
          if (!usuarioId) {
            errors.push(
              `Fila ${rowNumber}: Usuario ID es requerido para crear productos.`
            )
            continue
          }

          // Crear el producto
          const productData = {
            codigo: row.Código.toString().trim(),
            serie: row.Serie.toString().trim(),
            descripcion: row.Descripción.toString().trim(),
            categoria: row.Categoría,
            estado: row.Estado,
            stock: 0, // El stock se gestiona por movimientos de inventario
            precio: precio,
            proveedor_id: proveedorId,
            usuario_id: usuarioId,
          }

          const response = await createProduct(productData, empresaId)

          // Si hay un precio sugerido, crear automáticamente el tipo de precio "sugerido"
          if (precio > 0) {
            try {
              await createProductoPrecio({
                producto_id: parseInt(response.data.id),
                tipo: 'sugerido',
                precio: precio,
              })
            } catch (priceError) {
              console.error('Error creating suggested price:', priceError)
              // Continuamos aunque falle el precio
            }
          }

          successCount.count++
        } catch (error: any) {
          errors.push(
            `Fila ${rowNumber}: ${error.message || 'Error al crear producto'}`
          )
        }
      }

      // Invalidar queries si hubo productos creados
      if (successCount.count > 0) {
        await queryClient.invalidateQueries({
          queryKey: [QueryKey.productsInfo],
        })
      }

      // Cerrar el modal de carga
      setFileList([])
      onClose()

      // Pasar resultados al componente padre
      onProcessComplete({
        successCount: successCount.count,
        totalRows: totalRows,
        errors: errors,
      })
    } catch (error: any) {
      console.error('Error al procesar archivo:', error)
      message.error(
        `Error al procesar el archivo: ${error.message || 'Error desconocido'}`
      )
    } finally {
      setUploading(false)
    }
  }

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    fileList,
    beforeUpload: (file: any) => {
      const isExcel =
        file.type ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls')
      if (!isExcel) {
        message.error('Solo se permiten archivos Excel (.xlsx, .xls)')
        return Upload.LIST_IGNORE
      }
      const uploadFile: UploadFile = {
        uid: `${Date.now()}-${file.name}`,
        name: file.name,
        status: 'done', // Archivo listo para procesar
        originFileObj: file,
      }
      setFileList([uploadFile])
      message.success('Archivo cargado. Haga clic en "Aceptar" para procesar.')
      return false // Prevenir subida automática
    },
    onRemove: () => {
      setFileList([])
      return true
    },
  }

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Carga Masiva de Productos
        </Title>
      }
      open={visible}
      onCancel={() => {
        onClose()
        setFileList([])
      }}
      footer={[
        <Button
          key='cancel'
          onClick={() => {
            onClose()
            setFileList([])
          }}
        >
          Cancelar
        </Button>,
        <Button
          key='accept'
          type='primary'
          loading={uploading}
          disabled={fileList.length === 0 || uploading}
          onClick={handleProcessFile}
        >
          Aceptar
        </Button>,
      ]}
      width={700}
    >
      <Space direction='vertical' size='large' style={{ width: '100%' }}>
        <div>
          <Title level={5}>Descargar Plantilla</Title>
          <Paragraph>
            Descarga el archivo de plantilla para ver el formato requerido y
            completar con los datos de tus productos.
          </Paragraph>
          <Button
            type='primary'
            icon={<DownloadOutlined />}
            onClick={downloadTemplate}
            block
            size='large'
          >
            Descargar Plantilla Excel
          </Button>
        </div>

        <Divider />

        <div>
          <Title level={5}>Subir Archivo</Title>
          <Paragraph>
            Selecciona el archivo Excel (.xlsx) con los productos que deseas
            cargar. El archivo debe seguir el formato de la plantilla.
          </Paragraph>
          <Text type='secondary' style={{ fontSize: '12px' }}>
            Campos requeridos: Código, Serie, Descripción, Categoría, Estado,
            NIT Proveedor. El Precio Sugerido es opcional. Consulte la hoja
            "Proveedores" para ver los NITs disponibles.
          </Text>
          <Dragger {...uploadProps} disabled={uploading}>
            <p className='ant-upload-drag-icon'>
              <InboxOutlined />
            </p>
            <p className='ant-upload-text'>
              Haz clic o arrastra el archivo aquí para subirlo
            </p>
            <p className='ant-upload-hint'>
              Solo archivos Excel (.xlsx, .xls). Después de seleccionar el
              archivo, haga clic en "Aceptar" para procesarlo.
            </p>
          </Dragger>
          {uploading && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Text type='secondary'>Procesando archivo...</Text>
            </div>
          )}
        </div>
      </Space>
    </Modal>
  )
}
