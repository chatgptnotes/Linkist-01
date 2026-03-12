'use client';

import { useState, FormEvent } from 'react';
import {
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

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

interface StripePaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  returnUrl?: string;
}

export default function StripePaymentForm({
  amount,
  currency = 'usd',
  onSuccess,
  onError,
  returnUrl
}: StripePaymentFormProps) {
  const currencySymbol = getCurrencySymbol(currency);
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showExpressCheckout, setShowExpressCheckout] = useState(false);
  const [expressDebug, setExpressDebug] = useState<string>('loading...');

  const confirmPayment = async () => {
    if (!stripe || !elements) {
      setErrorMessage('Payment system is still loading. Please try again.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl || window.location.origin + '/order-success',
        },
        redirect: 'if_required',
      });

      if (error) {
        const message = error.message || 'An unexpected error occurred.';
        setErrorMessage(message);
        onError(message);
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        setErrorMessage('Additional authentication required. Please complete the verification.');
        setIsProcessing(false);
      } else {
        setErrorMessage('Payment status unclear. Please check your order status.');
        setIsProcessing(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMessage(message);
      onError(message);
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await confirmPayment();
  };

  // Handle Express Checkout (Apple Pay / Google Pay) confirmation
  const handleExpressCheckoutConfirm = async () => {
    await confirmPayment();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Express Checkout - Apple Pay, Google Pay buttons */}
      <div>
        <ExpressCheckoutElement
          onConfirm={handleExpressCheckoutConfirm}
          onReady={({ availablePaymentMethods }) => {
            console.log('[Stripe] ExpressCheckout available methods:', availablePaymentMethods);
            setExpressDebug(JSON.stringify(availablePaymentMethods));
            if (availablePaymentMethods) {
              setShowExpressCheckout(true);
            }
          }}
          onLoadError={(error) => {
            console.error('[Stripe] ExpressCheckout load error:', error);
            setExpressDebug(`error: ${error?.message || JSON.stringify(error)}`);
          }}
          onClick={({ resolve }) => {
            resolve();
          }}
          options={{
            paymentMethods: {
              applePay: 'always',
              googlePay: 'auto',
            },
          }}
        />
        {/* Temporary debug - remove after testing */}
        <p className="text-xs text-gray-400 mt-1">Wallet: {expressDebug}</p>
        {showExpressCheckout && (
          <div className="flex items-center gap-3 mt-4 mb-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-500 font-medium">Or pay with card</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        )}
      </div>

      {/* Payment Element - Card, UPI, etc. */}
      <PaymentElement
        onReady={() => setIsReady(true)}
        onLoadError={(e) => {
          console.error('[Stripe] PaymentElement failed to load:', e);
          setErrorMessage('Payment form failed to load. Please refresh the page and try again.');
          setIsReady(true); // Unblock UI so user can see the error
        }}
        onChange={(event) => {
          if (event.complete) setErrorMessage(null);
        }}
        options={{
          layout: 'tabs',
          // Disable wallets in PaymentElement — handled by ExpressCheckoutElement above
          // Having both enabled can cause conflicts where neither shows
          wallets: {
            googlePay: 'never',
            applePay: 'never',
          },
          // For INR: show UPI first so Indian users see it immediately
          ...(currency.toLowerCase() === 'inr' && {
            paymentMethodOrder: ['upi', 'card'],
          }),
        }}
      />

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Amount Display */}
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
        <span className="text-lg font-semibold">Total Amount:</span>
        <span className="text-2xl font-bold">
          {currencySymbol}{(amount / 100).toFixed(2)}
        </span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || !elements || !isReady || isProcessing}
        className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all ${
          !stripe || !elements || !isReady || isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-black hover:bg-gray-800 active:scale-95'
        }`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing Payment...
          </span>
        ) : !isReady ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading Payment Form...
          </span>
        ) : (
          `Pay ${currencySymbol}${(amount / 100).toFixed(2)}`
        )}
      </button>

      {/* Security Notice */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Secured by Stripe - PCI DSS compliant</span>
      </div>
    </form>
  );
}
