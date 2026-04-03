import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ---- Mock DB helpers ----
vi.mock("./db", () => ({
  getProducts: vi.fn().mockResolvedValue([
    {
      id: 1,
      slug: "gold-scalper-pro",
      name: "Gold Scalper Pro",
      shortDesc: "EA Scalping XAUUSD",
      price: "9900.00",
      salePrice: "7900.00",
      category: "scalping",
      platform: "mt4",
      imageUrl: null,
      winRate: "87.30",
      monthlyReturn: "12.50",
      maxDrawdown: "8.20",
      isFeatured: true,
      isNew: true,
      isActive: true,
      downloadCount: 0,
      tags: ["XAUUSD", "Scalping"],
    },
  ]),
  getProductBySlug: vi.fn().mockImplementation(async (slug: string) => {
    if (slug === "gold-scalper-pro") {
      return {
        id: 1,
        slug: "gold-scalper-pro",
        name: "Gold Scalper Pro",
        shortDesc: "EA Scalping XAUUSD",
        price: "9900.00",
        salePrice: "7900.00",
        category: "scalping",
        platform: "mt4",
        imageUrl: null,
        winRate: "87.30",
        monthlyReturn: "12.50",
        maxDrawdown: "8.20",
        isFeatured: true,
        isNew: true,
        isActive: true,
        downloadCount: 0,
        tags: ["XAUUSD", "Scalping"],
      };
    }
    return undefined;
  }),
  getProductById: vi.fn().mockResolvedValue(null),
  getProductReviews: vi.fn().mockResolvedValue([]),
  getCartItems: vi.fn().mockResolvedValue([]),
  addToCart: vi.fn().mockResolvedValue(undefined),
  updateCartItem: vi.fn().mockResolvedValue(undefined),
  removeFromCart: vi.fn().mockResolvedValue(undefined),
  clearCart: vi.fn().mockResolvedValue(undefined),
  getOrdersByUser: vi.fn().mockResolvedValue([]),
  getUserPurchasedProducts: vi.fn().mockResolvedValue([]),
  getOrderByNumber: vi.fn().mockResolvedValue(null),
  getOrderItems: vi.fn().mockResolvedValue([]),
  createOrder: vi.fn().mockResolvedValue(undefined),
  createOrderItems: vi.fn().mockResolvedValue(undefined),
  updateOrderStatus: vi.fn().mockResolvedValue(undefined),
  createReview: vi.fn().mockResolvedValue(undefined),
  getAllOrders: vi.fn().mockResolvedValue([]),
  getAllUsers: vi.fn().mockResolvedValue([]),
  getDashboardStats: vi.fn().mockResolvedValue({ totalOrders: 0, totalRevenue: "0", totalUsers: 1, totalProducts: 6 }),
  getOrderById: vi.fn().mockResolvedValue(null),
  getOrderByStripeSession: vi.fn().mockResolvedValue(null),
  createProduct: vi.fn().mockResolvedValue(undefined),
  updateProduct: vi.fn().mockResolvedValue(undefined),
  deleteProduct: vi.fn().mockResolvedValue(undefined),
  incrementDownloadCount: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./stripe", () => ({
  createCheckoutSession: vi.fn().mockResolvedValue("https://checkout.stripe.com/test"),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Assistant reply" } }],
  }),
  extractAssistantText: (r: { choices?: Array<{ message?: { content?: string } }> }) =>
    String(r?.choices?.[0]?.message?.content ?? ""),
  streamAssistantChunks: async function* () {
    yield "Assistant ";
    yield "reply";
  },
}));

// ---- Context helpers ----
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(overrides?: Partial<NonNullable<TrpcContext["user"]>>): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "user-001",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createUserContext({ id: 2, openId: "admin-001", role: "admin" });
}

function createSuperAdminContext(): TrpcContext {
  return createUserContext({ id: 3, openId: "owner-001", role: "super_admin" });
}

// ===== TESTS =====

describe("auth", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("test@example.com");
  });

  it("logout clears cookie and returns success", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect((ctx.res.clearCookie as ReturnType<typeof vi.fn>)).toHaveBeenCalledOnce();
  });
});

describe("products.list", () => {
  it("returns product list for public users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.products.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBe("Gold Scalper Pro");
  });

  it("returns product list with category filter", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.products.list({ category: "scalping" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("products.bySlug", () => {
  it("returns product for valid slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.products.bySlug({ slug: "gold-scalper-pro" });
    expect(result.name).toBe("Gold Scalper Pro");
    expect(result.category).toBe("scalping");
  });

  it("throws NOT_FOUND for invalid slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.products.bySlug({ slug: "nonexistent-ea" })).rejects.toThrow("Product not found");
  });
});

describe("cart", () => {
  it("requires authentication to view cart", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.cart.get()).rejects.toThrow();
  });

  it("returns empty cart for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.cart.get();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("add to cart requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.cart.add({ productId: 1, quantity: 1 })).rejects.toThrow();
  });

  it("add to cart succeeds for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.cart.add({ productId: 1, quantity: 1 });
    expect(result).toEqual({ success: true });
  });

  it("remove from cart succeeds for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.cart.remove({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

describe("orders", () => {
  it("requires authentication to view orders", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.orders.myOrders()).rejects.toThrow();
  });

  it("returns empty orders for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.orders.myOrders();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns empty purchases for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.orders.myPurchases();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("aiChat.sendMessage", () => {
  it("returns assistant content", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.aiChat.sendMessage({
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(result.content).toContain("Assistant");
  });
});

describe("admin", () => {
  it("requires admin role for stats", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("returns stats for admin user", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.stats();
    expect(result).toHaveProperty("totalOrders");
    expect(result).toHaveProperty("totalRevenue");
    expect(result).toHaveProperty("totalUsers");
    expect(result).toHaveProperty("totalProducts");
  });

  it("requires super_admin or developer for user list", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.users()).rejects.toThrow();
  });

  it("returns user list for super_admin", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    const result = await caller.admin.users();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns stats for service role", async () => {
    const caller = appRouter.createCaller(createUserContext({ role: "service" }));
    const result = await caller.admin.stats();
    expect(result).toHaveProperty("totalOrders");
  });
});
