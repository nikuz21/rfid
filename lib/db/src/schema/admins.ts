import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const adminsTable = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password_hash: text("password_hash").notNull(),
  full_name: text("full_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
