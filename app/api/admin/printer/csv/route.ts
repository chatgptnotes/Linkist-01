import { NextRequest, NextResponse } from 'next/server'
import { SupabaseOrderStore } from '@/lib/supabase-order-store'
import type { PrinterOrderData } from '@/lib/email-templates'
import { generatePrinterCsv } from '@/lib/printer-csv-generator'

/**
 * GET /api/admin/printer/csv
 * Download CSV of unsent printer orders (manual trigger from admin UI)
 */
export async function GET(request: NextRequest) {
  try {
    // Get unsent orders
    const pendingOrders = await SupabaseOrderStore.getUnsentToPrinter()

    if (pendingOrders.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No pending orders to export',
      }, { status: 404 })
    }

    // Format orders for CSV
    const printerOrders: PrinterOrderData[] = pendingOrders.map(order => ({
      orderNumber: order.orderNumber,
      cardConfig: {
        cardFirstName: order.cardConfig.cardFirstName,
        cardLastName: order.cardConfig.cardLastName,
        firstName: order.cardConfig.firstName,
        lastName: order.cardConfig.lastName,
        title: order.cardConfig.title,
        baseMaterial: order.cardConfig.baseMaterial,
        color: order.cardConfig.color,
        colour: order.cardConfig.colour,
        texture: order.cardConfig.texture,
        pattern: order.cardConfig.pattern,
        quantity: order.cardConfig.quantity || 1,
      },
      shipping: {
        fullName: order.shipping.fullName,
        addressLine1: order.shipping.addressLine1,
        addressLine2: order.shipping.addressLine2,
        city: order.shipping.city,
        state: order.shipping.state,
        country: order.shipping.country,
        postalCode: order.shipping.postalCode,
        phoneNumber: order.shipping.phoneNumber,
      },
    }))

    const csv = generatePrinterCsv(printerOrders)
    const filename = `linkist-print-orders-${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('CSV generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSV', details: String(error) },
      { status: 500 }
    )
  }
}
