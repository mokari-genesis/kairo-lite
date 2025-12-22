/**
 * Utilidades para formateo de moneda y conversión
 */

import { Moneda } from '@/app/api/monedas'

export const formatCurrency = (
  monedaCodigo?: string,
  monto?: number
): string => {
  const currencyCode = monedaCodigo || 'VES'
  const amount = Number(monto) || 0

  try {
    return new Intl.NumberFormat(currencyCode === 'VES' ? 'es-VE' : 'es-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch (error) {
    // Fallback si la moneda no es válida
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }
}

/**
 * Convierte un monto de una moneda a la moneda base
 * @param monto - Monto a convertir
 * @param monedaOrigen - Moneda de origen
 * @param monedaBase - Moneda base (es_base = 1)
 * @returns Monto convertido a la moneda base
 */
export const convertirAMonedaBase = (
  monto: number,
  monedaOrigen: Moneda,
  monedaBase: Moneda
): number => {
  if (monedaOrigen.id === monedaBase.id) {
    return Number(monto.toFixed(2))
  }

  // Si la moneda origen es la base, no hay conversión
  if (monedaOrigen.es_base === 1) {
    return Number(monto.toFixed(2))
  }

  // Convertir usando la tasa_vs_base de la moneda origen (siempre 2 decimales)
  const tasaConversion = parseFloat(
    Number(monedaOrigen.tasa_vs_base).toFixed(2)
  )
  const resultado = monto * tasaConversion
  return Number(resultado.toFixed(2))
}

/**
 * Convierte un monto de la moneda base a una moneda específica
 * @param monto - Monto en moneda base
 * @param monedaDestino - Moneda de destino
 * @param monedaBase - Moneda base (es_base = 1)
 * @returns Monto convertido a la moneda destino
 */
export const convertirDesdeMonedaBase = (
  monto: number,
  monedaDestino: Moneda,
  monedaBase: Moneda
): number => {
  if (monedaDestino.id === monedaBase.id) {
    return Number(monto.toFixed(2))
  }

  // Si la moneda destino es la base, no hay conversión
  if (monedaDestino.es_base === 1) {
    return Number(monto.toFixed(2))
  }

  // Convertir usando la tasa_vs_base de la moneda destino (siempre 2 decimales)
  const tasaConversion = parseFloat(
    Number(monedaDestino.tasa_vs_base).toFixed(2)
  )
  const resultado = monto / tasaConversion
  return Number(resultado.toFixed(2))
}

/**
 * Obtiene la moneda base de una lista de monedas
 * @param monedas - Lista de monedas
 * @returns Moneda base o null si no se encuentra
 */
export const obtenerMonedaBase = (monedas: Moneda[]): Moneda | null => {
  return monedas.find(moneda => moneda.es_base === 1) || null
}

export const sumPagos = (pagos: Array<{ monto: number }>): number => {
  return pagos.reduce((sum, pago) => sum + Number(pago.monto || 0), 0)
}

/**
 * Suma pagos usando monto_en_moneda_venta del backend cuando esté disponible
 * Si no está disponible, calcula la conversión manualmente
 * @param pagos - Lista de pagos con información de moneda
 * @param monedaBase - Moneda base para la conversión (solo si no hay monto_en_moneda_venta)
 * @param monedas - Lista de monedas (solo si no hay monto_en_moneda_venta)
 * @returns Suma total en moneda de la venta
 */
export const sumPagosConConversion = (
  pagos: Array<{
    monto: number
    monto_en_moneda_venta?: string | number
    moneda?: Moneda
    moneda_id?: number
  }>,
  monedaBase?: Moneda | null,
  monedas?: Moneda[]
): number => {
  const sumaTotal = pagos.reduce((sum, pago) => {
    // Prioridad 1: Usar monto_en_moneda_venta del backend (ya convertido)
    if (
      pago.monto_en_moneda_venta !== undefined &&
      pago.monto_en_moneda_venta !== null
    ) {
      return sum + Number(pago.monto_en_moneda_venta)
    }

    // Prioridad 2: Si no hay monto_en_moneda_venta, calcular conversión manualmente
    const monto = Number(pago.monto || 0)

    // Si no hay información de moneda o monedaBase, usar el monto directamente
    if (!monedaBase || (!pago.moneda && !pago.moneda_id)) {
      return sum + monto
    }

    // Buscar la moneda del pago
    let monedaPago: Moneda | undefined = pago.moneda
    if (!monedaPago && pago.moneda_id && monedas) {
      monedaPago = monedas.find(m => m.id === pago.moneda_id)
    }

    // Si no se encuentra la moneda, usar el monto directamente
    if (!monedaPago) {
      return sum + monto
    }

    // Convertir a moneda base (ya maneja los 2 decimales internamente)
    const montoConvertido = convertirAMonedaBase(monto, monedaPago, monedaBase)
    return sum + montoConvertido
  }, 0)

  // Asegurar que el resultado final tenga exactamente 2 decimales
  return Number(sumaTotal.toFixed(2))
}

export const calculateSaldo = (total: number, totalPagado: number): number => {
  const saldo = Number(total) - Number(totalPagado)
  return Number(saldo.toFixed(2))
}

export const getCurrencySymbol = (monedaCodigo?: string): string => {
  const currencyCode = monedaCodigo || 'VES'

  try {
    const formatter = new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currencyCode,
    })
    return (
      formatter.formatToParts(0).find(part => part.type === 'currency')
        ?.value || 'Bs'
    )
  } catch (error) {
    return 'Bs'
  }
}

/**
 * Formatea una tasa de conversión a 2 decimales
 * @param tasa - Tasa de conversión
 * @returns Tasa formateada con 2 decimales
 */
export const formatearTasa = (tasa: string | number): string => {
  const tasaNumerica = Number(tasa)
  return tasaNumerica.toFixed(2)
}
