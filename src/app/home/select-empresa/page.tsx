'use client'

import React, { useState, useEffect } from 'react'
import { Card, Typography, Button, message, Image, Spin } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { EmpresaSelect } from '@/app/components/EmpresaSelect'
import { useEmpresa } from '@/app/empresaContext'
import { EnterpriseType, getEnterprises } from '@/app/api/enterprise'
import { withAuth } from '@/app/auth/withAuth'
import { useCurrentUser } from '@/app/usuarioContext'

const { Title, Text } = Typography

function SelectEmpresaPage() {
  const router = useRouter()
  const { empresaId, empresa, setEmpresa } = useEmpresa()
  const { isMaster, loading: loadingUser } = useCurrentUser()
  const [selectedEmpresa, setSelectedEmpresa] = useState<EnterpriseType | null>(
    empresa
  )
  const [loading, setLoading] = useState(false)
  const [checkingEmpresas, setCheckingEmpresas] = useState(true)
  const [showSelection, setShowSelection] = useState(false)

  // Si ya hay una empresa seleccionada y el usuario no es master, redirigir al home
  // (solo los master pueden cambiar la sucursal después de seleccionarla)
  useEffect(() => {
    if (!loadingUser && empresaId && empresa && !isMaster) {
      router.replace('/home')
    }
  }, [empresaId, empresa, isMaster, loadingUser, router])

  // Verificar si hay solo una sucursal y seleccionarla automáticamente
  useEffect(() => {
    const checkAndAutoSelect = async () => {
      // Si ya hay una empresa seleccionada, no hacer nada
      if (empresaId && empresa) {
        setCheckingEmpresas(false)
        return
      }

      try {
        setCheckingEmpresas(true)
        const empresas = await getEnterprises()

        // Si solo hay una sucursal, seleccionarla automáticamente
        if (empresas.length === 1) {
          const unicaEmpresa = empresas[0]
          setEmpresa(unicaEmpresa)
          message.success(
            `Sucursal ${unicaEmpresa.nombre} seleccionada automáticamente`
          )
          // Redirigir al home después de un pequeño delay
          setTimeout(() => {
            router.replace('/home')
          }, 500)
        } else if (empresas.length > 1) {
          // Si hay más de una, mostrar la página de selección
          setShowSelection(true)
        } else {
          // Si no hay sucursales, mostrar mensaje de error
          message.error('No se encontraron sucursales disponibles')
          setShowSelection(true)
        }
      } catch (error) {
        console.error('Error al verificar sucursales:', error)
        message.error('Error al cargar las sucursales')
        setShowSelection(true)
      } finally {
        setCheckingEmpresas(false)
      }
    }

    checkAndAutoSelect()
  }, [empresaId, empresa, setEmpresa, router])

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

  // Mostrar spinner mientras se verifica si hay solo una sucursal
  if (checkingEmpresas) {
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
        <Spin size='large' />
      </div>
    )
  }

  // Si no se debe mostrar la selección (porque ya se seleccionó automáticamente), no renderizar nada
  if (!showSelection) {
    return null
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
              disabled={!isMaster && !!empresaId}
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
