import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SupabaseOrderStore } from '@/lib/supabase-order-store'
import { PrinterSettingsStore } from '@/lib/supabase-printer-settings-store'
import { printerBatchEmail, PrinterOrderData } from '@/lib/email-templates'
import { sendOrderEmail } from '@/lib/smtp-email-service'

const createAdminClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

/**
 * POST /api/admin/orders/[id]/resend-printer
 * Resend a single order to the printer (for re-printing purposes)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Note: In production, add admin authentication check here

    const { id: orderId } = await params

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    console.log(`🖨️ Resending order ${orderId} to printer...`)

    // Get the order
    const order = await SupabaseOrderStore.getById(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if this is a digital-only order (no physical card to print)
    const isDigitalOrder = order.cardConfig?.baseMaterial === 'digital' ||
                           (order.cardConfig as any)?.isDigitalOnly === true
    if (isDigitalOrder) {
      console.log(`⚠️ Order ${orderId} is a digital-only order - cannot send to printer`)
      return NextResponse.json({
        success: false,
        error: 'This is a digital-only order and cannot be sent to printer. No physical card to print.'
      }, { status: 400 })
    }

    // Get printer settings
    const settings = await PrinterSettingsStore.get()
    if (!settings || !settings.printerEmail) {
      return NextResponse.json({
        error: 'Printer email not configured. Please configure in Admin Settings.'
      }, { status: 400 })
    }

    // Fetch Linkist ID and company logo for the order's user (3-strategy lookup)
    let linkistId: string | null = null
    let profileCompanyLogoUrl: string | null = null

    const supabase = createAdminClient()

    if (order.userId) {
      // Strategy 1: profile_users junction table
      const { data: profileUser } = await supabase
        .from('profile_users')
        .select('profiles(custom_url, company_logo_url)')
        .eq('user_id', order.userId)
        .single()
      const profile = profileUser?.profiles as any
      const p = Array.isArray(profile) ? profile[0] : profile
      linkistId = p?.custom_url || null
      profileCompanyLogoUrl = p?.company_logo_url || null

      // Strategy 2: direct profiles.user_id lookup
      if (!linkistId) {
        const { data: directProfile } = await supabase
          .from('profiles')
          .select('custom_url, company_logo_url')
          .eq('user_id', order.userId)
          .single()
        linkistId = directProfile?.custom_url || null
        profileCompanyLogoUrl = directProfile?.company_logo_url || null
      }
    }

    // Strategy 3: fallback by email
    if (!linkistId && order.email) {
      const { data: profileByEmail } = await supabase
        .from('profiles')
        .select('custom_url, company_logo_url')
        .eq('email', order.email)
        .single()
      linkistId = profileByEmail?.custom_url || null
      profileCompanyLogoUrl = profileByEmail?.company_logo_url || null
    }

    // Format order for email
    const printerOrder: PrinterOrderData = {
      orderNumber: order.orderNumber,
      linkistId,
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
        // Use order's companyLogoUrl, falling back to profile's company_logo_url
        companyLogoUrl: (order.cardConfig as any).companyLogoUrl || profileCompanyLogoUrl || null,
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
    }

    // Generate email content
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const emailHtml = printerBatchEmail([printerOrder], today)

    console.log(`📧 Sending RESEND email to ${settings.printerEmail}...`)

    // Send email with RESEND in subject
    const result = await sendOrderEmail({
      to: settings.printerEmail,
      subject: `[RESEND] Linkist Print Order - ${order.orderNumber}`,
      html: emailHtml,
    })

    if (!result.success) {
      console.error('❌ Failed to resend order to printer:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send email'
      }, { status: 500 })
    }

    // Update the order's printer sent status
    await SupabaseOrderStore.markSingleOrderAsSentToPrinter(orderId)

    const response = {
      success: true,
      message: `Order ${order.orderNumber} resent to printer at ${settings.printerEmail}`,
      orderNumber: order.orderNumber,
      messageId: result.id,
      sentAt: new Date().toISOString()
    }

    console.log('✅ Order resent to printer:', response)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Resend to printer error:', error)
    return NextResponse.json(
      { error: 'Failed to resend order to printer', details: String(error) },
      { status: 500 }
    )
  }
}
