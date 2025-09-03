interface ErrorMessage {
  pattern: string
  message: string
}

const errorMessages: ErrorMessage[] = [
  {
    pattern:
      'duplicate key value violates unique constraint "productos_codigo_key"',
    message: 'El código o serie del producto ya existe',
  },
  {
    pattern: 'La venta no existe o ya está cancelada',
    message: 'La venta ya se encuentra cancelada',
  },
  // Aquí puedes añadir más patrones de error y sus mensajes amigables
]

export const getFriendlyErrorMessage = (error: string): string => {
  const matchedError = errorMessages.find(errorMessage =>
    error.includes(errorMessage.pattern)
  )

  return matchedError?.message || error || 'Error inesperado'
}
