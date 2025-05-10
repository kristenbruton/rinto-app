import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Heart, MenuIcon, ChevronDown, User, Bookmark, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import rintoLogo from '@/assets/rinto-logo.svg';

export function Header() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img src={rintoLogo} alt="Rinto Logo" className="h-14 w-14" />
            <span className="text-primary font-heading font-bold text-3xl">Rinto</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 text-neutral-600">
            <Link href="/" className={cn("hover:text-primary font-medium", location === "/" && "text-primary")}>
              Home
            </Link>
            <Link href="/search?type=boat" className={cn("hover:text-primary font-medium", location.startsWith("/search?type=boat") && "text-primary")}>
              Boats
            </Link>
            <Link href="/search?type=jetski" className={cn("hover:text-primary font-medium", location.startsWith("/search?type=jetski") && "text-primary")}>
              Jet Skis
            </Link>
            <Link href="/create-listing" className={cn("hover:text-primary font-medium", location === "/create-listing" && "text-primary")}>
              List Your Watercraft
            </Link>
            <Link href="/how-it-works" className={cn("hover:text-primary font-medium", location === "/how-it-works" && "text-primary")}>
              How It Works
            </Link>
          </nav>
          
          {/* User Menu (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && (
              <Link href="/saved-listings">
                <Button variant="ghost" className="flex items-center space-x-1 text-neutral-600 hover:text-primary">
                  <Heart className="h-4 w-4" />
                  <span>Saved</span>
                </Button>
              </Link>
            )}
            
            {/* Not logged in state */}
            {!isAuthenticated && (
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary-light hover:text-white" onClick={() => window.location.href = "/api/login"}>
                  Log in
                </Button>
                <Button className="bg-primary text-white hover:bg-primary-dark" onClick={() => window.location.href = "/api/login"}>
                  Sign up
                </Button>
              </div>
            )}
            
            {/* Logged in state */}
            {isAuthenticated && (
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 focus:outline-none">
                      <Avatar className="w-8 h-8">
                        {user?.profileImageUrl ? (
                          <AvatarImage src={user.profileImageUrl} alt="Profile" />
                        ) : (
                          <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
                        )}
                      </Avatar>
                      <span className="font-medium">{user?.firstName || "User"}</span>
                      <ChevronDown className="h-4 w-4 text-neutral-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <Link href="/my-profile">
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/my-bookings">
                      <DropdownMenuItem className="cursor-pointer">
                        <Bookmark className="mr-2 h-4 w-4" />
                        <span>My Bookings</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/my-listings">
                      <DropdownMenuItem className="cursor-pointer">
                        <Bookmark className="mr-2 h-4 w-4" />
                        <span>My Listings</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/messages">
                      <DropdownMenuItem className="cursor-pointer">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>Messages</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/settings">
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Account Settings</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = "/api/logout"}>
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <Button variant="ghost" className="md:hidden" onClick={toggleMobileMenu}>
            <MenuIcon className="h-6 w-6 text-neutral-600" />
          </Button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-2 pb-4 space-y-1 border-t mt-3">
            <Link href="/" className="block px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100 rounded-md">
              Home
            </Link>
            <Link href="/search?type=boat" className="block px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100 rounded-md">
              Boats
            </Link>
            <Link href="/search?type=jetski" className="block px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100 rounded-md">
              Jet Skis
            </Link>
            <Link href="/create-listing" className="block px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100 rounded-md">
              List Your Watercraft
            </Link>
            <Link href="/how-it-works" className="block px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100 rounded-md">
              How It Works
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/my-profile" className="block px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100 rounded-md">
                  My Profile
                </Link>
                <Link href="/my-bookings" className="block px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100 rounded-md">
                  My Bookings
                </Link>
                <Link href="/my-listings" className="block px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100 rounded-md">
                  My Listings
                </Link>
                <Link href="/messages" className="block px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100 rounded-md">
                  Messages
                </Link>
                <Link href="/saved-listings" className="block px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100 rounded-md">
                  Saved Listings
                </Link>
                <div className="border-t border-neutral-200 my-2"></div>
                <a 
                  href="/api/logout"
                  className="block px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100 rounded-md"
                >
                  Log Out
                </a>
              </>
            )}
            {!isAuthenticated && (
              <div className="border-t border-neutral-200 my-2 px-3 py-2 flex space-x-3">
                <Button variant="outline" className="flex-1 border-primary text-primary" onClick={() => window.location.href = "/api/login"}>
                  Log in
                </Button>
                <Button className="flex-1 bg-primary text-white" onClick={() => window.location.href = "/api/login"}>
                  Sign up
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
