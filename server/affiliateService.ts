import { eq, sql } from "drizzle-orm";
import { affiliates, affiliateConversions } from "../drizzle/schema";
import { getDb } from "./db";
import { nanoid } from "nanoid";

export async function getAffiliateByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(affiliates).where(eq(affiliates.code, code)).limit(1);
  return row ?? null;
}

export async function getAffiliateByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(affiliates).where(eq(affiliates.userId, userId)).limit(1);
  return row ?? null;
}

export async function applyForAffiliate(userId: number): Promise<{ code: string }> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await getAffiliateByUserId(userId);
  if (existing) return { code: existing.code };
  const code = nanoid(8).toUpperCase();
  await db.insert(affiliates).values({ userId, code, status: "pending" });
  return { code };
}

export async function recordConversion(params: {
  affiliateCode: string;
  referredUserId?: number;
  orderId: number;
  orderAmount: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const affiliate = await getAffiliateByCode(params.affiliateCode);
  if (!affiliate || affiliate.status !== "active") return;

  const commission = (params.orderAmount * Number(affiliate.commissionRate)) / 100;
  await db.insert(affiliateConversions).values({
    affiliateId: affiliate.id,
    referredUserId: params.referredUserId ?? null,
    orderId: params.orderId,
    commissionAmount: commission.toFixed(2),
    status: "pending",
  });
  await db
    .update(affiliates)
    .set({ totalEarned: sql`totalEarned + ${commission.toFixed(2)}` })
    .where(eq(affiliates.id, affiliate.id));
}

export async function listAffiliates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(affiliates).orderBy(affiliates.createdAt);
}

export async function approveAffiliate(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(affiliates).set({ status: "active" }).where(eq(affiliates.userId, userId));
}

export async function getAffiliateStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const affiliate = await getAffiliateByUserId(userId);
  if (!affiliate) return null;
  const conversions = await db
    .select()
    .from(affiliateConversions)
    .where(eq(affiliateConversions.affiliateId, affiliate.id));
  return {
    ...affiliate,
    conversions,
    pendingEarnings: conversions
      .filter((c) => c.status === "pending")
      .reduce((s, c) => s + Number(c.commissionAmount), 0),
  };
}
