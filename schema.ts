import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  varchar,
  jsonb,
  real,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  phoneNumber: varchar("phone_number"),
  isOwner: boolean("is_owner").default(false),
  stripeCustomerId: varchar("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types of watercraft
export const watercraftTypes = pgTable("watercraft_types", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  icon: varchar("icon").notNull(),
});

// Locations for popular destinations
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  imageUrl: varchar("image_url"),
  listingCount: integer("listing_count").default(0),
});

// Watercraft listings
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  typeId: integer("type_id").notNull(),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  location: varchar("location").notNull(),
  capacity: integer("capacity").notNull(),
  length: real("length"), // in feet
  year: integer("year"),
  pricePerHour: integer("price_per_hour").notNull(), // in cents
  featuresJson: jsonb("features_json"), // Bluetooth, WiFi, etc.
  imagesJson: jsonb("images_json").notNull(), // Array of image URLs
  rating: real("rating"),
  reviewCount: integer("review_count").default(0),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Availability for listings
export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  date: timestamp("date").notNull(),
  startTime: integer("start_time").notNull(), // Minutes from midnight
  endTime: integer("end_time").notNull(), // Minutes from midnight
  isAvailable: boolean("is_available").default(true),
});

// Bookings for listings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  renterId: varchar("renter_id").notNull().references(() => users.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  totalPrice: integer("total_price").notNull(), // in cents
  status: varchar("status").notNull().default("pending"), // pending, confirmed, completed, cancelled
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews for listings
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages between users
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  user1Id: varchar("user1_id").notNull().references(() => users.id),
  user2Id: varchar("user2_id").notNull().references(() => users.id),
  listingId: integer("listing_id").references(() => listings.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    // Create a unique index instead of a second primary key
    uniqueParticipants: index().on(table.user1Id, table.user2Id, table.listingId),
  };
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved/favorite listings
export const savedListings = pgTable("saved_listings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    // Create a unique index instead of a second primary key
    uniqueSave: index().on(table.userId, table.listingId),
  };
});

// Zod schemas for validation
export const upsertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertListingSchema = createInsertSchema(listings).omit({ 
  id: true, 
  ownerId: true, 
  rating: true, 
  reviewCount: true, 
  isActive: true, 
  isFeatured: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  renterId: true,
  status: true,
  stripePaymentIntentId: true,
  createdAt: true,
  updatedAt: true
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  userId: true,
  createdAt: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  senderId: true,
  isRead: true,
  createdAt: true
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Availability = typeof availability.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;

export type WatercraftType = typeof watercraftTypes.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type SavedListing = typeof savedListings.$inferSelect;
