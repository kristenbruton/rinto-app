import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { CalendarDays, MessageSquare, Star, Heart, MapPin, Users, Ruler, Ship, Calendar, Music, AlertTriangle, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function ListingDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<{start: string; end: string}[]>([]);
  const [messageContent, setMessageContent] = useState('');

  // Fetch listing details
  const { data: listing, isLoading: isListingLoading } = useQuery({
    queryKey: [`/api/listings/${id}`],
  });

  // Fetch watercraft types for displaying the type name
  const { data: watercraftTypes = [] } = useQuery({
    queryKey: ['/api/types'],
  });

  // Fetch owner info
  const { data: owner, isLoading: isOwnerLoading } = useQuery({
    queryKey: [`/api/users/${listing?.ownerId}`],
    enabled: !!listing?.ownerId,
  });

  // Fetch reviews
  const { data: reviews = [], isLoading: isReviewsLoading } = useQuery({
    queryKey: [`/api/listings/${id}/reviews`],
    enabled: !!id,
  });

  // Fetch availability for the selected date
  const { data: availabilityData = [], refetch: refetchAvailability } = useQuery({
    queryKey: [`/api/listings/${id}/availability`, { date: selectedDate?.toISOString() }],
    enabled: !!id && !!selectedDate,
  });

  // Check if the listing is saved by the current user
  useQuery({
    queryKey: [`/api/is-saved/${id}`],
    enabled: !!id && isAuthenticated,
    onSuccess: (data) => {
      setIsSaved(data.isSaved);
    },
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Booking Created",
        description: "Redirecting to checkout...",
      });
      navigate(`/checkout/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle saved/favorite mutation
  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await apiRequest("DELETE", `/api/save-listing/${id}`);
        return false;
      } else {
        await apiRequest("POST", `/api/save-listing/${id}`);
        return true;
      }
    },
    onSuccess: (saved) => {
      setIsSaved(saved);
      toast({
        title: saved ? "Saved!" : "Removed",
        description: saved 
          ? "Watercraft added to your saved list" 
          : "Watercraft removed from your saved list",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-listings"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update saved status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/messages/start", {
        recipientId: listing.ownerId,
        listingId: id,
        content: messageContent,
      });
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the owner",
      });
      setMessageContent('');
      // Redirect to messages page
      navigate('/messages');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Process availability data
  useEffect(() => {
    if (availabilityData && availabilityData.length > 0) {
      const times = availabilityData
        .filter((slot: any) => slot.isAvailable)
        .map((slot: any) => ({
          start: minutesToTimeString(slot.startTime),
          end: minutesToTimeString(slot.endTime),
        }));
      setAvailableTimes(times);
    } else {
      // Default availability if none is set (8am to 6pm)
      const defaultTimes = [{ start: '08:00', end: '18:00' }];
      setAvailableTimes(defaultTimes);
    }
  }, [availabilityData]);

  // Helper function to convert minutes from midnight to time string (HH:MM)
  const minutesToTimeString = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Handle image navigation
  const nextImage = () => {
    if (listing && listing.imagesJson) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === listing.imagesJson.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (listing && listing.imagesJson) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? listing.imagesJson.length - 1 : prevIndex - 1
      );
    }
  };

  // Handle booking
  const handleBookNow = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }

    if (!startTime || !endTime) {
      toast({
        title: "Select Time",
        description: "Please select both start and end times for your booking",
        variant: "destructive",
      });
      return;
    }

    const startDateTime = new Date(selectedDate);
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(selectedDate);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    createBookingMutation.mutate({
      listingId: Number(id),
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    });
  };

  // Handle message send
  const handleSendMessage = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }

    if (!messageContent.trim()) {
      toast({
        title: "Empty Message",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate();
  };

  // Handle save toggle
  const handleToggleSave = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }

    toggleSaveMutation.mutate();
  };

  if (isListingLoading || isAuthLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!listing) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Listing Not Found</h2>
            <p className="text-neutral-500 mb-4">The watercraft you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/search')}>
              Browse Other Watercraft
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const typeName = watercraftTypes.find(t => t.id === listing.typeId)?.name || 'Watercraft';
  const features = listing.featuresJson || [];
  const images = listing.imagesJson || [];
  const averageRating = listing.rating || 0;

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Button variant="link" className="p-0" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Search
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="relative rounded-lg overflow-hidden shadow-md">
              <div className="h-[400px] bg-center bg-cover" style={{ backgroundImage: `url('${images[currentImageIndex]}')` }}>
                {images.length > 1 && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white rounded-full"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white rounded-full"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
                <div className="absolute top-4 right-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black bg-opacity-30 text-white rounded-full"
                    onClick={handleToggleSave}
                    disabled={toggleSaveMutation.isPending}
                  >
                    <Heart className={`h-5 w-5 ${isSaved ? 'fill-current text-red-500' : 'text-white'}`} />
                  </Button>
                </div>
              </div>
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex overflow-x-auto space-x-2 p-2 bg-white">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className={`h-16 w-24 flex-shrink-0 rounded cursor-pointer ${
                        currentImageIndex === index ? 'ring-2 ring-primary' : ''
                      }`}
                      style={{ backgroundImage: `url('${img}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Listing Details */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-heading font-bold">{listing.title}</h1>
                    <p className="text-neutral-500 flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" /> {listing.location}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium">{averageRating.toFixed(1)}</span>
                    <span className="text-neutral-400 text-sm ml-1">({listing.reviewCount || 0})</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" /> {listing.capacity} {listing.capacity === 1 ? 'person' : 'people'}
                  </Badge>
                  
                  {listing.length && (
                    <Badge variant="secondary">
                      <Ruler className="h-3 w-3 mr-1" /> {listing.length} ft
                    </Badge>
                  )}
                  
                  <Badge variant="secondary">
                    <Ship className="h-3 w-3 mr-1" /> {typeName}
                  </Badge>
                  
                  {listing.year && (
                    <Badge variant="secondary">
                      <Calendar className="h-3 w-3 mr-1" /> {listing.year}
                    </Badge>
                  )}
                  
                  {features.includes("Bluetooth") && (
                    <Badge variant="secondary">
                      <Music className="h-3 w-3 mr-1" /> Bluetooth
                    </Badge>
                  )}
                </div>

                <div className="border-t border-neutral-200 pt-6">
                  <h2 className="text-xl font-semibold mb-3">Description</h2>
                  <p className="text-neutral-600">{listing.description}</p>
                </div>

                {features.length > 0 && (
                  <div className="border-t border-neutral-200 pt-6 mt-6">
                    <h2 className="text-xl font-semibold mb-3">Features</h2>
                    <ul className="grid grid-cols-2 gap-2">
                      {features.map((feature, index) => (
                        <li key={index} className="flex items-center text-neutral-600">
                          <Check className="h-4 w-4 text-green-500 mr-2" /> {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs for Reviews and Location */}
            <Tabs defaultValue="reviews">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>
              
              <TabsContent value="reviews" className="bg-white rounded-lg shadow-md p-6 mt-2">
                <h2 className="text-xl font-semibold mb-4">Reviews</h2>
                
                {isReviewsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="border-b border-neutral-200 pb-6 last:border-0">
                        <div className="flex items-start">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={review.user?.profileImageUrl} alt={review.user?.firstName || "User"} />
                            <AvatarFallback>{review.user?.firstName?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium">{review.user?.firstName || "User"}</h3>
                              <span className="mx-2 text-neutral-300">•</span>
                              <span className="text-sm text-neutral-500">
                                {format(new Date(review.createdAt), "MMMM yyyy")}
                              </span>
                            </div>
                            <div className="flex text-yellow-400 my-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < review.rating ? 'fill-current' : ''}`} 
                                />
                              ))}
                            </div>
                            <p className="text-neutral-600 mt-1">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-500 text-center py-8">No reviews yet for this watercraft.</p>
                )}
              </TabsContent>
              
              <TabsContent value="location" className="bg-white rounded-lg shadow-md p-6 mt-2">
                <h2 className="text-xl font-semibold mb-4">Location</h2>
                <p className="text-neutral-600 mb-4">
                  <MapPin className="h-4 w-4 inline mr-1" /> {listing.location}
                </p>
                <div className="rounded-lg overflow-hidden shadow-md h-[300px] bg-neutral-100">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(listing.location)}`}
                    allowFullScreen
                  />
                </div>
                <p className="text-sm text-neutral-500 mt-2">
                  The exact location will be provided after your booking is confirmed.
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Booking and Owner */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="shadow-md sticky top-24">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="font-heading font-bold text-2xl">${(listing.pricePerHour / 100).toFixed(0)}</span>
                    <span className="text-neutral-500">/hour</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span>{averageRating.toFixed(1)}</span>
                    <span className="text-neutral-400 text-sm ml-1">({listing.reviewCount || 0})</span>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2" /> Select Date and Time
                  </h3>
                  
                  <DateTimePicker
                    date={selectedDate}
                    setDate={setSelectedDate}
                    startTime={startTime}
                    setStartTime={setStartTime}
                    endTime={endTime}
                    setEndTime={setEndTime}
                    availableTimes={availableTimes}
                    minDate={new Date()}
                  />
                </div>

                <div className="border-t border-neutral-200 pt-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span>${(listing.pricePerHour / 100).toFixed(0)} × 2 hours</span>
                    <span>${((listing.pricePerHour * 2) / 100).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Service fee</span>
                    <span>${((listing.pricePerHour * 0.1) / 100).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-neutral-200">
                    <span>Total</span>
                    <span>${((listing.pricePerHour * 2.1) / 100).toFixed(0)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleBookNow}
                  disabled={createBookingMutation.isPending}
                >
                  {createBookingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    'Book Now'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Owner Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">About the Owner</h3>
                
                {isOwnerLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : owner ? (
                  <div>
                    <div className="flex items-center mb-4">
                      <Avatar className="h-12 w-12 mr-3">
                        <AvatarImage src={owner.profileImageUrl} alt={owner.firstName || "Owner"} />
                        <AvatarFallback>{owner.firstName?.charAt(0) || "O"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{owner.firstName} {owner.lastName}</h4>
                        <p className="text-sm text-neutral-500">Owner since {format(new Date(owner.createdAt), "MMMM yyyy")}</p>
                      </div>
                    </div>
                    
                    {owner.bio && (
                      <p className="text-neutral-600 mb-4">{owner.bio}</p>
                    )}
                    
                    <div className="border-t border-neutral-200 pt-4">
                      <Label htmlFor="message">Message the Owner</Label>
                      <Textarea
                        id="message"
                        placeholder="Ask a question about this watercraft..."
                        className="mt-2 mb-3"
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        disabled={sendMessageMutation.isPending || user?.id === owner.id}
                      />
                      <Button 
                        className="w-full" 
                        onClick={handleSendMessage}
                        disabled={sendMessageMutation.isPending || user?.id === owner.id}
                      >
                        {sendMessageMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="mr-2 h-4 w-4" /> Send Message
                          </>
                        )}
                      </Button>
                      {user?.id === owner.id && (
                        <p className="text-xs text-neutral-500 mt-2 text-center">
                          You cannot message yourself as the owner
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-neutral-500">Owner information not available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
