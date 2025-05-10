import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Search from "@/pages/search";
import ListingDetails from "@/pages/listing-details";
import CreateListing from "@/pages/create-listing";
import MyListings from "@/pages/my-listings";
import MyBookings from "@/pages/my-bookings";
import MyProfile from "@/pages/my-profile";
import Checkout from "@/pages/checkout";
import Messages from "@/pages/messages";
import SavedListings from "@/pages/saved-listings";
import HowItWorks from "@/pages/how-it-works";
import { useAuth } from "./hooks/useAuth";
import { Loader2 } from "lucide-react";

// Protected route component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={Search} />
      <Route path="/listings/:id" component={ListingDetails} />
      <Route path="/create-listing" component={props => <ProtectedRoute component={CreateListing} />} />
      <Route path="/my-listings" component={props => <ProtectedRoute component={MyListings} />} />
      <Route path="/my-bookings" component={props => <ProtectedRoute component={MyBookings} />} />
      <Route path="/my-profile" component={props => <ProtectedRoute component={MyProfile} />} />
      <Route path="/checkout/:bookingId" component={props => <ProtectedRoute component={Checkout} />} />
      <Route path="/messages" component={props => <ProtectedRoute component={Messages} />} />
      <Route path="/saved-listings" component={props => <ProtectedRoute component={SavedListings} />} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Router />
    </TooltipProvider>
  );
}

export default App;
