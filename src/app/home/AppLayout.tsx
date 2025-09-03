'use client' // Necesario para usar estados y efectos en un componente en el App Router

import React, { useEffect, useState } from 'react'
import { FloatButton, Image, Layout, Menu, MenuProps, Spin } from 'antd'
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
} from '@ant-design/icons'
import { Auth } from 'aws-amplify'
import { queryClient } from '../utils/query'

const { Content, Footer, Sider } = Layout
type MenuItem = Required<MenuProps>['items'][number]
const pathToMenuKey: Record<string, string> = {
  '/home/products': '1',
  '/home/products/new': '1',

  '/home/clients': '2',
  '/home/clients/new': '2',

  '/home/saleOrders': '3',
  '/home/saleOrders/new': '3',
  '/home/saleOrders/edit': '3',

  '/home/stock': '4',
  '/home/stock/new': '4',

  '/home/sales': '5-1',
}

export default function AppLayout({ children }: any) {
  const router = useRouter()
  const pathname = usePathname()

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
      label: 'Ventas',
      icon: React.createElement(StockOutlined),
      onClick: () => {
        setSelectedKey('3')
        router.push('/home/saleOrders')
      },
    },
    {
      key: '4',
      label: 'Movimientos',
      icon: React.createElement(StockOutlined),
      onClick: () => {
        setSelectedKey('4')
        router.push('/home/stock')
      },
    },
    {
      key: '5',
      label: 'Reportes',
      icon: React.createElement(BarChartOutlined),
      children: [
        {
          key: '5-1',
          label: 'Ventas',
          icon: React.createElement(FileTextOutlined),
          onClick: () => {
            setSelectedKey('5-1')
            router.push('/home/sales')
          },
        },
      ],
    },
  ]

  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
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
