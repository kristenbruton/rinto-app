import Stripe from "stripe";

// Check if we have the Stripe API key, but don't throw an error right away
const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

if (hasStripeKey) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-04-30.basil",
  });
} else {
  console.warn('Stripe secret key missing. Payment features will be unavailable.');
}

// Calculate the total price based on hourly rate and time difference
export function calculateTotalAmount(pricePerHour: number, startTime: Date, endTime: Date): number {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const durationInHours = (end - start) / (1000 * 60 * 60);
  
  // Round to the nearest half hour and ensure minimum of 1 hour
  const roundedDuration = Math.max(Math.ceil(durationInHours * 2) / 2, 1);
  
  return Math.round(pricePerHour * roundedDuration);
}

// Create a payment intent for a booking
export async function createPaymentIntent(amount: number, metadata: any): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Payment features are unavailable.');
  }
  return await stripe.paymentIntents.create({
    amount, // in cents
    currency: "usd",
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });
}

// Retrieve a payment intent
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Payment features are unavailable.');
  }
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

// Export the stripe instance for use elsewhere
export { stripe };
