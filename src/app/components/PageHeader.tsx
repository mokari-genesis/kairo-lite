'use client'

import React from 'react'
import { Button } from 'antd'

interface PageHeaderProps {
  title: string
  onNewClick?: () => void
  showNewButton?: boolean
  newButtonText?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  onNewClick,
  showNewButton = true,
  newButtonText = 'Nuevo',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        width: '100%',
      }}
    >
      <h1 style={{ margin: 0 }}>{title}</h1>
      {showNewButton && (
        <Button type='primary' onClick={onNewClick}>
          {newButtonText}
        </Button>
      )}
    </div>
  )
}
