'use client'

import React, { useState } from 'react'
import { Table, Button, Space, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  PrinterOutlined,
} from '@ant-design/icons'
import { EditDrawer } from './EditDrawer'
import { ReactNode } from 'react'

export interface ColumnConfig {
  key: string
  title: string
  dataIndex: string
  type?: 'text' | 'number' | 'date' | 'select' | 'supplier' | 'action'
  options?: { value: any; label: string }[]
  render?: (value: any, record: any, actions?: any) => ReactNode
  hidden?: boolean
  disabled?: boolean
  textAlign?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  data: T[]
  columns: ColumnConfig[]
  onEdit?: (record: T) => void
  onView?: (record: T) => void
  onCheck?: (record: T) => void
  onDelete?: (record: T) => void
  onCancel?: (record: T) => void
  onPrintTicket?: (record: T) => void
  onManagePrecios?: (record: T) => void
  loading?: boolean
  pagination?: {
    total: number
    pageSize: number
    current: number
    onChange: (page: number, pageSize: number) => void
  }
  showActions?: boolean
  showDelete?: boolean
  showView?: boolean
  showPrintTicket?: boolean
  expandable?: {
    expandedRowRender: (record: any) => ReactNode
    rowExpandable?: (record: any) => boolean
    defaultExpandAllRows?: boolean
    expandRowByClick?: boolean
    expandIcon?: (props: any) => ReactNode
    expandedRowKeys?: readonly React.Key[]
    defaultExpandedRowKeys?: readonly React.Key[]
    onExpand?: (expanded: boolean, record: any) => void
    onExpandedRowsChange?: (expandedKeys: readonly React.Key[]) => void
  }
  deleteTooltip?: string
  editTooltip?: string
  viewTooltip?: string
  checkTooltip?: string
  cancelTooltip?: string
  printTicketTooltip?: string
}

export const DataTable = <T extends { id?: string | number }>({
  data,
  columns,
  onEdit,
  onView,
  onCheck,
  onDelete,
  onCancel,
  onPrintTicket,
  onManagePrecios,
  loading = false,
  pagination,
  showActions = true,
  showDelete = true,
  showView = false,
  showPrintTicket = false,
  expandable,
  deleteTooltip = 'Eliminar',
  cancelTooltip = 'Cancelar',
  editTooltip = 'Editar',
  viewTooltip = 'Ver detalles',
  checkTooltip = 'Marcar como vendido',
  printTicketTooltip = 'Imprimir Etiqueta',
}: DataTableProps<T>) => {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<T | null>(null)

  const handleEdit = (record: T) => {
    setSelectedRecord(record)
    setIsEditDrawerOpen(true)
  }

  const handleClose = () => {
    setIsEditDrawerOpen(false)
    setSelectedRecord(null)
  }

  const handleView = (record: T) => {
    onView && onView(record)
    // setSelectedRecord(record)
    // setIsEditDrawerOpen(true)
  }

  const renderCell = (record: T, column: ColumnConfig): ReactNode => {
    if (column.render) {
      const actions = {
        onManagePrecios,
      }
      return column.render(record[column.dataIndex as keyof T], record, actions)
    }
    const value = record[column.dataIndex as keyof T]
    return value !== undefined && value !== null ? String(value) : ''
  }

  const Body = () => (
    <tbody>
      {data.map((record, index) => (
        <tr key={`row-${record.id || index}`}>
          {columns.map(column => (
            <td key={`cell-${column.key}-${record.id || index}`}>
              {renderCell(record, column)}
            </td>
          ))}
          {showActions && (
            <td key={`actions-${record.id || index}`}>
              <Space>
                {onCheck && (
                  <Tooltip title={checkTooltip}>
                    <Button
                      type='text'
                      icon={<CheckCircleOutlined />}
                      onClick={() => onCheck(record)}
                    />
                  </Tooltip>
                )}
                {showView && onView && (
                  <Tooltip title={viewTooltip}>
                    <Button
                      type='text'
                      icon={<EyeOutlined />}
                      onClick={() => {
                        onView(record)
                      }}
                    />
                  </Tooltip>
                )}
                {onEdit && (
                  <Tooltip title={editTooltip}>
                    <Button
                      type='text'
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                    />
                  </Tooltip>
                )}
                {onCancel && (
                  <Tooltip title={cancelTooltip}>
                    <Button
                      type='text'
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => onCancel(record)}
                    />
                  </Tooltip>
                )}
                {showPrintTicket && onPrintTicket && (
                  <Tooltip title={printTicketTooltip}>
                    <Button
                      type='text'
                      icon={<PrinterOutlined />}
                      onClick={() => onPrintTicket(record)}
                    />
                  </Tooltip>
                )}
                {showDelete && onDelete && (
                  <Tooltip title={deleteTooltip}>
                    <Button
                      type='text'
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => onDelete(record)}
                    />
                  </Tooltip>
                )}
              </Space>
            </td>
          )}
        </tr>
      ))}
    </tbody>
  )

  const tableColumns: ColumnsType<T> = [
    ...columns.map(column => ({
      key: column.key,
      title: column.title,
      dataIndex: column.dataIndex,
      render: column.render
        ? (value: any, record: T) => {
            const actions = {
              onManagePrecios,
            }
            return column.render!(value, record, actions)
          }
        : undefined,
    })),
    ...(showActions
      ? [
          {
            key: 'actions',
            title: 'Acciones',
            render: (_: unknown, record: T) => (
              <Space>
                {onCheck && (
                  <Tooltip title={checkTooltip}>
                    <Button
                      type='text'
                      icon={<CheckCircleOutlined />}
                      onClick={() => onCheck(record)}
                    />
                  </Tooltip>
                )}
                {onView && showView && (
                  <Tooltip title={viewTooltip}>
                    <Button
                      type='text'
                      icon={<EyeOutlined />}
                      onClick={() => handleView(record)}
                    />
                  </Tooltip>
                )}
                {onEdit && (
                  <Tooltip title={editTooltip}>
                    <Button
                      type='text'
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                    />
                  </Tooltip>
                )}
                {onCancel && (
                  <Tooltip title={cancelTooltip}>
                    <Button
                      type='text'
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => onCancel(record)}
                    />
                  </Tooltip>
                )}
                {showPrintTicket && onPrintTicket && (
                  <Tooltip title={printTicketTooltip}>
                    <Button
                      type='text'
                      icon={<PrinterOutlined />}
                      onClick={() => onPrintTicket(record)}
                    />
                  </Tooltip>
                )}
                {showDelete && onDelete && (
                  <Tooltip title={deleteTooltip}>
                    <Button
                      type='text'
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => onDelete(record)}
                    />
                  </Tooltip>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ]

  const editFields = columns
    .filter(column => column.type !== 'action')
    .map(column => ({
      key: column.dataIndex,
      label: column.title,
      type: (column.type === 'number' ? 'text' : column.type) || 'text',
      options: column.options,
      hidden: column.hidden,
      disabled: column.disabled,
    }))

  return (
    <>
      <Table
        columns={tableColumns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        rowKey={record => `row-${record.id || Math.random()}`}
        style={{
          marginTop: '16px',
        }}
        scroll={{ x: 'max-content' }}
        expandable={{
          ...expandable,
        }}
      >
        <Body />
      </Table>

      <EditDrawer
        showView={showView}
        visible={isEditDrawerOpen}
        onClose={handleClose}
        data={selectedRecord}
        fields={editFields}
        onSave={async updatedData => {
          if (onEdit) {
            await onEdit(updatedData as T)
          }
          handleClose()
        }}
      />
    </>
  )
}
