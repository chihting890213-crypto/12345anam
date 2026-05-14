import { eq, desc, and, like, sql, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  staffAccounts, InsertStaffAccount,
  flowerFolders, InsertFlowerFolder,
  flowers, InsertFlower,
  timeslotCapacities, InsertTimeslotCapacity,
  bankAccounts, InsertBankAccount,
  orders, InsertOrder,
  orderMessages, InsertOrderMessage,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Staff Accounts ───────────────────────────────────────────────────────────
export async function getAllStaff() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: staffAccounts.id,
    username: staffAccounts.username,
    displayName: staffAccounts.displayName,
    role: staffAccounts.role,
    isActive: staffAccounts.isActive,
    createdAt: staffAccounts.createdAt,
    updatedAt: staffAccounts.updatedAt,
  }).from(staffAccounts).orderBy(desc(staffAccounts.createdAt));
}

export async function getStaffByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(staffAccounts).where(eq(staffAccounts.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getStaffById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(staffAccounts).where(eq(staffAccounts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createStaff(data: InsertStaffAccount) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(staffAccounts).values(data);
}

export async function updateStaff(id: number, data: Partial<InsertStaffAccount>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(staffAccounts).set(data).where(eq(staffAccounts.id, id));
}

export async function deleteStaff(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(staffAccounts).where(eq(staffAccounts.id, id));
}

// ─── Flower Folders ───────────────────────────────────────────────────────────
export async function getAllFolders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(flowerFolders).orderBy(flowerFolders.sortOrder);
}

export async function createFolder(data: InsertFlowerFolder) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(flowerFolders).values(data);
}

export async function updateFolder(id: number, data: Partial<InsertFlowerFolder>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(flowerFolders).set(data).where(eq(flowerFolders.id, id));
}

export async function deleteFolder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(flowerFolders).where(eq(flowerFolders.id, id));
}

// ─── Flowers ──────────────────────────────────────────────────────────────────
export async function getAllFlowers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(flowers).orderBy(flowers.sortOrder, flowers.name);
}

export async function getActiveFlowers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(flowers).where(eq(flowers.isActive, true)).orderBy(flowers.sortOrder, flowers.name);
}

export async function getFlowerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(flowers).where(eq(flowers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createFlower(data: InsertFlower) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(flowers).values(data);
}

export async function updateFlower(id: number, data: Partial<InsertFlower>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(flowers).set(data).where(eq(flowers.id, id));
}

export async function deleteFlower(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(flowers).where(eq(flowers.id, id));
}

// ─── Timeslot Capacities ──────────────────────────────────────────────────────
// Helper: count active orders for a given date+timeslot+flowerId combination
async function countOrdersForFlowerSlot(dbInst: any, date: string, timeslot: string, flowerId: number): Promise<number> {
  const activeStatuses = ["pending", "confirmed", "awaiting_payment", "paid", "processing"];
  const result = await dbInst.select({ count: sql<number>`COUNT(*)` })
    .from(orders)
    .where(
      and(
        eq(orders.deliveryDate, date),
        eq(orders.timeslot, timeslot),
        eq(orders.flowerId, flowerId),
        sql`${orders.status} IN (${sql.raw(activeStatuses.map(s => `'${s}'`).join(","))})`
      )
    );
  return Number(result[0]?.count ?? 0);
}

export async function getCapacitiesByDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  const caps = await db.select().from(timeslotCapacities).where(eq(timeslotCapacities.date, date));
  // Dynamically compute currentCount from actual orders
  return Promise.all(caps.map(async cap => ({
    ...cap,
    currentCount: await countOrdersForFlowerSlot(db, date, cap.timeslot, cap.flowerId),
  })));
}

export async function getCapacitiesByDateRange(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  const caps = await db.select().from(timeslotCapacities).where(
    and(
      sql`${timeslotCapacities.date} >= ${startDate}`,
      sql`${timeslotCapacities.date} <= ${endDate}`
    )
  );
  // Dynamically compute currentCount from actual orders
  return Promise.all(caps.map(async cap => ({
    ...cap,
    currentCount: await countOrdersForFlowerSlot(db, cap.date, cap.timeslot, cap.flowerId),
  })));
}

export async function getCapacity(date: string, timeslot: string, flowerId: number) {
  const db = await getDb();
  if (!db) return null;
  const cap = await db.select().from(timeslotCapacities).where(
    and(
      eq(timeslotCapacities.date, date),
      eq(timeslotCapacities.timeslot, timeslot),
      eq(timeslotCapacities.flowerId, flowerId)
    )
  );
  if (cap.length === 0) return null;
  return {
    ...cap[0],
    currentCount: await countOrdersForFlowerSlot(db, date, timeslot, flowerId),
  };
}

export async function incrementCapacityCount(capacityId: number, increment: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(timeslotCapacities)
    .set({ currentCount: sql`${timeslotCapacities.currentCount} + ${increment}` })
    .where(eq(timeslotCapacities.id, capacityId));
}

export async function upsertCapacity(data: InsertTimeslotCapacity) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Only store maxCapacity; currentCount is computed dynamically
  await db.insert(timeslotCapacities).values({ ...data, currentCount: 0 }).onDuplicateKeyUpdate({
    set: { maxCapacity: data.maxCapacity }
  });
}

export async function deleteCapacity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(timeslotCapacities).where(eq(timeslotCapacities.id, id));
}

// Legacy function for backward compatibility
async function countOrdersForSlot(dbInst: any, date: string, timeslot: string, category: string): Promise<number> {
  // This is deprecated - use countOrdersForFlowerSlot instead
  return 0;
}

// ─── Bank Accounts ────────────────────────────────────────────────────────────
export async function getAllBankAccounts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bankAccounts).orderBy(bankAccounts.sortOrder);
}

export async function createBankAccount(data: InsertBankAccount) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(bankAccounts).values(data);
}

export async function updateBankAccount(id: number, data: Partial<InsertBankAccount>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(bankAccounts).set(data).where(eq(bankAccounts.id, id));
}

export async function deleteBankAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function getAllOrders(filters?: { status?: string; date?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters?.status && filters.status !== 'all') conditions.push(eq(orders.status, filters.status as any));
  if (filters?.date) conditions.push(eq(orders.deliveryDate, filters.date));
  if (filters?.search) conditions.push(like(orders.orderNumber, `%${filters.search}%`));
  let query = db.select().from(orders).$dynamic();
  if (conditions.length > 0) query = query.where(and(...conditions));
  return query.orderBy(desc(orders.createdAt));
}

export async function getOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(orders).values(data);
}

export async function updateOrder(id: number, data: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(orders).set(data).where(eq(orders.id, id));
}

export async function getOrderBySenderName(orderingPersonName: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.orderingPersonName, orderingPersonName)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteOrder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(orders).where(eq(orders.id, id));
}

export async function getOrdersByDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.deliveryDate, date)).orderBy(orders.timeslot);
}

export async function getOrderCountByDateTimeslot(date: string, timeslot: string, category?: string) {
  const db = await getDb();
  if (!db) return 0;
  const conditions: any[] = [
    eq(orders.deliveryDate, date),
    eq(orders.timeslot, timeslot),
    sql`${orders.status} NOT IN ('cancelled', 'fully_booked')`,
  ];
  if (category && category !== 'all') conditions.push(eq(orders.category, category as any));
  const result = await db.select({ count: sql<number>`count(*)` }).from(orders).where(and(...conditions));
  return Number(result[0]?.count ?? 0);
}

// ─── Order Messages ───────────────────────────────────────────────────────────
export async function getMessagesByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderMessages).where(eq(orderMessages.orderId, orderId)).orderBy(orderMessages.createdAt);
}

export async function createMessage(data: InsertOrderMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(orderMessages).values(data);
}
