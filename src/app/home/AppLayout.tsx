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
} from '@ant-design/icons'
import { Auth } from 'aws-amplify'
import { queryClient } from '../utils/query'
import { EMPRESA_STORAGE_KEY, useEmpresa } from '../empresaContext'

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

  // Si estamos en la página de login, no renderizar el layout
  if (pathname === '/login') {
    return children
  }

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
      key: '6',
      label: 'Reportes',
      icon: React.createElement(BarChartOutlined),
      children: [
        {
          key: '6-3',
          label: 'Métodos de Pago Unificados',
          icon: React.createElement(BankOutlined),
          onClick: () => {
            setSelectedKey('6-3')
            router.push('/home/metodosPagoUnificado')
          },
        },
      ],
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
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(EMPRESA_STORAGE_KEY)
      } catch (e) {
        console.error('Error clearing empresa session storage on logout', e)
      }
    }

    // Limpiar contexto en memoria
    setEmpresa(null)
    setEmpresaId(null)

    try {
      setLoading(true)
      await Auth.signOut()
      router.push('/login')
      queryClient.clear()
      setLoading(false)
    } catch (error) {
      console.error('Error signing out:', error)
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
            justifyContent: 'center',
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
              description='Vaya a la sección "Sucursales" y seleccione una sucursal para continuar.'
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
