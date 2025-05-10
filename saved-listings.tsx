import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WatercraftCard } from '@/components/ui/watercraft-card';
import { Ship, Loader2 } from 'lucide-react';

export default function SavedListings() {
  const [, navigate] = useLocation();

  // Fetch saved listings
  const { data: savedListings = [], isLoading } = useQuery({
    queryKey: ['/api/saved-listings'],
  });

  // Fetch watercraft types for displaying type names
  const { data: watercraftTypes = [] } = useQuery({
    queryKey: ['/api/types'],
  });

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-heading font-bold">Saved Watercraft</h1>
          <Button onClick={() => navigate('/search')}>
            Browse Watercraft
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : savedListings.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Ship className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Saved Listings</h3>
              <p className="text-neutral-500 mb-6">
                You haven't saved any watercraft listings yet. Browse available options and save your favorites!
              </p>
              <Button onClick={() => navigate('/search')}>
                Find Watercraft
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedListings.map((listing) => (
              <WatercraftCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                location={listing.location}
                pricePerHour={listing.pricePerHour}
                imageUrl={listing.imagesJson[0]}
                rating={listing.rating}
                reviewCount={listing.reviewCount}
                capacity={listing.capacity}
                type={watercraftTypes.find(t => t.id === listing.typeId)?.name || 'Watercraft'}
                length={listing.length}
                year={listing.year}
                features={listing.featuresJson}
                isSaved={true}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
