import { getDb } from "./db";
import { auditLogs } from "../drizzle/schema";
import type { Request } from "express";

export type AuditSeverity = "info" | "warn" | "critical";

export interface AuditEntry {
  userId?: number | null;
  orgId?: number | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  severity?: AuditSeverity;
  req?: Request;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId ?? null,
      orgId: entry.orgId ?? null,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
      ipAddress: entry.req ? getClientIp(entry.req) : null,
      userAgent: entry.req?.headers["user-agent"] ?? null,
      severity: entry.severity ?? "info",
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write:", err);
  }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}
