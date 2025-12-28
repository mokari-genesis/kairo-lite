'use client'

import React from 'react'
import { Button } from 'antd'
import { EmpresaSelect } from './EmpresaSelect'
import { useEmpresa } from '@/app/empresaContext'
import { useCurrentUser } from '@/app/usuarioContext'

interface PageHeaderProps {
  title: string
  onNewClick?: () => void
  showNewButton?: boolean
  newButtonText?: string
  showSucursalSelect?: boolean
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  onNewClick,
  showNewButton = true,
  newButtonText = 'Nuevo',
  showSucursalSelect = true,
}) => {
  const { empresaId, empresa, setEmpresa } = useEmpresa()
  const { isMaster, loading, rol } = useCurrentUser()

  // Deshabilitar si:
  // 1. No es master (cuando ya tenemos el rol cargado)
  // 2. O si está cargando y no tenemos rol todavía (para evitar habilitar incorrectamente)
  // Pero si tenemos rol desde sessionStorage, isMaster debería estar disponible inmediatamente
  const shouldDisable = loading && !rol ? true : !isMaster

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        width: '100%',
        gap: '16px',
      }}
    >
      <h1 style={{ margin: 0 }}>{title}</h1>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minWidth: 0,
        }}
      >
        <div style={{ minWidth: 260 }}>
          {showSucursalSelect && (
            <EmpresaSelect
              value={empresaId ?? undefined}
              onChange={(_, selectedEmpresa) => {
                setEmpresa(selectedEmpresa)
              }}
              placeholder='Selecciona una sucursal'
              labelValue={empresa ? `Sucursal: ${empresa.nombre}` : undefined}
              disabled={shouldDisable}
            />
          )}
        </div>
        {showNewButton && (
          <Button type='primary' onClick={onNewClick}>
            {newButtonText}
          </Button>
        )}
      </div>
    </div>
  )
}
