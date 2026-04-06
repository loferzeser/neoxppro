/**
 * n8n Integration Service
 *
 * Sends outgoing webhooks to n8n when events happen in the shop.
 * Set N8N_WEBHOOK_URL in Railway env to enable.
 *
 * Events:
 *   order.paid       — customer paid
 *   order.created    — new pending order
 *   user.registered  — new user signed up
 *   product.created  — new product added
 */

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? "";
const N8N_SECRET = process.env.N8N_SECRET ?? "";

export type N8nEvent =
  | "order.paid"
  | "order.created"
  | "user.registered"
  | "product.created"
  | "product.updated"
  | "coupon.created";

export async function triggerN8n(event: N8nEvent, data: Record<string, unknown>) {
  if (!N8N_WEBHOOK_URL) return; // silently skip if not configured

  try {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (N8N_SECRET) {
      headers["X-N8N-Secret"] = N8N_SECRET;
    }

    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000), // 5s timeout, don't block main flow
    });

    if (!res.ok) {
      console.warn(`[n8n] Webhook failed: ${res.status} ${res.statusText}`);
    } else {
      console.log(`[n8n] Event sent: ${event}`);
    }
  } catch (err) {
    // Never crash the main flow because of n8n
    console.warn("[n8n] Webhook error (non-fatal):", err instanceof Error ? err.message : err);
  }
}
