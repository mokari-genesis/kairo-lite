'use client'
import '../../globals.css'
import '@ant-design/v5-patch-for-react-19'
import { useMemo, useState, useEffect } from 'react'
import { withAuth } from '../../auth/withAuth'
import { PageHeader } from '../../components/PageHeader'
import { FilterSection } from '../../components/FilterSection'
import { DataTable } from '../../components/DataTable'
import {
  CompraColumns,
  CompraFilterConfigs,
} from '../../model/comprasTableModel'
import { useCompras } from '../../hooks/useHooks'
import { QueryKey, queryClient } from '../../utils/query'
import { anularCompra, CompraResponse } from '../../api/compras'
import { useEmpresa } from '../../empresaContext'
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
  const [filters, setFilters] = useState<Record<string, any>>({})
  const router = useRouter()
  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [monedaVES, setMonedaVES] = useState<Moneda | null>(null)

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
    return compras.reduce(
      (acc, compra) => {
        acc.totalCompras += 1
        acc.totalMonto += Number(compra.total)
        if (compra.tipo_pago === 'contado') {
          acc.totalContado += Number(compra.total)
        } else if (compra.tipo_pago === 'credito') {
          acc.totalCredito += Number(compra.total)
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
  }, [compras])

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
      'Total Items': compra.total_items || 0,
      'Total Productos': compra.total_productos || 0,
      Comentario: compra.comentario || 'N/A',
    }))

    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Compras')
    XLSX.writeFile(wb, `compras_${dayjs().format('YYYY-MM-DD')}.xlsx`)
    message.success('Archivo exportado exitosamente')
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
                      {formatCurrency('VES', totalVES)} (local)
                    </span>
                  )}
              </Space>
            )
          },
        }
      }
      return col
    })

    return [
      ...columnsWithCustomTotal,
      {
        key: 'actions',
        title: 'Acciones',
        dataIndex: 'actions',
        type: 'text',
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
      },
    ]
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
        <Button
          icon={<ExportOutlined />}
          onClick={handleExportExcel}
          disabled={!compras || compras.length === 0}
        >
          Exportar Excel
        </Button>
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
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title='Contado'
                value={stats.totalContado}
                prefix={<CheckCircleOutlined />}
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title='Crédito'
                value={stats.totalCredito}
                prefix={<DollarCircleOutlined />}
                precision={2}
                valueStyle={{ color: '#1890ff' }}
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
            rowKey='id'
          />
        </Card>
      </motion.div>
    </div>
  )
}

export default withAuth(ComprasPage)
