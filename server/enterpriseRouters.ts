import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  protectedProcedure,
  publicProcedure,
  router,
  userAdminProcedure,
  systemSettingsProcedure,
  dashboardProcedure,
} from "./_core/trpc";
import { validateCoupon, listCoupons, createCoupon, toggleCoupon } from "./couponService";
import {
  applyForAffiliate,
  getAffiliateStats,
  listAffiliates,
  approveAffiliate,
} from "./affiliateService";
import {
  getUserNotifications,
  markNotificationsRead,
  getUnreadCount,
} from "./notificationService";
import { blockIp, unblockIp, listBlockedIps } from "./ipBlocklist";
import { getDb } from "./db";
import { organizations, orgMembers } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logAdminAction } from "./adminLogHelper";
import { writeAuditLog } from "./auditLogger";

// ===== COUPON ROUTER =====
export const couponRouter = router({
  validate: publicProcedure
    .input(z.object({ code: z.string(), orderAmount: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id ?? 0;
      return validateCoupon(input.code, userId, input.orderAmount);
    }),

  adminList: dashboardProcedure.query(async () => listCoupons()),

  adminCreate: systemSettingsProcedure
    .input(
      z.object({
        code: z.string().min(3).max(64),
        description: z.string().optional(),
        discountType: z.enum(["percent", "fixed"]),
        discountValue: z.string(),
        minOrderAmount: z.string().optional(),
        maxDiscountAmount: z.string().optional(),
        usageLimit: z.number().int().optional(),
        perUserLimit: z.number().int().default(1),
        startsAt: z.string().optional(),
        expiresAt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createCoupon({
        code: input.code,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minOrderAmount: input.minOrderAmount ?? null,
        maxDiscountAmount: input.maxDiscountAmount ?? null,
        usageLimit: input.usageLimit ?? null,
        perUserLimit: input.perUserLimit,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        createdBy: ctx.user.id,
      });
      await logAdminAction(ctx, "coupon.create", { code: input.code });
      return { success: true as const };
    }),

  adminToggle: systemSettingsProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await toggleCoupon(input.id, input.isActive);
      await logAdminAction(ctx, "coupon.toggle", { id: input.id, isActive: input.isActive });
      return { success: true as const };
    }),
});

// ===== AFFILIATE ROUTER =====
export const affiliateRouter = router({
  apply: protectedProcedure.mutation(async ({ ctx }) => {
    return applyForAffiliate(ctx.user.id);
  }),

  myStats: protectedProcedure.query(async ({ ctx }) => {
    return getAffiliateStats(ctx.user.id);
  }),

  adminList: dashboardProcedure.query(async () => listAffiliates()),

  adminApprove: userAdminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await approveAffiliate(input.userId);
      await logAdminAction(ctx, "affiliate.approve", { userId: input.userId });
      return { success: true as const };
    }),
});

// ===== NOTIFICATIONS ROUTER =====
export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }).optional())
    .query(async ({ ctx, input }) => {
      return getUserNotifications(ctx.user.id, input?.limit ?? 20);
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return { count: await getUnreadCount(ctx.user.id) };
  }),

  markRead: protectedProcedure
    .input(z.object({ ids: z.array(z.number()).optional() }))
    .mutation(async ({ ctx, input }) => {
      await markNotificationsRead(ctx.user.id, input.ids);
      return { success: true as const };
    }),
});

// ===== ORGANIZATIONS ROUTER =====
export const orgRouter = router({
  myOrg: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [member] = await db
      .select()
      .from(orgMembers)
      .where(eq(orgMembers.userId, ctx.user.id))
      .limit(1);
    if (!member) return null;
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, member.orgId))
      .limit(1);
    return org ? { ...org, memberRole: member.role } : null;
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(255), slug: z.string().min(2).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(organizations).values({
        slug: input.slug.toLowerCase().replace(/\s+/g, "-"),
        name: input.name,
        ownerId: ctx.user.id,
      });
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, input.slug))
        .limit(1);
      if (!org) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(orgMembers).values({ orgId: org.id, userId: ctx.user.id, role: "owner" });
      await writeAuditLog({
        userId: ctx.user.id,
        action: "org.create",
        resource: "organization",
        resourceId: String(org.id),
        after: { name: input.name, slug: input.slug },
        req: ctx.req,
      });
      return { success: true as const, orgId: org.id };
    }),

  adminList: dashboardProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(organizations).orderBy(organizations.createdAt);
  }),
});

// ===== SECURITY ROUTER (IP Blocklist + Audit) =====
export const securityRouter = router({
  listBlockedIps: systemSettingsProcedure.query(async () => listBlockedIps()),

  blockIp: systemSettingsProcedure
    .input(
      z.object({
        ip: z.string().ip(),
        reason: z.string(),
        expiresAt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await blockIp(
        input.ip,
        input.reason,
        ctx.user.id,
        input.expiresAt ? new Date(input.expiresAt) : undefined
      );
      await logAdminAction(ctx, "security.block_ip", { ip: input.ip });
      return { success: true as const };
    }),

  unblockIp: systemSettingsProcedure
    .input(z.object({ ip: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await unblockIp(input.ip);
      await logAdminAction(ctx, "security.unblock_ip", { ip: input.ip });
      return { success: true as const };
    }),
});
