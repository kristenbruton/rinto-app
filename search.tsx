import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { WatercraftCard } from '@/components/ui/watercraft-card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Loader2, Calendar as CalendarIcon, Ship, MapPin, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Search() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');

  // State for filters
  const [searchLocation, setSearchLocation] = useState(searchParams.get('location') || '');
  const [searchDate, setSearchDate] = useState<Date | undefined>(
    searchParams.get('date') ? new Date(searchParams.get('date')!) : undefined
  );
  const [searchType, setSearchType] = useState(searchParams.get('type') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [capacity, setCapacity] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch watercraft types
  const { data: watercraftTypes = [], isLoading: isTypesLoading } = useQuery({
    queryKey: ['/api/types'],
  });

  // Get typeId from the type name
  const getTypeIdFromName = (typeName: string) => {
    const type = watercraftTypes.find(t => t.name.toLowerCase() === typeName.toLowerCase());
    return type ? type.id : undefined;
  };

  // Build query params for listings
  const buildQueryParams = () => {
    const typeId = searchType ? 
      (isNaN(Number(searchType)) ? getTypeIdFromName(searchType) : Number(searchType)) : 
      undefined;
      
    return {
      location: searchLocation || undefined,
      typeId: typeId,
      date: searchDate ? searchDate.toISOString() : undefined,
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
    };
  };

  // Fetch listings based on filters
  const {
    data: listingsResponse = { listings: [] },
    isLoading: isListingsLoading, 
    refetch: refetchListings
  } = useQuery({
    queryKey: ['/api/listings', buildQueryParams()],
    enabled: !isTypesLoading,
  });

  const listings = listingsResponse.listings || [];

  // Initialize search params from URL
  useEffect(() => {
    if (searchParams.has('type') && watercraftTypes.length > 0) {
      const typeParam = searchParams.get('type') || '';
      if (isNaN(Number(typeParam))) {
        const typeId = getTypeIdFromName(typeParam);
        if (typeId) {
          setSearchType(typeId.toString());
        }
      } else {
        setSearchType(typeParam);
      }
    }
  }, [watercraftTypes, searchParams]);

  // Handle filter changes
  const handleFilterChange = () => {
    setCurrentPage(1);
    refetchListings();
  };

  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Filters</h2>
              
              <div className="space-y-4">
                {/* Location Filter */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-neutral-600 mb-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                    <Input 
                      id="location" 
                      placeholder="City, state, or marina" 
                      className="pl-10" 
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !searchDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {searchDate ? format(searchDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={searchDate}
                        onSelect={setSearchDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Watercraft Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Watercraft Type</label>
                  <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger className="pl-10">
                      <Ship className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      {watercraftTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-3">Price Range (per hour)</label>
                  <div className="px-2">
                    <Slider
                      defaultValue={[0, 500]}
                      min={0}
                      max={500}
                      step={10}
                      value={[priceRange[0], priceRange[1]]}
                      onValueChange={handlePriceChange}
                      className="my-6"
                    />
                    <div className="flex justify-between text-sm">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}+</span>
                    </div>
                  </div>
                </div>
                
                {/* Capacity Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Capacity</label>
                  <Select value={capacity} onValueChange={setCapacity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="1-2">1-2 People</SelectItem>
                      <SelectItem value="3-6">3-6 People</SelectItem>
                      <SelectItem value="7-10">7-10 People</SelectItem>
                      <SelectItem value="11+">11+ People</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={handleFilterChange}
                >
                  <Filter className="mr-2 h-4 w-4" /> Apply Filters
                </Button>
              </div>
            </div>
          </div>
          
          {/* Listings */}
          <div className="lg:w-3/4">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h1 className="text-2xl font-bold mb-2">
                {searchLocation ? `Watercraft in ${searchLocation}` : "All Watercraft"}
              </h1>
              <p className="text-neutral-500">
                {searchDate ? `Available on ${format(searchDate, "PPP")}` : "Browse available watercraft"}
              </p>
            </div>
            
            {isListingsLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : listings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {listings.map((listing) => (
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
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                <div className="flex justify-center space-x-2 mb-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={listings.length < itemsPerPage}
                  >
                    Next
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-white p-10 rounded-lg shadow-md text-center">
                <Ship className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Watercraft Found</h3>
                <p className="text-neutral-500 mb-4">
                  We couldn't find any watercraft matching your filters.
                </p>
                <Button onClick={() => {
                  setSearchLocation('');
                  setSearchType('');
                  setPriceRange([0, 500]);
                  setCapacity('');
                  handleFilterChange();
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
