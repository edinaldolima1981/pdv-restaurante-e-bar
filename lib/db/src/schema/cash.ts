import { pgTable, text, serial, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cashSessionsTable = pgTable("cash_sessions", {
  id: serial("id").primaryKey(),
  openedBy: text("opened_by").notNull(),
  openedAt: timestamp("opened_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
  openingBalance: numeric("opening_balance", { precision: 10, scale: 2 }).notNull(),
  closingBalance: numeric("closing_balance", { precision: 10, scale: 2 }),
  totalSales: numeric("total_sales", { precision: 10, scale: 2 }).notNull().default("0"),
  totalOrders: integer("total_orders").notNull().default(0),
  status: text("status").notNull().default("open"),
});

export const insertCashSessionSchema = createInsertSchema(cashSessionsTable).omit({ id: true, openedAt: true });
export type InsertCashSession = z.infer<typeof insertCashSessionSchema>;
export type CashSession = typeof cashSessionsTable.$inferSelect;
