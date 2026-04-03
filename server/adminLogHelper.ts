import type { TrpcContext } from "./_core/context";
import { insertAdminLog } from "./db";

export async function logAdminAction(
  ctx: TrpcContext,
  action: string,
  details?: Record<string, unknown>
) {
  if (!ctx.user) return;
  const ip =
    (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    ctx.req.socket?.remoteAddress ||
    undefined;
  try {
    await insertAdminLog({
      userId: ctx.user.id,
      action,
      details: details ?? {},
      ipAddress: ip,
    });
  } catch (e) {
    console.warn("[adminLog]", action, e);
  }
}
