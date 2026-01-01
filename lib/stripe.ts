import Stripe from 'stripe';

// Helper function to get Stripe instance only when needed
export function getStripe(): Stripe {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error('Stripe secret key not configured');
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
    typescript: true,
  });
}

// Legacy export - only use when Stripe is definitely configured
export const stripe = {
  get instance() {
    return getStripe();
  }
};

export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};

export const formatAmountFromStripe = (amount: number): number => {
  return amount / 100;
};

// Product configuration
export const PRODUCT_CONFIG = {
  NFC_CARD: {
    id: 'nfc-card',
    name: 'Linkist NFC Card',
    price: 29.99,
    currency: 'usd',
  },
  SHIPPING: {
    id: 'shipping',
    name: 'Standard Shipping',
    price: 5.00,
    currency: 'usd',
  },
  TAX_RATE: 0.05, // 5% VAT
};

export default stripe;