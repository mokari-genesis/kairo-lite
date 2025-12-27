'use client'

import React, { useState, useEffect } from 'react'
import { Card, Typography, Button, message, Image } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { EmpresaSelect } from '@/app/components/EmpresaSelect'
import { useEmpresa } from '@/app/empresaContext'
import { EnterpriseType } from '@/app/api/enterprise'
import { withAuth } from '@/app/auth/withAuth'

const { Title, Text } = Typography

function SelectEmpresaPage() {
  const router = useRouter()
  const { empresaId, empresa, setEmpresa } = useEmpresa()
  const [selectedEmpresa, setSelectedEmpresa] = useState<EnterpriseType | null>(
    empresa
  )
  const [loading, setLoading] = useState(false)

  // Si ya hay una empresa seleccionada, redirigir al home
  useEffect(() => {
    if (empresaId && empresa) {
      router.replace('/home')
    }
  }, [empresaId, empresa, router])

  const handleSelect = (value: number, empresa: EnterpriseType | null) => {
    setSelectedEmpresa(empresa)
  }

  const handleContinue = async () => {
    if (!selectedEmpresa) {
      message.warning('Por favor selecciona una sucursal para continuar')
      return
    }

    try {
      setLoading(true)
      setEmpresa(selectedEmpresa)
      message.success(`Sucursal ${selectedEmpresa.nombre} seleccionada`)
      
      // Pequeño delay para que el mensaje se muestre
      setTimeout(() => {
        router.replace('/home')
      }, 500)
    } catch (error) {
      console.error('Error al seleccionar sucursal:', error)
      message.error('Error al seleccionar la sucursal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        minWidth: '100vw',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 150 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          minWidth: '100vw',
        }}
      >
        <Card
          style={{
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            padding: '40px',
            marginRight: 20,
            marginLeft: 20,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              marginBottom: '32px',
            }}
          >
            <Image
              src='https://krediya-bucket.s3.us-east-1.amazonaws.com/Kairo.png'
              alt='Logo'
              preview={false}
              width={150}
              height={150}
              style={{
                objectFit: 'contain',
              }}
            />
            <Title
              level={2}
              style={{
                marginTop: '16px',
                fontWeight: 600,
                color: '#1a365d',
              }}
            >
              Selecciona una Sucursal
            </Title>
            <Text
              style={{
                color: '#718096',
                display: 'block',
                marginTop: '8px',
                fontSize: '16px',
              }}
            >
              Para continuar, debes seleccionar una sucursal
            </Text>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <Text
              strong
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#1a365d',
              }}
            >
              Sucursal
            </Text>
            <EmpresaSelect
              value={selectedEmpresa?.id}
              onChange={handleSelect}
              placeholder='Busca y selecciona una sucursal'
            />
          </div>

          <Button
            type='primary'
            onClick={handleContinue}
            loading={loading}
            block
            size='large'
            disabled={!selectedEmpresa}
            style={{
              height: '50px',
              borderRadius: '8px',
              fontWeight: 600,
              backgroundColor: '#a2e3f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1a365d',
              marginTop: '24px',
            }}
            icon={<ArrowRightOutlined />}
          >
            CONTINUAR
          </Button>
        </Card>
      </motion.div>
    </div>
  )
}

export default withAuth(SelectEmpresaPage)

