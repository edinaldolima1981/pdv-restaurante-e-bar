import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const restaurantTablesTable = pgTable("restaurant_tables", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  name: text("name"),
  status: text("status").notNull().default("available"),
  capacity: integer("capacity").default(4),
  currentOrderId: integer("current_order_id"),
});

export const insertTableSchema = createInsertSchema(restaurantTablesTable).omit({ id: true });
export type InsertTable = z.infer<typeof insertTableSchema>;
export type RestaurantTable = typeof restaurantTablesTable.$inferSelect;
