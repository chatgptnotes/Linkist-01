import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { SupabaseOrderStore, generateOrderNumber } from '@/lib/supabase-order-store';
import { SupabaseUserStore } from '@/lib/supabase-user-store';
import { SupabasePaymentStore } from '@/lib/supabase-payment-store';
import { SupabaseShippingAddressStore } from '@/lib/supabase-shipping-address-store';
import { emailService } from '@/lib/email-service';
import { formatOrderForEmail } from '@/lib/order-store';
import type { OrderData } from '@/lib/email-templates';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ received: true });
  }

  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature');

  if (!endpointSecret || !signature) {
    console.error('Missing webhook secret or signature');
    return NextResponse.json(
      { error: 'Missing webhook configuration' },
      { status: 400 }
    );
  }

  let event;

  try {
    // Initialize Stripe only when needed
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (error) {
    console.error('Webhook signature verification failed');
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handlePaymentFailure(failedPayment);
        break;

      case 'payment_method.attached':
        // Payment method attached - no action needed
        break;

      default:
        // Unhandled event type
        break;
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error handling webhook:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Webhook handling failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: any) {
  try {
    const email = paymentIntent.receipt_email || paymentIntent.metadata?.email;

    if (!email) {
      return;
    }

    // Create/update user in database
    const user = await SupabaseUserStore.upsertByEmail({
      email: email,
      first_name: paymentIntent.metadata?.firstName || null,
      last_name: paymentIntent.metadata?.lastName || null,
      phone_number: paymentIntent.metadata?.phone || paymentIntent.metadata?.mobile || null,
      email_verified: true,
      mobile_verified: !!(paymentIntent.metadata?.phone || paymentIntent.metadata?.mobile),
    });

    // Determine plan type for order ID generation
    // Stripe webhook typically processes paid orders (Digital Profile + App or NFC Card)
    const baseMaterial = paymentIntent.metadata?.baseMaterial || 'pvc';
    const isDigitalOnly = paymentIntent.metadata?.isDigitalOnly === 'true';
    const totalAmount = paymentIntent.amount / 100;

    let planType: 'digital-only' | 'digital-profile-app' | 'nfc-card-full' = 'nfc-card-full';

    if (isDigitalOnly && totalAmount === 0) {
      planType = 'digital-only';
    } else if (baseMaterial === 'digital' || isDigitalOnly) {
      planType = 'digital-profile-app';
    } else {
      planType = 'nfc-card-full';
    }

    // Generate order number with plan-specific prefix
    const orderNumber = await generateOrderNumber(planType);

    // Create order in database
    const order = await SupabaseOrderStore.create({
      orderNumber,
      userId: user.id, // Link order to user
      status: 'confirmed',
      customerName: paymentIntent.metadata?.customerName || email.split('@')[0],
      email,
      phoneNumber: paymentIntent.metadata?.phone || paymentIntent.metadata?.mobile || '',
      cardConfig: {
        firstName: paymentIntent.metadata?.firstName || 'Customer',
        lastName: paymentIntent.metadata?.lastName || '',
        title: paymentIntent.metadata?.title || 'Professional',
        mobile: paymentIntent.metadata?.mobile,
        whatsapp: paymentIntent.metadata?.whatsapp === 'true',
        quantity: parseInt(paymentIntent.metadata?.quantity || '1'),
        baseMaterial: baseMaterial,
        isDigitalOnly: isDigitalOnly
      },
      shipping: {
        fullName: paymentIntent.metadata?.shippingName || paymentIntent.metadata?.customerName || 'Customer',
        addressLine1: paymentIntent.metadata?.addressLine1 || 'Address Line 1',
        addressLine2: paymentIntent.metadata?.addressLine2 || '',
        city: paymentIntent.metadata?.city || 'City',
        state: paymentIntent.metadata?.state || 'State',
        country: paymentIntent.metadata?.country || 'Country',
        postalCode: paymentIntent.metadata?.postalCode || '00000',
        phoneNumber: paymentIntent.metadata?.phone || paymentIntent.metadata?.mobile || ''
      },
      pricing: {
        subtotal: parseFloat(paymentIntent.metadata?.subtotal || '0'),
        shipping: parseFloat(paymentIntent.metadata?.shipping || '0'),
        tax: parseFloat(paymentIntent.metadata?.tax || '0'),
        total: paymentIntent.amount / 100 // Convert from cents
      },
      estimatedDelivery: calculateEstimatedDelivery(),
      emailsSent: {}
    });

    // Create payment record in payments table
    try {
      await SupabasePaymentStore.create({
        orderId: order.id,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount, // Already in cents
        currency: paymentIntent.currency.toUpperCase(),
        status: 'succeeded',
        paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
        stripeFee: paymentIntent.charges?.data?.[0]?.application_fee_amount || 0,
        netAmount: paymentIntent.amount - (paymentIntent.charges?.data?.[0]?.application_fee_amount || 0),
        metadata: {
          stripeCustomerId: paymentIntent.customer,
          receiptUrl: paymentIntent.charges?.data?.[0]?.receipt_url,
        },
      });
    } catch (paymentError) {
      // Continue even if payment record creation fails
      // Order is already created
    }

    // Create shipping address record
    try {
      await SupabaseShippingAddressStore.create({
        userId: user.id,
        orderId: order.id,
        fullName: paymentIntent.metadata?.shippingName || paymentIntent.metadata?.customerName || 'Customer',
        addressLine1: paymentIntent.metadata?.addressLine1 || 'Address Line 1',
        addressLine2: paymentIntent.metadata?.addressLine2 || undefined,
        city: paymentIntent.metadata?.city || 'City',
        state: paymentIntent.metadata?.state || undefined,
        postalCode: paymentIntent.metadata?.postalCode || '00000',
        country: paymentIntent.metadata?.country || 'Country',
        phoneNumber: paymentIntent.metadata?.phone || paymentIntent.metadata?.mobile || undefined,
        isDefault: false,
      });
    } catch (addressError) {
      // Continue even if shipping address creation fails
      // Order is already created
    }

    // Send automated confirmation and receipt emails
    const orderData = formatOrderForEmail(order);
    const emailResults = await emailService.sendOrderLifecycleEmails(orderData);

    // Update order with email tracking
    await SupabaseOrderStore.update(order.id, {
      emailsSent: {
        confirmation: {
          sent: emailResults.confirmation.success,
          timestamp: Date.now(),
          messageId: emailResults.confirmation.messageId
        },
        receipt: {
          sent: emailResults.receipt.success,
          timestamp: Date.now(),
          messageId: emailResults.receipt.messageId
        }
      }
    });

  } catch (error) {
    console.error('Error processing payment success:', error instanceof Error ? error.message : 'Unknown error');
    throw error; // Re-throw to trigger webhook retry
  }
}

// Helper function to calculate estimated delivery date
function calculateEstimatedDelivery(): string {
  const now = new Date();
  const deliveryDate = new Date(now);
  deliveryDate.setDate(now.getDate() + 7); // 7 business days from now

  return deliveryDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

async function handlePaymentFailure(paymentIntent: any) {
  try {
    const email = paymentIntent.receipt_email || paymentIntent.metadata?.email;

    if (!email) {
      return;
    }

    // Check if there's an existing pending order for this payment intent
    // (This would be created during the initial checkout process)
    const orderId = paymentIntent.metadata?.orderId;

    if (orderId) {
      // Update existing order status to cancelled due to payment failure
      const updatedOrder = await SupabaseOrderStore.updateStatus(orderId, 'cancelled', {
        notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown payment error'}`
      });

      if (updatedOrder) {
        // Create failed payment record for the existing order
        try {
          await SupabasePaymentStore.create({
            orderId: orderId,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency.toUpperCase(),
            status: 'failed',
            paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
            failureReason: paymentIntent.last_payment_error?.message || 'Unknown payment error',
            metadata: {
              errorCode: paymentIntent.last_payment_error?.code,
              errorType: paymentIntent.last_payment_error?.type,
              declineCode: paymentIntent.last_payment_error?.decline_code,
            },
          });
        } catch (err) {
          // Continue even if payment record creation fails
        }
      }
      return; // Exit early since we handled the existing order
    }

    // Create failed payment record for analysis and potential retry
    const failedPaymentData = {
      orderNumber: `LNK-FAILED-${Date.now().toString().slice(-8)}`,
      status: 'cancelled' as const,
      customerName: paymentIntent.metadata?.customerName || email.split('@')[0],
      email,
      phoneNumber: paymentIntent.metadata?.phone || paymentIntent.metadata?.mobile || '',
      cardConfig: {
        firstName: paymentIntent.metadata?.firstName || 'Customer',
        lastName: paymentIntent.metadata?.lastName || '',
        title: paymentIntent.metadata?.title || 'Professional',
        mobile: paymentIntent.metadata?.mobile,
        whatsapp: paymentIntent.metadata?.whatsapp === 'true',
        quantity: parseInt(paymentIntent.metadata?.quantity || '1')
      },
      shipping: {
        fullName: paymentIntent.metadata?.shippingName || paymentIntent.metadata?.customerName || 'Customer',
        addressLine1: paymentIntent.metadata?.addressLine1 || 'Address Line 1',
        addressLine2: paymentIntent.metadata?.addressLine2 || '',
        city: paymentIntent.metadata?.city || 'City',
        state: paymentIntent.metadata?.state || 'State',
        country: paymentIntent.metadata?.country || 'Country',
        postalCode: paymentIntent.metadata?.postalCode || '00000',
        phoneNumber: paymentIntent.metadata?.phone || paymentIntent.metadata?.mobile || ''
      },
      pricing: {
        subtotal: parseFloat(paymentIntent.metadata?.subtotal || '0'),
        shipping: parseFloat(paymentIntent.metadata?.shipping || '0'),
        tax: parseFloat(paymentIntent.metadata?.tax || '0'),
        total: paymentIntent.amount / 100 // Convert from cents
      },
      notes: `Payment failed - Stripe Payment Intent: ${paymentIntent.id}\nError: ${paymentIntent.last_payment_error?.message}\nError Code: ${paymentIntent.last_payment_error?.code}\nDecline Code: ${paymentIntent.last_payment_error?.decline_code || 'N/A'}`,
      emailsSent: {}
    };

    // Create failed order record for analysis
    const failedOrder = await SupabaseOrderStore.create(failedPaymentData);

    // Create failed payment record in payments table
    try {
      await SupabasePaymentStore.create({
        orderId: failedOrder.id,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount, // Already in cents
        currency: paymentIntent.currency.toUpperCase(),
        status: 'failed',
        paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
        failureReason: paymentIntent.last_payment_error?.message || 'Unknown payment error',
        metadata: {
          errorCode: paymentIntent.last_payment_error?.code,
          errorType: paymentIntent.last_payment_error?.type,
          declineCode: paymentIntent.last_payment_error?.decline_code,
          stripeCustomerId: paymentIntent.customer,
        },
      });
    } catch (paymentError) {
      // Continue even if payment record creation fails
    }

  } catch (error) {
    // Don't throw error for payment failures - we don't want webhook retries for failed payments
  }
}

// Disable body parsing for webhooks
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
