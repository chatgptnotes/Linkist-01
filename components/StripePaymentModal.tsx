'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from './StripePaymentForm';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: '$',
  inr: '₹',
  aed: 'AED ',
  gbp: '£',
  eur: '€',
};

function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toLowerCase()] || '$';
}

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientSecret: string;
  amount: number;
  currency?: string;
  orderDetails: {
    customerName: string;
    email: string;
    phoneNumber?: string;
    orderNumber?: string;
    voucherCode?: string;
    discount?: number;
  };
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

export default function StripePaymentModal({
  isOpen,
  onClose,
  clientSecret,
  amount,
  currency = 'usd',
  orderDetails,
  onPaymentSuccess,
  onPaymentError,
}: StripePaymentModalProps) {
  const currencySymbol = getCurrencySymbol(currency);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#000000',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
            <p className="text-sm text-gray-500 mt-1">
              Secure payment powered by Stripe
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Accepted Payment Methods */}
        <div className="px-6 py-3 border-b border-gray-200">
          <p className="text-xs text-gray-500 mb-2">We accept</p>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Visa */}
            <div className="px-2 py-1 border border-gray-200 rounded bg-white">
              <svg className="h-4 w-auto" viewBox="0 0 48 16" fill="none"><path d="M19.4 1.2l-3.7 13.6h-3L16.4 1.2h3zm15.8 8.8l1.6-4.4.9 4.4h-2.5zm2.8 4.8h2.8L38.4 1.2h-2.5c-.6 0-1 .3-1.2.8l-4.3 12.8h3l.6-1.6h3.7l.3 1.6zm-7-9.1c0 3.6-5 3.8-5 5.4 0 .5.5 1 1.5 1.1.5.1 1.9.1 3.5-.7l.6 2.9c-.8.3-1.9.6-3.3.6-3.5 0-6-1.9-6-4.5 0-3.4 4.7-3.6 4.7-5.4 0-.5-.5-.9-1.4-1-.5 0-1.7 0-3.1.7l-.6-2.8c.8-.3 1.7-.5 2.9-.5 3.3 0 5.2 1.7 5.2 4.2zM16 1.2L12.3 14.8H9.5L7.7 4c-.1-.5-.2-.6-.6-.8C6.3 2.8 5 2.4 3.8 2.2l.1-.5h5c.7 0 1.2.4 1.4 1.2l1.2 6.6 3-7.8H16z" fill="#1434CB"/></svg>
            </div>
            {/* Mastercard */}
            <div className="px-2 py-1 border border-gray-200 rounded bg-white">
              <svg className="h-4 w-auto" viewBox="0 0 32 20" fill="none"><circle cx="12" cy="10" r="8" fill="#EB001B"/><circle cx="20" cy="10" r="8" fill="#F79E1B"/><path d="M16 3.8a8 8 0 010 12.4 8 8 0 000-12.4z" fill="#FF5F00"/></svg>
            </div>
            {/* Google Pay & Apple Pay - only show for non-INR (not available in India on Stripe) */}
            {currency.toLowerCase() !== 'inr' && (
              <>
                <div className="px-2 py-1 border border-gray-200 rounded bg-white flex items-center gap-1">
                  <svg className="h-4 w-auto" viewBox="0 0 40 16" fill="none">
                    <path d="M18.5 8.2c0-.4 0-.7-.1-1H13v2h3.1a2.7 2.7 0 01-1.1 1.7v1.4h1.8c1.1-1 1.7-2.4 1.7-4.1z" fill="#4285F4"/>
                    <path d="M13 13.2c1.5 0 2.8-.5 3.7-1.3l-1.8-1.4c-.5.3-1.1.5-1.9.5-1.5 0-2.7-1-3.1-2.3h-1.8v1.5A5.5 5.5 0 0013 13.2z" fill="#34A853"/>
                    <path d="M9.9 8.9a3.3 3.3 0 010-2.1V5.3H8.1a5.5 5.5 0 000 5l1.8-1.4z" fill="#FBBC04"/>
                    <path d="M13 4.4c.8 0 1.6.3 2.1.8l1.6-1.6A5.5 5.5 0 0013 2.2 5.5 5.5 0 008.1 5.3L9.9 6.8C10.3 5.4 11.5 4.4 13 4.4z" fill="#EA4335"/>
                  </svg>
                  <span className="text-[10px] font-medium text-gray-600">Pay</span>
                </div>
                <div className="px-2 py-1 border border-gray-200 rounded bg-white flex items-center gap-1">
                  <svg className="h-4 w-auto" viewBox="0 0 20 20" fill="currentColor"><path d="M7.5 3.1c.4-.5.7-1.2.6-1.9-.6 0-1.3.4-1.7.9-.4.4-.7 1.1-.6 1.8.6 0 1.3-.3 1.7-.8zM8.1 4.4c-.5 0-1 .2-1.4.3-.3.1-.5.2-.7.2-.2 0-.4-.1-.7-.2-.3-.1-.7-.2-1.1-.2-.7 0-1.4.4-1.8 1.1-.8 1.3-.2 3.3.6 4.4.4.5.8.8 1.2.7.3 0 .5-.1.8-.2.3-.1.6-.2.9-.2.3 0 .6.1.9.2.3.1.5.2.8.2.5 0 .9-.4 1.2-.7.3-.4.5-.8.5-.8s-.6-.2-.6-1c0-.6.5-1 .7-1.1-.4-.6-1-.9-1.3-.9z"/></svg>
                  <span className="text-[10px] font-medium text-gray-600">Pay</span>
                </div>
              </>
            )}
            {/* UPI - only show for INR currency */}
            {currency.toLowerCase() === 'inr' && (
              <div className="px-2 py-1 border border-gray-200 rounded bg-white">
                <span className="text-xs font-bold text-gray-700">UPI</span>
              </div>
            )}
            {/* Amex */}
            <div className="px-2 py-1 border border-gray-200 rounded bg-white">
              <span className="text-[10px] font-bold text-blue-600">AMEX</span>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-2 text-sm">
            {orderDetails.orderNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium text-gray-900 font-mono text-xs">
                  {orderDetails.orderNumber}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Customer Name:</span>
              <span className="font-medium text-gray-900">{orderDetails.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{orderDetails.email}</span>
            </div>
            {orderDetails.phoneNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Number:</span>
                <span className="font-medium text-gray-900">{orderDetails.phoneNumber}</span>
              </div>
            )}
            {orderDetails.voucherCode && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Voucher Applied:</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-mono text-xs font-semibold">
                    {orderDetails.voucherCode}
                  </span>
                  {orderDetails.discount && orderDetails.discount > 0 && (
                    <span className="text-green-600 font-semibold">
                      -{currencySymbol}{(orderDetails.discount / 100).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-gray-900">
                {currencySymbol}{(amount / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="px-6 py-6">
          <Elements stripe={stripePromise} options={options}>
            <StripePaymentForm
              amount={amount}
              currency={currency}
              onSuccess={onPaymentSuccess}
              onError={onPaymentError}
              returnUrl={`${window.location.origin}/nfc/success`}
            />
          </Elements>
        </div>

        {/* Security Notice */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
          <div className="flex items-start gap-3 text-xs text-gray-600">
            <svg
              className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <div>
              <p className="font-semibold text-gray-900 mb-1">
                Your payment is secure
              </p>
              <p className="leading-relaxed">
                Your card information is encrypted and securely processed by Stripe.
                We never store your card details on our servers. This payment is
                PCI DSS Level 1 compliant - the highest level of payment security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
