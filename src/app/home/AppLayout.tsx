'use client' // Necesario para usar estados y efectos en un componente en el App Router

import React, { useEffect, useState } from 'react'
import { Alert, FloatButton, Image, Layout, Menu, MenuProps, Spin } from 'antd'
import { useRouter, usePathname } from 'next/navigation'
import {
  LogoutOutlined,
  CloseOutlined,
  ShareAltOutlined,
  ProductOutlined,
  BarChartOutlined,
  FileTextOutlined,
  TeamOutlined,
  StockOutlined,
  ShopOutlined,
  BankOutlined,
  GlobalOutlined,
  SettingOutlined,
  SwapOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Auth } from 'aws-amplify'
import { queryClient } from '../utils/query'
import { EMPRESA_STORAGE_KEY, useEmpresa } from '../empresaContext'
import { USUARIO_STORAGE_KEY, useUsuario } from '../usuarioContext'
import { useCurrentUser } from '../usuarioContext'

const { Content, Footer, Sider } = Layout
type MenuItem = Required<MenuProps>['items'][number]
const pathToMenuKey: Record<string, string> = {
  '/home/products': '1',
  '/home/products/new': '1',

  '/home/clients': '2',
  '/home/clients/new': '2',

  '/home/suppliers': '3',
  '/home/suppliers/new': '3',

  // Sección Ventas
  '/home/saleOrders': '4-1',
  '/home/saleOrders/new': '4-1',
  '/home/saleOrders/edit': '4-1',
  '/home/cuentasPorCobrar': '4-2',
  '/home/cuentasPorPagar': '4-3',

  '/home/stock': '5',
  '/home/stock/new': '5',

  '/home/transferencias': '8',
  '/home/transferencias/new': '8',

  '/home/enterprises': '10',
  '/home/enterprises/new': '10',

  '/home/metodosPago': '7',
  '/home/metodosPago/new': '7',

  '/home/metodosPagoUnificado': '6-3',

  '/home/usuarios': '12',
  '/home/usuarios/new': '12',

  // Reportes
  '/home/reportes2/ventas': '11-1',
  '/home/reportes2/cartera': '11-2',
  '/home/reportes2/inventario': '11-3',
  '/home/reportes2/relaciones': '11-4',
}

export default function AppLayout({ children }: any) {
  const router = useRouter()
  const pathname = usePathname()
  const { empresaId, setEmpresa, setEmpresaId } = useEmpresa()
  const { clearUserCache } = useUsuario()
  const { usuario, rol } = useCurrentUser()

  // Si estamos en la página de login o selección de empresa, no renderizar el layout
  if (pathname === '/login' || pathname === '/home/select-empresa') {
    return children
  }

  // Si no hay empresa seleccionada, redirigir a la página de selección
  useEffect(() => {
    if (empresaId === null && pathname !== '/home/select-empresa') {
      router.replace('/home/select-empresa')
    }
  }, [empresaId, pathname, router])

  // Determina la clave del menú basada en la ruta actual
  const getMenuKey = (path: string) => pathToMenuKey[path] || ''

  const [selectedKey, setSelectedKey] = useState(getMenuKey(pathname))

  useEffect(() => {
    setSelectedKey(getMenuKey(pathname))
  }, [pathname]) // Se actualiza si cambia la ruta

  const items: MenuItem[] = [
    {
      key: '1',
      label: 'Productos',
      icon: React.createElement(ProductOutlined),
      onClick: () => {
        setSelectedKey('1')
        router.push('/home/products')
      },
    },
    {
      key: '2',
      label: 'Clientes',
      icon: React.createElement(TeamOutlined),
      onClick: () => {
        setSelectedKey('2')
        router.push('/home/clients')
      },
    },
    {
      key: '3',
      label: 'Proveedores',
      icon: React.createElement(ShopOutlined),
      onClick: () => {
        setSelectedKey('3')
        router.push('/home/suppliers')
      },
    },
    {
      key: '4',
      label: 'Ventas',
      icon: React.createElement(StockOutlined),
      children: [
        {
          key: '4-1',
          label: 'Orden de ventas',
          icon: React.createElement(FileTextOutlined),
          onClick: () => {
            setSelectedKey('4-1')
            router.push('/home/saleOrders')
          },
        },
        {
          key: '4-2',
          label: 'Cuentas por Cobrar',
          icon: React.createElement(FileTextOutlined),
          onClick: () => {
            setSelectedKey('4-2')
            router.push('/home/cuentasPorCobrar')
          },
        },
        {
          key: '4-3',
          label: 'Cuentas por Pagar',
          icon: React.createElement(FileTextOutlined),
          onClick: () => {
            setSelectedKey('4-3')
            router.push('/home/cuentasPorPagar')
          },
        },
      ],
    },
    {
      key: '5',
      label: 'Movimientos',
      icon: React.createElement(StockOutlined),
      onClick: () => {
        setSelectedKey('5')
        router.push('/home/stock')
      },
    },
    {
      key: '8',
      label: 'Transferencias',
      icon: React.createElement(SwapOutlined),
      onClick: () => {
        setSelectedKey('8')
        router.push('/home/transferencias')
      },
    },
    {
      key: '10',
      label: 'Sucursales',
      icon: React.createElement(ShopOutlined),
      onClick: () => {
        setSelectedKey('10')
        router.push('/home/enterprises')
      },
    },

    {
      key: '7',
      label: 'Métodos de Pago',
      icon: React.createElement(BankOutlined),
      onClick: () => {
        setSelectedKey('7')
        router.push('/home/metodosPago')
      },
    },
    {
      key: '9',
      label: 'Monedas',
      icon: React.createElement(GlobalOutlined),
      onClick: () => {
        setSelectedKey('9')
        router.push('/home/monedas')
      },
    },
    {
      key: '12',
      label: 'Usuarios',
      icon: React.createElement(UserOutlined),
      onClick: () => {
        setSelectedKey('12')
        router.push('/home/usuarios')
      },
    },
    {
      key: '11',
      label: 'Reportes',
      icon: React.createElement(BarChartOutlined),
      children: [
        {
          key: '11-1',
          label: 'Ventas',
          icon: React.createElement(FileTextOutlined),
          onClick: () => {
            setSelectedKey('11-1')
            router.push('/home/reportes2/ventas')
          },
        },
        {
          key: '11-2',
          label: 'Cartera',
          icon: React.createElement(BankOutlined),
          onClick: () => {
            setSelectedKey('11-2')
            router.push('/home/reportes2/cartera')
          },
        },
        {
          key: '11-3',
          label: 'Inventario Avanzado',
          icon: React.createElement(StockOutlined),
          onClick: () => {
            setSelectedKey('11-3')
            router.push('/home/reportes2/inventario')
          },
        },
        {
          key: '11-4',
          label: 'Clientes y Proveedores',
          icon: React.createElement(TeamOutlined),
          onClick: () => {
            setSelectedKey('11-4')
            router.push('/home/reportes2/relaciones')
          },
        },
      ],
    },
  ]

  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    try {
      setLoading(true)

      // Limpiar cache del usuario primero
      clearUserCache()

      // Limpiar contexto en memoria
      // Los providers ahora eliminarán automáticamente las keys cuando los valores sean null
      setEmpresa(null)
      setEmpresaId(null)

      // Limpiar sessionStorage completamente (por si acaso)
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.removeItem(EMPRESA_STORAGE_KEY)
          window.sessionStorage.removeItem(USUARIO_STORAGE_KEY)
        } catch (e) {
          console.error('Error clearing session storage on logout', e)
        }
      }

      await Auth.signOut()
      queryClient.clear()
      router.push('/login')
      setLoading(false)
    } catch (error) {
      console.error('Error signing out:', error)
      setLoading(false)
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', minWidth: '100vw' }}>
      <Spin spinning={loading} fullscreen={true} />
      {/* Sidebar */}
      <Sider collapsible>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px',
          }}
        >
          <Image
            src='https://krediya-bucket.s3.us-east-1.amazonaws.com/K-logo.png'
            alt='logo'
            height={100}
            style={{ objectFit: 'contain' }}
            preview={false}
            onClick={() => {
              router.push('/home')
            }}
          />
          {usuario?.nombre && (
            <div
              style={{
                marginTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                wordBreak: 'break-word',
                maxWidth: '100%',
              }}
            >
              <div
                style={{
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {usuario.nombre}
              </div>
              {rol && (
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '12px',
                    fontWeight: 400,
                    marginTop: '4px',
                    textTransform: 'capitalize',
                  }}
                >
                  {rol === 'admin'
                    ? 'Administrador'
                    : rol === 'vendedor'
                    ? 'Vendedor'
                    : rol === 'bodega'
                    ? 'Bodega'
                    : rol === 'master'
                    ? 'Master'
                    : rol}
                </div>
              )}
            </div>
          )}
        </div>

        <Menu
          theme='dark'
          selectedKeys={[selectedKey]} // Aplica la selección correcta
          items={items}
          style={{ flex: 1 }}
          mode='inline'
        />
      </Sider>
      <Layout>
        {/* Contenido principal */}
        {empresaId == null && (
          <div style={{ padding: 16 }}>
            <Alert
              type='warning'
              showIcon
              message='Debe seleccionar una sucursal'
              description='No tienes una sucursal seleccionada. Por favor, selecciona una sucursal para ejecutar cualquier acción.'
            />
          </div>
        )}
        <Content
          style={{
            overflow: 'auto',
            height: 360,
          }}
        >
          {children}
        </Content>
        {/* Footer */}
        <Footer style={{ textAlign: 'center' }}>
          © {new Date().getFullYear()} Kairo Lite Version 1.0.0
        </Footer>
      </Layout>

      <FloatButton.Group
        trigger='click'
        closeIcon={<CloseOutlined />}
        style={{ insetInlineEnd: 20, insetBlockEnd: 15 }}
      >
        <FloatButton
          onClick={handleLogout}
          icon={<LogoutOutlined />}
          tooltip={<div>Cerrar sesión</div>}
          style={{ backgroundColor: 'red', color: 'white' }}
        />
      </FloatButton.Group>
    </Layout>
  )
}
