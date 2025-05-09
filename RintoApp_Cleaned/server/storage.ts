import { 
  users, listings, bookings, reviews, messages, conversations, 
  availability, watercraftTypes, locations, savedListings,
  type User, type UpsertUser, type Listing, type InsertListing,
  type Booking, type InsertBooking, type Review, type InsertReview,
  type Message, type InsertMessage, type Conversation,
  type Availability, type InsertAvailability,
  type WatercraftType, type Location, type SavedListing
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, lt, between, desc, asc, like, sql, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Listing operations
  createListing(listing: InsertListing, ownerId: string): Promise<Listing>;
  getListing(id: number): Promise<Listing | undefined>;
  getListings(options?: { 
    typeId?: number, 
    location?: string, 
    date?: Date, 
    limit?: number, 
    offset?: number,
    featured?: boolean
  }): Promise<Listing[]>;
  updateListing(id: number, listing: Partial<InsertListing>): Promise<Listing>;
  deleteListing(id: number): Promise<boolean>;
  getListingsByOwner(ownerId: string): Promise<Listing[]>;
  
  // Availability operations
  createAvailability(availability: InsertAvailability): Promise<Availability>;
  getAvailabilityForListing(listingId: number, date: Date): Promise<Availability[]>;
  updateAvailability(id: number, isAvailable: boolean): Promise<Availability>;
  
  // Booking operations
  createBooking(booking: InsertBooking, renterId: string): Promise<Booking>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByRenter(renterId: string): Promise<Booking[]>;
  getBookingsForListing(listingId: number): Promise<Booking[]>;
  updateBookingStatus(id: number, status: string): Promise<Booking>;
  updateBookingPayment(id: number, paymentIntentId: string): Promise<Booking>;

  // Review operations
  createReview(review: InsertReview, userId: string): Promise<Review>;
  getReviewsForListing(listingId: number): Promise<Review[]>;
  
  // Message operations
  getOrCreateConversation(user1Id: string, user2Id: string, listingId?: number): Promise<Conversation>;
  getConversationsByUser(userId: string): Promise<Conversation[]>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage, senderId: string): Promise<Message>;
  markMessagesAsRead(conversationId: number, userId: string): Promise<void>;

  // Watercraft type operations
  getWatercraftTypes(): Promise<WatercraftType[]>;
  
  // Location operations
  getPopularLocations(limit?: number): Promise<Location[]>;
  
  // Saved listings operations
  saveListing(userId: string, listingId: number): Promise<SavedListing>;
  unsaveListing(userId: string, listingId: number): Promise<boolean>;
  getSavedListings(userId: string): Promise<Listing[]>;
  isSaved(userId: string, listingId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Listing operations
  async createListing(listing: InsertListing, ownerId: string): Promise<Listing> {
    const [newListing] = await db
      .insert(listings)
      .values({
        ...listing,
        ownerId,
      })
      .returning();
    return newListing;
  }

  async getListing(id: number): Promise<Listing | undefined> {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing;
  }

  async getListings(options: { 
    typeId?: number, 
    location?: string, 
    date?: Date, 
    limit?: number, 
    offset?: number,
    featured?: boolean
  } = {}): Promise<Listing[]> {
    let query = db.select().from(listings).where(eq(listings.isActive, true));
    
    if (options.typeId) {
      query = query.where(eq(listings.typeId, options.typeId));
    }
    
    if (options.location) {
      query = query.where(like(listings.location, `%${options.location}%`));
    }
    
    if (options.featured) {
      query = query.where(eq(listings.isFeatured, true));
    }
    
    // Add limit and offset if provided
    query = query.limit(options.limit || 50).offset(options.offset || 0);
    
    return await query;
  }

  async updateListing(id: number, listing: Partial<InsertListing>): Promise<Listing> {
    const [updatedListing] = await db
      .update(listings)
      .set({
        ...listing,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, id))
      .returning();
    return updatedListing;
  }

  async deleteListing(id: number): Promise<boolean> {
    const result = await db
      .delete(listings)
      .where(eq(listings.id, id));
    return true;
  }

  async getListingsByOwner(ownerId: string): Promise<Listing[]> {
    return await db
      .select()
      .from(listings)
      .where(eq(listings.ownerId, ownerId))
      .orderBy(desc(listings.createdAt));
  }

  // Availability operations
  async createAvailability(availabilityData: InsertAvailability): Promise<Availability> {
    const [newAvailability] = await db
      .insert(availability)
      .values(availabilityData)
      .returning();
    return newAvailability;
  }

  async getAvailabilityForListing(listingId: number, date: Date): Promise<Availability[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db
      .select()
      .from(availability)
      .where(
        and(
          eq(availability.listingId, listingId),
          between(availability.date, startOfDay, endOfDay)
        )
      )
      .orderBy(asc(availability.startTime));
  }

  async updateAvailability(id: number, isAvailable: boolean): Promise<Availability> {
    const [updatedAvailability] = await db
      .update(availability)
      .set({ isAvailable })
      .where(eq(availability.id, id))
      .returning();
    return updatedAvailability;
  }

  // Booking operations
  async createBooking(booking: InsertBooking, renterId: string): Promise<Booking> {
    const [newBooking] = await db
      .insert(bookings)
      .values({
        ...booking,
        renterId,
      })
      .returning();
    return newBooking;
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingsByRenter(renterId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.renterId, renterId))
      .orderBy(desc(bookings.createdAt));
  }

  async getBookingsForListing(listingId: number): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.listingId, listingId))
      .orderBy(desc(bookings.createdAt));
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ 
        status,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async updateBookingPayment(id: number, stripePaymentIntentId: string): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ 
        stripePaymentIntentId,
        status: "confirmed",
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  // Review operations
  async createReview(review: InsertReview, userId: string): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values({
        ...review,
        userId,
      })
      .returning();
    
    // Update the listing's rating and review count
    const listingReviews = await this.getReviewsForListing(review.listingId);
    const totalRating = listingReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / listingReviews.length;
    
    await db
      .update(listings)
      .set({ 
        rating: averageRating,
        reviewCount: listingReviews.length,
      })
      .where(eq(listings.id, review.listingId));
    
    return newReview;
  }

  async getReviewsForListing(listingId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.listingId, listingId))
      .orderBy(desc(reviews.createdAt));
  }

  // Message operations
  async getOrCreateConversation(user1Id: string, user2Id: string, listingId?: number): Promise<Conversation> {
    // Try to find existing conversation
    const [existingConversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.user1Id, user1Id),
          eq(conversations.user2Id, user2Id),
          listingId ? eq(conversations.listingId, listingId) : sql`${conversations.listingId} IS NULL`
        )
      );
    
    if (existingConversation) {
      return existingConversation;
    }
    
    // Try reverse order of users
    const [reverseConversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.user1Id, user2Id),
          eq(conversations.user2Id, user1Id),
          listingId ? eq(conversations.listingId, listingId) : sql`${conversations.listingId} IS NULL`
        )
      );
    
    if (reverseConversation) {
      return reverseConversation;
    }
    
    // Create new conversation
    const [newConversation] = await db
      .insert(conversations)
      .values({
        user1Id,
        user2Id,
        listingId,
      })
      .returning();
    
    return newConversation;
  }

  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.user1Id, userId),
          eq(conversations.user2Id, userId)
        )
      )
      .orderBy(desc(conversations.updatedAt));
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage, senderId: string): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        senderId,
      })
      .returning();
    
    // Update conversation's updatedAt
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, message.conversationId));
    
    return newMessage;
  }

  async markMessagesAsRead(conversationId: number, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          sql`${messages.senderId} != ${userId}`
        )
      );
  }

  // Watercraft type operations
  async getWatercraftTypes(): Promise<WatercraftType[]> {
    return await db.select().from(watercraftTypes);
  }

  // Location operations
  async getPopularLocations(limit: number = 4): Promise<Location[]> {
    return await db
      .select()
      .from(locations)
      .orderBy(desc(locations.listingCount))
      .limit(limit);
  }

  // Saved listings operations
  async saveListing(userId: string, listingId: number): Promise<SavedListing> {
    const [savedListing] = await db
      .insert(savedListings)
      .values({
        userId,
        listingId,
      })
      .onConflictDoNothing()
      .returning();
    return savedListing;
  }

  async unsaveListing(userId: string, listingId: number): Promise<boolean> {
    await db
      .delete(savedListings)
      .where(
        and(
          eq(savedListings.userId, userId),
          eq(savedListings.listingId, listingId)
        )
      );
    return true;
  }

  async getSavedListings(userId: string): Promise<Listing[]> {
    const saved = await db
      .select({
        listingId: savedListings.listingId,
      })
      .from(savedListings)
      .where(eq(savedListings.userId, userId));
    
    if (saved.length === 0) {
      return [];
    }
    
    const listingIds = saved.map(s => s.listingId);
    
    return await db
      .select()
      .from(listings)
      .where(inArray(listings.id, listingIds));
  }

  async isSaved(userId: string, listingId: number): Promise<boolean> {
    const [saved] = await db
      .select()
      .from(savedListings)
      .where(
        and(
          eq(savedListings.userId, userId),
          eq(savedListings.listingId, listingId)
        )
      );
    return !!saved;
  }
}

export const storage = new DatabaseStorage();
