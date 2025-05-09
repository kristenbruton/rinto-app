import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!key) {
      console.warn('Missing Stripe public key. Payment features will be unavailable.');
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

export default getStripe;
