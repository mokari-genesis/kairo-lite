/**
 *  USUARIOS PAGE
 * */
'use client'
import '../../globals.css'
import '@ant-design/v5-patch-for-react-19'
import { DataTable } from '../../components/DataTable'
import { FilterSection } from '../../components/FilterSection'
import { PageHeader } from '../../components/PageHeader'
import { withAuth } from '../../auth/withAuth'
import { useState, useMemo } from 'react'
import { useUsuarios } from '@/app/hooks/useHooks'
import { useRouter } from 'next/navigation'
import { queryClient, QueryKey } from '@/app/utils/query'
import { Card, message, Space, Row, Col, Statistic, Tag, Button } from 'antd'
import { motion } from 'framer-motion'
import {
  UsuarioColumns,
  UsuarioFilterConfigs,
} from '@/app/model/usuariosTableModel'
import {
  deleteUsuario,
  updateUsuario,
  UpdateUsuarioRequest,
} from '@/app/api/usuarios'
import {
  UserOutlined,
  CrownOutlined,
  ShoppingOutlined,
  InboxOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'

function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})

  const router = useRouter()

  const handleNewClick = () => {
    router.push('/home/usuarios/new')
  }

  const handleEdit = async (record: any) => {
    try {
      setIsLoading(true)
      const updateData: UpdateUsuarioRequest = {
        id: record.id,
        nombre: record.nombre,
        email: record.email,
        rol: record.rol,
        activo: record.activo,
        empresa_id: record.empresa_id,
      }
      await updateUsuario(updateData)
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.usuariosInfo, filters],
      })
      message.success('Usuario actualizado exitosamente')
    } catch (error: any) {
      message.error(error.message || 'Error al actualizar el usuario')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page)
    setPageSize(pageSize)
  }

  const handleDelete = async (record: any) => {
    if (!record.id) {
      message.error('No se puede eliminar el usuario')
      return
    }
    setIsLoading(true)
    await deleteUsuario(record.id)
    await queryClient.invalidateQueries({ queryKey: [QueryKey.usuariosInfo] })
    message.success('Usuario eliminado exitosamente')
    setIsLoading(false)
  }

  const onFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
  }

  const { data: dataUsuarios, isLoading: usuariosLoading } =
    useUsuarios(filters)

  // Calcular estadísticas de usuarios
  const usuariosStats = useMemo(() => {
    if (!dataUsuarios || dataUsuarios.length === 0) {
      return {
        totalUsuarios: 0,
        usuariosActivos: 0,
        usuariosAdmin: 0,
        usuariosVendedor: 0,
        usuariosBodega: 0,
        usuariosMaster: 0,
      }
    }

    const totalUsuarios = dataUsuarios.length
    const usuariosActivos = dataUsuarios.filter(
      usuario => usuario.activo === 1
    ).length
    const usuariosAdmin = dataUsuarios.filter(
      usuario => usuario.rol === 'admin'
    ).length
    const usuariosVendedor = dataUsuarios.filter(
      usuario => usuario.rol === 'vendedor'
    ).length
    const usuariosBodega = dataUsuarios.filter(
      usuario => usuario.rol === 'bodega'
    ).length
    const usuariosMaster = dataUsuarios.filter(
      usuario => usuario.rol === 'master'
    ).length

    return {
      totalUsuarios,
      usuariosActivos,
      usuariosAdmin,
      usuariosVendedor,
      usuariosBodega,
      usuariosMaster,
    }
  }, [dataUsuarios])

  const handleExportExcel = () => {
    if (!dataUsuarios || dataUsuarios.length === 0) {
      message.warning('No hay datos para exportar')
      return
    }

    // Preparar los datos para Excel
    const excelData = dataUsuarios.map(usuario => ({
      ID: usuario.id,
      Nombre: usuario.nombre,
      Email: usuario.email,
      Rol: usuario.rol,
      Estado: usuario.activo === 1 ? 'Activo' : 'Inactivo',
      'Fecha Creación': usuario.fecha_creacion,
    }))

    // Crear libro de Excel
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios')

    // Generar archivo
    XLSX.writeFile(wb, 'usuarios.xlsx')
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
            <PageHeader title='Usuarios' onNewClick={handleNewClick} />
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
                      Total Usuarios
                    </span>
                  }
                  value={usuariosStats.totalUsuarios}
                  prefix={<UserOutlined style={{ color: 'white' }} />}
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
                      Activos
                    </span>
                  }
                  value={usuariosStats.usuariosActivos}
                  prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
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
                      Administradores
                    </span>
                  }
                  value={usuariosStats.usuariosAdmin}
                  prefix={<CrownOutlined style={{ color: 'white' }} />}
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
                      Vendedores
                    </span>
                  }
                  value={usuariosStats.usuariosVendedor}
                  prefix={<ShoppingOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  background:
                    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: 'white', opacity: 0.9 }}>Bodega</span>
                  }
                  value={usuariosStats.usuariosBodega}
                  prefix={<InboxOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                style={{
                  background:
                    'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: 'white', opacity: 0.9 }}>Master</span>
                  }
                  value={usuariosStats.usuariosMaster}
                  prefix={<CrownOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
          </Row>

          <FilterSection
            filters={UsuarioFilterConfigs}
            onFilterChange={onFilterChange}
          />

          <DataTable
            data={dataUsuarios || []}
            columns={UsuarioColumns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={usuariosLoading || isLoading}
            pagination={{
              total: dataUsuarios?.length || 0,
              pageSize,
              current: currentPage,
              onChange: handlePageChange,
            }}
            showActions={true}
            showDelete={true}
          />
        </Space>
      </Card>
    </motion.div>
  )
}

export default withAuth(Home)
