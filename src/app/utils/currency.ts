/**
 * Utilidades para formateo de moneda
 */

export const formatCurrency = (
  monedaCodigo?: string,
  monto?: number
): string => {
  const currencyCode = monedaCodigo || 'VES'
  const amount = Number(monto) || 0

  try {
    return new Intl.NumberFormat('es-VE', {
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

export const sumPagos = (pagos: Array<{ monto: number }>): number => {
  return pagos.reduce((sum, pago) => sum + Number(pago.monto || 0), 0)
}

export const calculateSaldo = (total: number, totalPagado: number): number => {
  return Number(total) - Number(totalPagado)
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
