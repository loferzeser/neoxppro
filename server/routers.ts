import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { couponRouter, affiliateRouter, notificationsRouter, orgRouter, securityRouter } from "./enterpriseRouters";
import {
  dashboardProcedure,
  productAdminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
  systemSettingsProcedure,
  userAdminProcedure,
} from "./_core/trpc";
import { createCheckoutSession } from "./stripe";
import {
  addToCart,
  clearCart,
  createOrder,
  createOrderItems,
  createProduct,
  createReview,
  deleteProduct,
  getAllOrders,
  getAllUsers,
  getCartItems,
  getDashboardStats,
  getOrderByNumber,
  getOrderItems,
  getOrdersByUser,
  getProductById,
  getProductBySlug,
  getProductReviews,
  getProducts,
  listSystemConfigRows,
  getUserPurchasedProducts,
  incrementDownloadCount,
  removeFromCart,
  updateCartItem,
  updateOrderStatus,
  updateProduct,
  updateUserRole,
  upsertSystemConfigRow,
  upsertUser,
  getUserByEmail,
  getProductAssets,
  addProductAsset,
  setProductAssetActive,
  listWebhookEvents,
  retryWebhookEvent,
  listIntegrationHealthChecks,
  upsertIntegrationHealthCheck,
  listProductLicenses,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { nanoid } from "nanoid";
import { buildAiMessages } from "./aiChatCore";
import { invokeLLM, extractAssistantText } from "./_core/llm";
import { logAdminAction } from "./adminLogHelper";
import { hashPassword, verifyPassword } from "./_core/password";
import { sdk } from "./_core/sdk";

const productCategorySchema = z.enum([
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
]);

const saleTypeSchema = z.enum(["buy_once", "rent", "both"]);
const operationsProcedure = dashboardProcedure;
const securityProcedure = systemSettingsProcedure;

function getEffectiveProductPrice(product: {
  price: string;
  salePrice?: string | null;
  saleType?: string | null;
  rentalPrice?: string | null;
  rentalDurationDays?: number | null;
}) {
  if (product.saleType === "rent" && product.rentalPrice) {
    return Number(product.rentalPrice);
  }
  return Number(product.salePrice ?? product.price);
}

function isRentalPurchase(params: {
  saleType?: string | null;
  selectedPlan?: "buy" | "rent" | null;
}) {
  if (params.saleType === "rent") return true;
  if (params.saleType === "both" && params.selectedPlan === "rent") return true;
  return false;
}

function getEffectivePriceWithPlan(product: {
  price: string;
  salePrice?: string | null;
  saleType?: string | null;
  rentalPrice?: string | null;
}, plan?: "buy" | "rent") {
  if (product.saleType === "both" && plan === "rent") {
    if (!product.rentalPrice) return null;
    return Number(product.rentalPrice);
  }
  return getEffectiveProductPrice(product);
}

function generateOrderNumber() {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `NX-${ymd}-${rand}`;
}

function assertProductCommercialRules(input: {
  saleType: "buy_once" | "rent" | "both";
  rentalPrice?: string | null;
  rentalDurationDays?: number | null;
  price?: string;
}) {
  if (input.saleType !== "buy_once") {
    if (!input.rentalPrice || Number(input.rentalPrice) <= 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Rental price is required for rental plans" });
    }
    if (!input.rentalDurationDays || input.rentalDurationDays < 1) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Rental duration is required for rental plans" });
    }
  }
  if (input.price && Number(input.price) <= 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Price must be greater than zero" });
  }
}

export const appRouter = router({
  system: systemRouter,
  coupons: couponRouter,
  affiliates: affiliateRouter,
  notifications: notificationsRouter,
  org: orgRouter,
  security: securityRouter,

  // ===== AUTH =====
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    registerWithPassword: publicProcedure
      .input(
        z.object({
          name: z.string().min(2).max(120),
          email: z.string().email(),
          password: z.string().min(8).max(128),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const email = input.email.trim().toLowerCase();
        const exists = await getUserByEmail(email);
        if (exists) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
        }
        const openId = `local:${email}`;
        const passwordHash = await hashPassword(input.password);
        await upsertUser({
          openId,
          name: input.name.trim(),
          email,
          passwordHash,
          loginMethod: "password",
          lastSignedIn: new Date(),
        } as any);
        const token = await sdk.createSessionToken(openId, { name: input.name.trim(), expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true as const, token };
      }),
    loginWithPassword: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(8).max(128),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const email = input.email.trim().toLowerCase();
        const user = await getUserByEmail(email);
        if (!user?.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        const ok = await verifyPassword(input.password, user.passwordHash);
        if (!ok) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        await upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });
        const token = await sdk.createSessionToken(user.openId, {
          name: user.name ?? email,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true as const, token };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== PRODUCTS =====
  products: router({
    list: publicProcedure
      .input(
        z.object({
          category: z.string().optional(),
          platform: z.string().optional(),
          search: z.string().optional(),
          featured: z.boolean().optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        }).optional()
      )
      .query(async ({ input }) => {
        const items = await getProducts({
          category: input?.category,
          platform: input?.platform,
          search: input?.search,
          isFeatured: input?.featured,
          isActive: true,
          limit: input?.limit ?? 20,
          offset: input?.offset ?? 0,
        });
        return items;
      }),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const product = await getProductBySlug(input.slug);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        return product;
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const product = await getProductById(input.id);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        return product;
      }),

    reviews: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return getProductReviews(input.productId);
      }),

    addReview: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          rating: z.number().min(1).max(5),
          title: z.string().optional(),
          content: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await createReview({
          productId: input.productId,
          userId: ctx.user.id,
          rating: input.rating,
          title: input.title,
          content: input.content,
        });
        return { success: true };
      }),

    adminList: productAdminProcedure
      .input(z.object({ limit: z.number().min(1).max(500).default(200), offset: z.number().min(0).default(0) }).optional())
      .query(async ({ input }) => {
        return getProducts({
          limit: input?.limit ?? 200,
          offset: input?.offset ?? 0,
        });
      }),

    // Admin only
    create: productAdminProcedure
      .input(
        z.object({
          slug: z.string(),
          name: z.string(),
          shortDesc: z.string().optional(),
          description: z.string().optional(),
          price: z.string(),
          salePrice: z.string().optional(),
          category: productCategorySchema,
          platform: z.enum(["MT4", "MT5", "both"]),
          saleType: saleTypeSchema.default("buy_once"),
          rentalPrice: z.string().optional(),
          rentalDurationDays: z.number().int().min(1).max(3650).optional(),
          imageUrl: z.string().optional(),
          fileKey: z.string().optional(),
          fileUrl: z.string().optional(),
          winRate: z.string().optional(),
          monthlyReturn: z.string().optional(),
          maxDrawdown: z.string().optional(),
          profitFactor: z.string().optional(),
          totalTrades: z.number().optional(),
          isActive: z.boolean().default(true),
          isFeatured: z.boolean().default(false),
          isNew: z.boolean().default(true),
          tags: z.array(z.string()).default([]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        assertProductCommercialRules(input as any);
        await createProduct(input as any);
        await logAdminAction(ctx, "product.create", { slug: input.slug, name: input.name });
        return { success: true };
      }),

    update: productAdminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          shortDesc: z.string().optional(),
          description: z.string().optional(),
          price: z.string().optional(),
          salePrice: z.string().optional().nullable(),
          category: productCategorySchema.optional(),
          platform: z.enum(["MT4", "MT5", "both"]).optional(),
          saleType: saleTypeSchema.optional(),
          rentalPrice: z.string().optional().nullable(),
          rentalDurationDays: z.number().int().min(1).max(3650).optional().nullable(),
          imageUrl: z.string().optional(),
          fileKey: z.string().optional(),
          fileUrl: z.string().optional(),
          winRate: z.string().optional().nullable(),
          monthlyReturn: z.string().optional().nullable(),
          maxDrawdown: z.string().optional().nullable(),
          profitFactor: z.string().optional().nullable(),
          totalTrades: z.number().optional().nullable(),
          isActive: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
          isNew: z.boolean().optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        if (data.saleType) {
          assertProductCommercialRules({
            saleType: data.saleType,
            rentalPrice: data.rentalPrice ?? null,
            rentalDurationDays: data.rentalDurationDays ?? null,
            price: data.price,
          });
        }
        await updateProduct(id, data as any);
        await logAdminAction(ctx, "product.update", { productId: id });
        return { success: true };
      }),

    delete: productAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteProduct(input.id);
        await logAdminAction(ctx, "product.soft_delete", { productId: input.id });
        return { success: true };
      }),
  }),

  // ===== CART =====
  cart: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getCartItems(ctx.user.id);
    }),

    add: protectedProcedure
      .input(z.object({ productId: z.number(), quantity: z.number().min(1).default(1) }))
      .mutation(async ({ ctx, input }) => {
        // EA bots are digital goods - quantity is always 1
        await addToCart(ctx.user.id, input.productId, 1);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), quantity: z.number().min(0) }))
      .mutation(async ({ ctx, input }) => {
        await updateCartItem(input.id, ctx.user.id, input.quantity);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await removeFromCart(input.id, ctx.user.id);
        return { success: true };
      }),

    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  // ===== ORDERS =====
  orders: router({
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      return getOrdersByUser(ctx.user.id);
    }),

    myPurchases: protectedProcedure.query(async ({ ctx }) => {
      return getUserPurchasedProducts(ctx.user.id);
    }),

    byNumber: protectedProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ ctx, input }) => {
        const order = await getOrderByNumber(input.orderNumber);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        const staff = ["service", "admin", "super_admin", "developer"] as const;
        if (order.userId !== ctx.user.id && !staff.includes(ctx.user.role as (typeof staff)[number])) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const items = await getOrderItems(order.id);
        return { order, items };
      }),

    // Create a pending order (before Stripe payment)
    createPending: protectedProcedure
      .input(
        z.object({
          items: z.array(
            z.object({
              productId: z.number(),
              quantity: z.number(),
              plan: z.enum(["buy", "rent"]).optional(),
            })
          ),
          customerEmail: z.string().optional(),
          customerName: z.string().optional(),
          paymentMethod: z.enum(["card", "promptpay", "bank_transfer", "crypto"]).default("card"),
          couponCode: z.string().optional(),
          affiliateCode: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Fetch product details
        const productDetails = await Promise.all(
          input.items.map(async (item) => {
            const product = await getProductById(item.productId);
            if (!product) throw new TRPCError({ code: "NOT_FOUND", message: `Product ${item.productId} not found` });
            return { product, quantity: item.quantity, plan: item.plan };
          })
        );

        const totalAmount = productDetails.reduce((sum, { product, quantity, plan }) => {
          const p = product as {
            price: string;
            salePrice?: string | null;
            saleType?: string | null;
            rentalPrice?: string | null;
          };
          const price = getEffectivePriceWithPlan(p, plan);
          if (price === null) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Rental plan is not available for this product" });
          }
          return sum + price * quantity;
        }, 0);

        // ===== COUPON =====
        let discountAmount = 0;
        let couponId: number | undefined;
        if (input.couponCode) {
          const { validateCoupon } = await import("./couponService");
          const couponResult = await validateCoupon(input.couponCode, ctx.user.id, totalAmount);
          if (couponResult.valid && couponResult.coupon) {
            discountAmount = couponResult.discountAmount ?? 0;
            couponId = couponResult.coupon.id;
          }
        }
        const finalAmount = Math.max(0, totalAmount - discountAmount);

        const orderNumber = generateOrderNumber();
        const notesParts: string[] = [];
        if (input.paymentMethod === "crypto") {
          notesParts.push("Payment: cryptocurrency — pending manual verification.");
        } else if (input.paymentMethod === "bank_transfer") {
          notesParts.push("Payment: bank transfer — complete transfer using instructions after order.");
        }
        await createOrder({
          orderNumber,
          userId: ctx.user.id,
          status: "pending",
          totalAmount: finalAmount.toFixed(2),
          customerEmail: input.customerEmail ?? ctx.user.email ?? undefined,
          customerName: input.customerName ?? ctx.user.name ?? undefined,
          paymentMethod: input.paymentMethod,
          notes: notesParts.length ? notesParts.join(" ") : undefined,
          couponId: couponId ?? null,
          discountAmount: discountAmount.toFixed(2),
          affiliateCode: input.affiliateCode ?? null,
        } as any);

        const order = await getOrderByNumber(orderNumber);
        if (!order) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Apply coupon usage record
        if (couponId && discountAmount > 0) {
          const { applyCoupon } = await import("./couponService");
          await applyCoupon(couponId, ctx.user.id, order.id, discountAmount);
        }

        await createOrderItems(
          productDetails.map(({ product, quantity, plan }) => {
            const p = product as unknown as {
              id: number;
              name: string;
              price: string;
              salePrice?: string | null;
              saleType?: string | null;
              rentalPrice?: string | null;
              rentalDurationDays?: number | null;
            };
            const isRental = isRentalPurchase({ saleType: p.saleType, selectedPlan: plan ?? null });
            const effectivePrice = getEffectivePriceWithPlan(
              { price: p.price, salePrice: p.salePrice, saleType: p.saleType, rentalPrice: p.rentalPrice },
              plan
            );
            if (effectivePrice === null) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "Rental plan is not available for this product" });
            }
            const days = Math.max(1, Number(p.rentalDurationDays ?? 30));
            const expiry = isRental
              ? new Date(Date.now() + days * 24 * 60 * 60 * 1000)
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            return {
            orderId: order.id,
              productId: p.id,
              productName: p.name,
              price: effectivePrice.toString(),
            quantity,
            downloadToken: nanoid(32),
              downloadExpiry: expiry,
            };
          })
        );

        return { orderNumber, orderId: order.id, totalAmount: finalAmount, discountAmount };
      }),

    // Update order after Stripe payment
    confirmPayment: protectedProcedure
      .input(
        z.object({
          orderNumber: z.string(),
          stripeSessionId: z.string().optional(),
          stripePaymentIntentId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const order = await getOrderByNumber(input.orderNumber);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        if (order.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (order.paymentMethod === "card" || order.paymentMethod === "promptpay") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Stripe-based payments are confirmed only by webhook",
          });
        }
        await updateOrderStatus(order.id, "paid", {
          stripeSessionId: input.stripeSessionId,
          stripePaymentIntentId: input.stripePaymentIntentId,
          paidAt: new Date(),
        });
        await clearCart(ctx.user.id);
        // Affiliate conversion tracking
        if ((order as any).affiliateCode) {
          const { recordConversion } = await import("./affiliateService");
          await recordConversion({
            affiliateCode: (order as any).affiliateCode,
            referredUserId: ctx.user.id,
            orderId: order.id,
            orderAmount: Number(order.totalAmount),
          });
        }
        // In-app notification for buyer
        const { createNotification } = await import("./notificationService");
        await createNotification({
          userId: ctx.user.id,
          type: "order_paid",
          title: `คำสั่งซื้อ ${order.orderNumber} ชำระเงินแล้ว`,
          body: `ยอดรวม ฿${Number(order.totalAmount).toLocaleString()} — ดาวน์โหลดสินค้าได้ที่ Dashboard`,
          link: "/dashboard",
        });
        // Queue confirmation email
        const { queueEmail } = await import("./emailService");
        if (order.customerEmail) {
          await queueEmail({
            to: order.customerEmail,
            subject: `ยืนยันคำสั่งซื้อ #${order.orderNumber}`,
            template: "order_confirmed",
            payload: { orderNumber: order.orderNumber, totalAmount: order.totalAmount },
          });
        }
        // Notify admin
        await notifyOwner({
          title: `New Order: ${order.orderNumber}`,
          content: `Order ${order.orderNumber} completed. Total: ฿${order.totalAmount}. Customer: ${order.customerName ?? "N/A"}`,
        });
        return { success: true };
      }),

    // Admin: get all orders
    adminList: dashboardProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
      .query(async ({ input }) => {
        return getAllOrders(input?.limit ?? 50, input?.offset ?? 0);
      }),

    adminUpdateStatus: dashboardProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "paid", "processing", "completed", "cancelled", "refunded"]) }))
      .mutation(async ({ ctx, input }) => {
        await updateOrderStatus(input.id, input.status);
        await logAdminAction(ctx, "order.status_update", { orderId: input.id, status: input.status });
        return { success: true };
      }),
  }),

  // ===== DOWNLOADS =====
  downloads: router({
    getLink: protectedProcedure
      .input(z.object({ orderNumber: z.string(), itemId: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await getOrderByNumber(input.orderNumber);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        if (order.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (!["paid", "processing", "completed"].includes(order.status)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Order not paid or completed" });
        }
        const items = await getOrderItems(order.id);
        const item = items.find((i) => i.id === input.itemId);
        if (!item) throw new TRPCError({ code: "NOT_FOUND" });
        if (item.downloadExpiry) {
          const exp = new Date(item.downloadExpiry as unknown as string | number | Date);
          if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Download expired" });
          }
        }
        const product = await getProductById(item.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND" });
        await incrementDownloadCount(item.id);
        return {
          downloadUrl: product.fileUrl ?? null,
          token: item.downloadToken,
          productName: item.productName,
          expiresAt: item.downloadExpiry,
        };
      }),
  }),

  // ===== STRIPE CHECKOUT =====
  checkout: router({
    createSession: protectedProcedure
      .input(
        z.object({
          orderNumber: z.string(),
          origin: z.string().url(),
          paymentMethod: z.enum(["card", "promptpay"]).default("card"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const order = await getOrderByNumber(input.orderNumber);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        if (order.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const items = await getOrderItems(order.id);
        if (!items.length) throw new TRPCError({ code: "BAD_REQUEST", message: "No items in order" });

        const checkoutItems = items.map((item) => ({
          productId: item.productId,
          name: item.productName,
          price: Number(item.price),
          quantity: item.quantity,
        }));

        const sessionUrl = await createCheckoutSession({
          items: checkoutItems,
          orderNumber: input.orderNumber,
          userId: ctx.user.id,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          origin: input.origin,
          stripePaymentPreference: input.paymentMethod,
        });

        return { url: sessionUrl };
      }),
  }),

  // ===== AI CHAT =====
  aiChat: router({
    sendMessage: protectedProcedure // เปลี่ยนจาก publicProcedure เป็น protectedProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          ),
          productContext: z.any().optional().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Rate limiting (เฉพาะ user ที่ login แล้ว)
        const { checkRateLimit } = await import("./aiRateLimiter");
        const userId = ctx.user.id.toString();
        const ip = ctx.req.ip || ctx.req.socket.remoteAddress || "unknown";
        
        const rateLimit = checkRateLimit(userId, ip);
        
        if (!rateLimit.allowed) {
          const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000 / 60);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `คุณใช้ AI เกินจำนวนที่กำหนด (${USER_LIMIT} ข้อความ/ชั่วโมง) กรุณารออีก ${resetIn} นาที`,
          });
        }
        
        console.log(`[AI Chat] User: ${ctx.user.email}, Remaining: ${rateLimit.remaining}/${USER_LIMIT}`);
        
        const msgs = buildAiMessages({
          userMessages: input.messages,
          productContext: input.productContext ?? undefined,
        });
        const result = await invokeLLM({ messages: msgs });
        const content = extractAssistantText(result);
        return { content, remaining: rateLimit.remaining };
      }),
  }),

  // ===== CONTACT =====
  contact: router({
    send: publicProcedure
      .input(
        z.object({
          name: z.string().min(2).max(120),
          email: z.string().email(),
          subject: z.string().optional(),
          message: z.string().min(5).max(2000),
        })
      )
      .mutation(async ({ input }) => {
        const { queueEmail } = await import("./emailService");
        // Queue to support email
        await queueEmail({
          to: ENV.smtpFrom || "support@neoxp.store",
          subject: `[Contact] ${input.subject ?? "ข้อความจากเว็บไซต์"} — ${input.name}`,
          template: "contact_form",
          payload: {
            name: input.name,
            email: input.email,
            subject: input.subject ?? "",
            message: input.message,
          },
        });
        // Auto-reply to sender
        await queueEmail({
          to: input.email,
          subject: "ได้รับข้อความของคุณแล้ว — NEOXP Store",
          template: "contact_autoreply",
          payload: { name: input.name },
        });
        return { success: true as const };
      }),
  }),

  // ===== MARKET DATA =====
  market: router({
    ticker: publicProcedure.query(async () => {
      const { getMarketData } = await import("./marketDataService");
      return getMarketData();
    }),
  }),

  // ===== ADMIN =====
  admin: router({
    stats: dashboardProcedure.query(async () => {
      return getDashboardStats();
    }),

    users: userAdminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
      .query(async ({ input }) => {
        return getAllUsers(input?.limit ?? 50, input?.offset ?? 0);
      }),

    updateUserRole: userAdminProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["user", "service", "admin", "super_admin", "developer"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateUserRole(input.userId, input.role);
        await logAdminAction(ctx, "user.role_update", { userId: input.userId, role: input.role });
        return { success: true };
      }),

    panelAccess: protectedProcedure.query(({ ctx }) => {
      const role = ctx.user.role as string;
      return {
        role,
        panels: {
          catalog: {
            read: ["admin", "super_admin", "developer"].includes(role),
            write: ["admin", "super_admin", "developer"].includes(role),
          },
          operations: {
            read: ["service", "admin", "super_admin", "developer"].includes(role),
            write: ["admin", "super_admin", "developer"].includes(role),
          },
          security: {
            read: ["super_admin", "developer"].includes(role),
            write: ["super_admin", "developer"].includes(role),
          },
        },
      };
    }),

    systemSettings: systemSettingsProcedure.query(async () => {
      return listSystemConfigRows();
    }),

    upsertSystemSetting: systemSettingsProcedure
      .input(
        z.object({
          key: z.string(),
          value: z.string(),
          category: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await upsertSystemConfigRow({
          key: input.key,
          value: input.value,
          category: input.category,
          description: input.description,
          updatedBy: ctx.user.id,
        });
        await logAdminAction(ctx, "system_config.upsert", { key: input.key });
        return { success: true as const };
      }),

    productAssets: productAdminProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => getProductAssets(input.productId)),

    addProductAsset: productAdminProcedure
      .input(
        z.object({
          productId: z.number(),
          fileKey: z.string().min(2),
          fileUrl: z.string().optional(),
          version: z.string().min(1).max(64),
          checksum: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await addProductAsset({
          productId: input.productId,
          fileKey: input.fileKey,
          fileUrl: input.fileUrl,
          version: input.version,
          checksum: input.checksum,
          notes: input.notes,
          createdBy: ctx.user.id,
        });
        await logAdminAction(ctx, "product_asset.create", { productId: input.productId, version: input.version });
        return { success: true as const };
      }),

    setProductAssetActive: productAdminProcedure
      .input(z.object({ assetId: z.number(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await setProductAssetActive(input.assetId, input.isActive);
        await logAdminAction(ctx, "product_asset.toggle_active", { assetId: input.assetId, isActive: input.isActive });
        return { success: true as const };
      }),

    webhookEvents: operationsProcedure
      .input(z.object({ limit: z.number().min(1).max(200).default(50), offset: z.number().min(0).default(0) }).optional())
      .query(async ({ input }) => listWebhookEvents(input?.limit ?? 50, input?.offset ?? 0)),

    retryWebhookEvent: operationsProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await retryWebhookEvent(input.id);
        await logAdminAction(ctx, "webhook.retry", { id: input.id });
        return result ?? { success: false as const };
      }),

    integrationHealth: operationsProcedure.query(async () => {
      return listIntegrationHealthChecks();
    }),

    runIntegrationHealthCheck: operationsProcedure.mutation(async ({ ctx }) => {
      const checks = [
        {
          service: "stripe",
          ok: !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET,
          diagnostics: "Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET",
        },
        {
          service: "email",
          ok: !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS,
          diagnostics: "Requires SMTP_HOST/SMTP_USER/SMTP_PASS",
        },
        {
          service: "storage",
          ok: !!process.env.S3_BUCKET && !!process.env.S3_ENDPOINT,
          diagnostics: "Requires S3_BUCKET and S3_ENDPOINT",
        },
      ];
      for (const check of checks) {
        await upsertIntegrationHealthCheck({
          service: check.service,
          lastStatus: check.ok ? "ok" : "warn",
          diagnostics: check.ok ? "configured" : check.diagnostics,
          lastCheckedAt: new Date(),
        });
      }
      await logAdminAction(ctx, "integration_health.run_check", { count: checks.length });
      return { success: true as const };
    }),

    securitySnapshot: securityProcedure.query(async () => {
      const corsOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      return {
        corsAllowlist: corsOrigins,
        trustProxy: process.env.TRUST_PROXY ?? "1",
        cookieDomain: process.env.COOKIE_DOMAIN ?? null,
        csrfConfigured: !!process.env.CSRF_SECRET,
        sentryConfigured: !!process.env.SENTRY_DSN,
      };
    }),

    productLicenses: operationsProcedure
      .input(z.object({ limit: z.number().min(1).max(200).default(100), offset: z.number().min(0).default(0) }).optional())
      .query(async ({ input }) => listProductLicenses(input?.limit ?? 100, input?.offset ?? 0)),
  }),
});

export type AppRouter = typeof appRouter;
