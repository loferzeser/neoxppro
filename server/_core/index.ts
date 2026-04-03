import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerGoogleOAuthRoutes } from "./googleOAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { constructWebhookEvent } from "../stripe";
import { updateOrderStatus, clearCart, getOrderByNumber, upsertWebhookEvent } from "../db";
import { notifyOwner } from "./notification";
import { buildAiMessages } from "../aiChatCore";
import { streamAssistantChunks } from "./llm";
import { createRateLimiter } from "./rateLimit";
import { ipBlocklistMiddleware } from "../ipBlocklist";
import { processEmailQueue } from "../emailService";

const trpcRateLimit = createRateLimiter({ windowMs: 60_000, max: 200 });
const aiStreamRateLimit = createRateLimiter({ windowMs: 60_000, max: 40 });

function getAllowedOrigins() {
  const raw = process.env.CORS_ALLOWED_ORIGINS ?? "";
  return raw
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin: string | undefined, allowlist: string[]) {
  if (!origin) return true;
  return allowlist.includes(origin);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.set("trust proxy", process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) || 1 : 1);
  const corsAllowlist = getAllowedOrigins();

  // ===== STRIPE WEBHOOK (must be before express.json) =====
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    let event: import("stripe").Stripe.Event;

    try {
      event = constructWebhookEvent(req.body as Buffer, sig);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await upsertWebhookEvent({
        provider: "stripe",
        eventId: "signature_verification_failed",
        payloadHash: null,
        status: "failed",
        retryCount: 0,
        lastError: message,
      });
      console.error("[Stripe Webhook] Signature verification failed:", message);
      res.status(400).send(`Webhook Error: ${message}`);
      return;
    }

    // Handle test events
    if (event.id.startsWith("evt_test_")) {
      console.log("[Webhook] Test event detected, returning verification response");
      res.json({ verified: true });
      return;
    }

    console.log(`[Stripe Webhook] Event: ${event.type} (${event.id})`);
    await upsertWebhookEvent({
      provider: "stripe",
      eventId: event.id,
      payloadHash: event.type,
      status: "received",
      retryCount: 0,
      lastError: null,
    });

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as import("stripe").Stripe.Checkout.Session;
        const orderNumber = session.metadata?.order_number;

        if (orderNumber) {
          const order = await getOrderByNumber(orderNumber);
          if (order && order.status === "pending") {
            const pref = session.metadata?.payment_preference;
            const paymentMethod =
              pref === "promptpay" ? "promptpay" : ("card" as const);
            await updateOrderStatus(order.id, "paid", {
              stripeSessionId: session.id,
              stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
              paidAt: new Date(),
              paymentMethod,
            });
            // Clear cart for the user
            if (order.userId) {
              await clearCart(order.userId);
            }
            // Notify admin / confirmation
            await notifyOwner({
              title: `Payment confirmed: ${orderNumber}`,
              content: `Order ${orderNumber} is paid via Stripe. Total: ฿${order.totalAmount}. Customer: ${order.customerName ?? session.customer_email ?? "N/A"}`,
            });
            console.log(`[Stripe Webhook] Order ${orderNumber} marked as paid`);
            await upsertWebhookEvent({
              provider: "stripe",
              eventId: event.id,
              payloadHash: event.type,
              status: "processed",
              retryCount: 0,
              lastError: null,
            });
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await upsertWebhookEvent({
        provider: "stripe",
        eventId: event.id,
        payloadHash: event.type,
        status: "failed",
        retryCount: 0,
        lastError: message,
      });
      console.error("[Stripe Webhook] Processing error:", err);
    }

    res.json({ received: true });
  });

  // Configure body parser with larger size limit for file uploads
  app.use(ipBlocklistMiddleware());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && isAllowedOrigin(origin, corsAllowlist)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    }
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  app.use((req, res, next) => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      return next();
    }
    const origin = req.headers.origin;
    if (!isAllowedOrigin(origin, corsAllowlist)) {
      res.status(403).json({ error: "Origin not allowed" });
      return;
    }
    next();
  });

  app.get("/api/healthz", (_req, res) => {
    res.json({ ok: true, uptime: process.uptime() });
  });

  // AI chat SSE (streaming; complements tRPC aiChat.sendMessage)
  app.post("/api/ai/chat-stream", aiStreamRateLimit, async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    try {
      const body = req.body as {
        messages?: Array<{ role: "user" | "assistant"; content: string }>;
        productContext?: Record<string, unknown> | null;
      };
      if (!body?.messages?.length) {
        res.status(400).json({ error: "messages required" });
        return;
      }
      const msgs = buildAiMessages({
        userMessages: body.messages,
        productContext: body.productContext ?? undefined,
      });
      for await (const chunk of streamAssistantChunks({ messages: msgs })) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  });
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Google OAuth
  registerGoogleOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    trpcRateLimit,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number.parseInt(process.env.PORT ?? "3000", 10);

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    // Email queue processor — runs every 60s
    setInterval(() => {
      processEmailQueue(20).catch((e) => console.error("[EmailQueue]", e));
    }, 60_000);
  });
}

startServer().catch(console.error);
