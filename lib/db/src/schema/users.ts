import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  cardUid: text("card_uid").notNull().unique(),
  fullName: text("full_name").notNull(),
  contactNumber: text("contact_number").notNull(),
  // 1. Idagdag ang 'type' column dito para makita ni Drizzle
  type: text("type").notNull().default("Regular"), 
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  gcashLoadedTotal: numeric("gcash_loaded_total", { precision: 10, scale: 2 }).notNull().default("0"),
  totalWallet: numeric("total_wallet", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Sa insert schema, kailangang kasama ang 'type'
export const insertUserSchema = createInsertSchema(usersTable, {
  // Pwede mo ring lagyan ng validation dito para sigurado
  type: z.enum(['Student', 'Regular', 'PWD', 'Senior']).default('Regular'),
}).omit({ 
  id: true, 
  createdAt: true,
  totalWallet: true 
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;