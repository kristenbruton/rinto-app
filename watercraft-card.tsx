import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Star, Heart, MapPin, Users, Ruler, Ship, Calendar, Music } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface WatercraftCardProps {
  id: number;
  title: string;
  location: string;
  pricePerHour: number;
  imageUrl: string;
  rating?: number;
  reviewCount?: number;
  capacity: number;
  type: string;
  length?: number;
  year?: number;
  features?: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  isSaved?: boolean;
}

export function WatercraftCard({
  id,
  title,
  location,
  pricePerHour,
  imageUrl,
  rating,
  reviewCount,
  capacity,
  type,
  length,
  year,
  features,
  isFeatured,
  isNew,
  isPopular,
  isSaved: initialIsSaved = false,
}: WatercraftCardProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isSaved) {
        await apiRequest("DELETE", `/api/save-listing/${id}`);
        setIsSaved(false);
        toast({
          title: "Removed from saved",
          description: "Watercraft has been removed from your saved list",
        });
      } else {
        await apiRequest("POST", `/api/save-listing/${id}`);
        setIsSaved(true);
        toast({
          title: "Saved!",
          description: "Watercraft has been added to your saved list",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/saved-listings"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem saving this watercraft",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <Link href={`/listings/${id}`}>
        <div className="relative">
          <div className="h-48 bg-center bg-cover" style={{ backgroundImage: `url(${imageUrl})` }}>
            <div className="p-3 flex justify-between">
              {isFeatured && (
                <Badge className="bg-primary text-white">Featured</Badge>
              )}
              {isNew && (
                <Badge className="bg-accent text-white">New</Badge>
              )}
              {isPopular && (
                <Badge className="bg-secondary text-white">Popular</Badge>
              )}
              {!isFeatured && !isNew && !isPopular && <span className="invisible"></span>}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleSave}
                    disabled={isLoading}
                    className="text-white bg-black bg-opacity-30 hover:bg-opacity-50 h-8 w-8 rounded-full flex items-center justify-center transition-colors"
                  >
                    <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSaved ? 'Remove from saved' : 'Save to favorites'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </Link>
      
      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-heading font-semibold text-lg">{title}</h3>
          {rating && (
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 mr-1 fill-current" />
              <span className="font-medium">{rating.toFixed(1)}</span>
              {reviewCount && (
                <span className="text-neutral-400 text-sm ml-1">({reviewCount})</span>
              )}
            </div>
          )}
        </div>
        
        <p className="text-neutral-500 text-sm mb-3">
          <MapPin className="h-3 w-3 inline mr-1" /> {location}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs px-2 py-1 bg-neutral-100 rounded-full">
            <Users className="h-3 w-3 inline mr-1" /> {capacity} {capacity === 1 ? 'person' : 'people'}
          </span>
          
          {length && (
            <span className="text-xs px-2 py-1 bg-neutral-100 rounded-full">
              <Ruler className="h-3 w-3 inline mr-1" /> {length} ft
            </span>
          )}
          
          <span className="text-xs px-2 py-1 bg-neutral-100 rounded-full">
            <Ship className="h-3 w-3 inline mr-1" /> {type}
          </span>
          
          {year && (
            <span className="text-xs px-2 py-1 bg-neutral-100 rounded-full">
              <Calendar className="h-3 w-3 inline mr-1" /> {year}
            </span>
          )}
          
          {features && features.includes("Bluetooth") && (
            <span className="text-xs px-2 py-1 bg-neutral-100 rounded-full">
              <Music className="h-3 w-3 inline mr-1" /> Bluetooth
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-auto pt-3 border-t border-neutral-200">
          <div>
            <span className="font-heading font-bold text-xl">${(pricePerHour / 100).toFixed(0)}</span>
            <span className="text-neutral-500 text-sm">/hour</span>
          </div>
          
          <Link href={`/listings/${id}`}>
            <Button size="sm" className="px-4 py-2">View Details</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
