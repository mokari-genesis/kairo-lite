'use client'
import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, message, Image } from 'antd'
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  UserOutlined,
  LockOutlined,
  KeyOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { Auth } from 'aws-amplify'
import { CognitoUser } from 'amazon-cognito-identity-js'
import { withAuth } from '../auth/withAuth'
import '@ant-design/v5-patch-for-react-19'
import { motion } from 'framer-motion'

const { Title, Text } = Typography

function SignIn() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [resetPassword, setResetPassword] = useState(false)
  const [confirmCode, setConfirmCode] = useState(false)
  const [showPassword, setShowPassword] = useState(true)

  const handleSubmit = async (values: any) => {
    if (loading) return

    message.info('Iniciando sesión...')

    try {
      setLoading(true)
      const { email, code, password } = values
      if (confirmCode && resetPassword) {
        await Auth.forgotPasswordSubmit(email, code, password)
        setConfirmCode(false)
        setResetPassword(false)
        setShowPassword(true)
        message.success(
          'La contraseña ha sido reestablecida de manera correcta'
        )
      } else if (resetPassword) {
        await Auth.forgotPassword(email)
        setConfirmCode(true)
        setShowPassword(true)
      } else {
        const signIn: CognitoUser = await Auth.signIn({
          username: email,
          password,
        })

        if (signIn.challengeName === 'NEW_PASSWORD_REQUIRED') {
          await Auth.completeNewPassword(signIn, password)
        }

        router.replace('/home')
      }
    } catch (error: any) {
      message.error(error.message || 'Usuario y/o contraseña no válidos')
    } finally {
      setLoading(false)
    }
  }

  const switchBehavior = () => {
    setResetPassword(prev => !prev)
    if (confirmCode) {
      setConfirmCode(prev => !prev)
      setShowPassword(true)
      return
    }
    setShowPassword(prev => !prev)
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
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Card
          style={{
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            paddingBottom: 20,
            marginRight: 20,
            marginLeft: 20,
          }}
        >
          <div
            style={{
              textAlign: 'center',
            }}
          >
            <Image
              src='https://krediya-bucket.s3.us-east-1.amazonaws.com/Kairo.png'
              alt='Logo'
              preview={false}
              width={200}
              height={200}
              style={{
                objectFit: 'contain',
              }}
            />
            <Title
              level={2}
              style={{
                //margin: '8px 0 0',
                fontWeight: 600,
                color: '#1a365d',
              }}
            >
              {resetPassword ? 'Reiniciar contraseña' : 'Bienvenido'}
            </Title>
            {!resetPassword && (
              <Text
                style={{
                  color: '#718096',
                  display: 'block',
                  marginTop: '8px',
                  marginBottom: '20px',
                }}
              >
                Accede a tu cuenta para continuar
              </Text>
            )}
          </div>

          <Form
            form={form}
            layout='vertical'
            onFinish={handleSubmit}
            autoComplete='off'
            size='large'
          >
            <Form.Item
              name='email'
              rules={[
                { required: true, message: 'Por favor ingresa tu email' },
                { type: 'string', message: 'Ingresa un email válido' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder='Email'
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            {showPassword && (
              <Form.Item
                name='password'
                rules={[
                  {
                    required: true,
                    message: 'Por favor ingresa tu contraseña',
                  },
                  {
                    min: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres',
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder={confirmCode ? 'Nueva contraseña' : 'Contraseña'}
                  iconRender={visible =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            )}

            {confirmCode && (
              <Form.Item
                name='code'
                rules={[
                  { required: true, message: 'Por favor ingresa el código' },
                ]}
              >
                <Input
                  prefix={<KeyOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder='Código de validación'
                  type='number'
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type='primary'
                htmlType='submit'
                loading={loading}
                block
                size='large'
                style={{
                  height: '50px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  backgroundColor: '#a2e3f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1a365d',
                }}
                icon={<ArrowRightOutlined />}
              >
                {resetPassword ? 'REINICIAR' : 'INGRESAR'}
              </Button>
            </Form.Item>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                gap: '8px',
                marginTop: '16px',
              }}
            >
              {/* {!resetPassword && (
                <Button
                  type='link'
                  onClick={switchBehavior}
                  style={{
                    fontWeight: 'bold',
                    color: '#1a365d',
                    padding: 0,
                    height: 'auto',
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              )} */}

              {resetPassword && (
                <Button
                  type='link'
                  onClick={switchBehavior}
                  style={{
                    fontWeight: 'bold',
                    color: '#a2e3f0',
                    padding: 0,
                    height: 'auto',
                  }}
                >
                  Volver al inicio de sesión
                </Button>
              )}
            </div>

            {/* <div style={{ 
            marginTop: '24px',
            textAlign: 'center'
          }}>
            <Divider plain style={{ fontSize: '12px', color: '#718096' }}>
              ¿No tienes una cuenta?
            </Divider>
            <Button 
              type="default"
              onClick={() => router.replace('/signUp')}
              block
              style={{
                borderRadius: '8px',
                height: '46px',
                border: '1px solid #4c51bf',
                color: '#4c51bf',
                fontWeight: 600
              }}
            >
              CREAR CUENTA
            </Button>
          </div> */}
          </Form>
        </Card>
      </motion.div>
    </div>
  )
}

export default withAuth(SignIn)
