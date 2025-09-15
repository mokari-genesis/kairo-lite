import React from 'react'

interface SummaryItem {
  title: string
  value: number | string
  prefix?: string
  color?: string
  isInteger?: boolean // Nuevo campo para indicar si debe mostrarse como entero
}

interface SummaryCardsProps {
  items: SummaryItem[]
  style?: React.CSSProperties
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ items, style }) => {
  return (
    <div
      style={{
        marginTop: '24px',
        padding: '16px',
        background: '#fafafa',
        borderRadius: '8px',
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: '16px',
        ...style,
      }}
    >
      {items.map((item, index) => (
        <div key={index} style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#666' }}>{item.title}</h3>
          <p
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              margin: 0,
              color: item.color || '#1890ff',
            }}
          >
            {item.prefix || ''}
            {typeof item.value === 'number'
              ? item.isInteger
                ? Math.round(item.value).toString()
                : item.value.toFixed(2)
              : item.value}
          </p>
        </div>
      ))}
    </div>
  )
}
