'use client';

import { useState, FormEvent } from 'react';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

interface StripePaymentFormProps {
  amount: number;
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  returnUrl?: string;
}

const elementStyle = {
  base: {
    fontSize: '16px',
    color: '#30313d',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    '::placeholder': {
      color: '#aab7c4',
    },
  },
  invalid: {
    color: '#df1b41',
  },
};

export default function StripePaymentForm({
  amount,
  clientSecret,
  onSuccess,
  onError,
  returnUrl
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [readyCount, setReadyCount] = useState(0);

  const isElementReady = readyCount >= 3;

  const handleReady = () => {
    setReadyCount((prev) => prev + 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Payment system is still loading. Please try again.');
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      setErrorMessage('Payment form is not ready yet. Please wait a moment.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
        },
        return_url: returnUrl || window.location.origin + '/order-success',
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Card number</label>
        <div className="p-3.5 border border-gray-300 rounded-lg focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
          <CardNumberElement
            options={{ style: elementStyle, showIcon: true }}
            onReady={handleReady}
            onChange={(event) => {
              if (event.error) setErrorMessage(event.error.message);
              else setErrorMessage(null);
            }}
          />
        </div>
      </div>

      {/* Expiry & CVC row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry date</label>
          <div className="p-3.5 border border-gray-300 rounded-lg focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
            <CardExpiryElement
              options={{ style: elementStyle }}
              onReady={handleReady}
              onChange={(event) => {
                if (event.error) setErrorMessage(event.error.message);
                else setErrorMessage(null);
              }}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Security code</label>
          <div className="p-3.5 border border-gray-300 rounded-lg focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
            <CardCvcElement
              options={{ style: elementStyle }}
              onReady={handleReady}
              onChange={(event) => {
                if (event.error) setErrorMessage(event.error.message);
                else setErrorMessage(null);
              }}
            />
          </div>
        </div>
      </div>

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
          ${(amount / 100).toFixed(2)}
        </span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || !elements || !isElementReady || isProcessing}
        className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all ${
          !stripe || !elements || !isElementReady || isProcessing
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
        ) : !isElementReady ? (
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
          `Pay $${(amount / 100).toFixed(2)}`
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
