import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Ship, MapPin, Users, Calendar, MoreVertical, PenSquare, Trash2, AlertTriangle, Loader2, Star } from 'lucide-react';

export default function MyListings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch user's listings
  const { data: listings = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/my-listings'],
  });

  // Fetch watercraft types
  const { data: watercraftTypes = [] } = useQuery({
    queryKey: ['/api/types'],
  });

  // Delete listing mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/listings/${id}`);
      return id;
    },
    onSuccess: (id) => {
      toast({
        title: "Listing Deleted",
        description: "Your watercraft listing has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/my-listings'] });
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the listing. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle delete confirmation
  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  // Filter active and inactive listings
  const activeListings = listings.filter((listing) => listing.isActive);
  const inactiveListings = listings.filter((listing) => !listing.isActive);

  // Get watercraft type name
  const getTypeName = (typeId: number) => {
    const type = watercraftTypes.find(t => t.id === typeId);
    return type ? type.name : 'Watercraft';
  };

  // Render listing card
  const renderListingCard = (listing: any) => (
    <Card key={listing.id} className="mb-4 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div 
          className="h-48 md:h-auto md:w-48 bg-center bg-cover"
          style={{ backgroundImage: `url('${listing.imagesJson[0]}')` }}
        ></div>
        <div className="flex-grow p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold mb-1">{listing.title}</h3>
              <p className="text-neutral-500 flex items-center text-sm mb-2">
                <MapPin className="h-3 w-3 mr-1" /> {listing.location}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {listing.rating ? (
                <div className="flex items-center mr-4">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span className="font-medium">{listing.rating.toFixed(1)}</span>
                  <span className="text-neutral-400 text-sm ml-1">({listing.reviewCount})</span>
                </div>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/listings/${listing.id}`)}>
                    View Listing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/edit-listing/${listing.id}`)}>
                    <PenSquare className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => {
                      setDeleteId(listing.id);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 my-3">
            <Badge variant="secondary">
              <Ship className="h-3 w-3 mr-1" /> {getTypeName(listing.typeId)}
            </Badge>
            <Badge variant="secondary">
              <Users className="h-3 w-3 mr-1" /> {listing.capacity} {listing.capacity === 1 ? 'person' : 'people'}
            </Badge>
            {listing.year && (
              <Badge variant="secondary">
                <Calendar className="h-3 w-3 mr-1" /> {listing.year}
              </Badge>
            )}
          </div>
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-neutral-200">
            <div>
              <span className="font-heading font-bold text-xl">${(listing.pricePerHour / 100).toFixed(0)}</span>
              <span className="text-neutral-500 text-sm">/hour</span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => navigate(`/listing-availability/${listing.id}`)}>
                Manage Availability
              </Button>
              <Button onClick={() => navigate(`/listings/${listing.id}`)}>
                View Listing
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-heading font-bold">My Listings</h1>
            <Button onClick={() => navigate('/create-listing')}>
              Create New Listing
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : listings.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Ship className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Listings Yet</h3>
                <p className="text-neutral-500 mb-6">
                  You haven't created any watercraft listings yet. Create your first listing now!
                </p>
                <Button onClick={() => navigate('/create-listing')}>
                  Create Listing
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="active">
              <TabsList className="mb-6">
                <TabsTrigger value="active">
                  Active Listings ({activeListings.length})
                </TabsTrigger>
                <TabsTrigger value="inactive">
                  Inactive Listings ({inactiveListings.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active">
                {activeListings.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <h3 className="text-xl font-semibold mb-2">No Active Listings</h3>
                      <p className="text-neutral-500 mb-4">
                        You don't have any active watercraft listings at the moment.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  activeListings.map(renderListingCard)
                )}
              </TabsContent>
              
              <TabsContent value="inactive">
                {inactiveListings.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <h3 className="text-xl font-semibold mb-2">No Inactive Listings</h3>
                      <p className="text-neutral-500 mb-4">
                        You don't have any inactive watercraft listings.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  inactiveListings.map(renderListingCard)
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center text-destructive">
                  <AlertTriangle className="h-5 w-5 mr-2" /> Delete Listing
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this listing? This action cannot be undone, and any 
                  future bookings will be cancelled.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...
                    </>
                  ) : (
                    'Delete Listing'
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
