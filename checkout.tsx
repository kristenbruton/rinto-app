import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { Ship, Calendar, Clock, MapPin, CreditCard, Check, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

function CheckoutForm({ bookingId }: { bookingId: string }) {
  const [, navigate] = useLocation();
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + `/booking-confirmed/${bookingId}`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "Something went wrong with your payment",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 mb-6">
        <PaymentElement />
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={!stripe || !elements || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" /> Pay Now
          </>
        )}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const { bookingId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");

  // Fetch booking details
  const { data: booking, isLoading: isBookingLoading, error: bookingError } = useQuery({
    queryKey: [`/api/bookings/${bookingId}`],
    enabled: !!bookingId,
  });

  // Fetch listing details
  const { data: listing, isLoading: isListingLoading } = useQuery({
    queryKey: [`/api/listings/${booking?.listingId}`],
    enabled: !!booking?.listingId,
  });

  // Create payment intent
  useEffect(() => {
    if (booking && booking.status === 'pending' && !booking.stripePaymentIntentId) {
      apiRequest("POST", "/api/create-payment-intent", { bookingId: booking.id })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch((err) => {
          toast({
            title: "Error",
            description: "Failed to create payment intent. Please try again.",
            variant: "destructive",
          });
        });
    } else if (booking && booking.status !== 'pending') {
      // If booking is already paid for, redirect to the bookings page
      toast({
        title: "Already Paid",
        description: "This booking has already been paid for.",
      });
      navigate("/my-bookings");
    }
  }, [booking, bookingId, toast, navigate]);

  // Loading states
  if (isBookingLoading || isListingLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Error state
  if (bookingError || !booking) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Booking Not Found</h2>
                <p className="text-neutral-600 mb-6">
                  We couldn't find the booking you're looking for. It might have been canceled or doesn't exist.
                </p>
                <Button 
                  onClick={() => navigate("/my-bookings")}
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Go to My Bookings
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);
  const isSameDay = startDate.toDateString() === endDate.toDateString();
  const totalPrice = booking.totalPrice / 100; // Convert cents to dollars
  const serviceFee = totalPrice * 0.1; // 10% service fee

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/my-bookings")} 
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Bookings
          </Button>

          <h1 className="text-3xl font-heading font-bold mb-6">Complete Your Booking</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Booking Summary */}
            <div className="md:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="h-16 w-16 rounded-md overflow-hidden mr-4">
                        {listing && listing.imagesJson && (
                          <img 
                            src={listing.imagesJson[0]} 
                            alt={listing.title}
                            className="h-full w-full object-cover" 
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{listing?.title}</h3>
                        <p className="text-neutral-500 text-sm flex items-center">
                          <MapPin className="h-3 w-3 mr-1" /> {listing?.location}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <Calendar className="h-4 w-4 mr-2 mt-0.5 text-neutral-500" />
                        <div>
                          <p className="text-sm font-medium">Date</p>
                          <p className="text-neutral-600">
                            {format(startDate, "MMMM d, yyyy")}
                            {!isSameDay && ` - ${format(endDate, "MMMM d, yyyy")}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Clock className="h-4 w-4 mr-2 mt-0.5 text-neutral-500" />
                        <div>
                          <p className="text-sm font-medium">Time</p>
                          <p className="text-neutral-600">
                            {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Hourly Rate</span>
                        <span>${(listing?.pricePerHour / 100).toFixed(2)}/hour</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rental Duration</span>
                        <span>
                          {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))} hours
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>${(totalPrice - serviceFee).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Fee</span>
                        <span>${serviceFee.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Payment */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Payment</CardTitle>
                  <CardDescription>
                    Secure payment via Stripe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!clientSecret ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm bookingId={bookingId} />
                    </Elements>
                  )}
                </CardContent>
                <CardFooter className="flex-col space-y-2 items-start">
                  <div className="flex items-center text-sm text-neutral-600">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span>Secure SSL encryption</span>
                  </div>
                  <div className="flex items-center text-sm text-neutral-600">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span>No hidden fees</span>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
