import { and, desc, eq, inArray, like, lt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  adminLogs,
  apiConfigs,
  cartItems,
  featureFlags,
  integrationHealthChecks,
  orderItems,
  orders,
  productAssets,
  productLicenses,
  products,
  reviews,
  systemConfig,
  users,
  webhookEvents,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && !process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required in production");
  }
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

// ===== USER HELPERS =====
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    for (const field of textFields) {
      const value = user[field];
      if (value === undefined) continue;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "super_admin";
      updateSet.role = "super_admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== PRODUCT HELPERS =====
export async function getProducts(filters?: {
  category?: string;
  platform?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.isActive !== undefined) conditions.push(eq(products.isActive, filters.isActive));
  if (filters?.isFeatured !== undefined) conditions.push(eq(products.isFeatured, filters.isFeatured));
  if (filters?.category) conditions.push(eq(products.category, filters.category as any));
  if (filters?.platform) conditions.push(eq(products.platform, filters.platform as any));
  if (filters?.search) {
    conditions.push(
      or(
        like(products.name, `%${filters.search}%`),
        like(products.shortDesc, `%${filters.search}%`)
      )
    );
  }
  const query = db.select().from(products);
  if (conditions.length > 0) query.where(and(...conditions));
  query.orderBy(desc(products.createdAt));
  if (filters?.limit) query.limit(filters.limit);
  if (filters?.offset) query.offset(filters.offset);
  return query;
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(data: typeof products.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(products).values(data);
  return result;
}

export async function updateProduct(id: number, data: Partial<typeof products.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(products).set({ isActive: false }).where(eq(products.id, id));
}

// ===== CART HELPERS =====
export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const items = await db
    .select({
      id: cartItems.id,
      userId: cartItems.userId,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      createdAt: cartItems.createdAt,
      product: products,
    })
    .from(cartItems)
    .leftJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId));
  return items;
}

export async function addToCart(userId: number, productId: number, quantity = 1) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(cartItems)
      .set({ quantity: existing[0].quantity + quantity })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ userId, productId, quantity });
  }
}

export async function updateCartItem(id: number, userId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (quantity <= 0) {
    return db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
  }
  return db.update(cartItems).set({ quantity }).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
}

export async function removeFromCart(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ===== ORDER HELPERS =====
export async function createOrder(data: typeof orders.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(orders).values(data);
}

export async function createOrderItems(items: typeof orderItems.$inferInsert[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(orderItems).values(items);
}

export async function getOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderByStripeSession(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.stripeSessionId, sessionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function updateOrderStatus(id: number, status: string, extra?: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(orders).set({ status: status as any, ...extra }).where(eq(orders.id, id));
}

export async function getAllOrders(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
}

// ===== DOWNLOAD HELPERS =====
export async function getOrderItemByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      item: orderItems,
      product: products,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.downloadToken, token))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function incrementDownloadCount(itemId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(orderItems)
    .set({ downloadCount: sql`${orderItems.downloadCount} + 1` })
    .where(eq(orderItems.id, itemId));
}

export async function getUserPurchasedProducts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const userOrders = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber })
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        inArray(orders.status, ["paid", "completed"])
      )
    );
  if (userOrders.length === 0) return [];
  const orderMap = new Map(userOrders.map((o) => [o.id, o.orderNumber]));
  const orderIds = userOrders.map((o) => o.id);
  const items = await db
    .select({
      item: orderItems,
      product: products,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(
      or(...orderIds.map((id) => eq(orderItems.orderId, id)))
    );
  return items.map((row) => ({
    ...row,
    order: { orderNumber: orderMap.get(row.item.orderId) ?? "" },
  }));
}

// ===== REVIEW HELPERS =====
export async function getProductReviews(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      review: reviews,
      user: { name: users.name },
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));
}

export async function createReview(data: typeof reviews.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(reviews).values(data);
}

// ===== STATS HELPERS =====
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalOrders: 0, totalRevenue: 0, totalUsers: 0, totalProducts: 0 };
  const [orderStats] = await db
    .select({
      count: sql<number>`count(*)`,
      revenue: sql<number>`COALESCE(sum(totalAmount), 0)`,
    })
    .from(orders)
    .where(inArray(orders.status, ["paid", "completed"]));
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isActive, true));
  return {
    totalOrders: Number(orderStats?.count ?? 0),
    totalRevenue: Number(orderStats?.revenue ?? 0),
    totalUsers: Number(userCount?.count ?? 0),
    totalProducts: Number(productCount?.count ?? 0),
  };
}

// ===== ADMIN LOGS =====
export async function insertAdminLog(data: typeof adminLogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(adminLogs).values(data);
}

export async function getAdminLogs(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      log: adminLogs,
      userName: users.name,
    })
    .from(adminLogs)
    .leftJoin(users, eq(adminLogs.userId, users.id))
    .orderBy(desc(adminLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

// ===== API CONFIG =====
export async function listApiConfigs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apiConfigs).orderBy(apiConfigs.service);
}

export async function upsertApiConfigRow(
  row: Omit<typeof apiConfigs.$inferInsert, "id"> & { id?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const { id, ...rest } = row;
  const existing = await db
    .select()
    .from(apiConfigs)
    .where(eq(apiConfigs.keyName, rest.keyName))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(apiConfigs)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(apiConfigs.keyName, rest.keyName));
    return existing[0].id;
  }
  const ins = await db.insert(apiConfigs).values(rest as typeof apiConfigs.$inferInsert);
  return Number((ins as unknown as { insertId: number }).insertId ?? 0);
}

export async function getApiConfigByKeyName(keyName: string) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(apiConfigs).where(eq(apiConfigs.keyName, keyName)).limit(1);
  return r[0];
}

// ===== FEATURE FLAGS =====
export async function listFeatureFlags() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(featureFlags).orderBy(featureFlags.name);
}

export async function upsertFeatureFlagRow(
  row: Omit<typeof featureFlags.$inferInsert, "id"> & { id?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.name, row.name))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(featureFlags)
      .set({
        value: row.value,
        description: row.description ?? existing[0].description,
        updatedBy: row.updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(featureFlags.name, row.name));
    return existing[0].id;
  }
  const ins = await db.insert(featureFlags).values(row as typeof featureFlags.$inferInsert);
  return Number((ins as unknown as { insertId: number }).insertId ?? 0);
}

// ===== SYSTEM CONFIG =====
export async function listSystemConfigRows() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(systemConfig).orderBy(systemConfig.category, systemConfig.key);
}

export async function upsertSystemConfigRow(
  row: Omit<typeof systemConfig.$inferInsert, "id"> & { id?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db
    .select()
    .from(systemConfig)
    .where(eq(systemConfig.key, row.key))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(systemConfig)
      .set({
        value: row.value,
        category: row.category,
        description: row.description ?? existing[0].description,
        updatedBy: row.updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(systemConfig.key, row.key));
    return existing[0].id;
  }
  const ins = await db.insert(systemConfig).values(row as typeof systemConfig.$inferInsert);
  return Number((ins as unknown as { insertId: number }).insertId ?? 0);
}

// ===== DEV CONSOLE STATS =====
export async function getUsersCountByRole() {
  const db = await getDb();
  if (!db) return [] as { role: string; count: number }[];
  const rows = await db
    .select({
      role: users.role,
      count: sql<number>`count(*)`,
    })
    .from(users)
    .groupBy(users.role);
  return rows.map((r) => ({ role: String(r.role), count: Number(r.count) }));
}

export async function getProductCountsActive() {
  const db = await getDb();
  if (!db) return { active: 0, inactive: 0 };
  const [a] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.isActive, true));
  const [i] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.isActive, false));
  return { active: Number(a?.count ?? 0), inactive: Number(i?.count ?? 0) };
}

export async function getOrderCountsByStatus() {
  const db = await getDb();
  if (!db) return [] as { status: string; count: number }[];
  const rows = await db
    .select({
      status: orders.status,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .groupBy(orders.status);
  return rows.map((r) => ({ status: String(r.status), count: Number(r.count) }));
}

export async function getTotalRevenuePaid() {
  const db = await getDb();
  if (!db) return 0;
  const [r] = await db
    .select({ revenue: sql<number>`COALESCE(sum(totalAmount), 0)` })
    .from(orders)
    .where(eq(orders.status, "paid"));
  return Number(r?.revenue ?? 0);
}

export async function getTableRowCounts() {
  const db = await getDb();
  if (!db) return {} as Record<string, number>;
  const tables = [
    ["users", users],
    ["products", products],
    ["orders", orders],
    ["order_items", orderItems],
    ["cart_items", cartItems],
    ["reviews", reviews],
    ["api_configs", apiConfigs],
    ["feature_flags", featureFlags],
    ["system_config", systemConfig],
    ["admin_logs", adminLogs],
  ] as const;
  const out: Record<string, number> = {};
  for (const [name, table] of tables) {
    const [row] = await db.select({ c: sql<number>`count(*)` }).from(table);
    out[name] = Number(row?.c ?? 0);
  }
  return out;
}

export async function deleteStalePendingOrdersOlderThan(hours: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const pending = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.status, "pending"), lt(orders.createdAt, cutoff)));
  const ids = pending.map((p) => p.id);
  if (ids.length === 0) return { deleted: 0 };
  await db.delete(orderItems).where(inArray(orderItems.orderId, ids));
  await db.delete(orders).where(inArray(orders.id, ids));
  return { deleted: ids.length };
}

export async function updateUserRole(userId: number, role: (typeof users.$inferSelect)["role"]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ===== CONTROL PLANE: ASSETS =====
export async function getProductAssets(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(productAssets)
    .where(eq(productAssets.productId, productId))
    .orderBy(desc(productAssets.createdAt));
}

export async function addProductAsset(data: typeof productAssets.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(productAssets).values(data);
}

export async function setProductAssetActive(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(productAssets).set({ isActive }).where(eq(productAssets.id, id));
}

// ===== CONTROL PLANE: WEBHOOK OPS =====
export async function listWebhookEvents(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhookEvents).orderBy(desc(webhookEvents.createdAt)).limit(limit).offset(offset);
}

export async function upsertWebhookEvent(
  row: Omit<typeof webhookEvents.$inferInsert, "id"> & { id?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db
    .select()
    .from(webhookEvents)
    .where(and(eq(webhookEvents.provider, row.provider), eq(webhookEvents.eventId, row.eventId)))
    .limit(1);
  if (existing.length > 0) {
    return db.update(webhookEvents).set({ ...row, updatedAt: new Date() }).where(eq(webhookEvents.id, existing[0].id));
  }
  return db.insert(webhookEvents).values(row as typeof webhookEvents.$inferInsert);
}

export async function retryWebhookEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const rows = await db.select().from(webhookEvents).where(eq(webhookEvents.id, id)).limit(1);
  const row = rows[0];
  if (!row) return null;
  await db
    .update(webhookEvents)
    .set({ status: "retried", retryCount: (row.retryCount ?? 0) + 1, updatedAt: new Date() })
    .where(eq(webhookEvents.id, id));
  return { success: true as const };
}

// ===== CONTROL PLANE: INTEGRATION HEALTH =====
export async function listIntegrationHealthChecks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(integrationHealthChecks).orderBy(integrationHealthChecks.service);
}

export async function upsertIntegrationHealthCheck(
  row: Omit<typeof integrationHealthChecks.$inferInsert, "id"> & { id?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db
    .select()
    .from(integrationHealthChecks)
    .where(eq(integrationHealthChecks.service, row.service))
    .limit(1);
  if (existing.length > 0) {
    return db
      .update(integrationHealthChecks)
      .set({ ...row, updatedAt: new Date() })
      .where(eq(integrationHealthChecks.service, row.service));
  }
  return db.insert(integrationHealthChecks).values(row as typeof integrationHealthChecks.$inferInsert);
}

export async function listProductLicenses(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productLicenses).orderBy(desc(productLicenses.createdAt)).limit(limit).offset(offset);
}
