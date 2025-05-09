import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WatercraftCard } from '@/components/ui/watercraft-card';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Calendar, Ship, Locate, MapPin, Users, Ruler, Wind, Fish, Music, Star } from 'lucide-react';
import heroImage from '@/assets/pexels-matthardy-1533720.jpeg';

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDate, setSearchDate] = useState<Date>(new Date());
  const [searchType, setSearchType] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Fetch featured listings
  const { data: featuredListings = [] } = useQuery({
    queryKey: ['/api/listings', { featured: true, limit: 4 }],
  });

  // Fetch watercraft types
  const { data: watercraftTypes = [] } = useQuery({
    queryKey: ['/api/types'],
  });

  // Fetch popular locations
  const { data: popularLocations = [] } = useQuery({
    queryKey: ['/api/locations'],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation) params.append('location', searchLocation);
    if (searchDate) params.append('date', searchDate.toISOString().split('T')[0]);
    if (searchType) params.append('type', searchType);
    setLocation(`/search?${params.toString()}`);
  };

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative">
          <div 
            className="h-[500px] md:h-[600px] bg-center bg-cover" 
            style={{
              backgroundImage: `url(${heroImage})`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60"></div>
            <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
              <div className="max-w-2xl">
                <h1 className="text-white font-heading font-bold text-4xl md:text-5xl lg:text-6xl leading-tight">
                  Find the Perfect Watercraft for Your Adventure
                </h1>
                <p className="text-white text-xl mt-6 max-w-lg">
                  Explore boats, jet skis, and other watercraft available for rent from local owners.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <Link href="/search">
                    <Button size="lg" className="px-8 py-4 bg-primary hover:bg-primary-dark text-white font-bold shadow-lg text-lg">
                      Find Watercraft
                    </Button>
                  </Link>
                  <Link href="/create-listing">
                    <Button size="lg" variant="secondary" className="px-8 py-4 bg-white hover:bg-neutral-100 text-primary font-medium shadow-lg border-2 border-primary text-lg">
                      List Your Watercraft
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <section className="bg-white shadow-md py-6 relative z-20">
          <div className="container mx-auto px-4">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1">
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
              <div className="flex-1">
                <label htmlFor="date" className="block text-sm font-medium text-neutral-600 mb-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input 
                    id="date" 
                    type="date" 
                    className="pl-10" 
                    value={searchDate ? searchDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setSearchDate(new Date(e.target.value))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label htmlFor="watercraft-type" className="block text-sm font-medium text-neutral-600 mb-1">Watercraft Type</label>
                <div className="relative">
                  <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger className="pl-10">
                      <Ship className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {watercraftTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full md:w-auto px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium">
                  <Locate className="mr-2 h-4 w-4" /> Search
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Featured Listings */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-neutral-700 mb-2">Featured Watercraft</h2>
            <p className="text-neutral-500 mb-8">Discover top-rated options for your next water adventure</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredListings.map((listing) => (
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
                  isFeatured={true}
                />
              ))}
            </div>
            
            <div className="mt-10 text-center">
              <Link href="/search">
                <Button variant="outline" size="lg" className="border-2 border-primary text-primary hover:bg-primary hover:text-white">
                  View All Watercraft
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12 bg-neutral-100">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-neutral-700 mb-2">Browse by Category</h2>
            <p className="text-neutral-500 mb-8">Find the perfect watercraft for your needs</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link href="/search?type=yacht">
                <div className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden text-center">
                  <div 
                    className="h-32 bg-center bg-cover" 
                    style={{
                      backgroundImage: "url('https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300')"
                    }}
                  ></div>
                  <div className="p-4">
                    <Ship className="text-primary text-2xl mb-2 mx-auto" />
                    <h3 className="font-heading font-medium">Yachts</h3>
                  </div>
                </div>
              </Link>
              
              <Link href="/search?type=jetski">
                <div className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden text-center">
                  <div 
                    className="h-32 bg-center bg-cover" 
                    style={{
                      backgroundImage: "url('https://pixabay.com/get/gcc733a98c4c3cb23ab62c367e414298cb9a75cc61d50a6e35fe2e508d4d7cbf6215349eb7acccf31465d1c1413cff9534dcf703399def2c0c6550a5be75dae7f_1280.jpg')"
                    }}
                  ></div>
                  <div className="p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-primary text-2xl mb-2 mx-auto h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 18c3.5-6 7-9 13-9M7.41 15.41a7 7 0 009.18 9.18M22 17a10 10 0 00-20 0" />
                    </svg>
                    <h3 className="font-heading font-medium">Jet Skis</h3>
                  </div>
                </div>
              </Link>
              
              <Link href="/search?type=pontoon">
                <div className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden text-center">
                  <div 
                    className="h-32 bg-center bg-cover" 
                    style={{
                      backgroundImage: "url('https://images.unsplash.com/photo-1516728778615-2d590ea1855e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300')"
                    }}
                  ></div>
                  <div className="p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-primary text-2xl mb-2 mx-auto h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <h3 className="font-heading font-medium">Pontoons</h3>
                  </div>
                </div>
              </Link>
              
              <Link href="/search?type=speedboat">
                <div className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden text-center">
                  <div 
                    className="h-32 bg-center bg-cover" 
                    style={{
                      backgroundImage: "url('https://pixabay.com/get/g5cee9f271c3dfc3e3bb5ee07793e57c989c07301529f7087c5700c311a2cd3040ae92b5e6b844a531e7ed301bb2cdd184653c2ca44954c3b7a318de26312709f_1280.jpg')"
                    }}
                  ></div>
                  <div className="p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-primary text-2xl mb-2 mx-auto h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="font-heading font-medium">Speedboats</h3>
                  </div>
                </div>
              </Link>
              
              <Link href="/search?type=sailboat">
                <div className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden text-center">
                  <div 
                    className="h-32 bg-center bg-cover" 
                    style={{
                      backgroundImage: "url('https://images.unsplash.com/photo-1566847438217-76e82d383f84?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300')"
                    }}
                  ></div>
                  <div className="p-4">
                    <Wind className="text-primary text-2xl mb-2 mx-auto" />
                    <h3 className="font-heading font-medium">Sailboats</h3>
                  </div>
                </div>
              </Link>
              
              <Link href="/search?type=fishing">
                <div className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden text-center">
                  <div 
                    className="h-32 bg-center bg-cover" 
                    style={{
                      backgroundImage: "url('https://images.unsplash.com/photo-1519832979-6fa011b87667?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300')"
                    }}
                  ></div>
                  <div className="p-4">
                    <Fish className="text-primary text-2xl mb-2 mx-auto" />
                    <h3 className="font-heading font-medium">Fishing Boats</h3>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-bold text-neutral-700 mb-2">How Rinto Works</h2>
              <p className="text-neutral-500 max-w-2xl mx-auto">Renting watercraft has never been easier. Follow these simple steps to get on the water.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">1</div>
                <h3 className="font-heading font-semibold text-xl mb-3">Search & Discover</h3>
                <p className="text-neutral-500">Browse watercraft in your area, filter by type, price, and availability to find the perfect option.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">2</div>
                <h3 className="font-heading font-semibold text-xl mb-3">Book & Pay</h3>
                <p className="text-neutral-500">Reserve your watercraft for the hours you want. Secure your booking with our safe payment system.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">3</div>
                <h3 className="font-heading font-semibold text-xl mb-3">Enjoy the Water</h3>
                <p className="text-neutral-500">Meet the owner, get the keys, and head out for an amazing day on the water. Return and rate your experience.</p>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <Link href="/how-it-works">
                <Button className="px-6 py-3">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Locations */}
        <section className="py-12 bg-neutral-100">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-neutral-700 mb-2">Popular Destinations</h2>
            <p className="text-neutral-500 mb-8">Explore top watercraft rental locations</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularLocations.map((location) => (
                <Link key={location.id} href={`/search?location=${encodeURIComponent(location.name)}`}>
                  <div className="block rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow relative">
                    <div 
                      className="h-64 bg-center bg-cover" 
                      style={{
                        backgroundImage: `url('${location.imageUrl}')`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
                      <div className="absolute bottom-0 left-0 p-4 text-white">
                        <h3 className="font-heading font-bold text-xl">{location.name}</h3>
                        <p className="text-sm">{location.listingCount} watercraft available</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Owner CTA */}
        <section className="py-16 relative">
          <div 
            className="absolute inset-0 bg-center bg-cover" 
            style={{
              backgroundImage: "url('https://pixabay.com/get/g9e1e5e0d1432159548a6f74e6e77129128d22853a41f6b38756e2ca48d4b97a2208af1b84ae5100301191061e3d5b602f41f9f36c1e4f9255640ade9148363bc_1280.jpg')"
            }}
          >
            <div className="absolute inset-0 bg-primary bg-opacity-80"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl mx-auto text-center text-white">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Own a Watercraft?</h2>
              <p className="text-lg mb-8">Turn your boat, jet ski, or yacht into income when you're not using it. Join thousands of owners earning extra money by listing on Rinto.</p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/create-listing">
                  <Button variant="secondary" size="lg" className="px-6 py-3 bg-white text-primary hover:bg-neutral-100 shadow-lg">
                    List Your Watercraft
                  </Button>
                </Link>
                <Link href="/host-info">
                  <Button variant="outline" size="lg" className="px-6 py-3 border-2 border-white text-white hover:bg-white hover:bg-opacity-20">
                    Learn More About Hosting
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-neutral-700 text-center mb-2">What Our Users Say</h2>
            <p className="text-neutral-500 text-center mb-12">Hear from renters and owners who love using Rinto</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" alt="Sarah J." className="w-14 h-14 rounded-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold">Sarah J.</h3>
                    <p className="text-neutral-500 text-sm">Miami, FL</p>
                  </div>
                </div>
                <div className="mb-3 text-yellow-400 flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-neutral-600">"We rented a pontoon for my birthday and had the most amazing day! The booking process was simple, the boat was clean and perfect, and the owner was so helpful."</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" alt="Michael T." className="w-14 h-14 rounded-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold">Michael T.</h3>
                    <p className="text-neutral-500 text-sm">San Diego, CA</p>
                  </div>
                </div>
                <div className="mb-3 text-yellow-400 flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-neutral-600">"As an owner, I've been able to offset the costs of my boat significantly. The platform is easy to use, and I've met some great people. Highly recommend!"</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <img src="https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" alt="Emily R." className="w-14 h-14 rounded-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold">Emily R.</h3>
                    <p className="text-neutral-500 text-sm">Lake Tahoe</p>
                  </div>
                </div>
                <div className="mb-3 text-yellow-400 flex">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                  <Star className="h-4 w-4 fill-current text-yellow-400 opacity-50" />
                </div>
                <p className="text-neutral-600">"We rented jet skis for the weekend and had a blast! The entire process from booking to return was seamless. Will definitely be using Rinto again next summer!"</p>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-heading font-semibold text-neutral-700 mb-3">Stay Updated</h2>
              <p className="text-neutral-500 mb-6">Subscribe to our newsletter for exclusive deals and watercraft rental tips</p>
              <form className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-2">
                <Input 
                  type="email" 
                  placeholder="Your email address" 
                  className="flex-1" 
                />
                <Button type="submit">
                  Subscribe
                </Button>
              </form>
              <p className="text-xs text-neutral-400 mt-4">By subscribing, you agree to our privacy policy and consent to receive updates from Rinto.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
