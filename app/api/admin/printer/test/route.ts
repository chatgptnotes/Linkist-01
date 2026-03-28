import { NextRequest, NextResponse } from 'next/server'
import { SupabaseOrderStore } from '@/lib/supabase-order-store'

/**
 * POST /api/admin/printer/test
 * Creates a test NFC card order to verify the printer email/CSV pipeline
 */
export async function POST(request: NextRequest) {
  try {
    const testOrder = await SupabaseOrderStore.create({
      orderNumber: `TEST-${Date.now().toString(36).toUpperCase()}`,
      status: 'confirmed',
      customerName: 'Test User',
      email: 'test@linkist.ai',
      phoneNumber: '+919876543210',
      cardConfig: {
        firstName: 'TEST',
        lastName: 'CARD',
        cardFirstName: 'TEST',
        cardLastName: 'CARD',
        baseMaterial: 'pvc',
        color: 'black',
        texture: 'matte',
        pattern: 'Geometric',
        patternKey: 'geometric',
        quantity: 1,
        planType: 'signature',
      },
      shipping: {
        fullName: 'Test User',
        addressLine1: '123 Test Street',
        addressLine2: 'Suite 100',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400001',
        phoneNumber: '+919876543210',
      },
      pricing: {
        subtotal: 129,
        shipping: 0,
        tax: 0,
        total: 129,
      },
      emailsSent: {},
    })

    return NextResponse.json({
      success: true,
      message: 'Test order created. Now trigger /api/admin/printer/send to test the email.',
      order: {
        id: testOrder.id,
        orderNumber: testOrder.orderNumber,
        status: testOrder.status,
      },
    })
  } catch (error) {
    console.error('Failed to create test order:', error)
    return NextResponse.json(
      { error: 'Failed to create test order', details: String(error) },
      { status: 500 }
    )
  }
}
