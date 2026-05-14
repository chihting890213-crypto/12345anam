import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Staff Accounts (username/password login) ─────────────────────────────────
export const staffAccounts = mysqlTable("staff_accounts", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  displayName: varchar("displayName", { length: 128 }),
  role: mysqlEnum("role", ["admin", "staff"]).default("staff").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StaffAccount = typeof staffAccounts.$inferSelect;
export type InsertStaffAccount = typeof staffAccounts.$inferInsert;

// ─── Flower Folders ────────────────────────────────────────────────────────────
// ─── Relations ─────────────────────────────────────────────────────────────────
import { relations } from "drizzle-orm";
// Note: relations import already exists above

export const flowerFolders = mysqlTable("flower_folders", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FlowerFolder = typeof flowerFolders.$inferSelect;
export type InsertFlowerFolder = typeof flowerFolders.$inferInsert;

// ─── Flowers ───────────────────────────────────────────────────────────────────
export const flowers = mysqlTable("flowers", {
  id: int("id").autoincrement().primaryKey(),
  folderId: int("folderId"),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  price: int("price"),
  unit: varchar("unit", { length: 32 }).default("束").notNull(),
  category: mysqlEnum("category", ["holiday", "wedding", "funeral", "other"]).default("other").notNull(),
  isCustom: boolean("isCustom").default(false).notNull(),
  imageUrl: varchar("imageUrl", { length: 512 }),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Flower = typeof flowers.$inferSelect;
export type InsertFlower = typeof flowers.$inferInsert;



// ─── Timeslot Capacities ───────────────────────────────────────────────────────
export const timeslotCapacities = mysqlTable("timeslot_capacities", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(),
  timeslot: varchar("timeslot", { length: 32 }).notNull(),
  flowerId: int("flowerId").notNull(),
  maxCapacity: int("maxCapacity").notNull(),
  currentCount: int("currentCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TimeslotCapacity = typeof timeslotCapacities.$inferSelect;
export type InsertTimeslotCapacity = typeof timeslotCapacities.$inferInsert;

// Foreign key relation
export const timeslotCapacitiesRelations = relations(timeslotCapacities, ({ one }) => ({
  flower: one(flowers, { fields: [timeslotCapacities.flowerId], references: [flowers.id] }),
}));



// ─── Bank Accounts ─────────────────────────────────────────────────────────────
export const bankAccounts = mysqlTable("bank_accounts", {
  id: int("id").autoincrement().primaryKey(),
  bankName: varchar("bankName", { length: 128 }).notNull(),
  accountNumber: varchar("accountNumber", { length: 64 }).notNull(),
  accountName: varchar("accountName", { length: 128 }).notNull(),
  branchName: varchar("branchName", { length: 128 }),
  note: text("note"),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;

// ─── Orders ────────────────────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  senderName: varchar("senderName", { length: 128 }).notNull(),
  senderPhone: varchar("senderPhone", { length: 32 }).notNull(),
  senderEmail: varchar("senderEmail", { length: 320 }),
  taxId: varchar("taxId", { length: 16 }),
  recipientName: varchar("recipientName", { length: 128 }).notNull(),
  recipientPhone: varchar("recipientPhone", { length: 32 }).notNull(),
  recipientAddress: text("recipientAddress"),
  deliveryType: mysqlEnum("deliveryType", ["pickup", "delivery"]).notNull(),
  deliveryDate: varchar("deliveryDate", { length: 10 }),
  timeslot: varchar("timeslot", { length: 32 }),
  flowerId: int("flowerId"),
  flowerName: varchar("flowerName", { length: 128 }),
  flowerQuantity: int("flowerQuantity").default(1),
  flowerUnit: varchar("flowerUnit", { length: 32 }).default("束"),
  customFlowerPrice: int("customFlowerPrice"),
  flowerPrice: int("flowerPrice"),
  needCard: boolean("needCard").default(false).notNull(),
  cardContent: text("cardContent"),
  cardPrice: int("cardPrice").default(0),
  category: mysqlEnum("category", ["holiday", "wedding", "funeral", "other"]).default("other").notNull(),
  categoryNote: text("categoryNote"),
  totalAmount: int("totalAmount").default(0),
  status: mysqlEnum("status", [
    "pending",
    "confirmed",
    "awaiting_payment",
    "paid",
    "processing",
    "completed",
    "cancelled",
    "fully_booked",
  ]).default("pending").notNull(),
  paymentNote: text("paymentNote"),
  bankAccountId: int("bankAccountId"),
  createdByStaff: boolean("createdByStaff").default(false).notNull(),
  staffId: int("staffId"),
  internalNote: text("internalNote"),
  extraFields: json("extraFields"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items (Multiple flowers per order) ──────────────────────────────────
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  flowerId: int("flowerId").notNull(),
  flowerName: varchar("flowerName", { length: 128 }),
  quantity: int("quantity").default(1).notNull(),
  unit: varchar("unit", { length: 32 }).default("束"),
  price: int("price").default(0),
  customPrice: int("customPrice"),
  subtotal: int("subtotal").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  flower: one(flowers, { fields: [orderItems.flowerId], references: [flowers.id] }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));


// ─── Order Messages (Staff-Customer Interaction) ───────────────────────────────
export const orderMessages = mysqlTable("order_messages", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  senderType: mysqlEnum("senderType", ["staff", "customer"]).notNull(),
  senderName: varchar("senderName", { length: 128 }),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OrderMessage = typeof orderMessages.$inferSelect;
export type InsertOrderMessage = typeof orderMessages.$inferInsert;