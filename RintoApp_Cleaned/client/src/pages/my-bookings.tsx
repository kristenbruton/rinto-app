import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { Ship, Calendar, Clock, MapPin, CreditCard, CheckCircle, XCircle, MessageSquare, Star, Loader2, AlertTriangle } from 'lucide-react';

export default function MyBookings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState<number | null>(null);
  const [reviewListingId, setReviewListingId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // Fetch user's bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['/api/my-bookings'],
  });

  // Fetch listings data for the bookings
  const { data: listingsMap = {}, isLoading: isListingsLoading } = useQuery({
    queryKey: ['/api/bookings/listings'],
    enabled: bookings.length > 0,
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: { bookingId: number; listingId: number; rating: number; comment: string }) => {
      const response = await apiRequest("POST", "/api/reviews", reviewData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Thank you for sharing your experience!",
      });
      setIsReviewDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/my-bookings'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      await apiRequest("PATCH", `/api/bookings/${bookingId}/cancel`);
      return bookingId;
    },
    onSuccess: () => {
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully",
      });
      setIsCancelDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/my-bookings'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle review submission
  const handleSubmitReview = () => {
    if (reviewBookingId && reviewListingId) {
      submitReviewMutation.mutate({
        bookingId: reviewBookingId,
        listingId: reviewListingId,
        rating,
        comment: reviewComment,
      });
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = () => {
    if (cancelBookingId) {
      cancelBookingMutation.mutate(cancelBookingId);
    }
  };

  // Open review dialog
  const openReviewDialog = (bookingId: number, listingId: number) => {
    setReviewBookingId(bookingId);
    setReviewListingId(listingId);
    setRating(5);
    setReviewComment('');
    setIsReviewDialogOpen(true);
  };

  // Open cancel dialog
  const openCancelDialog = (bookingId: number) => {
    setCancelBookingId(bookingId);
    setIsCancelDialogOpen(true);
  };

  // Filter bookings by status
  const upcomingBookings = bookings.filter(booking => 
    ['pending', 'confirmed'].includes(booking.status) && 
    new Date(booking.startTime) > new Date()
  );
  
  const completedBookings = bookings.filter(booking => 
    booking.status === 'completed' || 
    (booking.status === 'confirmed' && new Date(booking.endTime) < new Date())
  );
  
  const cancelledBookings = bookings.filter(booking => 
    booking.status === 'cancelled'
  );

  // Get listing details
  const getListingDetails = (listingId: number) => {
    return listingsMap[listingId] || null;
  };

  // Render booking card
  const renderBookingCard = (booking: any) => {
    const listing = getListingDetails(booking.listingId);
    const startDate = new Date(booking.startTime);
    const endDate = new Date(booking.endTime);
    const isSameDay = startDate.toDateString() === endDate.toDateString();
    
    // Determine status badge
    let statusBadge;
    if (booking.status === 'pending') {
      statusBadge = <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending Payment</Badge>;
    } else if (booking.status === 'confirmed') {
      statusBadge = <Badge variant="outline" className="border-green-500 text-green-500">Confirmed</Badge>;
    } else if (booking.status === 'completed') {
      statusBadge = <Badge variant="outline" className="border-blue-500 text-blue-500">Completed</Badge>;
    } else if (booking.status === 'cancelled') {
      statusBadge = <Badge variant="outline" className="border-red-500 text-red-500">Cancelled</Badge>;
    }

    return (
      <Card key={booking.id} className="mb-4 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {listing && (
            <div 
              className="h-48 md:h-auto md:w-48 bg-center bg-cover"
              style={{ backgroundImage: `url('${listing.imagesJson[0]}')` }}
            ></div>
          )}
          <div className="flex-grow p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-semibold">{listing ? listing.title : 'Loading...'}</h3>
                {listing && (
                  <p className="text-neutral-500 flex items-center text-sm">
                    <MapPin className="h-3 w-3 mr-1" /> {listing.location}
                  </p>
                )}
              </div>
              <div>{statusBadge}</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
              
              <div className="flex items-start">
                <Ship className="h-4 w-4 mr-2 mt-0.5 text-neutral-500" />
                <div>
                  <p className="text-sm font-medium">Watercraft</p>
                  <p className="text-neutral-600">{listing ? listing.title : 'Loading...'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CreditCard className="h-4 w-4 mr-2 mt-0.5 text-neutral-500" />
                <div>
                  <p className="text-sm font-medium">Total Price</p>
                  <p className="text-neutral-600">${(booking.totalPrice / 100).toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-between items-center mt-4 pt-3 border-t border-neutral-200">
              <div>
                {booking.status === 'pending' && (
                  <Button 
                    onClick={() => navigate(`/checkout/${booking.id}`)}
                    className="mr-2"
                  >
                    <CreditCard className="mr-2 h-4 w-4" /> Complete Payment
                  </Button>
                )}
                
                {['confirmed', 'completed'].includes(booking.status) && (
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/listings/${booking.listingId}`)}
                    className="mr-2"
                  >
                    <Ship className="mr-2 h-4 w-4" /> View Listing
                  </Button>
                )}

                {booking.status === 'pending' && (
                  <Button 
                    variant="outline" 
                    onClick={() => openCancelDialog(booking.id)}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                )}
              </div>
              
              {booking.status === 'completed' && !booking.hasReviewed && (
                <Button onClick={() => openReviewDialog(booking.id, booking.listingId)}>
                  <Star className="mr-2 h-4 w-4" /> Write Review
                </Button>
              )}

              {booking.status === 'completed' && booking.hasReviewed && (
                <Badge variant="secondary">
                  <CheckCircle className="mr-2 h-3 w-3" /> Reviewed
                </Badge>
              )}
              
              {booking.owner && (
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    // Send message to owner
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" /> Message Owner
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-heading font-bold mb-6">My Bookings</h1>

          {isLoading || isListingsLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Ship className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
                <p className="text-neutral-500 mb-6">
                  You haven't made any watercraft bookings yet. Start exploring available options!
                </p>
                <Button onClick={() => navigate('/search')}>
                  Find Watercraft
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="upcoming">
              <TabsList className="mb-6">
                <TabsTrigger value="upcoming">
                  Upcoming ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedBookings.length})
                </TabsTrigger>
                <TabsTrigger value="cancelled">
                  Cancelled ({cancelledBookings.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming">
                {upcomingBookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <h3 className="text-xl font-semibold mb-2">No Upcoming Bookings</h3>
                      <p className="text-neutral-500 mb-4">
                        You don't have any upcoming watercraft rentals at the moment.
                      </p>
                      <Button onClick={() => navigate('/search')}>
                        Find Watercraft
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  upcomingBookings.map(renderBookingCard)
                )}
              </TabsContent>
              
              <TabsContent value="completed">
                {completedBookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <h3 className="text-xl font-semibold mb-2">No Completed Bookings</h3>
                      <p className="text-neutral-500 mb-4">
                        You don't have any completed watercraft rentals yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  completedBookings.map(renderBookingCard)
                )}
              </TabsContent>
              
              <TabsContent value="cancelled">
                {cancelledBookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <h3 className="text-xl font-semibold mb-2">No Cancelled Bookings</h3>
                      <p className="text-neutral-500 mb-4">
                        You don't have any cancelled watercraft rentals.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  cancelledBookings.map(renderBookingCard)
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Review Dialog */}
          <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
                <DialogDescription>
                  Share your experience to help other renters make informed decisions.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className="focus:outline-none"
                      >
                        <Star 
                          className={`h-6 w-6 ${value <= rating ? 'text-yellow-400 fill-current' : 'text-neutral-300'}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Comments</label>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share the details of your experience..."
                    className="h-32"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsReviewDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitReview}
                  disabled={submitReviewMutation.isPending}
                >
                  {submitReviewMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Cancel Booking Dialog */}
          <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" /> Cancel Booking
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel this booking? Cancellation policies may apply.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCancelDialogOpen(false)}
                >
                  Keep Booking
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleCancelBooking}
                  disabled={cancelBookingMutation.isPending}
                >
                  {cancelBookingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelling...
                    </>
                  ) : (
                    'Cancel Booking'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </>
  );
}
