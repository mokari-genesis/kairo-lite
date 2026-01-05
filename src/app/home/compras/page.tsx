'use client'
import '../../globals.css'
import '@ant-design/v5-patch-for-react-19'
import { useMemo, useState, useEffect } from 'react'
import { withAuth } from '../../auth/withAuth'
import { PageHeader } from '../../components/PageHeader'
import { FilterSection } from '../../components/FilterSection'
import { DataTable, ColumnConfig } from '../../components/DataTable'
import {
  CompraColumns,
  CompraFilterConfigs,
} from '../../model/comprasTableModel'
import { useCompras } from '../../hooks/useHooks'
import { QueryKey, queryClient } from '../../utils/query'
import { anularCompra, CompraResponse } from '../../api/compras'
import { useEmpresa } from '../../empresaContext'
import { useUsuario } from '../../usuarioContext'
import { BulkUploadModalCompras } from '../../components/BulkUploadModalCompras'
import { TemplateInfoModal } from '../../components/TemplateInfoModal'
import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Tag,
  message,
  Modal,
} from 'antd'
import {
  DollarCircleOutlined,
  DollarOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExportOutlined,
  EyeOutlined,
  StopOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import {
  formatCurrency,
  convertirAMonedaBase,
  obtenerMonedaBase,
} from '@/app/utils/currency'
import { getMonedas, Moneda } from '@/app/api/monedas'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'

function ComprasPage() {
  const { empresaId } = useEmpresa()
  const { usuarioId } = useUsuario()
  const [filters, setFilters] = useState<Record<string, any>>({})
  const router = useRouter()
  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [monedaVES, setMonedaVES] = useState<Moneda | null>(null)
  const [bulkUploadModalVisible, setBulkUploadModalVisible] = useState(false)
  const [summaryModalVisible, setSummaryModalVisible] = useState(false)
  const [summaryData, setSummaryData] = useState<{
    successCount: number
    totalRows: number
    errors: string[]
  } | null>(null)
  const [templateInfoModalVisible, setTemplateInfoModalVisible] =
    useState(false)

  const { data: compras, isLoading } = useCompras(filters)

  // Cargar monedas al montar el componente
  useEffect(() => {
    const loadMonedas = async () => {
      try {
        const monedasData = await getMonedas()
        setMonedas(monedasData)
        const ves = monedasData.find(m => m.codigo === 'VES')
        if (ves) {
          setMonedaVES(ves)
        }
      } catch (error) {
        console.error('Error loading monedas:', error)
      }
    }
    loadMonedas()
  }, [])

  const stats = useMemo(() => {
    if (!compras || compras.length === 0) {
      return {
        totalCompras: 0,
        totalMonto: 0,
        totalContado: 0,
        totalCredito: 0,
        totalAnuladas: 0,
      }
    }

    // Función helper para calcular total en VES
    const calcularTotalVES = (
      value: number,
      record: CompraResponse
    ): number => {
      if (!monedas || !monedaVES || value <= 0 || !record.moneda_codigo) {
        return 0
      }

      const monedaCompra = monedas.find(m => m.codigo === record.moneda_codigo)
      if (!monedaCompra) return 0

      if (monedaCompra.codigo === 'VES') {
        return value
      }

      const monedaBase = obtenerMonedaBase(monedas)
      if (monedaBase) {
        // Convertir de moneda compra a base
        const montoEnBase = convertirAMonedaBase(
          value,
          monedaCompra,
          monedaBase
        )
        // Convertir de base a VES
        if (monedaVES.id === monedaBase.id) {
          return montoEnBase
        } else {
          const tasaVES = parseFloat(monedaVES.tasa_vs_base)
          return montoEnBase * tasaVES
        }
      } else {
        // Si no hay moneda base, usar conversión directa
        const tasaOrigen = parseFloat(monedaCompra.tasa_vs_base)
        const tasaVES = parseFloat(monedaVES.tasa_vs_base)
        return (value * tasaVES) / tasaOrigen
      }
    }

    return compras.reduce(
      (acc, compra) => {
        acc.totalCompras += 1

        // Convertir el total a VES antes de sumar
        const totalVES = calcularTotalVES(Number(compra.total), compra)
        acc.totalMonto += totalVES

        if (compra.tipo_pago === 'contado') {
          acc.totalContado += totalVES
        } else if (compra.tipo_pago === 'credito') {
          acc.totalCredito += totalVES
        }
        if (compra.estado === 'anulada') {
          acc.totalAnuladas += 1
        }
        return acc
      },
      {
        totalCompras: 0,
        totalMonto: 0,
        totalContado: 0,
        totalCredito: 0,
        totalAnuladas: 0,
      }
    )
  }, [compras, monedas, monedaVES])

  const handleFilterChange = (newFilters: Record<string, any>) => {
    // Convertir fechas a formato YYYY-MM-DD
    const processedFilters: Record<string, any> = {}
    Object.entries(newFilters).forEach(([key, value]) => {
      if (key === 'fecha_inicio' || key === 'fecha_fin') {
        // El FilterSection ya maneja fecha_inicio y fecha_fin desde dateRange
        if (value) {
          processedFilters[key] = value
        }
      } else if (value !== undefined && value !== null && value !== '') {
        processedFilters[key] = value
      }
    })
    setFilters(prev => ({ ...prev, ...processedFilters }))
  }

  const handleNewClick = () => {
    router.push('/home/compras/new')
  }

  const handleView = (record: CompraResponse) => {
    router.push(`/home/compras/${record.id}`)
  }

  const handleAnular = async (record: CompraResponse) => {
    if (record.estado === 'anulada') {
      message.warning('La compra ya está anulada')
      return
    }

    // Construir mensaje de confirmación
    let warningMessage = `¿Está seguro de que desea anular la compra #${record.id}?`

    warningMessage += `\n\n⚠️ Esta acción:`
    warningMessage += `\n• Quitará el stock agregado por esta compra`
    warningMessage += `\n• Revertirá los movimientos de inventario`

    if (record.cuenta_por_pagar && record.cuenta_por_pagar.saldo > 0) {
      warningMessage += `\n• Anulará la cuenta por pagar asociada (saldo pendiente: ${formatCurrency(
        record.moneda_codigo,
        record.cuenta_por_pagar.saldo
      )})`
    }

    warningMessage += `\n\nNota: Si el stock actual es menor que la cantidad comprada, el stock quedará negativo.`

    Modal.confirm({
      title: 'Anular compra',
      content: warningMessage,
      okText: 'Anular',
      okType: 'danger',
      cancelText: 'Cancelar',
      width: 500,
      onOk: async () => {
        try {
          await anularCompra(record.id)
          message.success('Compra anulada exitosamente')
          // Invalidar queries para refrescar los datos
          await queryClient.invalidateQueries({
            queryKey: [QueryKey.comprasInfo],
          })
          // Refrescar la página si estamos en el detalle
          if (window.location.pathname.includes(`/compras/${record.id}`)) {
            router.refresh()
          }
        } catch (error: any) {
          console.error('Error al anular compra:', error)
          const errorMessage =
            error.message ||
            error.response?.data?.message ||
            'Error al anular la compra. Por favor, intente nuevamente.'
          message.error(errorMessage)
        }
      },
    })
  }

  const handleExportExcel = () => {
    if (!compras || compras.length === 0) {
      message.warning('No hay datos para exportar')
      return
    }

    const excelData = compras.map(compra => ({
      ID: compra.id,
      Fecha: dayjs(compra.fecha).format('DD/MM/YYYY'),
      Proveedor: compra.proveedor_nombre,
      'NIT Proveedor': compra.proveedor_nit || 'N/A',
      Total: compra.total,
      Moneda: compra.moneda_codigo,
      'Tipo de Pago': compra.tipo_pago || 'No especificado',
      Estado: compra.estado,
      'Total Productos': compra.total_productos || 0,
      Comentario: compra.comentario || 'N/A',
    }))

    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Compras')
    XLSX.writeFile(wb, `compras_${dayjs().format('YYYY-MM-DD')}.xlsx`)
    message.success('Archivo exportado exitosamente')
  }

  const handleTemplateDownloaded = () => {
    setTemplateInfoModalVisible(true)
  }

  const handleProcessComplete = (data: {
    successCount: number
    totalRows: number
    errors: string[]
  }) => {
    setSummaryData(data)
    setSummaryModalVisible(true)
  }

  const columnsWithActions = useMemo(() => {
    // Función helper para calcular total en VES
    const calcularTotalVES = (
      value: number,
      record: CompraResponse
    ): number => {
      if (!monedas || !monedaVES || value <= 0 || !record.moneda_codigo) {
        return 0
      }

      const monedaCompra = monedas.find(m => m.codigo === record.moneda_codigo)
      if (!monedaCompra) return 0

      if (monedaCompra.codigo === 'VES') {
        return value
      }

      const monedaBase = obtenerMonedaBase(monedas)
      if (monedaBase) {
        // Convertir de moneda compra a base
        const montoEnBase = convertirAMonedaBase(
          value,
          monedaCompra,
          monedaBase
        )
        // Convertir de base a VES
        if (monedaVES.id === monedaBase.id) {
          return montoEnBase
        } else {
          const tasaVES = parseFloat(monedaVES.tasa_vs_base)
          return montoEnBase * tasaVES
        }
      } else {
        // Si no hay moneda base, usar conversión directa
        const tasaOrigen = parseFloat(monedaCompra.tasa_vs_base)
        const tasaVES = parseFloat(monedaVES.tasa_vs_base)
        return (value * tasaVES) / tasaOrigen
      }
    }

    // Reemplazar la columna de total con una personalizada
    const columnsWithCustomTotal = CompraColumns.map(col => {
      if (col.key === 'total') {
        return {
          ...col,
          render: (value: any, record: CompraResponse) => {
            const totalVES = calcularTotalVES(value, record)
            return (
              <Space direction='vertical' size={2} style={{ width: '100%' }}>
                <Space>
                  <DollarOutlined style={{ color: '#faad14' }} />
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {formatCurrency(record.moneda_codigo || 'USD', value)}
                  </span>
                </Space>
                {monedaVES &&
                  record.moneda_codigo !== 'VES' &&
                  totalVES > 0 && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#8c8c8c',
                        fontStyle: 'italic',
                        marginLeft: '20px',
                      }}
                    >
                      {formatCurrency('VES', totalVES)} (Moneda local)
                    </span>
                  )}
              </Space>
            )
          },
        }
      }
      return col
    })

    const actionsColumn: ColumnConfig = {
      key: 'actions',
      title: 'Acciones',
      dataIndex: 'actions',
      type: 'action',
      render: (_: any, record: CompraResponse) => (
        <Space>
          <Button
            type='link'
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            Ver
          </Button>
          {record.estado !== 'anulada' && (
            <Button
              type='link'
              danger
              icon={<StopOutlined />}
              onClick={() => handleAnular(record)}
            >
              Anular
            </Button>
          )}
        </Space>
      ),
    }

    return [...columnsWithCustomTotal, actionsColumn] as ColumnConfig[]
  }, [monedas, monedaVES, handleView, handleAnular])

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader
        title='Compras'
        onNewClick={handleNewClick}
        newButtonText='Nueva Compra'
      />
      <div
        style={{
          marginBottom: '20px',
          width: '100%',
          textAlign: 'right',
        }}
      >
        <Space>
          <Button
            onClick={() => setBulkUploadModalVisible(true)}
            type='default'
          >
            📦 Carga Masiva
          </Button>
          <Button
            onClick={handleExportExcel}
            disabled={!compras || compras.length === 0}
          >
            📊Exportar Excel
          </Button>
        </Space>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title='Total Compras'
                value={stats.totalCompras}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title='Total Monto'
                value={stats.totalMonto}
                prefix={<DollarCircleOutlined />}
                precision={2}
                valueStyle={{ color: '#52c41a' }}
                formatter={value => formatCurrency('VES', Number(value))}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title='Contado'
                value={stats.totalContado}
                prefix={<CheckCircleOutlined />}
                precision={2}
                valueStyle={{ color: '#52c41a' }}
                formatter={value => formatCurrency('VES', Number(value))}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title='Crédito'
                value={stats.totalCredito}
                prefix={<DollarCircleOutlined />}
                precision={2}
                valueStyle={{ color: '#1890ff' }}
                formatter={value => formatCurrency('VES', Number(value))}
              />
            </Col>
          </Row>
        </Card>

        <Card>
          <FilterSection
            filters={CompraFilterConfigs}
            onFilterChange={handleFilterChange}
          />
          <DataTable
            columns={columnsWithActions}
            data={compras || []}
            loading={isLoading}
            showActions={false}
          />
        </Card>
      </motion.div>

      {/* Modal de Carga Masiva */}
      <BulkUploadModalCompras
        visible={bulkUploadModalVisible}
        onClose={() => setBulkUploadModalVisible(false)}
        empresaId={empresaId}
        usuarioId={usuarioId}
        onTemplateDownloaded={handleTemplateDownloaded}
        onProcessComplete={handleProcessComplete}
      />

      {/* Modal de Información de Plantilla */}
      <TemplateInfoModal
        visible={templateInfoModalVisible}
        onClose={() => setTemplateInfoModalVisible(false)}
        title='Información sobre la Plantilla de Compras'
        content={
          <div>
            <p>
              La plantilla de compras incluye las siguientes hojas de
              referencia:
            </p>
            <ul>
              <li>
                <strong>Compras:</strong> Hoja principal donde debe ingresar los
                datos de las compras. Las filas con el mismo NIT Proveedor,
                Fecha, Moneda y Tipo Pago se agruparán en una sola compra.
              </li>
              <li>
                <strong>Tipos de Pago:</strong> Lista de tipos de pago
                permitidos (contado, credito).
              </li>
              <li>
                <strong>Proveedores:</strong> Lista de proveedores disponibles
                con sus NITs. Use el NIT en la hoja Compras.
              </li>
              <li>
                <strong>Productos:</strong> Lista de productos disponibles con
                sus códigos. Use el código en la hoja Compras.
              </li>
              <li>
                <strong>Monedas:</strong> Lista de monedas disponibles con sus
                códigos. Use el código en la hoja Compras.
              </li>
            </ul>
            <p>
              <strong>Nota importante:</strong> Si el Tipo Pago es "credito",
              debe especificar la Fecha Vencimiento. Las filas con el mismo NIT
              Proveedor, Fecha, Moneda y Tipo Pago se agruparán automáticamente
              en una sola compra.
            </p>
          </div>
        }
      />

      {/* Modal de Resumen */}
      <Modal
        title='Resumen de Carga Masiva'
        open={summaryModalVisible}
        onOk={() => {
          setSummaryModalVisible(false)
          setSummaryData(null)
        }}
        onCancel={() => {
          setSummaryModalVisible(false)
          setSummaryData(null)
        }}
        footer={[
          <Button
            key='ok'
            type='primary'
            onClick={() => {
              setSummaryModalVisible(false)
              setSummaryData(null)
            }}
          >
            Aceptar
          </Button>,
        ]}
        width={600}
      >
        {summaryData && (
          <div>
            <p>
              <strong>Total de filas procesadas:</strong>{' '}
              {summaryData.totalRows}
            </p>
            <p>
              <strong>Compras creadas exitosamente:</strong>{' '}
              {summaryData.successCount}
            </p>
            {summaryData.errors.length > 0 && (
              <div>
                <p>
                  <strong>Errores encontrados:</strong>{' '}
                  {summaryData.errors.length}
                </p>
                <div
                  style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                  }}
                >
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {summaryData.errors.map((error, index) => (
                      <li key={index} style={{ marginBottom: '5px' }}>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default withAuth(ComprasPage)
