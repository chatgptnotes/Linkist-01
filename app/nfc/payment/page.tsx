'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Footer from '@/components/Footer';
import { getOrderAmountForVoucher } from '@/lib/pricing-utils';
import StripePaymentModal from '@/components/StripePaymentModal';

// Icon aliases
const Lock = LockIcon;
const Shield = SecurityIcon;
const Check = CheckIcon;
const AlertCircle = ErrorOutlineIcon;

// Initialize Stripe (you'll need to add your publishable key)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Color mapping for card preview
const allColours: Array<{ value: string; label: string; hex: string; gradient: string }> = [
  // PVC colors
  { value: 'white', label: 'White', hex: '#FFFFFF', gradient: 'from-white to-gray-100' },
  { value: 'black-pvc', label: 'Black', hex: '#000000', gradient: 'from-gray-900 to-black' },
  // Wood colors
  { value: 'cherry', label: 'Cherry', hex: '#8E3A2D', gradient: 'from-red-950 to-red-900' },
  { value: 'birch', label: 'Birch', hex: '#E5C79F', gradient: 'from-amber-100 to-amber-200' },
  // Metal colors
  { value: 'black-metal', label: 'Black', hex: '#1A1A1A', gradient: 'from-gray-800 to-gray-900' },
  { value: 'silver', label: 'Silver', hex: '#C0C0C0', gradient: 'from-gray-300 to-gray-400' },
  { value: 'rose-gold', label: 'Rose Gold', hex: '#B76E79', gradient: 'from-rose-300 to-rose-400' }
];

interface OrderData {
  orderId?: string;  // Order ID from checkout (if order was pre-created)
  orderNumber?: string;  // Order number from checkout
  customerName: string;
  email: string;
  phoneNumber: string;
  cardConfig: any;
  shipping: any;
  pricing: any;
  isFoundingMember?: boolean;  // Founding member flag from checkout
}

export default function NFCPaymentPage() {
  const router = useRouter();

  // Payment state
  const [processing, setProcessing] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [hasOrderError, setHasOrderError] = useState(false);

  // Voucher details
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherValid, setVoucherValid] = useState<boolean | null>(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [voucherType, setVoucherType] = useState<'percentage' | 'fixed'>('percentage');
  const [voucherAmount, setVoucherAmount] = useState(0);
  const [appliedVoucherCode, setAppliedVoucherCode] = useState('');
  const [originalTotal, setOriginalTotal] = useState(0);

  // Founding member status
  const [isFoundingMember, setIsFoundingMember] = useState(false);

  // Stripe Modal state
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState('');
  const [stripePaymentAmount, setStripePaymentAmount] = useState(0);

  useEffect(() => {
    const initializePaymentPage = async () => {
      // Get order data from localStorage (set by checkout page)
      const storedOrderData = localStorage.getItem('pendingOrder');
      if (!storedOrderData) {

        router.push('/nfc/checkout');
        return;
      }

      const data = JSON.parse(storedOrderData);

      // Check if order has orderId (created during checkout)
      if (!data.orderId) {
        console.error('❌ No orderId found in pending order data');
        setHasOrderError(true);
        setOrderData(data); // Set data so page can display error properly
        return;
      }

      setOrderData(data);
      setHasOrderError(false);

      // Store original total before any discounts
      if (data.pricing?.total) {
        setOriginalTotal(data.pricing.total);
      }

      // STEP 1: Determine founding member status FIRST
      let foundingMemberStatus = false;

      if (typeof data.isFoundingMember === 'boolean') {
        // Use status from order data
        foundingMemberStatus = data.isFoundingMember;

      } else {
        // Fallback: Check from API

        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
            cache: 'no-store'
          });
          if (response.ok) {
            const userData = await response.json();
            foundingMemberStatus = userData.user?.is_founding_member || false;

          }
        } catch (error) {

          foundingMemberStatus = false;
        }
      }

      // Set the founding member state
      setIsFoundingMember(foundingMemberStatus);

      // STEP 2: Only auto-apply LINKISTFM voucher for FOUNDING MEMBERS
      if (foundingMemberStatus) {
        setVoucherCode('LINKISTFM');

        // Load voucher from order data if present
        if (data.pricing?.voucherCode) {
          setVoucherDiscount(data.pricing.voucherDiscount || 0);
          setVoucherValid(true);
          setAppliedVoucherCode(data.pricing.voucherCode);
          setVoucherAmount(data.pricing.voucherAmount || 120);

        } else {
          // STEP 3: Auto-validate LINKISTFM with correct founding member status

          try {
            // FIXED: Use unified pricing utility for consistent order amount calculation
            const country = data.shipping?.country || 'IN';
            const orderAmount = getOrderAmountForVoucher({
              cardConfig: {
                baseMaterial: data.cardConfig?.baseMaterial || 'pvc',
                quantity: data.cardConfig?.quantity || 1,
              },
              country: country,
              isFoundingMember: foundingMemberStatus,
            });

            const response = await fetch('/api/vouchers/validate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: 'LINKISTFM',
                orderAmount: orderAmount,
                userEmail: data.email,
                isFoundingMember: foundingMemberStatus, // NEW: Pass founding member status
              }),
            });

            if (response.ok) {
              const voucherData = await response.json();
              if (voucherData.valid && voucherData.voucher) {
                setVoucherType(voucherData.voucher.discount_type);
                setVoucherAmount(voucherData.voucher.discount_amount);
                const discountPercent = voucherData.voucher.discount_type === 'percentage'
                  ? voucherData.voucher.discount_value
                  : Math.round((voucherData.voucher.discount_amount / (orderAmount || 1)) * 100);
                setVoucherDiscount(discountPercent);
                setVoucherValid(true);
                setAppliedVoucherCode('LINKISTFM');

              } else {
                console.error('❌ LINKISTFM validation failed:', voucherData.message || 'Unknown error');
              }
            } else {
              const errorData = await response.json();
              console.error('❌ Voucher validation API error:', {
                status: response.status,
                message: errorData?.message || 'No message',
                error: errorData?.error || 'Unknown'
              });
            }
          } catch (error) {
            console.error('❌ Error auto-applying LINKISTFM:', error);
          }
        }
      }
      // Non-founding members: voucher field starts empty, no auto-apply
    };

    initializePaymentPage();
  }, [router]);

  // NOTE: Founding member check and voucher auto-apply are now handled
  // together in the initialization useEffect above to prevent race conditions

  const validateVoucher = async () => {
    if (!voucherCode.trim()) {
      alert('Please enter a voucher code');
      return;
    }

    // Prevent re-applying the same voucher (check appliedVoucherCode regardless of voucherValid state)
    if (voucherCode.toUpperCase() === appliedVoucherCode && appliedVoucherCode !== '') {

      // Re-set the valid state if it was reset
      setVoucherValid(true);
      return;
    }

    setApplyingVoucher(true);
    try {
      // FIXED: Use unified pricing utility for consistent order amount
      const country = orderData?.shipping?.country || 'IN';
      const orderAmount = getOrderAmountForVoucher({
        cardConfig: {
          baseMaterial: orderData?.cardConfig?.baseMaterial || 'pvc',
          quantity: orderData?.cardConfig?.quantity || 1,
        },
        country: country,
        isFoundingMember: isFoundingMember,
      });

      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucherCode.toUpperCase(),
          orderAmount: orderAmount,
          userEmail: orderData?.email,
          isFoundingMember: isFoundingMember // NEW: Pass founding member status
        })
      });

      const result = await response.json();

      if (result.valid && result.voucher) {
        setVoucherType(result.voucher.discount_type);
        setVoucherAmount(result.voucher.discount_amount);

        // Calculate discount percentage for display (for backward compatibility)
        const discountPercent = result.voucher.discount_type === 'percentage'
          ? result.voucher.discount_value
          : Math.round((result.voucher.discount_amount / (orderAmount || 1)) * 100);

        setVoucherDiscount(discountPercent);
        setVoucherValid(true);
        setAppliedVoucherCode(voucherCode.toUpperCase());
      } else {
        setVoucherDiscount(0);
        setVoucherValid(false);
        setVoucherType('percentage');
        setVoucherAmount(0);
        setAppliedVoucherCode('');
        alert('Invalid voucher code');
      }
    } catch (error) {
      console.error('Error validating voucher:', error);
      setVoucherDiscount(0);
      setVoucherValid(false);
      setAppliedVoucherCode('');
      alert('Error validating voucher. Please try again.');
    } finally {
      setApplyingVoucher(false);
    }
  };

  // Helper functions for card preview
  const getCardGradient = () => {
    const selectedColor = allColours.find(c => c.value === orderData?.cardConfig?.color);
    return selectedColor?.gradient || 'from-gray-800 to-gray-900';
  };

  const getTextColor = () => {
    // Return white text for dark backgrounds, black for light backgrounds
    const darkBackgrounds = ['black-pvc', 'black-metal', 'cherry', 'rose-gold'];
    if (orderData?.cardConfig?.color && darkBackgrounds.includes(orderData.cardConfig.color)) {
      return 'text-white';
    }
    return 'text-gray-900';
  };

  // SIMPLIFIED PRICING: Calculate flat price (tax absorbed, no subscription for non-founders)
  const getSubtotal = () => {
    if (!orderData) return 0;

    const quantity = orderData?.cardConfig?.quantity || 1;

    if (isFoundingMember) {
      // FOUNDERS: Use the flat founder's price (subscription + GST included)
      const founderPrice = orderData.pricing?.materialPrice || orderData.cardConfig?.foundersTotalPrice || 149;
      return founderPrice * quantity;
    }

    // NON-FOUNDERS: Just material price (GST absorbed, no subscription)
    const materialPrice = orderData.pricing?.materialPrice || 99;
    return materialPrice * quantity;
  };

  const getFinalAmount = () => {
    if (!orderData) return 0;

    const subtotal = getSubtotal();

    // FOUNDERS: No voucher discount (exclusive pricing, no coupon UI)
    if (isFoundingMember) {
      return subtotal;
    }

    // NON-FOUNDERS: Apply voucher discount if valid
    if (voucherValid && voucherAmount > 0) {
      return Math.max(0, subtotal - voucherAmount);
    }

    return subtotal;
  };

  const handleStripePayment = async () => {
    try {
      if (!orderData) {
        throw new Error('No order data available');
      }

      // Calculate final amount with voucher discount
      const finalAmount = getFinalAmount();

      // Create payment intent
      // Note: finalAmount already has voucher discount applied by frontend
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount, // Already includes voucher discount
          currency: 'usd',
          orderId: orderData.orderId, // Required for idempotency
          orderData: {
            customerName: orderData.customerName,
            email: orderData.email,
            phoneNumber: orderData.phoneNumber,
            pricing: {
              subtotal: orderData.pricing?.subtotal || 0,
              shipping: orderData.pricing?.shipping || 0,
              tax: orderData.pricing?.tax || 0,
            },
          },
          // Don't send voucherCode here - discount already applied in finalAmount
          // Voucher will be tracked when order is processed after payment
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      // Store client secret and amount for modal
      setStripeClientSecret(data.clientSecret);
      setStripePaymentAmount(data.amount);

      // Open Stripe payment modal
      setShowStripeModal(true);

      // Return modal flag to indicate we're waiting for payment confirmation
      // Actual payment processing will happen in handleModalPaymentSuccess callback
      return {
        modalOpened: true, // Flag to indicate we're waiting for modal completion
      };
    } catch (error) {
      console.error('❌ Stripe payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
  };

  const handlePayment = async () => {
    if (!orderData) {
      console.error('No order data found');
      return;
    }

    // Validate that order exists before processing payment
    if (!orderData.orderId) {
      console.error('No orderId found in order data');
      alert('No order found. Please complete checkout first.');
      router.push('/nfc/checkout');
      return;
    }

    setProcessing(true);

    try {
      const paymentResult = await handleStripePayment();

      // If modal opened, stop here and wait for modal callback
      if (paymentResult && paymentResult.modalOpened) {
        setProcessing(false);
        return;
      }

      if (paymentResult && !paymentResult.modalOpened) {
        throw new Error('Payment was not successful');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  // Handle successful Stripe payment from modal
  const handleModalPaymentSuccess = async (paymentIntentId: string) => {
    if (!orderData) {
      console.error('No order data found');
      return;
    }

    setShowStripeModal(false);
    setProcessing(true);

    try {
      // Store payment confirmation with complete pricing data
      const orderConfirmation = {
        ...orderData,
        paymentMethod: 'card',
        paymentId: paymentIntentId,
        amount: getFinalAmount(),
        pricing: {
          ...orderData.pricing,
          // Explicitly store all pricing fields for success page
          materialPrice: orderData.pricing?.materialPrice || 99,
          appSubscriptionPrice: orderData.pricing?.appSubscriptionPrice || 120,
          taxAmount: orderData.pricing?.taxAmount || 0,
          subtotal: getSubtotal(),
          total: getFinalAmount()
        },
        voucherCode: appliedVoucherCode || voucherCode || null,
        voucherDiscount: voucherDiscount || 0,
        voucherAmount: voucherAmount || 0,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('orderConfirmation', JSON.stringify(orderConfirmation));

      // Update existing order with payment details using process-order API
      const response = await fetch('/api/process-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          cardConfig: orderData.cardConfig,
          checkoutData: {
            email: orderData.email,
            fullName: orderData.customerName,
            phoneNumber: orderData.phoneNumber,
            addressLine1: orderData.shipping.addressLine1,
            addressLine2: orderData.shipping.addressLine2,
            city: orderData.shipping.city,
            state: orderData.shipping.stateProvince,
            country: orderData.shipping.country,
            postalCode: orderData.shipping.postalCode,
          },
          paymentData: {
            paymentMethod: 'card',
            paymentId: paymentIntentId,
            voucherCode: appliedVoucherCode || voucherCode || null,
            voucherDiscount: voucherDiscount || 0,
            voucherAmount: voucherAmount || 0,
          },
          pricing: {
            ...orderData.pricing,
            total: getFinalAmount(),
            totalBeforeDiscount: getSubtotal(),
            voucherAmount: voucherAmount || 0,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process order');
      }

      await response.json();

      // Clear localStorage
      localStorage.removeItem('pendingOrder');
      localStorage.removeItem('checkoutData');

      // Redirect to success page

      router.push('/nfc/success');
    } catch (error) {
      console.error('❌ Error processing order after payment:', error);
      alert('Payment succeeded but order processing failed. Please contact support with your payment ID: ' + paymentIntentId);
      setProcessing(false);
    }
  };

  // Handle payment error from modal
  const handleModalPaymentError = (error: string) => {
    console.error('❌ Stripe payment failed in modal:', error);
    setShowStripeModal(false);
    setProcessing(false);
    alert('Payment failed: ' + error);
  };

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }


  // Show error message if no order found
  if (hasOrderError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find your order information. Please complete the checkout process first before proceeding to payment.
          </p>
          <button
            onClick={() => router.push('/nfc/checkout')}
            className="w-full py-3 px-6 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: '#ff0000', color: '#FFFFFF' }}
          >
            Go to Checkout
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full mt-3 py-3 px-6 rounded-lg font-semibold transition-colors border border-gray-300"
            style={{ backgroundColor: '#FFFFFF', color: '#374151' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Payment Form - Left Side */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
              {/* Header - Hidden on mobile */}
              <div className="hidden lg:flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Secure Payment</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Powered by Stripe</p>
                </div>
              </div>

              {/* Card Brand Logos - Hidden on mobile */}
              <div className="hidden lg:flex items-center gap-2 mb-6">
                <div className="px-2 py-1.5 border border-gray-200 rounded bg-white">
                  <Image src="/visa.png" alt="Visa" width={32} height={20} className="h-4 w-auto" />
                </div>
                <div className="px-2 py-1.5 border border-gray-200 rounded bg-white">
                  <Image src="/mc.png" alt="Mastercard" width={28} height={20} className="h-4 w-auto" />
                </div>
                <div className="px-2 py-1.5 border border-gray-200 rounded bg-white">
                  <Image src="/amex.png" alt="Amex" width={28} height={20} className="h-4 w-auto" />
                </div>
              </div>

              {/* Payment Info - Hidden on mobile */}
              <div className="hidden lg:block bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">
                  Click the button below to securely enter your card details. Your payment is protected by industry-standard encryption.
                </p>
              </div>

              {/* Payment Button - Always visible */}
              <button
                onClick={handlePayment}
                disabled={processing || !orderData?.orderId}
                className="w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: (processing || !orderData?.orderId) ? '#D1D5DB' : '#ff0000',
                  color: '#FFFFFF'
                }}
              >
                {processing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Processing...
                  </div>
                ) : !orderData?.orderId ? (
                  'Order ID Required'
                ) : (
                  `Pay $${getFinalAmount().toFixed(2)}`
                )}
              </button>

              {/* Security Badges - Hidden on mobile */}
              <div className="hidden lg:flex mt-8 flex-row items-center justify-center gap-8 text-sm text-gray-600">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-500" />
                  SSL Secure Connection
                </div>
                <div className="flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-blue-500" />
                  PCI DSS Compliant
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary - Right Side */}
          <div className="lg:col-span-1 lg:sticky lg:top-8 order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Order Summary</h3>

              {/* Card Preview - Hide for digital products */}
              {orderData?.cardConfig?.baseMaterial !== 'digital' && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-sm sm:text-base font-medium mb-2 sm:mb-3">Your NFC Card</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">
                    {orderData?.cardConfig?.fullName || `${orderData?.cardConfig?.cardFirstName} ${orderData?.cardConfig?.cardLastName}` || 'Custom NFC Card'}
                  </p>
                  {orderData?.cardConfig?.baseMaterial && (
                    <p className="text-xs text-gray-500 mb-3 sm:mb-4">
                      Material: {orderData.cardConfig.baseMaterial.charAt(0).toUpperCase() + orderData.cardConfig.baseMaterial.slice(1)} •
                      Color: {(() => {
                        const color = orderData.cardConfig.color || 'Black';
                        // Remove material suffix (e.g., "black-pvc" -> "black")
                        const colorName = color.split('-')[0];
                        return colorName.charAt(0).toUpperCase() + colorName.slice(1);
                      })()} •
                      Plan: <span className={isFoundingMember ? 'text-amber-600 font-medium' : 'text-gray-600'}>{isFoundingMember ? 'Founders Club' : 'Personal'}</span>
                    </p>
                  )}

                  {/* Front Card */}
                  <div className="mb-3 sm:mb-4">
                    <div className={`w-48 sm:w-56 aspect-[1.6/1] bg-gradient-to-br ${getCardGradient()} rounded-lg sm:rounded-xl relative overflow-hidden shadow-lg mr-auto`}>
                      {/* AI Icon top right - No wrapper, no background, no shadow */}
                      <img
                        src={orderData?.cardConfig?.color === 'white' ? '/ai2.png' : '/ai1.png'}
                        alt="AI"
                        className={`absolute top-2 sm:top-3 right-2 sm:right-3 w-3 h-3 sm:w-4 sm:h-4 ${orderData?.cardConfig?.color === 'white' ? '' : 'invert'}`}
                        style={{ boxShadow: 'none', background: 'transparent' }}
                      />

                      {/* User Name or Initials */}
                      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4">
                        {(() => {
                          const firstName = orderData?.cardConfig?.cardFirstName?.trim() || '';
                          const lastName = orderData?.cardConfig?.cardLastName?.trim() || '';
                          const isSingleCharOnly = firstName.length <= 1 && lastName.length <= 1;

                          if (isSingleCharOnly) {
                            return (
                              <div className={`${getTextColor()} text-lg sm:text-xl font-light`}>
                                {(firstName || 'J').toUpperCase()}{(lastName || 'D').toUpperCase()}
                              </div>
                            );
                          } else {
                            return (
                              <div className={`${getTextColor()} text-xs sm:text-sm font-medium`}>
                                {firstName} {lastName}
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SIMPLIFIED PRICING BREAKDOWN */}
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                {isFoundingMember ? (
                  <>
                    {/* FOUNDERS CLUB: Exclusive pricing with everything included */}
                    <div className="flex justify-between">
                      <span>
                        Exclusive Founder&apos;s Price × {orderData?.cardConfig?.quantity || 1}
                      </span>
                      <span>${getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1 Year Linkist Subscription</span>
                      <span className="text-green-600">Included</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST</span>
                      <span className="text-green-600">Included</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping & Customization</span>
                      <span className="text-green-600">Included</span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* NON-FOUNDERS: Flat material price with everything included */}
                    <div className="flex justify-between">
                      <span>
                        Base Material Price × {orderData?.cardConfig?.quantity || 1}
                      </span>
                      <span>${getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST</span>
                      <span className="text-green-600">Included</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-green-600">Included</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customization</span>
                      <span className="text-green-600">Included</span>
                    </div>
                  </>
                )}

                {/* Voucher Section - ONLY for Non-Founders (Founders have exclusive pricing) */}
                {!isFoundingMember && (
                  <>
                    <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-3">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Have a voucher code?</h3>

                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={voucherCode}
                            onChange={(e) => {
                              const newCode = e.target.value.toUpperCase();
                              setVoucherCode(newCode);
                              // Reset validation ONLY when code changes to something different
                              if (newCode !== appliedVoucherCode) {
                                setVoucherValid(null);
                                setVoucherDiscount(0);
                                setVoucherAmount(0);
                                setAppliedVoucherCode('');
                              }
                            }}
                            placeholder="Enter voucher code"
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 uppercase cursor-text"
                          />

                          <button
                            type="button"
                            onClick={validateVoucher}
                            disabled={applyingVoucher || !voucherCode.trim() || voucherValid === true}
                            style={{
                              backgroundColor: (applyingVoucher || !voucherCode.trim() || voucherValid === true) ? '#d1d5db' : '#dc2626',
                              color: '#ffffff',
                              opacity: (applyingVoucher || !voucherCode.trim() || voucherValid === true) ? 0.6 : 1,
                              cursor: (applyingVoucher || !voucherCode.trim() || voucherValid === true) ? 'not-allowed' : 'pointer'
                            }}
                            className="px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap"
                          >
                            {applyingVoucher ? 'Applying...' : 'Apply'}
                          </button>
                        </div>

                        {voucherValid === true && (
                          <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <p className="text-sm text-green-700">Voucher applied successfully</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setVoucherCode('');
                                setVoucherValid(null);
                                setVoucherDiscount(0);
                                setVoucherAmount(0);
                                setAppliedVoucherCode('');
                              }}
                              className="text-xs text-red-600 hover:text-red-800 font-medium underline"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        {voucherValid === false && (
                          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <p className="text-sm text-red-700">Invalid voucher code</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Discount Line - Outside dashed box, only for non-founders */}
                    {voucherValid && voucherAmount > 0 && (
                      <div className="flex justify-between text-green-600 font-medium text-sm">
                        <span>Voucher Discount ({voucherDiscount}% off)</span>
                        <span>-${voucherAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Total */}
                <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-3 flex justify-between font-semibold text-sm sm:text-base">
                  <span>Total</span>
                  <span>${getFinalAmount().toFixed(2)}</span>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-4 sm:mt-6 flex items-start space-x-2 sm:space-x-3 text-xs sm:text-sm text-gray-600">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5" />
                <div>
                  <p className="font-medium">Secure Payment</p>
                  <p className="text-xs sm:text-sm">Your payment info is encrypted and secure</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Stripe Payment Modal */}
      {showStripeModal && stripeClientSecret && (
        <StripePaymentModal
          isOpen={showStripeModal}
          onClose={() => setShowStripeModal(false)}
          clientSecret={stripeClientSecret}
          amount={stripePaymentAmount}
          orderDetails={{
            customerName: orderData.customerName,
            email: orderData.email,
            orderNumber: orderData.orderNumber,
            // Only show voucher for non-founders AND only when successfully applied
            voucherCode: !isFoundingMember && voucherValid && appliedVoucherCode ? appliedVoucherCode : undefined,
            discount: !isFoundingMember && voucherValid && voucherAmount > 0 ? voucherAmount * 100 : undefined, // Convert to cents
          }}
          onPaymentSuccess={handleModalPaymentSuccess}
          onPaymentError={handleModalPaymentError}
        />
      )}
    </div>
  );
}