import { NextRequest, NextResponse } from 'next/server';
import { SupabaseOrderStore, generateOrderNumber, OrderPlanType } from '@/lib/supabase-order-store';
import { SupabaseUserStore } from '@/lib/supabase-user-store';
import { SupabasePaymentStore } from '@/lib/supabase-payment-store';
import { SupabaseShippingAddressStore } from '@/lib/supabase-shipping-address-store';
import { formatOrderForEmail } from '@/lib/order-store';
import { emailService } from '@/lib/email-service';
import { createClient } from '@/lib/supabase/client';
import { calculatePricing } from '@/lib/pricing-utils';
import { getCurrency } from '@/lib/country-utils';
import { SessionStore } from '@/lib/session-store';
import { getSessionCookieOptions } from '@/lib/cookie-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { cardConfig, checkoutData, paymentData, orderId, pricing } = body;

    if (!cardConfig || !checkoutData) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Calculate pricing - use provided pricing if available (for digital-only $0 orders)
    let subtotal, shippingAmount, taxAmount, totalAmount;

    if (pricing) {
      // Use provided pricing from checkout
      subtotal = pricing.subtotal || 0;
      shippingAmount = pricing.shipping || 0;
      taxAmount = pricing.tax || 0;
      totalAmount = pricing.total || 0;
    } else {
      // FALLBACK: This should not happen - pricing should always be provided from checkout
      // Set to 0 as fallback - better than using outdated hardcoded values
      const quantity = cardConfig.quantity || 1;
      subtotal = 0;
      shippingAmount = 0;
      taxAmount = 0;
      totalAmount = 0;
    }

    // VALIDATION: Check if pricing looks suspiciously low (might be missing app subscription)
    // For physical cards (non-digital), total should be at least material price + tax
    // App subscription ($120) should be included unless user is founding member
    const MIN_EXPECTED_TOTAL = 50; // Minimum threshold to catch obvious errors

    if (cardConfig.baseMaterial !== 'digital' && totalAmount > 0 && totalAmount < MIN_EXPECTED_TOTAL) {
      // Attempt to recalculate using unified pricing utility as a sanity check
      try {
        const recalculated = calculatePricing({
          cardConfig: {
            baseMaterial: cardConfig.baseMaterial,
            quantity: cardConfig.quantity || 1,
          },
          country: checkoutData.country || 'US',
          isFoundingMember: false, // Assume not founding member for validation
          includeAppSubscription: true,
        });

        // Log the discrepancy for admin review (without sensitive data)
        if (process.env.NODE_ENV === 'development') {
          console.warn('Pricing validation: potential mismatch detected');
        }
      } catch (validationError) {
        // Continue even if validation fails
      }
    }

    // Create/update user in database
    let user;
    try {
      user = await SupabaseUserStore.upsertByEmail({
        email: checkoutData.email,
        first_name: checkoutData.fullName?.split(' ')[0] || cardConfig.firstName,
        last_name: checkoutData.fullName?.split(' ').slice(1).join(' ') || cardConfig.lastName,
        phone_number: checkoutData.phoneNumber || null,
        email_verified: true, // They completed checkout, so email is verified
        mobile_verified: !!checkoutData.phoneNumber, // If they provided phone, assume verified
        status: 'active', // User completed checkout, they should be active
      });
    } catch (userError) {
      throw new Error(`User creation failed: ${userError instanceof Error ? userError.message : 'Unknown error'}`);
    }

    // For digital-only (Starter) orders, ensure user is active (they completed checkout)
    if (user && user.status === 'pending' && (cardConfig.isDigitalOnly === true || cardConfig.baseMaterial === 'digital')) {
      try {
        const activatedUser = await SupabaseUserStore.activateUser(user.id, 'email');
        if (activatedUser) {
          user = activatedUser;
          console.log('✅ [process-order] Activated pending Starter user:', user.id);
        }
      } catch (activateError) {
        console.error('Failed to activate Starter user:', activateError);
      }
    }

    // Determine if this is a digital-only order (no physical card)
    const isDigitalOnlyOrder = cardConfig.isDigitalOnly === true || cardConfig.baseMaterial === 'digital';

    // Determine order status:
    // - Digital orders: 'delivered' (no physical card to ship)
    // - Physical orders: 'pending' if no payment, 'confirmed' if has payment
    const orderStatus = isDigitalOnlyOrder ? 'delivered' : (paymentData ? 'confirmed' : 'pending');

    let order;

    // Update existing order if orderId provided (payment flow), otherwise create new order (checkout flow)
    if (orderId) {
      // Check if orderId is a UUID or order number
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

      let existingOrder;
      if (isUUID) {
        // It's a UUID, fetch by ID
        existingOrder = await SupabaseOrderStore.getById(orderId);
      } else {
        // It's an order number, fetch by order number
        existingOrder = await SupabaseOrderStore.getByOrderNumber(orderId);
      }

      if (!existingOrder) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // Build update object with payment data
      const updateData: any = {
        status: orderStatus,
      };

      if (paymentData) {
        updateData.paymentMethod = paymentData.paymentMethod;
        updateData.paymentId = paymentData.paymentId;
        updateData.voucherCode = paymentData.voucherCode || null;
        updateData.voucherDiscount = paymentData.voucherDiscount || 0;
        // Stamp the actual payment time so "Date of Purchase" reflects when the
        // customer paid, not when the pending order was first initiated.
        updateData.paidAt = Date.now();

        // FIXED: Always use pricing from request if provided (contains actual paid amount)
        // This ensures DB stores the exact amount the user paid, regardless of founders status or vouchers
        if (pricing && pricing.total !== undefined) {
          updateData.pricing = {
            ...existingOrder.pricing,
            ...pricing, // Use pricing from request (includes actual paid total)
          };
        } else {
          // Fallback to old logic if pricing not provided in request
          const isFoundersOrder = (existingOrder?.cardConfig as any)?.isFoundingMember ||
                                  (cardConfig as any)?.isFoundingMember;

          if (paymentData.voucherAmount && paymentData.voucherAmount > 0 && !isFoundersOrder) {
            const originalTotal = existingOrder.pricing?.total || 0;
            const finalTotal = Math.max(0, originalTotal - paymentData.voucherAmount);

            updateData.pricing = {
              ...existingOrder.pricing,
              totalBeforeDiscount: originalTotal,
              total: finalTotal,
              voucherAmount: paymentData.voucherAmount,
            };
          } else if (paymentData.voucherAmount && paymentData.voucherAmount > 0 && isFoundersOrder) {
            updateData.pricing = {
              ...existingOrder.pricing,
              voucherCode: paymentData.voucherCode,
            };
          }
        }
      }

      // Update using the UUID from the existing order
      order = await SupabaseOrderStore.update(existingOrder.id, updateData);

      if (!order) {
        return NextResponse.json(
          { error: 'Failed to update order' },
          { status: 500 }
        );
      }

    } else {
      // No orderId provided — check if user already has a pending order for this plan
      // before creating a new one. Prevents duplicate pending orders when localStorage
      // is cleared between checkout and payment.
      const shippingPayload = {
        fullName: checkoutData.fullName,
        addressLine1: checkoutData.addressLine1,
        addressLine2: checkoutData.addressLine2,
        landmark: checkoutData.landmark,
        city: checkoutData.city,
        state: checkoutData.state,
        country: checkoutData.country,
        postalCode: checkoutData.postalCode,
        phoneNumber: checkoutData.phoneNumber || '',
      };
      const pricingPayload = {
        subtotal,
        shipping: shippingAmount,
        tax: taxAmount,
        total: totalAmount,
      };

      let existingPending = null;
      if (checkoutData.email) {
        try {
          const existingOrders = await SupabaseOrderStore.getByEmail(checkoutData.email);
          existingPending = existingOrders.find(o =>
            o.status === 'pending' &&
            (o.cardConfig as any)?.planType === cardConfig.planType
          ) || null;
        } catch (lookupError) {
          console.error('[process-order] Pending order lookup failed, falling back to create:', lookupError);
        }
      }

      if (existingPending) {
        console.log('🔁 [process-order] Resuming existing pending order:', existingPending.orderNumber);
        order = await SupabaseOrderStore.update(existingPending.id, {
          cardConfig,
          customerName: checkoutData.fullName,
          phoneNumber: checkoutData.phoneNumber || '',
          shipping: shippingPayload,
          pricing: pricingPayload,
        });

        if (!order) {
          throw new Error('Failed to resume existing pending order');
        }
      } else {
        // Create new order
        // Determine plan type for order ID generation
        let planType: OrderPlanType = 'nfc-card-full'; // Default: NFC Card + Digital Profile + Linkist App

        // Check if it's a digital-only order (free tier)
        if (cardConfig.isDigitalOnly && totalAmount === 0) {
          planType = 'digital-only';
        }
        // Check if it's digital profile + app (digital with subscription)
        else if (cardConfig.baseMaterial === 'digital' && (cardConfig.isDigitalOnly || totalAmount > 0)) {
          planType = 'digital-profile-app';
        }
        // Physical NFC card + digital profile + app
        else {
          planType = 'nfc-card-full';
        }

        try {
          order = await SupabaseOrderStore.create({
            orderNumber: await generateOrderNumber(planType, cardConfig.isFoundingMember || false, cardConfig.planType || undefined),
            userId: user.id, // Link order to user
            status: orderStatus,
            customerName: checkoutData.fullName,
            email: checkoutData.email,
            phoneNumber: checkoutData.phoneNumber || '',
            cardConfig: cardConfig,
            pricing: pricingPayload,
            shipping: shippingPayload,
            estimatedDelivery: undefined,
            emailsSent: {},
          });

          if (!order) {
            throw new Error('Order creation returned null');
          }
        } catch (orderError) {
          throw new Error(`Order creation failed: ${orderError instanceof Error ? orderError.message : 'Unknown error'}`);
        }
      }
    }

    // Create payment record if payment data provided
    if (paymentData && order) {
      try {
        // FIXED: Use pricing.total from request if available (actual paid amount)
        // This ensures the payment record matches what the user actually paid
        const actualTotal = pricing?.total ?? totalAmount;
        const amount = Math.round(actualTotal * 100);

        const payment = await SupabasePaymentStore.create({
          orderId: order.id,
          paymentIntentId: paymentData.paymentId || `payment_${Date.now()}`,
          amount: amount,
          currency: getCurrency(checkoutData.country),
          status: 'succeeded',
          paymentMethod: paymentData.paymentMethod || 'unknown',
          metadata: {
            voucherCode: paymentData.voucherCode,
            voucherDiscount: paymentData.voucherDiscount,
          },
        });

        // Track voucher usage if voucher was used
        if (paymentData.voucherCode) {
          try {
            const supabase = createClient();

            // Get voucher details
            const { data: voucher } = await supabase
              .from('vouchers')
              .select('*')
              .eq('code', paymentData.voucherCode.toUpperCase())
              .single();

            if (voucher) {
              // Calculate discount amount
              let discountAmount = 0;
              if (paymentData.voucherAmount !== undefined && paymentData.voucherAmount !== null) {
                // voucherAmount expected in same currency units as totalAmount (dollars)
                discountAmount = paymentData.voucherAmount;
              } else if (paymentData.voucherDiscount) {
                discountAmount = (totalAmount * paymentData.voucherDiscount) / 100;
              }

              // Create voucher usage record
              await supabase
                .from('voucher_usage')
                .insert({
                  voucher_id: voucher.id,
                  user_id: user.id,
                  user_email: checkoutData.email,
                  order_id: order.id,
                  discount_amount: discountAmount
                });

              // Increment voucher used_count
              await supabase
                .from('vouchers')
                .update({
                  used_count: voucher.used_count + 1
                })
                .eq('id', voucher.id);
            }
          } catch (voucherError) {
            // Continue even if voucher tracking fails
          }
        }
      } catch (error) {
        // Continue even if payment record creation fails
        // Order is already created/updated
      }
    }

    // Create shipping address record for the order
    if (order && checkoutData) {
      try {
        await SupabaseShippingAddressStore.create({
          userId: user.id,
          orderId: order.id,
          fullName: checkoutData.fullName,
          addressLine1: checkoutData.addressLine1,
          addressLine2: checkoutData.addressLine2 || undefined,
          landmark: checkoutData.landmark || undefined,
          city: checkoutData.city,
          state: checkoutData.state,
          postalCode: checkoutData.postalCode,
          country: checkoutData.country,
          phoneNumber: checkoutData.phoneNumber || undefined,
          isDefault: false, // Don't auto-set as default
        });
      } catch (error) {
        // Continue even if shipping address creation fails
        // Order is already created/updated
      }
    }

    // Handle Founders Club member status update - VERIFY server-side before updating.
    // Only stamp founding_member_plan after a successful payment (orderStatus 'confirmed'
    // or 'delivered'). Pending orders must not flip the user into "paid founder" state —
    // that would make the Founder's Circle badge appear before payment.
    const isPaidOrDelivered = orderStatus === 'confirmed' || orderStatus === 'delivered';
    if (isPaidOrDelivered && cardConfig.isFoundingMember && user && order) {
      try {
        // SECURITY: Verify the user is actually a founding member in the database
        // Do NOT trust the frontend flag blindly
        const dbUser = await SupabaseUserStore.getByEmail(user.email);
        const isVerifiedFounder = dbUser?.is_founding_member === true;

        const supabase = createClient();

        // Resolve plan tier from the invite code that brought this user in:
        //   - referral codes inherit the referrer's plan (e.g. 'annual')
        //   - admin-issued codes (or no code) default to 'lifetime'
        // Mirrors the original semantic that used to live in founders/activate
        // before the badge-after-payment refactor moved this write here.
        const resolveFounderPlan = async (
          loadedInvite?: { referral_type?: string | null; inherited_plan?: string | null } | null
        ): Promise<string> => {
          if (loadedInvite?.referral_type === 'referral' && loadedInvite.inherited_plan) {
            return loadedInvite.inherited_plan;
          }
          if (loadedInvite) return 'lifetime';

          const { data: usedCode } = await supabase
            .from('founders_invite_codes')
            .select('referral_type, inherited_plan')
            .eq('email', user.email)
            .eq('referral_type', 'referral')
            .not('used_at', 'is', null)
            .order('used_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return usedCode?.inherited_plan || 'lifetime';
        };

        if (isVerifiedFounder) {
          // User is already a verified founding member - stamp the resolved plan.
          const resolvedPlan = await resolveFounderPlan();
          await SupabaseUserStore.updateFoundingMemberStatus(user.id, resolvedPlan);
        } else if (cardConfig.foundersInviteCode) {
          // User claims to be a new founding member - validate the invite code first
          const { data: inviteCode } = await supabase
            .from('founders_invite_codes')
            .select('*')
            .eq('code', cardConfig.foundersInviteCode)
            .single();

          // Only update status if invite code is valid, unused, and not expired
          if (inviteCode && !inviteCode.used_at && new Date(inviteCode.expires_at) > new Date()) {
            const resolvedPlan = await resolveFounderPlan(inviteCode);
            await SupabaseUserStore.updateFoundingMemberStatus(user.id, resolvedPlan);

            // Mark the invite code as used
            await supabase
              .from('founders_invite_codes')
              .update({ used_at: new Date().toISOString() })
              .eq('code', cardConfig.foundersInviteCode);
          } else {
            console.warn('Process-order: Invalid or expired founders invite code provided:', cardConfig.foundersInviteCode);
          }
        } else {
          console.warn('Process-order: User claimed founding member status without valid code or DB verification');
        }
      } catch (founderError) {
        // Continue even if this fails - order is already created
        console.error('Process-order: Founders status update error:', founderError);
      }
    }

    // Send emails if order is confirmed (has payment) OR is a digital-only order (status 'delivered')
    let finalOrder = order;
    // Suppress order receipt / invoice emails for the free Starter (Skip) path —
    // those customers should only see the simplified activation page, no order paperwork.
    // Paid Starter customers ($40 card) still receive standard order emails.
    const isFreeStarterSkip = isDigitalOnlyOrder && cardConfig.planType === 'starter';
    const shouldSendEmails = (orderStatus === 'confirmed' || orderStatus === 'delivered') && !isFreeStarterSkip;
    
    console.log(`📧 [process-order] Email decision:`, {
      orderNumber: order.orderNumber,
      orderStatus,
      shouldSendEmails,
      email: checkoutData.email || 'MISSING',
      planType: cardConfig.planType || 'unknown',
      isDigitalOnly: isDigitalOnlyOrder
    });

    if (shouldSendEmails) {
      // Validate email before attempting to send
      if (!checkoutData.email || !checkoutData.email.includes('@')) {
        console.error(`❌ [process-order] Cannot send email - invalid email address:`, checkoutData.email);
        return NextResponse.json({
          success: true,
          order: order,
          emailResults: { confirmation: { success: false, error: 'Invalid email' }, receipt: { success: false, error: 'Invalid email' } },
          warning: 'Order created but email not sent - invalid email address'
        });
      }

      const emailData = formatOrderForEmail(order);
      console.log(`📤 [process-order] Sending emails to:`, emailData.email);
      const emailResults = await emailService.sendOrderLifecycleEmails(emailData);
      
      console.log(`📧 [process-order] Email results:`, {
        confirmation: emailResults.confirmation?.success ? '✅' : '❌',
        receipt: emailResults.receipt?.success ? '✅' : '❌',
        confirmationError: emailResults.confirmation?.error,
        receiptError: emailResults.receipt?.error
      });

      // Update order with email tracking in Supabase
      finalOrder = await SupabaseOrderStore.update(order.id, {
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
      }) || order;

      // For digital-only (Starter) orders, create a session so the user is authenticated immediately
      if (isDigitalOnlyOrder && user) {
        try {
          const sessionId = await SessionStore.create(user.id, user.email, user.role || 'user');
          const requestHost = request.headers.get('host') || '';
          const cookieOptions = getSessionCookieOptions(requestHost);

          const response = NextResponse.json({
            success: true,
            order: finalOrder,
            emailResults: emailResults,
            sessionCreated: true
          });
          response.cookies.set('session', sessionId, cookieOptions);
          return response;
        } catch (sessionError) {
          console.error('Failed to create session for Starter order:', sessionError);
          // Fall through to return without session
        }
      }

      return NextResponse.json({
        success: true,
        order: finalOrder,
        emailResults: emailResults
      });
    } else {
      return NextResponse.json({
        success: true,
        order: finalOrder,
        message: 'Order created successfully, awaiting payment'
      });
    }

  } catch (error) {
    console.error('Error processing order:', error instanceof Error ? error.message : 'Unknown error');

    // Return more detailed error message in development
    const errorMessage = error instanceof Error ? error.message : 'Failed to process order';
    const detailedError = process.env.NODE_ENV === 'development'
      ? { error: errorMessage }
      : { error: 'Failed to process order' };

    return NextResponse.json(
      detailedError,
      { status: 500 }
    );
  }
}
