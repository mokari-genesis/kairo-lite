'use client'
import { Card, Image } from 'antd'
import RedoAnimText from './components/RedoAnimText'
import TextAnim from './components/TextAnim'
import { withAuth } from '@/app/auth/withAuth'
import Title from 'antd/es/typography/Title'

function HomePage() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <Card
        style={{
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          padding: '40px',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Title level={1} style={{ fontWeight: 600 }}>
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
