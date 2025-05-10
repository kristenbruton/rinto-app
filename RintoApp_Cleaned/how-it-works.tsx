import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';
import { Search, Calendar, CreditCard, Anchor, Ship, Shield, Clock, HelpCircle, Star, MessageSquare } from 'lucide-react';

export default function HowItWorks() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-primary text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">How WaveRentals Works</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Renting a watercraft has never been easier. Learn how our platform connects owners and renters for amazing experiences on the water.
            </p>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-center mb-12">For Renters: Three Simple Steps</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">1</div>
                <CardContent className="pt-10 pb-6 text-center">
                  <Search className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Search & Discover</h3>
                  <p className="text-neutral-600">
                    Browse available watercraft in your area. Filter by type, price, and dates to find the perfect match for your adventure.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">2</div>
                <CardContent className="pt-10 pb-6 text-center">
                  <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Book & Pay</h3>
                  <p className="text-neutral-600">
                    Reserve your watercraft for the hours you want. Our secure payment system ensures your booking is protected.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">3</div>
                <CardContent className="pt-10 pb-6 text-center">
                  <Anchor className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Enjoy the Water</h3>
                  <p className="text-neutral-600">
                    Meet the owner, receive the keys, and head out for an amazing day on the water. Return and share your experience.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-16" />

            <h2 className="text-3xl font-heading font-bold text-center mb-12">For Owners: Turn Your Watercraft Into Income</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">1</div>
                <CardContent className="pt-10 pb-6 text-center">
                  <Ship className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">List Your Watercraft</h3>
                  <p className="text-neutral-600">
                    Create a detailed listing with photos, specifications, and availability. Set your hourly rates and booking policies.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">2</div>
                <CardContent className="pt-10 pb-6 text-center">
                  <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Communicate & Confirm</h3>
                  <p className="text-neutral-600">
                    Receive booking requests and communicate with potential renters. Confirm bookings and arrange handovers.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">3</div>
                <CardContent className="pt-10 pb-6 text-center">
                  <CreditCard className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Get Paid</h3>
                  <p className="text-neutral-600">
                    Receive payments securely through our platform. Manage your listings and grow your rental business.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-neutral-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-center mb-12">Platform Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Shield className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Secure Payments</h3>
                <p className="text-neutral-600">
                  Our secure payment system protects both renters and owners throughout the transaction process.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Clock className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Hourly Booking</h3>
                <p className="text-neutral-600">
                  Flexible hourly rental options let you book exactly the time you need, whether it's a few hours or a full day.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Star className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Verified Reviews</h3>
                <p className="text-neutral-600">
                  Read authentic reviews from real renters to help you choose the perfect watercraft for your adventure.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <MessageSquare className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Direct Messaging</h3>
                <p className="text-neutral-600">
                  Communicate directly with owners or renters to ask questions and coordinate details before booking.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-center mb-12">Frequently Asked Questions</h2>
            
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <HelpCircle className="h-5 w-5 text-primary mr-2" />
                  Do I need a boating license to rent?
                </h3>
                <p className="text-neutral-600">
                  Requirements vary by location and watercraft type. Some areas require a valid boating license or safety certification. Owners will specify requirements in their listings.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <HelpCircle className="h-5 w-5 text-primary mr-2" />
                  What if I need to cancel my booking?
                </h3>
                <p className="text-neutral-600">
                  Our platform has a flexible cancellation policy. Depending on when you cancel, you may be eligible for a full or partial refund. Check the specific listing for details.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <HelpCircle className="h-5 w-5 text-primary mr-2" />
                  Is insurance included with rentals?
                </h3>
                <p className="text-neutral-600">
                  Basic insurance is typically included in your rental fee. Owners may offer additional coverage options. Always review the insurance details before booking.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <HelpCircle className="h-5 w-5 text-primary mr-2" />
                  How do I list my watercraft for rent?
                </h3>
                <p className="text-neutral-600">
                  Create an account, click on "List Your Watercraft," and follow the step-by-step instructions. You'll need photos, specifications, and details about your watercraft.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-heading font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl max-w-3xl mx-auto mb-8">
              Join thousands of watercraft enthusiasts already using WaveRentals to find amazing experiences on the water.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/search">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-neutral-100">
                  Find Watercraft
                </Button>
              </Link>
              <Link href="/create-listing">
                <Button size="lg" className="bg-transparent border-2 border-white hover:bg-white hover:bg-opacity-10">
                  List Your Watercraft
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
