import { theme } from 'antd'

/**
 * Utilidad para generar colores adaptativos según el tema (dark/light)
 * Los colores se ajustan automáticamente para mantener buen contraste
 */

// Colores para modo claro (light)
const lightColors = [
  '#d6f7ff', // Azul claro
  '#d9f7be', // Verde claro
  '#ffd8bf', // Naranja claro
  '#efdbff', // Púrpura claro
  '#fff1b8', // Amarillo claro
  '#bae7ff', // Azul más visible
  '#d9f7be', // Verde más visible
  '#ffccc7', // Rojo claro
  '#efdbff', // Púrpura más visible
  '#fff1b8', // Amarillo más visible
]

// Colores para modo oscuro (dark) - versiones más oscuras pero visibles
const darkColors = [
  '#1a3a4a', // Azul oscuro
  '#2d4a2d', // Verde oscuro
  '#4a3a2a', // Naranja oscuro
  '#3a2d4a', // Púrpura oscuro
  '#4a4a2a', // Amarillo oscuro
  '#1a4a5a', // Azul más oscuro
  '#2d5a2d', // Verde más oscuro
  '#5a2a2a', // Rojo oscuro
  '#3a3d5a', // Púrpura más oscuro
  '#5a5a2a', // Amarillo más oscuro
]

/**
 * Genera un color único basado en un ID, adaptado al tema actual
 * @param salesId - ID único para generar el color
 * @param isDark - Si el tema es oscuro
 * @returns Color hexadecimal
 */
export const generateColorForId = (
  salesId: string | number,
  isDark: boolean = false
): string => {
  const colors = isDark ? darkColors : lightColors

  // Convertir el ID a un número y usar módulo para obtener un índice
  const idStr = String(salesId)
  let hash = 0
  for (let i = 0; i < idStr.length; i++) {
    const char = idStr.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convertir a 32bit integer
  }

  return colors[Math.abs(hash) % colors.length]
}

/**
 * Obtiene el color de fondo para filas únicas según el tema
 * @param isDark - Si el tema es oscuro
 * @returns Color hexadecimal
 */
export const getUniqueRowColor = (isDark: boolean = false): string => {
  return isDark ? '#1f1f1f' : '#ffffff'
}

/**
 * Obtiene colores de texto secundario según el tema
 * @param isDark - Si el tema es oscuro
 * @returns Color hexadecimal
 */
export const getSecondaryTextColor = (isDark: boolean = false): string => {
  return isDark ? '#bfbfbf' : '#666666'
}

/**
 * Obtiene colores de borde según el tema
 * @param isDark - Si el tema es oscuro
 * @returns Color hexadecimal
 */
export const getBorderColor = (isDark: boolean = false): string => {
  return isDark ? '#434343' : '#e9ecef'
}

/**
 * Obtiene color de fondo para elementos de información según el tema
 * @param isDark - Si el tema es oscuro
 * @returns Color hexadecimal
 */
export const getInfoBackgroundColor = (isDark: boolean = false): string => {
  return isDark ? '#1a1a1a' : '#f8f9fa'
}

