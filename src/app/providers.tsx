'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { useEffect, useState } from 'react'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider, theme } from 'antd'
import { queryClient } from './utils/query'
import { Amplify } from 'aws-amplify'
import { amplifyConfiguration } from '@/app/auth/amplifyConfiguration'
import { EmpresaProvider } from './empresaContext'
import { UsuarioProvider } from './usuarioContext'
import { ThemeProvider, useTheme } from './themeContext'

// Componente interno para aplicar el tema de Ant Design
function AntdThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme: currentTheme } = useTheme()

  return (
    <ConfigProvider
      theme={{
        algorithm:
          currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      {children}
    </ConfigProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [persister, setPersister] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
    })
    setPersister(persister)
    Amplify.configure(amplifyConfiguration)
  }, [])

  if (!isClient) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      {persister ? (
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister }}
        >
          <ThemeProvider>
            <AntdRegistry>
              <AntdThemeWrapper>
                <EmpresaProvider>
                  <UsuarioProvider>{children}</UsuarioProvider>
                </EmpresaProvider>
              </AntdThemeWrapper>
            </AntdRegistry>
          </ThemeProvider>
        </PersistQueryClientProvider>
      ) : (
        <ThemeProvider>
          <AntdRegistry>
            <AntdThemeWrapper>
              <EmpresaProvider>
                <UsuarioProvider>{children}</UsuarioProvider>
              </EmpresaProvider>
            </AntdThemeWrapper>
          </AntdRegistry>
        </ThemeProvider>
      )}
    </QueryClientProvider>
  )
}
