import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ===== USERS =====
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "service", "admin", "super_admin", "developer"]).default("user").notNull(),
  phone: varchar("phone", { length: 32 }),
  avatarUrl: text("avatarUrl"),
  timezone: varchar("timezone", { length: 64 }).default("Asia/Bangkok"),
  locale: varchar("locale", { length: 16 }).default("th"),
  isVerified: boolean("isVerified").default(false).notNull(),
  isBanned: boolean("isBanned").default(false).notNull(),
  bannedReason: text("bannedReason"),
  deletedAt: timestamp("deletedAt"),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ===== PRODUCTS (EA BOTS) =====
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  shortDesc: text("shortDesc"),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("salePrice", { precision: 10, scale: 2 }),
  category: mysqlEnum("category", [
    "scalping",
    "swing",
    "grid",
    "hedging",
    "trend",
    "arbitrage",
    "indicator_tv",
    "strategy_tv",
    "script_tv",
    "tool",
    "other",
  ]).default("other").notNull(),
  platform: mysqlEnum("platform", ["MT4", "MT5", "both"]).default("MT4").notNull(),
  saleType: mysqlEnum("saleType", ["buy_once", "rent", "both"]).default("buy_once").notNull(),
  rentalPrice: decimal("rentalPrice", { precision: 10, scale: 2 }),
  rentalDurationDays: int("rentalDurationDays"),
  currency: varchar("currency", { length: 10 }).default("THB").notNull(),
  imageUrl: text("imageUrl"),
  screenshotUrls: json("screenshotUrls").$type<string[]>().default([]),
  fileKey: text("fileKey"),
  fileUrl: text("fileUrl"),
  // Performance metrics
  winRate: decimal("winRate", { precision: 5, scale: 2 }),
  monthlyReturn: decimal("monthlyReturn", { precision: 5, scale: 2 }),
  maxDrawdown: decimal("maxDrawdown", { precision: 5, scale: 2 }),
  profitFactor: decimal("profitFactor", { precision: 5, scale: 2 }),
  totalTrades: int("totalTrades"),
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isNew: boolean("isNew").default(false).notNull(),
  downloadCount: int("downloadCount").default(0).notNull(),
  // Tags
  tags: json("tags").$type<string[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ===== ORDERS =====
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "processing", "completed", "cancelled", "refunded"]).default("pending").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("THB").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["card", "promptpay", "bank_transfer", "crypto"]).default("card").notNull(),
  // Stripe
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  // Customer info
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerName: text("customerName"),
  // Metadata
  notes: text("notes"),
  couponId: int("couponId"),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).default("0.00"),
  affiliateCode: varchar("affiliateCode", { length: 32 }),
  orgId: int("orgId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  paidAt: timestamp("paidAt"),
  deletedAt: timestamp("deletedAt"),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ===== ORDER ITEMS =====
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  // Download tracking
  downloadToken: varchar("downloadToken", { length: 128 }),
  downloadCount: int("downloadCount").default(0).notNull(),
  downloadExpiry: timestamp("downloadExpiry"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ===== CART ITEMS =====
export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// ===== REVIEWS =====
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(), // 1-5
  title: varchar("title", { length: 255 }),
  content: text("content"),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ===== API CONFIG (Developer Console) =====
export const apiConfigs = mysqlTable("api_configs", {
  id: int("id").autoincrement().primaryKey(),
  service: varchar("service", { length: 64 }).notNull(),
  keyName: varchar("keyName", { length: 128 }).notNull().unique(),
  encryptedValue: text("encryptedValue").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiConfig = typeof apiConfigs.$inferSelect;
export type InsertApiConfig = typeof apiConfigs.$inferInsert;

// ===== FEATURE FLAGS =====
export const featureFlags = mysqlTable("feature_flags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  value: boolean("value").default(false).notNull(),
  description: text("description"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;

// ===== SYSTEM CONFIG =====
export const systemConfig = mysqlTable("system_config", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: text("value").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  description: text("description"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemConfigRow = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = typeof systemConfig.$inferInsert;

// ===== ADMIN LOGS =====
export const adminLogs = mysqlTable("admin_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  details: json("details").$type<Record<string, unknown>>(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = typeof adminLogs.$inferInsert;

// ===== PRODUCT ASSETS =====
export const productAssets = mysqlTable("product_assets", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  fileKey: text("fileKey").notNull(),
  fileUrl: text("fileUrl"),
  version: varchar("version", { length: 64 }).notNull(),
  checksum: varchar("checksum", { length: 128 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductAsset = typeof productAssets.$inferSelect;
export type InsertProductAsset = typeof productAssets.$inferInsert;

// ===== PRODUCT LICENSES =====
export const productLicenses = mysqlTable("product_licenses", {
  id: int("id").autoincrement().primaryKey(),
  orderItemId: int("orderItemId").notNull(),
  licenseKey: varchar("licenseKey", { length: 128 }).notNull().unique(),
  seats: int("seats").default(1).notNull(),
  status: mysqlEnum("status", ["active", "revoked", "expired"]).default("active").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductLicense = typeof productLicenses.$inferSelect;
export type InsertProductLicense = typeof productLicenses.$inferInsert;

// ===== WEBHOOK EVENTS =====
export const webhookEvents = mysqlTable("webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 64 }).notNull(),
  eventId: varchar("eventId", { length: 255 }).notNull(),
  payloadHash: varchar("payloadHash", { length: 128 }),
  status: mysqlEnum("status", ["received", "processed", "failed", "retried"]).default("received").notNull(),
  retryCount: int("retryCount").default(0).notNull(),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;

// ===== INTEGRATION HEALTH CHECKS =====
export const integrationHealthChecks = mysqlTable("integration_health_checks", {
  id: int("id").autoincrement().primaryKey(),
  service: varchar("service", { length: 64 }).notNull().unique(),
  lastStatus: mysqlEnum("lastStatus", ["ok", "warn", "error"]).default("warn").notNull(),
  diagnostics: text("diagnostics"),
  lastCheckedAt: timestamp("lastCheckedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IntegrationHealthCheck = typeof integrationHealthChecks.$inferSelect;
export type InsertIntegrationHealthCheck = typeof integrationHealthChecks.$inferInsert;

// =============================================================================
// ENTERPRISE ADDITIONS
// =============================================================================

// ===== ORGANIZATIONS (Multi-tenant) =====
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logoUrl"),
  plan: mysqlEnum("plan", ["free", "starter", "pro", "enterprise"]).default("free").notNull(),
  maxSeats: int("maxSeats").default(5).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  ownerId: int("ownerId").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// ===== ORGANIZATION MEMBERS =====
export const orgMembers = mysqlTable("org_members", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "member", "viewer"]).default("member").notNull(),
  invitedBy: int("invitedBy"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});
export type OrgMember = typeof orgMembers.$inferSelect;
export type InsertOrgMember = typeof orgMembers.$inferInsert;

// ===== COUPONS =====
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  description: text("description"),
  discountType: mysqlEnum("discountType", ["percent", "fixed"]).default("percent").notNull(),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("minOrderAmount", { precision: 10, scale: 2 }),
  maxDiscountAmount: decimal("maxDiscountAmount", { precision: 10, scale: 2 }),
  usageLimit: int("usageLimit"),
  usageCount: int("usageCount").default(0).notNull(),
  perUserLimit: int("perUserLimit").default(1).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  startsAt: timestamp("startsAt"),
  expiresAt: timestamp("expiresAt"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

// ===== COUPON USAGES =====
export const couponUsages = mysqlTable("coupon_usages", {
  id: int("id").autoincrement().primaryKey(),
  couponId: int("couponId").notNull(),
  userId: int("userId").notNull(),
  orderId: int("orderId").notNull(),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CouponUsage = typeof couponUsages.$inferSelect;
export type InsertCouponUsage = typeof couponUsages.$inferInsert;

// ===== AFFILIATES =====
export const affiliates = mysqlTable("affiliates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("10.00").notNull(),
  totalEarned: decimal("totalEarned", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalPaid: decimal("totalPaid", { precision: 12, scale: 2 }).default("0.00").notNull(),
  status: mysqlEnum("status", ["pending", "active", "suspended"]).default("pending").notNull(),
  payoutMethod: varchar("payoutMethod", { length: 64 }),
  payoutDetails: json("payoutDetails").$type<Record<string, string>>().default({}),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = typeof affiliates.$inferInsert;

// ===== AFFILIATE CONVERSIONS =====
export const affiliateConversions = mysqlTable("affiliate_conversions", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull(),
  referredUserId: int("referredUserId"),
  orderId: int("orderId"),
  commissionAmount: decimal("commissionAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "paid", "rejected"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AffiliateConversion = typeof affiliateConversions.$inferSelect;
export type InsertAffiliateConversion = typeof affiliateConversions.$inferInsert;

// ===== EMAIL QUEUE =====
export const emailQueue = mysqlTable("email_queue", {
  id: int("id").autoincrement().primaryKey(),
  to: varchar("to", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  template: varchar("template", { length: 128 }).notNull(),
  payload: json("payload").$type<Record<string, unknown>>().default({}),
  status: mysqlEnum("status", ["queued", "sent", "failed", "skipped"]).default("queued").notNull(),
  attempts: int("attempts").default(0).notNull(),
  lastError: text("lastError"),
  scheduledAt: timestamp("scheduledAt").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailQueueItem = typeof emailQueue.$inferSelect;
export type InsertEmailQueueItem = typeof emailQueue.$inferInsert;

// ===== IN-APP NOTIFICATIONS =====
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  link: varchar("link", { length: 512 }),
  isRead: boolean("isRead").default(false).notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ===== IP BLOCKLIST =====
export const ipBlocklist = mysqlTable("ip_blocklist", {
  id: int("id").autoincrement().primaryKey(),
  ip: varchar("ip", { length: 64 }).notNull().unique(),
  reason: text("reason"),
  blockedBy: int("blockedBy"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IpBlock = typeof ipBlocklist.$inferSelect;
export type InsertIpBlock = typeof ipBlocklist.$inferInsert;

// ===== AUDIT LOGS (Enterprise-grade, immutable) =====
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  orgId: int("orgId"),
  action: varchar("action", { length: 255 }).notNull(),
  resource: varchar("resource", { length: 128 }).notNull(),
  resourceId: varchar("resourceId", { length: 128 }),
  before: json("before").$type<Record<string, unknown>>(),
  after: json("after").$type<Record<string, unknown>>(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  severity: mysqlEnum("severity", ["info", "warn", "critical"]).default("info").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
