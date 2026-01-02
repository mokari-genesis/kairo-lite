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
import { getProducts } from '@/app/api/products'
import { getMonedas } from '@/app/api/monedas'
import { createCompra, CompraItem } from '@/app/api/compras'
import { queryClient, QueryKey } from '@/app/utils/query'

const { Dragger } = Upload
const { Title, Paragraph, Text } = Typography

interface BulkUploadModalComprasProps {
  visible: boolean
  onClose: () => void
  empresaId: number | null
  usuarioId: number | null
  onTemplateDownloaded: () => void
  onProcessComplete: (data: {
    successCount: number
    totalRows: number
    errors: string[]
  }) => void
}

export const BulkUploadModalCompras: React.FC<BulkUploadModalComprasProps> = ({
  visible,
  onClose,
  empresaId,
  usuarioId,
  onTemplateDownloaded,
  onProcessComplete,
}) => {
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  // Función para descargar la plantilla Excel
  const downloadTemplate = async () => {
    try {
      if (!empresaId) {
        message.error(
          'Debe seleccionar una sucursal antes de descargar la plantilla.'
        )
        return
      }

      // Obtener listas para incluir en la plantilla
      const suppliers = await getSuppliers({}, undefined, empresaId)
      const products = await getProducts({}, empresaId)
      const monedas = await getMonedas()

      // Crear datos de ejemplo para la plantilla
      const templateData = [
        {
          'NIT Proveedor': suppliers.length > 0 ? suppliers[0].nit : '',
          Fecha: '2024-01-15',
          'Código Moneda': monedas.length > 0 ? monedas[0].codigo : 'VES',
          'Tipo Pago': 'contado',
          'Fecha Vencimiento': '',
          Comentario: 'Compra de ejemplo',
          'Código Producto': products.length > 0 ? products[0].codigo : '',
          Cantidad: '10',
          'Costo Unitario': '5.00',
        },
        {
          'NIT Proveedor': suppliers.length > 0 ? suppliers[0].nit : '',
          Fecha: '2024-01-15',
          'Código Moneda': monedas.length > 0 ? monedas[0].codigo : 'VES',
          'Tipo Pago': 'credito',
          'Fecha Vencimiento': '2024-02-15',
          Comentario: 'Segunda compra de ejemplo',
          'Código Producto': products.length > 1 ? products[1].codigo : '',
          Cantidad: '5',
          'Costo Unitario': '8.50',
        },
      ]

      // Crear libro de Excel
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(templateData)

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 20 }, // NIT Proveedor
        { wch: 15 }, // Fecha
        { wch: 15 }, // Código Moneda
        { wch: 15 }, // Tipo Pago
        { wch: 20 }, // Fecha Vencimiento
        { wch: 30 }, // Comentario
        { wch: 20 }, // Código Producto
        { wch: 12 }, // Cantidad
        { wch: 18 }, // Costo Unitario
      ]
      ws['!cols'] = colWidths

      // Crear hoja de referencia con tipos de pago
      const referenceData: (string | undefined)[][] = [
        ['REFERENCIA: Tipos de Pago Permitidos'],
        [
          'IMPORTANTE: Use EXACTAMENTE estos valores (en minúsculas) en la columna Tipo Pago',
        ],
        [''], // Fila vacía
        ['Tipos de Pago Permitidos'], // Encabezado
        ['contado'],
        ['credito'],
      ]

      const wsRef = XLSX.utils.aoa_to_sheet(referenceData)

      // Aplicar formato en negrita a títulos y encabezados
      const boldStyle = {
        font: { bold: true },
      }

      // Título (fila 1, columna A - A1)
      if (wsRef['A1']) {
        wsRef['A1'].s = boldStyle
      }

      // Encabezado (fila 4, columna A - A4)
      if (wsRef['A4']) {
        wsRef['A4'].s = boldStyle
      }

      // Ajustar ancho de columnas
      wsRef['!cols'] = [{ wch: 35 }]

      // Crear hoja de proveedores
      const suppliersData: (string | number | undefined)[][] = [
        ['REFERENCIA: Proveedores Disponibles'],
        [
          'IMPORTANTE: Use el NIT Proveedor en la hoja Compras. El NIT es un identificador único.',
        ],
        [''], // Fila vacía
        ['NIT Proveedor', 'Nombre Proveedor'], // Encabezados
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

      // Crear hoja de productos
      const productsData: (string | number | undefined)[][] = [
        ['REFERENCIA: Productos Disponibles'],
        [
          'IMPORTANTE: Use el Código Producto en la hoja Compras. El código es un identificador único por empresa.',
        ],
        [''], // Fila vacía
        ['Código Producto', 'Descripción', 'Serie'], // Encabezados
      ]

      // Agregar productos
      products.forEach(product => {
        productsData.push([
          product.codigo,
          product.descripcion,
          product.serie || '',
        ])
      })

      const wsProducts = XLSX.utils.aoa_to_sheet(productsData)

      // Aplicar formato en negrita a títulos y encabezados de productos
      if (wsProducts['A1']) {
        wsProducts['A1'].s = boldStyle
      }
      if (wsProducts['A4']) {
        wsProducts['A4'].s = boldStyle
      }
      if (wsProducts['B4']) {
        wsProducts['B4'].s = boldStyle
      }
      if (wsProducts['C4']) {
        wsProducts['C4'].s = boldStyle
      }

      // Ajustar ancho de columnas de productos
      wsProducts['!cols'] = [
        { wch: 20 }, // Código Producto
        { wch: 40 }, // Descripción
        { wch: 15 }, // Serie
      ]

      // Crear hoja de monedas
      const monedasData: (string | number | undefined)[][] = [
        ['REFERENCIA: Monedas Disponibles'],
        [
          'IMPORTANTE: Use el Código Moneda en la hoja Compras. El código es un identificador único.',
        ],
        [''], // Fila vacía
        ['Código Moneda', 'Nombre', 'Símbolo'], // Encabezados
      ]

      // Agregar monedas
      monedas.forEach(moneda => {
        monedasData.push([moneda.codigo, moneda.nombre, moneda.simbolo || ''])
      })

      const wsMonedas = XLSX.utils.aoa_to_sheet(monedasData)

      // Aplicar formato en negrita a títulos y encabezados de monedas
      if (wsMonedas['A1']) {
        wsMonedas['A1'].s = boldStyle
      }
      if (wsMonedas['A4']) {
        wsMonedas['A4'].s = boldStyle
      }
      if (wsMonedas['B4']) {
        wsMonedas['B4'].s = boldStyle
      }
      if (wsMonedas['C4']) {
        wsMonedas['C4'].s = boldStyle
      }

      // Ajustar ancho de columnas de monedas
      wsMonedas['!cols'] = [
        { wch: 15 }, // Código Moneda
        { wch: 25 }, // Nombre
        { wch: 10 }, // Símbolo
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Compras')
      XLSX.utils.book_append_sheet(wb, wsRef, 'Tipos de Pago')
      XLSX.utils.book_append_sheet(wb, wsSuppliers, 'Proveedores')
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Productos')
      XLSX.utils.book_append_sheet(wb, wsMonedas, 'Monedas')
      XLSX.writeFile(wb, 'plantilla_compras.xlsx')
      message.success('Plantilla descargada exitosamente')

      // Llamar callback para mostrar modal informativo
      onTemplateDownloaded()
    } catch (error) {
      console.error('Error al generar plantilla:', error)
      message.error('Error al generar la plantilla')
    }
  }

  // Función para procesar el archivo Excel y crear compras
  const handleProcessFile = async () => {
    if (fileList.length === 0 || !fileList[0].originFileObj) {
      message.error('Por favor seleccione un archivo primero')
      return
    }

    const file = fileList[0].originFileObj
    try {
      if (!empresaId) {
        message.error('Debe seleccionar una sucursal antes de cargar compras.')
        return
      }

      if (!usuarioId) {
        message.error('Usuario ID es requerido para crear compras.')
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

      // Obtener listas para validar
      const suppliers = await getSuppliers({}, undefined, empresaId)
      const products = await getProducts({}, empresaId)
      const monedas = await getMonedas()

      const supplierMapByNit = new Map(suppliers.map(s => [s.nit, s.id]))
      const productMapByCodigo = new Map(products.map(p => [p.codigo, p.id]))
      const monedaMapByCodigo = new Map(monedas.map(m => [m.codigo, m.id]))

      // Agrupar filas por compra (mismo NIT Proveedor, Fecha, Moneda, Tipo Pago)
      const comprasMap = new Map<string, any[]>()

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any
        const rowNumber = i + 2 // +2 porque la fila 1 es el encabezado y empezamos desde 0

        // Validar campos requeridos básicos
        if (
          !row['NIT Proveedor'] ||
          !row.Fecha ||
          !row['Código Moneda'] ||
          !row['Tipo Pago'] ||
          !row['Código Producto'] ||
          !row.Cantidad ||
          !row['Costo Unitario']
        ) {
          continue // Saltar filas incompletas, se validarán después
        }

        // Crear clave única para agrupar compras
        const compraKey = `${row['NIT Proveedor']}_${row.Fecha}_${row['Código Moneda']}_${row['Tipo Pago']}`

        if (!comprasMap.has(compraKey)) {
          comprasMap.set(compraKey, [])
        }

        comprasMap.get(compraKey)!.push({ ...row, rowNumber })
      }

      // Validar y procesar cada compra
      const errors: string[] = []
      const successCount = { count: 0 }
      const totalRows = jsonData.length

      for (const [compraKey, rows] of comprasMap.entries()) {
        try {
          // Obtener datos de la primera fila para la compra
          const firstRow = rows[0]

          // Validar proveedor por NIT
          const nitStr = firstRow['NIT Proveedor'].toString().trim()
          const proveedorId = supplierMapByNit.get(nitStr)
          if (!proveedorId) {
            errors.push(
              `Fila ${firstRow.rowNumber}: NIT de Proveedor "${nitStr}" no existe. Consulte la hoja "Proveedores" para ver los NITs disponibles.`
            )
            continue
          }

          // Validar moneda por código
          const codigoMoneda = firstRow['Código Moneda'].toString().trim()
          const monedaId = monedaMapByCodigo.get(codigoMoneda)
          if (!monedaId) {
            errors.push(
              `Fila ${firstRow.rowNumber}: Código de Moneda "${codigoMoneda}" no existe. Consulte la hoja "Monedas" para ver los códigos disponibles.`
            )
            continue
          }

          // Validar tipo de pago
          const tipoPago = firstRow['Tipo Pago'].toString().trim().toLowerCase()
          if (!['contado', 'credito'].includes(tipoPago)) {
            errors.push(
              `Fila ${firstRow.rowNumber}: Tipo Pago "${firstRow['Tipo Pago']}" no es válido. Valores permitidos: contado, credito`
            )
            continue
          }

          // Validar fecha
          let fecha: string
          try {
            const fechaValue = firstRow.Fecha
            if (typeof fechaValue === 'number') {
              // Excel date serial number
              const excelEpoch = new Date(1899, 11, 30)
              const date = new Date(
                excelEpoch.getTime() + fechaValue * 86400000
              )
              fecha = date.toISOString().split('T')[0]
            } else {
              fecha = new Date(fechaValue).toISOString().split('T')[0]
            }
          } catch (error) {
            errors.push(
              `Fila ${firstRow.rowNumber}: Fecha "${firstRow.Fecha}" no es válida. Use formato YYYY-MM-DD`
            )
            continue
          }

          // Validar fecha_vencimiento si es crédito
          let fechaVencimiento: string | undefined
          if (tipoPago === 'credito') {
            if (firstRow['Fecha Vencimiento']) {
              try {
                const fechaVencValue = firstRow['Fecha Vencimiento']
                if (typeof fechaVencValue === 'number') {
                  // Excel date serial number
                  const excelEpoch = new Date(1899, 11, 30)
                  const date = new Date(
                    excelEpoch.getTime() + fechaVencValue * 86400000
                  )
                  fechaVencimiento = date.toISOString().split('T')[0]
                } else {
                  fechaVencimiento = new Date(fechaVencValue)
                    .toISOString()
                    .split('T')[0]
                }
              } catch (error) {
                errors.push(
                  `Fila ${firstRow.rowNumber}: Fecha Vencimiento "${firstRow['Fecha Vencimiento']}" no es válida. Use formato YYYY-MM-DD`
                )
                continue
              }
            }
          }

          // Validar y crear items
          const items: CompraItem[] = []
          for (const row of rows) {
            // Validar producto por código
            const codigoProducto = row['Código Producto'].toString().trim()
            const productoId = productMapByCodigo.get(codigoProducto)
            if (!productoId) {
              errors.push(
                `Fila ${row.rowNumber}: Código de Producto "${codigoProducto}" no existe. Consulte la hoja "Productos" para ver los códigos disponibles.`
              )
              continue
            }

            // Validar cantidad
            const cantidad = parseInt(row.Cantidad.toString())
            if (isNaN(cantidad) || cantidad <= 0) {
              errors.push(
                `Fila ${row.rowNumber}: Cantidad debe ser un número mayor a 0`
              )
              continue
            }

            // Validar costo unitario
            const costoUnitario = parseFloat(row['Costo Unitario'].toString())
            if (isNaN(costoUnitario) || costoUnitario < 0) {
              errors.push(
                `Fila ${row.rowNumber}: Costo Unitario debe ser un número mayor o igual a 0`
              )
              continue
            }

            items.push({
              producto_id: productoId,
              cantidad: cantidad,
              costo_unitario: costoUnitario,
            })
          }

          if (items.length === 0) {
            errors.push(
              `Fila ${firstRow.rowNumber}: La compra debe tener al menos un item válido`
            )
            continue
          }

          // Crear la compra
          const compraData = {
            empresa_id: empresaId,
            proveedor_id: proveedorId,
            usuario_id: usuarioId,
            fecha: fecha,
            moneda_id: monedaId,
            tipo_pago: tipoPago as 'contado' | 'credito',
            fecha_vencimiento: fechaVencimiento,
            comentario: firstRow.Comentario
              ? firstRow.Comentario.toString().trim()
              : undefined,
            items: items,
          }

          await createCompra(compraData)
          successCount.count++
        } catch (error: any) {
          const firstRow = rows[0]
          errors.push(
            `Fila ${firstRow.rowNumber}: ${
              error.message || 'Error al crear compra'
            }`
          )
        }
      }

      // Invalidar queries si hubo compras creadas
      if (successCount.count > 0) {
        await queryClient.invalidateQueries({
          queryKey: [QueryKey.comprasInfo],
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
          Carga Masiva de Compras
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
            completar con los datos de tus compras.
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
            Selecciona el archivo Excel (.xlsx) con las compras que deseas
            cargar. El archivo debe seguir el formato de la plantilla.
          </Paragraph>
          <Text type='secondary' style={{ fontSize: '12px' }}>
            Campos requeridos: NIT Proveedor, Fecha, Código Moneda, Tipo Pago,
            Código Producto, Cantidad, Costo Unitario. Fecha Vencimiento es
            requerida si Tipo Pago es "credito". Comentario es opcional. Las
            filas con el mismo NIT Proveedor, Fecha, Moneda y Tipo Pago se
            agruparán en una sola compra.
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
