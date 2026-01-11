'use client'
import { Card, Image, theme } from 'antd'
import RedoAnimText from './components/RedoAnimText'
import TextAnim from './components/TextAnim'
import { withAuth } from '@/app/auth/withAuth'
import Title from 'antd/es/typography/Title'
import { useTheme } from '@/app/themeContext'

function HomePage() {
  const { theme: currentTheme } = useTheme()
  const isDark = currentTheme === 'dark'
  const {
    token: { colorBgContainer, colorText },
  } = theme.useToken()

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: isDark
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <Card
        style={{
          borderRadius: '20px',
          boxShadow: isDark
            ? '0 8px 32px rgba(0, 0, 0, 0.5)'
            : '0 8px 32px rgba(0, 0, 0, 0.1)',
          padding: '40px',
          textAlign: 'center',
          backgroundColor: isDark
            ? colorBgContainer
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Title
          level={1}
          style={{
            fontWeight: 600,
            color: isDark ? colorText : undefined,
          }}
        >
          Simple Business Control
        </Title>

        <TextAnim />
        <div
          style={{
            height: 50,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <RedoAnimText />
        </div>
      </Card>
    </div>
  )
}

export default withAuth(HomePage)
