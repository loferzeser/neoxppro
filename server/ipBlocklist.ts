import type { Request, Response, NextFunction } from "express";
import { eq, or, isNull, gt } from "drizzle-orm";
import { ipBlocklist } from "../drizzle/schema";
import { getDb } from "./db";

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

export async function isIpBlocked(ip: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const now = new Date();
  const [row] = await db
    .select({ id: ipBlocklist.id })
    .from(ipBlocklist)
    .where(
      eq(ipBlocklist.ip, ip)
    )
    .limit(1);
  if (!row) return false;
  // Check expiry
  const [full] = await db.select().from(ipBlocklist).where(eq(ipBlocklist.ip, ip)).limit(1);
  if (full?.expiresAt && new Date(full.expiresAt) < now) return false;
  return true;
}

export function ipBlocklistMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    const blocked = await isIpBlocked(ip).catch(() => false);
    if (blocked) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    next();
  };
}

export async function blockIp(ip: string, reason: string, blockedBy?: number, expiresAt?: Date) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(ipBlocklist)
    .values({ ip, reason, blockedBy: blockedBy ?? null, expiresAt: expiresAt ?? null })
    .onDuplicateKeyUpdate({ set: { reason, blockedBy: blockedBy ?? null, expiresAt: expiresAt ?? null } });
}

export async function unblockIp(ip: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(ipBlocklist).where(eq(ipBlocklist.ip, ip));
}

export async function listBlockedIps() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ipBlocklist).orderBy(ipBlocklist.createdAt);
}
