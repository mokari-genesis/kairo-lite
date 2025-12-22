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
  {
    pattern:
      'Cannot delete or update a parent row: a foreign key constraint fails (`kairo_db_lite`.`transferencias_inventario_detalle`, CONSTRAINT `fk_tid_prod` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`))',
    message:
      'No se puede eliminar el producto porque tiene transferencias asociadas,\n👉 Acción recomendada: Marcá el producto como inactivo en vez de eliminarlo.',
  },

  // Aquí puedes añadir más patrones de error y sus mensajes amigables
]

export const getFriendlyErrorMessage = (error: string): string => {
  const matchedError = errorMessages.find(errorMessage =>
    error.includes(errorMessage.pattern)
  )

  return matchedError?.message || error || 'Error inesperado'
}
