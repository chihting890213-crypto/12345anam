import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ─── Staff JWT helpers ────────────────────────────────────────────────────────
const STAFF_COOKIE = "staff_session";

async function signStaffToken(staffId: number, role: string): Promise<string> {
  const payload = { staffId, role, type: "staff", exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 };
  const { SignJWT } = await import("jose");
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "flower-secret-key");
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).sign(secret);
}

async function verifyStaffToken(token: string): Promise<{ staffId: number; role: string; type: string } | null> {
  try {
    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "flower-secret-key");
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch { return null; }
}

// ─── Staff middleware ─────────────────────────────────────────────────────────
const staffProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = (ctx.req as any).cookies?.[STAFF_COOKIE];
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "請先登入" });
  const payload = await verifyStaffToken(token);
  if (!payload || payload.type !== "staff") throw new TRPCError({ code: "UNAUTHORIZED", message: "登入已過期" });
  const staff = await db.getStaffById(payload.staffId);
  if (!staff || !staff.isActive) throw new TRPCError({ code: "UNAUTHORIZED", message: "帳號已停用" });
  return next({ ctx: { ...ctx, staff } });
});

const adminStaffProcedure = staffProcedure.use(async ({ ctx, next }) => {
  if ((ctx as any).staff.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "需要管理員權限" });
  return next({ ctx });
});

// ─── Order number generator ───────────────────────────────────────────────────
function generateOrderNumber() {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `FO${dateStr}${nanoid(6).toUpperCase()}`;
}

// ─── Seed default admin staff ─────────────────────────────────────────────────
export async function seedDefaultStaff() {
  try {
    const existing = await db.getStaffByUsername("AAA");
    if (!existing) {
      const hash = await bcrypt.hash("BBB", 10);
      await db.createStaff({ username: "AAA", passwordHash: hash, displayName: "預設管理員", role: "admin", isActive: true });
      console.log("[Seed] Default admin staff created: AAA / BBB");
    }
  } catch (e) {
    console.warn("[Seed] Could not seed default staff:", e);
  }
}

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  // OAuth auth (kept for compatibility)
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Staff Auth (username/password)
  staffAuth: router({
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const staff = await db.getStaffByUsername(input.username);
        if (!staff || !staff.isActive) throw new TRPCError({ code: "UNAUTHORIZED", message: "帳號或密碼錯誤" });
        const valid = await bcrypt.compare(input.password, staff.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "帳號或密碼錯誤" });
        const token = await signStaffToken(staff.id, staff.role);
        const isSecure = ctx.req.protocol === "https" || (ctx.req.headers as any)["x-forwarded-proto"] === "https";
        (ctx.res as any).cookie(STAFF_COOKIE, token, {
          httpOnly: true,
          secure: isSecure,
          sameSite: isSecure ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: "/",
        });
        return { id: staff.id, username: staff.username, displayName: staff.displayName, role: staff.role };
      }),

    me: publicProcedure.query(async ({ ctx }) => {
      const token = (ctx.req as any).cookies?.[STAFF_COOKIE];
      if (!token) return null;
      const payload = await verifyStaffToken(token);
      if (!payload || payload.type !== "staff") return null;
      const staff = await db.getStaffById(payload.staffId);
      if (!staff || !staff.isActive) return null;
      return { id: staff.id, username: staff.username, displayName: staff.displayName, role: staff.role };
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      (ctx.res as any).clearCookie(STAFF_COOKIE, { path: "/" });
      return { success: true };
    }),

    changePassword: staffProcedure
      .input(z.object({ oldPassword: z.string(), newPassword: z.string().min(3) }))
      .mutation(async ({ input, ctx }) => {
        const staff = await db.getStaffById((ctx as any).staff.id);
        if (!staff) throw new TRPCError({ code: "NOT_FOUND" });
        const valid = await bcrypt.compare(input.oldPassword, staff.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "舊密碼錯誤" });
        const hash = await bcrypt.hash(input.newPassword, 10);
        await db.updateStaff(staff.id, { passwordHash: hash });
        return { success: true };
      }),
  }),

  // Staff Management (admin only)
  staff: router({
    list: staffProcedure.query(() => db.getAllStaff()),

    create: adminStaffProcedure
      .input(z.object({
        username: z.string().min(1),
        password: z.string().min(3),
        displayName: z.string().optional(),
        role: z.enum(["admin", "staff"]).default("staff"),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getStaffByUsername(input.username);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "帳號已存在" });
        const hash = await bcrypt.hash(input.password, 10);
        await db.createStaff({ username: input.username, passwordHash: hash, displayName: input.displayName, role: input.role, isActive: true });
        return { success: true };
      }),

    update: adminStaffProcedure
      .input(z.object({
        id: z.number(),
        displayName: z.string().optional(),
        role: z.enum(["admin", "staff"]).optional(),
        isActive: z.boolean().optional(),
        newPassword: z.string().min(3).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, newPassword, ...rest } = input;
        const updateData: any = { ...rest };
        if (newPassword) updateData.passwordHash = await bcrypt.hash(newPassword, 10);
        await db.updateStaff(id, updateData);
        return { success: true };
      }),

    delete: adminStaffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await db.deleteStaff(input.id); return { success: true }; }),
  }),

  // Flower Folders
  folders: router({
    list: publicProcedure.query(() => db.getAllFolders()),
    create: staffProcedure
      .input(z.object({ name: z.string().min(1), sortOrder: z.number().default(0) }))
      .mutation(async ({ input }) => { await db.createFolder(input); return { success: true }; }),
    update: staffProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), sortOrder: z.number().optional() }))
      .mutation(async ({ input }) => { const { id, ...rest } = input; await db.updateFolder(id, rest); return { success: true }; }),
    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await db.deleteFolder(input.id); return { success: true }; }),
  }),

  // Flowers
  flowers: router({
    list: publicProcedure.query(() => db.getAllFlowers()),
    activeList: publicProcedure.query(() => db.getActiveFlowers()),
    create: staffProcedure
      .input(z.object({
        folderId: z.number().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.union([z.string(), z.number()]).optional().transform(v => v ? String(v) : undefined),
        unit: z.string().default("束"),
        category: z.enum(["holiday", "other"]).default("other"),
        isCustom: z.boolean().default(false),
        imageUrl: z.string().optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => { await db.createFlower(input as any); return { success: true }; }),
    update: staffProcedure
      .input(z.object({
        id: z.number(),
        folderId: z.number().nullable().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.union([z.string(), z.number()]).optional().transform(v => v ? String(v) : undefined),
        unit: z.string().optional(),
        category: z.enum(["holiday", "wedding", "funeral", "other"]).optional(),
        isCustom: z.boolean().optional(),
        imageUrl: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => { const { id, ...rest } = input; await db.updateFlower(id, rest as any); return { success: true }; }),
    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await db.deleteFlower(input.id); return { success: true }; }),
  }),



  // Timeslot Capacities
  capacities: router({
    byDate: publicProcedure
      .input(z.object({ date: z.string() }))
      .query(({ input }) => db.getCapacitiesByDate(input.date)),
    byDateRange: staffProcedure
      .input(z.object({ startDate: z.string(), endDate: z.string() }))
      .query(({ input }) => db.getCapacitiesByDateRange(input.startDate, input.endDate)),
    upsert: staffProcedure
      .input(z.object({
        date: z.string(),
        timeslot: z.string(),
        category: z.enum(["holiday", "wedding", "funeral", "other", "all"]).default("all"),
        maxCapacity: z.number().min(0),
        currentCount: z.number().default(0),
      }))
      .mutation(async ({ input }) => { await db.upsertCapacity(input as any); return { success: true }; }),
    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await db.deleteCapacity(input.id); return { success: true }; }),
  }),

  // Bank Accounts
  bankAccounts: router({
    list: publicProcedure.query(() => db.getAllBankAccounts()),
    create: staffProcedure
      .input(z.object({
        bankName: z.string().min(1),
        accountNumber: z.string().min(1),
        accountName: z.string().min(1),
        branchName: z.string().optional(),
        note: z.string().optional(),
        isActive: z.boolean().default(true),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => { await db.createBankAccount(input as any); return { success: true }; }),
    update: staffProcedure
      .input(z.object({
        id: z.number(),
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        accountName: z.string().optional(),
        branchName: z.string().optional(),
        note: z.string().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => { const { id, ...rest } = input; await db.updateBankAccount(id, rest as any); return { success: true }; }),
    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await db.deleteBankAccount(input.id); return { success: true }; }),
  }),

  // Orders
  orders: router({
    list: staffProcedure
      .input(z.object({ status: z.string().optional(), date: z.string().optional(), search: z.string().optional() }).optional())
      .query(({ input }) => db.getAllOrders(input)),

    byDate: staffProcedure
      .input(z.object({ date: z.string() }))
      .query(({ input }) => db.getOrdersByDate(input.date)),

    byNumber: publicProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ input }) => {
        const order = await db.getOrderByNumber(input.orderNumber);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "找不到此訂單" });
        const { internalNote, staffId, ...publicOrder } = order;
        return publicOrder;
      }),

    byNumberOrSender: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        let order = await db.getOrderByNumber(input.query);
        if (!order) {
          order = await db.getOrderBySenderName(input.query);
        }
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "找不到此訂單" });
        const { internalNote, staffId, ...publicOrder } = order;
        return publicOrder;
      }),

    detail: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        return order;
      }),

    create: publicProcedure
      .input(z.object({
        senderName: z.string().min(1),
        senderPhone: z.string().min(1),
        senderEmail: z.string().optional(),
        taxId: z.string().optional(),
        recipientName: z.string().min(1),
        recipientPhone: z.string().min(1),
        recipientAddress: z.string().optional(),
        deliveryType: z.enum(["pickup", "delivery"]),
        deliveryDate: z.string().optional(),
        timeslot: z.string().optional(),
        flowerId: z.number().optional(),
        flowerName: z.string().optional(),
        flowerQuantity: z.number().default(1),
        flowerUnit: z.string().default("束"),
        customFlowerPrice: z.number().optional(),
        flowerPrice: z.number().optional(),
        needCard: z.boolean().default(false),
        cardContent: z.string().optional(),
        cardPrice: z.number().default(0),
        category: z.enum(["holiday", "wedding", "funeral", "other"]).default("other"),
        categoryNote: z.string().optional(),
        totalAmount: z.number().default(0),
        internalNote: z.string().optional(),
        extraFields: z.any().optional(),
        createdByStaff: z.boolean().default(false),
        staffId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        if (input.deliveryDate && input.timeslot) {
          const caps = await db.getCapacitiesByDate(input.deliveryDate);
          const relevantCap = caps.find(c =>
            c.timeslot === input.timeslot &&
            (c.category === 'all' || c.category === input.category)
          );
          if (relevantCap) {
            const count = await db.getOrderCountByDateTimeslot(input.deliveryDate, input.timeslot, relevantCap.category);
            if (count >= relevantCap.maxCapacity) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "FULLY_BOOKED" });
            }
          }
        }
        const orderNumber = generateOrderNumber();
        await db.createOrder({ ...input as any, orderNumber, status: "pending" });
        return { orderNumber };
      }),

    update: staffProcedure
      .input(z.object({
        id: z.number(),
        senderName: z.string().optional(),
        senderPhone: z.string().optional(),
        senderEmail: z.string().optional(),
        taxId: z.string().optional(),
        recipientName: z.string().optional(),
        recipientPhone: z.string().optional(),
        recipientAddress: z.string().optional(),
        deliveryType: z.enum(["pickup", "delivery"]).optional(),
        deliveryDate: z.string().optional(),
        timeslot: z.string().optional(),
        flowerId: z.number().nullable().optional(),
        flowerName: z.string().optional(),
        flowerQuantity: z.string().optional(),
        flowerUnit: z.string().optional(),
        customFlowerPrice: z.string().optional(),
        flowerPrice: z.string().optional(),
        needCard: z.boolean().optional(),
        cardContent: z.string().optional(),
        cardPrice: z.string().optional(),
        category: z.enum(["holiday", "wedding", "funeral", "other"]).optional(),
        categoryNote: z.string().optional(),
        totalAmount: z.string().optional(),
        status: z.enum(["pending","confirmed","awaiting_payment","paid","processing","completed","cancelled","fully_booked"]).optional(),
        paymentNote: z.string().optional(),
        bankAccountId: z.number().nullable().optional(),
        internalNote: z.string().optional(),
        extraFields: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        await db.updateOrder(id, rest as any);
        return { success: true };
      }),

    updateStatus: staffProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending","confirmed","awaiting_payment","paid","processing","completed","cancelled","fully_booked"]),
        paymentNote: z.string().optional(),
        bankAccountId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        await db.updateOrder(id, rest as any);
        return { success: true };
      }),

    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteOrder(input.id);
        return { success: true };
      }),
  }),

  // Order Messages
  messages: router({
    list: publicProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ input }) => {
        const order = await db.getOrderByNumber(input.orderNumber);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        return db.getMessagesByOrderId(order.id);
      }),

    listByOrderId: staffProcedure
      .input(z.object({ orderId: z.number() }))
      .query(({ input }) => db.getMessagesByOrderId(input.orderId)),

    sendStaff: staffProcedure
      .input(z.object({ orderId: z.number(), content: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        await db.createMessage({
          orderId: input.orderId,
          senderType: "staff",
          senderName: (ctx as any).staff.displayName || (ctx as any).staff.username,
          content: input.content,
        });
        return { success: true };
      }),

    sendCustomer: publicProcedure
      .input(z.object({ orderNumber: z.string(), content: z.string().min(1), senderName: z.string().optional() }))
      .mutation(async ({ input }) => {
        const order = await db.getOrderByNumber(input.orderNumber);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        await db.createMessage({
          orderId: order.id,
          senderType: "customer",
          senderName: input.senderName || order.senderName,
          content: input.content,
        });
        return { success: true };
      }),
  }),

  // Calendar
  calendar: router({
    ordersForMonth: staffProcedure
      .input(z.object({ startDate: z.string(), endDate: z.string() }))
      .query(async ({ input }) => {
        const allOrders = await db.getAllOrders();
        return allOrders.filter(o =>
          o.deliveryDate && o.deliveryDate >= input.startDate && o.deliveryDate <= input.endDate
        );
      }),
    capacitiesForMonth: staffProcedure
      .input(z.object({ startDate: z.string(), endDate: z.string() }))
      .query(({ input }) => db.getCapacitiesByDateRange(input.startDate, input.endDate)),
  }),
});

export type AppRouter = typeof appRouter;
