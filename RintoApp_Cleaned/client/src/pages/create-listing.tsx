import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { insertListingSchema } from '@shared/schema';
import { Loader2, Ship, Info, X, Upload, Plus } from 'lucide-react';

// Extend the schema with frontend validations
const createListingSchema = insertListingSchema.extend({
  // Add image URLs validation
  imagesJson: z.array(z.string().url()).min(1, "At least one image is required"),
  // Add features validation
  featuresJson: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof createListingSchema>;

const FEATURES = [
  "Bluetooth Audio",
  "Life Jackets",
  "GPS Navigation",
  "Fishing Gear",
  "Cooler",
  "Wakeboard/Water Skis",
  "Bathroom",
  "Shower",
  "Kitchenette",
  "Sun Shade/Bimini Top",
];

export default function CreateListing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Fetch watercraft types
  const { data: watercraftTypes = [], isLoading: isTypesLoading } = useQuery({
    queryKey: ['/api/types'],
  });

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      title: '',
      description: '',
      typeId: 0,
      location: '',
      capacity: 1,
      length: undefined,
      year: undefined,
      pricePerHour: 0,
      featuresJson: [],
      imagesJson: [],
    },
  });

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Convert price to cents
      const priceInCents = Math.round(values.pricePerHour * 100);
      
      // Prepare the data
      const listingData = {
        ...values,
        pricePerHour: priceInCents,
        typeId: Number(values.typeId),
        capacity: Number(values.capacity),
        length: values.length ? Number(values.length) : undefined,
        year: values.year ? Number(values.year) : undefined,
      };
      
      const response = await apiRequest("POST", "/api/listings", listingData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Listing Created",
        description: "Your watercraft listing has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/my-listings"] });
      navigate(`/listings/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    createListingMutation.mutate(values);
  };

  // Handle image URL addition
  const addImageUrl = () => {
    if (!newImageUrl) return;
    
    try {
      // Validate if it's a URL
      new URL(newImageUrl);
      
      const updatedUrls = [...imageUrls, newImageUrl];
      setImageUrls(updatedUrls);
      form.setValue('imagesJson', updatedUrls);
      setNewImageUrl('');
    } catch (e) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive",
      });
    }
  };

  // Handle image URL removal
  const removeImageUrl = (index: number) => {
    const updatedUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updatedUrls);
    form.setValue('imagesJson', updatedUrls);
  };

  // Handle feature selection
  const handleFeatureChange = (checked: boolean, feature: string) => {
    const currentFeatures = form.getValues('featuresJson') || [];
    
    if (checked) {
      form.setValue('featuresJson', [...currentFeatures, feature]);
    } else {
      form.setValue(
        'featuresJson',
        currentFeatures.filter((f) => f !== feature)
      );
    }
  };

  if (isTypesLoading) {
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

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-heading font-bold mb-2">List Your Watercraft</h1>
          <p className="text-neutral-500 mb-8">Create a listing for your boat, jet ski, or other watercraft to start earning money.</p>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Provide the essential details about your watercraft</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 25' Pontoon Boat, 2022 Yamaha Jet Ski" {...field} />
                        </FormControl>
                        <FormDescription>
                          A clear, descriptive title helps renters find your watercraft
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="typeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Watercraft Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {watercraftTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Miami Beach Marina, FL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your watercraft, including its condition, special features, and what makes it great for renters" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Specifications</CardTitle>
                  <CardDescription>Add detailed specifications of your watercraft</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacity (people)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Length (feet)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0}
                              step={0.1}
                              placeholder="Optional"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1900}
                              max={new Date().getFullYear()}
                              placeholder="Optional"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="pricePerHour"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Hour ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0}
                            step={0.01}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Set a competitive hourly rate. You can always adjust it later.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <FormLabel>Features</FormLabel>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {FEATURES.map((feature) => (
                        <div key={feature} className="flex items-center space-x-2">
                          <Checkbox
                            id={`feature-${feature}`}
                            onCheckedChange={(checked) => 
                              handleFeatureChange(checked === true, feature)
                            }
                          />
                          <label
                            htmlFor={`feature-${feature}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {feature}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                  <CardDescription>Add photos of your watercraft (minimum 1 required)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Enter image URL"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                    />
                    <Button type="button" onClick={addImageUrl} variant="outline">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Listing image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => removeImageUrl(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {form.formState.errors.imagesJson && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.imagesJson.message}
                    </p>
                  )}
                  
                  <div className="bg-blue-50 p-4 rounded-md flex items-start">
                    <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">Photo tips:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Add clear, high-quality photos</li>
                        <li>Include exterior and interior shots</li>
                        <li>Show any special features or amenities</li>
                        <li>Avoid using stock photos - use actual photos of your watercraft</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="min-w-[160px]"
                  disabled={createListingMutation.isPending}
                >
                  {createListingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Ship className="mr-2 h-4 w-4" /> Create Listing
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
      <Footer />
    </>
  );
}
