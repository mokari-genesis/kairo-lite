/**
 * Utilidades para formateo de moneda y conversión
 */

import { Moneda } from '@/app/api/monedas'

export const formatCurrency = (
  monedaCodigo?: string,
  monto?: number
): string => {
  const currencyCode = monedaCodigo || 'USD'
  const amount = Number(monto) || 0

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch (error) {
    // Fallback si la moneda no es válida
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }
}

/**
 * Convierte un monto de una moneda a la moneda base (USD)
 * Valida que la moneda base sea USD
 * @param monto - Monto a convertir
 * @param monedaOrigen - Moneda de origen
 * @param monedaBase - Moneda base (debe ser USD)
 * @returns Monto convertido a la moneda base
 */
export const convertirAMonedaBase = (
  monto: number,
  monedaOrigen: Moneda,
  monedaBase: Moneda
): number => {
  // Validar que la moneda base sea USD
  if (monedaBase.codigo !== 'USD') {
    console.warn(
      `Advertencia: La moneda base proporcionada (${monedaBase.codigo}) no es USD. Solo USD puede ser moneda base.`
    )
  }

  if (monedaOrigen.id === monedaBase.id) {
    return Number(monto.toFixed(2))
  }

  // Si la moneda origen es la base, no hay conversión
  if (monedaOrigen.es_base === 1) {
    return Number(monto.toFixed(2))
  }

  // Validar tasas
  const tasaFrom = Number(monedaOrigen.tasa_vs_base)
  const tasaTo = Number(monedaBase.tasa_vs_base)
  
  if (!tasaFrom || !tasaTo || tasaFrom <= 0 || tasaTo <= 0 || !isFinite(tasaFrom) || !isFinite(tasaTo)) {
    throw new Error(
      `tasa_vs_base inválida para las monedas. Origen: ${monedaOrigen.codigo} (${tasaFrom}), Base: ${monedaBase.codigo} (${tasaTo})`
    )
  }

  // Convertir usando la misma lógica que convertirEntreMonedas
  // tasa_vs_base significa: cuántas unidades de esta moneda = 1 USD
  // Ejemplo: si GTQ tiene tasa_vs_base = 7.8, significa 7.8 GTQ = 1 USD
  // Para convertir GTQ a USD: monto_usd = monto_gtq * (tasa_usd / tasa_gtq) = monto_gtq * (1 / 7.8)
  const tasa = tasaTo / tasaFrom
  const resultado = monto * tasa
  return Number(resultado.toFixed(2))
}

/**
 * Convierte un monto de la moneda base (USD) a una moneda específica
 * Valida que la moneda base sea USD
 * @param monto - Monto en moneda base
 * @param monedaDestino - Moneda de destino
 * @param monedaBase - Moneda base (debe ser USD)
 * @returns Monto convertido a la moneda destino
 */
export const convertirDesdeMonedaBase = (
  monto: number,
  monedaDestino: Moneda,
  monedaBase: Moneda
): number => {
  // Validar que la moneda base sea USD
  if (monedaBase.codigo !== 'USD') {
    console.warn(
      `Advertencia: La moneda base proporcionada (${monedaBase.codigo}) no es USD. Solo USD puede ser moneda base.`
    )
  }

  if (monedaDestino.id === monedaBase.id) {
    return Number(monto.toFixed(2))
  }

  // Si la moneda destino es la base, no hay conversión
  if (monedaDestino.es_base === 1) {
    return Number(monto.toFixed(2))
  }

  // Validar tasa_vs_base
  const tasaConversion = Number(monedaDestino.tasa_vs_base)
  if (!tasaConversion || tasaConversion <= 0 || !isFinite(tasaConversion)) {
    throw new Error(
      `tasa_vs_base inválida para la moneda ${monedaDestino.codigo}: ${monedaDestino.tasa_vs_base}`
    )
  }

  // Convertir usando la tasa_vs_base de la moneda destino
  // tasa_vs_base significa: cuántas unidades de esta moneda = 1 USD
  // Ejemplo: si GTQ tiene tasa_vs_base = 7.8, significa 7.8 GTQ = 1 USD
  // Para convertir USD a GTQ: monto_gtq = monto_usd * 7.8
  const resultado = monto * tasaConversion
  return Number(resultado.toFixed(2))
}

/**
 * Obtiene la moneda base de una lista de monedas
 * Valida que sea USD (única moneda base permitida)
 * @param monedas - Lista de monedas
 * @returns Moneda base (USD) o null si no se encuentra
 */
export const obtenerMonedaBase = (monedas: Moneda[]): Moneda | null => {
  const monedaBase = monedas.find(moneda => moneda.es_base === 1)
  
  // Validar que la moneda base sea USD
  if (monedaBase && monedaBase.codigo !== 'USD') {
    console.warn(
      `Advertencia: La moneda base encontrada (${monedaBase.codigo}) no es USD. Solo USD puede ser moneda base.`
    )
    // Buscar USD específicamente
    const usd = monedas.find(moneda => moneda.codigo === 'USD')
    if (usd) {
      return usd
    }
  }
  
  // Si no hay moneda base pero existe USD, retornar USD
  if (!monedaBase) {
    const usd = monedas.find(moneda => moneda.codigo === 'USD')
    if (usd) {
      console.warn('Advertencia: USD no está marcado como moneda base, pero se usará como tal.')
      return usd
    }
  }
  
  return monedaBase || null
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
  const currencyCode = monedaCodigo || 'USD'

  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    })
    return (
      formatter.formatToParts(0).find(part => part.type === 'currency')
        ?.value || '$'
    )
  } catch (error) {
    return '$'
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

/**
 * Convierte un monto de una moneda a otra directamente usando tasa_vs_base
 * Valida que las tasas sean válidas antes de convertir
 * @param monto - Monto a convertir
 * @param monedaOrigen - Moneda de origen
 * @param monedaDestino - Moneda de destino
 * @returns Objeto con el monto convertido y la tasa de conversión
 */
export const convertirEntreMonedas = (
  monto: number,
  monedaOrigen: Moneda,
  monedaDestino: Moneda
): { montoConvertido: number; tasa: number } => {
  if (monedaOrigen.id === monedaDestino.id) {
    return {
      montoConvertido: Number(monto.toFixed(monedaDestino.decimales || 2)),
      tasa: 1.0,
    }
  }

  const tasaFrom = Number(monedaOrigen.tasa_vs_base || 1)
  const tasaTo = Number(monedaDestino.tasa_vs_base || 1)

  // Validar que las tasas sean válidas
  if (!tasaFrom || !tasaTo || tasaFrom <= 0 || tasaTo <= 0 || !isFinite(tasaFrom) || !isFinite(tasaTo)) {
    throw new Error(
      `Falta tasa_vs_base válida en monedas para convertir el monto. Origen: ${monedaOrigen.codigo} (${tasaFrom}), Destino: ${monedaDestino.codigo} (${tasaTo})`
    )
  }

  // Validar que la moneda base (USD) tenga tasa = 1
  if (monedaOrigen.es_base === 1 && tasaFrom !== 1.0) {
    console.warn(
      `Advertencia: La moneda base ${monedaOrigen.codigo} tiene tasa_vs_base = ${tasaFrom}, debería ser 1.0`
    )
  }
  if (monedaDestino.es_base === 1 && tasaTo !== 1.0) {
    console.warn(
      `Advertencia: La moneda base ${monedaDestino.codigo} tiene tasa_vs_base = ${tasaTo}, debería ser 1.0`
    )
  }

  // Calcular tasa de conversión correcta
  // tasa_vs_base significa: cuántas unidades de esta moneda = 1 USD
  // Ejemplo: EUR tiene tasa_vs_base = 0.86 (0.86 EUR = 1 USD)
  //          GTQ tiene tasa_vs_base = 7.66 (7.66 GTQ = 1 USD)
  // Para convertir EUR a GTQ:
  // 1. Convertir EUR a USD: monto_usd = monto_eur / tasa_eur = monto_eur / 0.86
  // 2. Convertir USD a GTQ: monto_gtq = monto_usd * tasa_gtq = monto_usd * 7.66
  // Combinado: monto_gtq = monto_eur * (tasa_gtq / tasa_eur) = monto_eur * (7.66 / 0.86)
  // Por lo tanto: tasa = tasaTo / tasaFrom
  const tasa = tasaTo / tasaFrom
  const montoConvertido = Number(
    (monto * tasa).toFixed(monedaDestino.decimales || 2)
  )

  return { montoConvertido, tasa }
}
