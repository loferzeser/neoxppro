import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { coupons, couponUsages } from "../drizzle/schema";
import { getDb } from "./db";

export interface CouponValidation {
  valid: boolean;
  reason?: string;
  coupon?: typeof coupons.$inferSelect;
  discountAmount?: number;
}

export async function validateCoupon(
  code: string,
  userId: number,
  orderAmount: number
): Promise<CouponValidation> {
  const db = await getDb();
  if (!db) return { valid: false, reason: "Database unavailable" };

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.toUpperCase().trim()))
    .limit(1);

  if (!coupon) return { valid: false, reason: "ไม่พบโค้ดส่วนลดนี้" };
  if (!coupon.isActive) return { valid: false, reason: "โค้ดนี้ถูกปิดใช้งานแล้ว" };

  const now = new Date();
  if (coupon.startsAt && new Date(coupon.startsAt) > now)
    return { valid: false, reason: "โค้ดนี้ยังไม่เริ่มใช้งาน" };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now)
    return { valid: false, reason: "โค้ดนี้หมดอายุแล้ว" };
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit)
    return { valid: false, reason: "โค้ดนี้ถูกใช้ครบจำนวนแล้ว" };
  if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount))
    return { valid: false, reason: `ยอดสั่งซื้อขั้นต่ำ ฿${coupon.minOrderAmount}` };

  // Per-user limit check
  const [usageRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(couponUsages)
    .where(and(eq(couponUsages.couponId, coupon.id), eq(couponUsages.userId, userId)));
  const userUsage = Number(usageRow?.count ?? 0);
  if (userUsage >= coupon.perUserLimit)
    return { valid: false, reason: "คุณใช้โค้ดนี้ครบจำนวนแล้ว" };

  // Calculate discount
  let discountAmount =
    coupon.discountType === "percent"
      ? (orderAmount * Number(coupon.discountValue)) / 100
      : Number(coupon.discountValue);

  if (coupon.maxDiscountAmount) {
    discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
  }
  discountAmount = Math.min(discountAmount, orderAmount);

  return { valid: true, coupon, discountAmount };
}

export async function applyCoupon(
  couponId: number,
  userId: number,
  orderId: number,
  discountAmount: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(couponUsages).values({ couponId, userId, orderId, discountAmount: discountAmount.toFixed(2) });
  await db.update(coupons).set({ usageCount: sql`usageCount + 1` }).where(eq(coupons.id, couponId));
}

export async function listCoupons() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coupons).orderBy(coupons.createdAt);
}

export async function createCoupon(data: typeof coupons.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(coupons).values({ ...data, code: data.code.toUpperCase().trim() });
}

export async function toggleCoupon(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(coupons).set({ isActive }).where(eq(coupons.id, id));
}
