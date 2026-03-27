import type { PrinterOrderData } from './email-templates'

/**
 * Escape a value for CSV (handles commas, quotes, newlines)
 */
function escapeCsv(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Generate a CSV string from printer order data
 */
export function generatePrinterCsv(orders: PrinterOrderData[]): string {
  const headers = [
    'Order Number',
    'Name on Card',
    'Material',
    'Color',
    'Texture',
    'Pattern',
    'Quantity',
    'Ship To Name',
    'Address Line 1',
    'Address Line 2',
    'City',
    'State',
    'Postal Code',
    'Country',
    'Phone',
  ]

  const rows = orders.map(order => [
    order.orderNumber,
    `${order.cardConfig.cardFirstName || order.cardConfig.firstName || ''} ${order.cardConfig.cardLastName || order.cardConfig.lastName || ''}`.trim(),
    order.cardConfig.baseMaterial || 'PVC',
    order.cardConfig.color || order.cardConfig.colour || 'Default',
    order.cardConfig.texture || 'None',
    order.cardConfig.pattern || 'None',
    order.cardConfig.quantity || 1,
    order.shipping.fullName,
    order.shipping.addressLine1,
    order.shipping.addressLine2 || '',
    order.shipping.city,
    order.shipping.state,
    order.shipping.postalCode,
    order.shipping.country,
    order.shipping.phoneNumber,
  ])

  const csvLines = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(',')),
  ]

  return csvLines.join('\r\n')
}
