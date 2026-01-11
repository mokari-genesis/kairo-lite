/**
 *  CUENTAS POR COBRAR PAGE
 * */
'use client'
import '../../globals.css'
import '@ant-design/v5-patch-for-react-19'
import { DataTable } from '../../components/DataTable'
import { FilterSection } from '../../components/FilterSection'
import { PageHeader } from '../../components/PageHeader'
import { withAuth } from '../../auth/withAuth'
import { useState, useMemo, useEffect } from 'react'
import { useCuentasPorCobrar } from '@/app/hooks/useHooks'
import { queryClient, QueryKey } from '@/app/utils/query'
import { AbonosManager } from '@/app/components/AbonosManager'
import { CuentaPorCobrarTypeResponse } from '@/app/api/cuentas-por-cobrar'
import {
  Card,
  message,
  Space,
  Row,
  Col,
  Statistic,
  Tag,
  Button,
  theme,
} from 'antd'
import { motion } from 'framer-motion'
import {
  getCuentasPorCobrarColumns,
  CuentasPorCobrarFilterConfigs,
} from '@/app/model/cuentasPorCobrarTableModel'
import { useTheme } from '@/app/themeContext'
import {
  DollarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'
import {
  formatCurrency,
  obtenerMonedaBase,
  convertirAMonedaBase,
} from '@/app/utils/currency'
import { getMonedas, Moneda } from '@/app/api/monedas'

function CuentasPorCobrarPage() {
  const [monedaBase, setMonedaBase] = useState<Moneda | null>(null)
  const [monedas, setMonedas] = useState<Moneda[]>([])

  // Cargar moneda base y todas las monedas
  useEffect(() => {
    const loadMonedas = async () => {
      try {
        const monedasData = await getMonedas({ activo: 1 })
        setMonedas(monedasData)
        const base = obtenerMonedaBase(monedasData)
        setMonedaBase(base)
      } catch (error) {
        console.error('Error loading monedas:', error)
      }
    }
    loadMonedas()
  }, [])
  const { theme: currentTheme } = useTheme()
  const isDark = currentTheme === 'dark'
  const {
    token: { colorTextSecondary, colorBgContainer, colorError },
  } = theme.useToken()
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [abonosModalOpen, setAbonosModalOpen] = useState(false)
  const [selectedCuentaId, setSelectedCuentaId] = useState<number | null>(null)

  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page)
    setPageSize(pageSize)
  }

  const onFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  // Separar filtros del servidor de los del cliente
  const serverFilters = useMemo(() => {
    const server: Record<string, any> = {}
    // Solo incluir filtros que el backend soporta
    if (filters.estado) {
      server.estado = filters.estado
    }
    return server
  }, [filters])

  // Filtros del lado del cliente (para campos calculados o no soportados por el backend)
  const clientFilters = useMemo(() => {
    return {
      cliente_nombre: filters.cliente_nombre || '',
      cliente_nit: filters.cliente_nit || '',
      estado_pago_clasificacion: filters.estado_pago_clasificacion || '',
    }
  }, [filters])

  const { data: dataCuentasRaw, isLoading: cuentasLoading } =
    useCuentasPorCobrar(serverFilters)

  // Aplicar filtros del lado del cliente
  const dataCuentas = useMemo(() => {
    if (!dataCuentasRaw) return []

    return dataCuentasRaw.filter(cxc => {
      // Filtro por nombre de cliente
      if (clientFilters.cliente_nombre) {
        const nombreMatch = cxc.cliente_nombre
          ?.toLowerCase()
          .includes(clientFilters.cliente_nombre.toLowerCase())
        if (!nombreMatch) return false
      }

      // Filtro por NIT de cliente
      if (clientFilters.cliente_nit) {
        const nitMatch = cxc.cliente_nit
          ?.toLowerCase()
          .includes(clientFilters.cliente_nit.toLowerCase())
        if (!nitMatch) return false
      }

      // Filtro por estado de pago (campo calculado)
      if (clientFilters.estado_pago_clasificacion) {
        if (
          cxc.estado_pago_clasificacion !==
          clientFilters.estado_pago_clasificacion
        ) {
          return false
        }
      }

      return true
    })
  }, [dataCuentasRaw, clientFilters])

  const handleOpenAbonos = (cuenta: CuentaPorCobrarTypeResponse) => {
    setSelectedCuentaId(cuenta.id)
    setAbonosModalOpen(true)
  }

  const handleCloseAbonos = () => {
    setAbonosModalOpen(false)
    setSelectedCuentaId(null)
    // Refrescar los datos
    queryClient.invalidateQueries({ queryKey: [QueryKey.cuentasPorCobrarInfo] })
  }

  const handleAbonosChange = () => {
    // Refrescar los datos cuando cambien los abonos
    queryClient.invalidateQueries({ queryKey: [QueryKey.cuentasPorCobrarInfo] })
  }

  // Calcular estadísticas
  const cuentasStats = useMemo(() => {
    if (!dataCuentas || dataCuentas.length === 0) {
      return {
        totalCuentas: 0,
        totalSaldo: 0,
        cuentasPendientes: 0,
        cuentasPagadas: 0,
        saldoPendiente: 0,
      }
    }

    const totalCuentas = dataCuentas.length

    // Los valores ya vienen en moneda base desde el backend, solo sumar
    const totalSaldo = dataCuentas.reduce(
      (sum, cxc) => sum + Number(cxc.total),
      0
    )
    const saldoPendiente = dataCuentas.reduce(
      (sum, cxc) => sum + Number(cxc.saldo),
      0
    )

    const cuentasPendientes = dataCuentas.filter(
      cxc => cxc.estado_pago_clasificacion === 'pendiente'
    ).length
    const cuentasPagadas = dataCuentas.filter(
      cxc => cxc.estado_pago_clasificacion === 'pagada'
    ).length

    return {
      totalCuentas,
      totalSaldo,
      saldoPendiente,
      cuentasPendientes,
      cuentasPagadas,
    }
  }, [dataCuentas])

  // Agrupar por cliente
  const cuentasPorCliente = useMemo(() => {
    if (!dataCuentas) return []

    const grouped = dataCuentas.reduce((acc, cxc) => {
      const clienteId = cxc.cliente_id
      if (!acc[clienteId]) {
        acc[clienteId] = {
          cliente_id: clienteId,
          cliente_nombre: cxc.cliente_nombre,
          cliente_nit: cxc.cliente_nit,
          cuentas: [],
          totalSaldo: 0,
          totalCuentas: 0,
        }
      }
      acc[clienteId].cuentas.push(cxc)
      // Los valores ya vienen en moneda base desde el backend, solo sumar
      acc[clienteId].totalSaldo += Number(cxc.saldo)
      acc[clienteId].totalCuentas += 1
      return acc
    }, {} as Record<number, any>)

    return Object.values(grouped).sort(
      (a: any, b: any) => b.totalSaldo - a.totalSaldo
    )
  }, [dataCuentas])

  const handleExportExcel = () => {
    if (!dataCuentas || dataCuentas.length === 0) {
      message.warning('No hay datos para exportar')
      return
    }

    // Preparar los datos para Excel
    const excelData = dataCuentas.map(cxc => ({
      ID: cxc.id,
      Cliente: cxc.cliente_nombre,
      'NIT Cliente': cxc.cliente_nit,
      Empresa: cxc.empresa_nombre,
      Total: cxc.total,
      Saldo: cxc.saldo,
      Pagado: cxc.total_pagado,
      'Días Antigüedad': cxc.dias_antiguedad,
      'Estado Pago': cxc.estado_pago_clasificacion,
      Estado: cxc.estado,
      'Fecha Emisión': cxc.fecha_emision,
      'Venta ID': cxc.venta_id || 'N/A',
      Moneda: cxc.moneda_codigo,
    }))

    // Crear libro de Excel
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(wb, ws, 'Cuentas por Cobrar')

    // Generar archivo
    XLSX.writeFile(wb, 'cuentas-por-cobrar.xlsx')
    message.success('Archivo exportado exitosamente')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '24px' }}
    >
      <Card
        variant='outlined'
        style={{
          borderRadius: '15px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Space direction='vertical' size='large' style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <PageHeader title='Cuentas por Cobrar' showNewButton={false} />
            <div
              style={{
                margin: 10,
                width: '100%',
                textAlign: 'right',
              }}
            >
              <Button
                type='primary'
                onClick={handleExportExcel}
                icon={<span>📊</span>}
              >
                Exportar a Excel
              </Button>
            </div>
          </div>

          {/* Tarjetas de Estadísticas */}
          <Row gutter={[16, 16]} justify='center'>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  background:
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: 'white', opacity: 0.9 }}>
                      Total Cuentas
                    </span>
                  }
                  value={cuentasStats.totalCuentas}
                  prefix={<FileTextOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  background:
                    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: 'white', opacity: 0.9 }}>
                      Saldo Pendiente
                    </span>
                  }
                  value={cuentasStats.saldoPendiente}
                  prefix={<DollarOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                  formatter={value =>
                    formatCurrency(monedaBase?.codigo || 'USD', Number(value))
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  background:
                    'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: 'white', opacity: 0.9 }}>
                      Pendientes
                    </span>
                  }
                  value={cuentasStats.cuentasPendientes}
                  prefix={<ClockCircleOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  background:
                    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: 'white', opacity: 0.9 }}>
                      Pagadas
                    </span>
                  }
                  value={cuentasStats.cuentasPagadas}
                  prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
          </Row>

          <FilterSection
            filters={CuentasPorCobrarFilterConfigs}
            onFilterChange={onFilterChange}
          />

          {/* Resumen por Cliente */}
          {cuentasPorCliente.length > 0 && (
            <Card
              size='small'
              title='Resumen por Cliente'
              style={{ marginBottom: '16px' }}
            >
              <Space
                direction='vertical'
                size='small'
                style={{ width: '100%' }}
              >
                {cuentasPorCliente.slice(0, 5).map((cliente: any) => (
                  <div
                    key={cliente.cliente_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      background: isDark ? colorBgContainer : '#f5f5f5',
                      borderRadius: '6px',
                    }}
                  >
                    <Space>
                      <UserOutlined />
                      <span style={{ fontWeight: 500 }}>
                        {cliente.cliente_nombre}
                      </span>
                      {cliente.cliente_nit && <Tag>{cliente.cliente_nit}</Tag>}
                      <Tag color='blue'>{cliente.totalCuentas} cuenta(s)</Tag>
                    </Space>
                    <span
                      style={{
                        fontWeight: 'bold',
                        color: isDark ? colorError : '#ff4d4f',
                      }}
                    >
                      <span style={{ marginRight: 4 }}>Saldo:</span>
                      {formatCurrency(
                        monedaBase?.codigo || 'USD',
                        cliente.totalSaldo
                      )}
                    </span>
                  </div>
                ))}
                {cuentasPorCliente.length > 5 && (
                  <div
                    style={{
                      textAlign: 'center',
                      color: isDark ? colorTextSecondary : '#8c8c8c',
                    }}
                  >
                    ... y {cuentasPorCliente.length - 5} cliente(s) más
                  </div>
                )}
              </Space>
            </Card>
          )}

          <DataTable
            data={dataCuentas || []}
            columns={getCuentasPorCobrarColumns(
              isDark,
              colorTextSecondary,
              monedaBase,
              monedas
            )}
            onOpenAbonos={handleOpenAbonos}
            loading={cuentasLoading || isLoading}
            pagination={{
              total: dataCuentas?.length || 0,
              pageSize,
              current: currentPage,
              onChange: handlePageChange,
            }}
            showActions={false}
            showDelete={false}
            rowClassName={(record: any) => {
              if (record.estado === 'vencida') return 'row-vencida'
              if (record.estado_pago_clasificacion === 'pagada')
                return 'row-pagada'
              return ''
            }}
          />
        </Space>
      </Card>

      <style jsx global>{`
        .row-vencida {
          background-color: ${isDark ? '#2a1215' : '#fff1f0'} !important;
        }
        .row-pagada {
          background-color: ${isDark ? '#162312' : '#f6ffed'} !important;
        }
      `}</style>

      {/* Modal de gestión de abonos */}
      {selectedCuentaId && (
        <AbonosManager
          open={abonosModalOpen}
          onCancel={handleCloseAbonos}
          cuentaId={selectedCuentaId}
          onAbonosChange={handleAbonosChange}
        />
      )}
    </motion.div>
  )
}

export default withAuth(CuentasPorCobrarPage)
