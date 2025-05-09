import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { stripe, calculateTotalAmount, createPaymentIntent, getPaymentIntent } from "./stripe";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { 
  insertListingSchema, 
  insertBookingSchema, 
  insertReviewSchema, 
  insertMessageSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Watercraft Types
  app.get('/api/types', async (req, res) => {
    try {
      const types = await storage.getWatercraftTypes();
      res.json(types);
    } catch (error) {
      console.error("Error fetching watercraft types:", error);
      res.status(500).json({ message: "Failed to fetch watercraft types" });
    }
  });

  // Locations
  app.get('/api/locations', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      const locations = await storage.getPopularLocations(limit);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  // Listings
  app.get('/api/listings', async (req, res) => {
    try {
      const options = {
        typeId: req.query.typeId ? parseInt(req.query.typeId as string) : undefined,
        location: req.query.location as string | undefined,
        date: req.query.date ? new Date(req.query.date as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 8,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        featured: req.query.featured === 'true',
      };
      
      const listings = await storage.getListings(options);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.get('/api/listings/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const listing = await storage.getListing(id);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      res.json(listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  app.post('/api/listings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertListingSchema.parse(req.body);
      
      const listing = await storage.createListing(validatedData, userId);
      res.status(201).json(listing);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Error creating listing:", error);
      res.status(500).json({ message: "Failed to create listing" });
    }
  });

  app.put('/api/listings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      
      // Verify listing ownership
      const listing = await storage.getListing(id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.ownerId !== userId) {
        return res.status(403).json({ message: "You do not have permission to update this listing" });
      }
      
      // Partial validation for update
      const validatedData = insertListingSchema.partial().parse(req.body);
      
      const updatedListing = await storage.updateListing(id, validatedData);
      res.json(updatedListing);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Error updating listing:", error);
      res.status(500).json({ message: "Failed to update listing" });
    }
  });

  app.delete('/api/listings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      
      // Verify listing ownership
      const listing = await storage.getListing(id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.ownerId !== userId) {
        return res.status(403).json({ message: "You do not have permission to delete this listing" });
      }
      
      await storage.deleteListing(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  app.get('/api/my-listings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listings = await storage.getListingsByOwner(userId);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching user listings:", error);
      res.status(500).json({ message: "Failed to fetch your listings" });
    }
  });

  // Availability
  app.get('/api/listings/:id/availability', async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const date = req.query.date 
        ? new Date(req.query.date as string) 
        : new Date();
      
      const availableTimes = await storage.getAvailabilityForListing(listingId, date);
      res.json(availableTimes);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.post('/api/listings/:id/availability', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listingId = parseInt(req.params.id);
      
      // Verify listing ownership
      const listing = await storage.getListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.ownerId !== userId) {
        return res.status(403).json({ message: "You do not have permission to update this listing's availability" });
      }
      
      // Create availability
      const availability = await storage.createAvailability({
        ...req.body,
        listingId,
      });
      
      res.status(201).json(availability);
    } catch (error) {
      console.error("Error creating availability:", error);
      res.status(500).json({ message: "Failed to create availability" });
    }
  });

  // Bookings
  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertBookingSchema.parse(req.body);
      
      // Get listing to calculate total price
      const listing = await storage.getListing(validatedData.listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      // Calculate total price
      const totalPrice = calculateTotalAmount(
        listing.pricePerHour,
        validatedData.startTime,
        validatedData.endTime
      );
      
      // Create pending booking
      const booking = await storage.createBooking(
        {
          ...validatedData,
          totalPrice,
        },
        userId
      );
      
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get('/api/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Verify that user is either the renter or the listing owner
      const listing = await storage.getListing(booking.listingId);
      if (booking.renterId !== userId && listing?.ownerId !== userId) {
        return res.status(403).json({ message: "You do not have permission to view this booking" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.get('/api/my-bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getBookingsByRenter(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({ message: "Failed to fetch your bookings" });
    }
  });

  app.get('/api/listings/:id/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listingId = parseInt(req.params.id);
      
      // Verify listing ownership
      const listing = await storage.getListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.ownerId !== userId) {
        return res.status(403).json({ message: "You do not have permission to view bookings for this listing" });
      }
      
      const bookings = await storage.getBookingsForListing(listingId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching listing bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Payment
  app.post('/api/create-payment-intent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bookingId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }
      
      // Get booking
      const booking = await storage.getBooking(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Verify that user is the renter
      if (booking.renterId !== userId) {
        return res.status(403).json({ message: "You do not have permission to pay for this booking" });
      }
      
      // Get listing
      const listing = await storage.getListing(booking.listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      // Create payment intent
      const paymentIntent = await createPaymentIntent(booking.totalPrice, {
        bookingId: booking.id.toString(),
        userId,
        listingId: listing.id.toString(),
      });
      
      // Update booking with payment intent ID
      await storage.updateBookingPayment(booking.id, paymentIntent.id);
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        bookingId: booking.id,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Reviews
  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertReviewSchema.parse(req.body);
      
      // Verify that user has a completed booking for this listing
      const booking = await storage.getBooking(validatedData.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.renterId !== userId) {
        return res.status(403).json({ message: "You can only review listings you've booked" });
      }
      
      if (booking.status !== "completed") {
        return res.status(400).json({ message: "You can only review completed bookings" });
      }
      
      // Create review
      const review = await storage.createReview(validatedData, userId);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get('/api/listings/:id/reviews', async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const reviews = await storage.getReviewsForListing(listingId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Messages
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversationsByUser(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = parseInt(req.params.id);
      
      // Mark messages as read
      await storage.markMessagesAsRead(conversationId, userId);
      
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = parseInt(req.params.id);
      
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        conversationId,
      });
      
      const message = await storage.createMessage(validatedData, userId);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post('/api/messages/start', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const { recipientId, listingId, content } = req.body;
      
      if (!recipientId || !content) {
        return res.status(400).json({ message: "Recipient ID and message content are required" });
      }
      
      // Create or get conversation
      const conversation = await storage.getOrCreateConversation(
        senderId,
        recipientId,
        listingId ? parseInt(listingId) : undefined
      );
      
      // Send message
      const message = await storage.createMessage(
        {
          conversationId: conversation.id,
          content,
        },
        senderId
      );
      
      res.status(201).json({ conversation, message });
    } catch (error) {
      console.error("Error starting conversation:", error);
      res.status(500).json({ message: "Failed to start conversation" });
    }
  });

  // Saved Listings
  app.post('/api/saved-listings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listingId = parseInt(req.params.id);
      
      const savedListing = await storage.saveListing(userId, listingId);
      res.status(201).json(savedListing);
    } catch (error) {
      console.error("Error saving listing:", error);
      res.status(500).json({ message: "Failed to save listing" });
    }
  });

  app.delete('/api/saved-listings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listingId = parseInt(req.params.id);
      
      await storage.unsaveListing(userId, listingId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unsaving listing:", error);
      res.status(500).json({ message: "Failed to unsave listing" });
    }
  });

  app.get('/api/saved-listings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const savedListings = await storage.getSavedListings(userId);
      res.json(savedListings);
    } catch (error) {
      console.error("Error fetching saved listings:", error);
      res.status(500).json({ message: "Failed to fetch saved listings" });
    }
  });

  app.get('/api/saved-listings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listingId = parseInt(req.params.id);
      
      const isSaved = await storage.isSaved(userId, listingId);
      res.json({ isSaved });
    } catch (error) {
      console.error("Error checking if listing is saved:", error);
      res.status(500).json({ message: "Failed to check if listing is saved" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}