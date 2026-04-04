import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  ArrowLeft,
  Bot,
  CheckCircle,
  CreditCard,
  Lock,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { Link, useLocation } from "@/lib/router";
import { toast } from "sonner";
import { useEffect } from "react";

type SalePlan = "buy" | "rent";
const PLAN_STORAGE_KEY = "neoxp_cart_sale_plans_v1";

function safeReadPlans(): Record<string, SalePlan> {
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SalePlan>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function safeWritePlans(plans: Record<string, SalePlan>) {
  try {
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plans));
  } catch {
    /* ignore */
  }
}

function getItemPrice(item: {
  product?: {
    saleType?: string | null;
    rentalPrice?: string | null;
    salePrice?: string | null;
    price?: string | null;
  } | null;
}, plan?: SalePlan) {
  if (item.product?.saleType === "rent" && item.product?.rentalPrice) {
    return Number(item.product.rentalPrice);
  }
  if (item.product?.saleType === "both" && plan === "rent" && item.product?.rentalPrice) {
    return Number(item.product.rentalPrice);
  }
  return Number(item.product?.salePrice ?? item.product?.price ?? 0);
}

export default function Cart() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: cartItems, isLoading } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });

  const removeItem = trpc.cart.remove.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  const clearCart = trpc.cart.clear.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <div className="w-8 h-8 border-2 border-[#ccff00] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) return null;

  const items = cartItems ?? [];
  const planByProductId = safeReadPlans();
  const subtotal = items.reduce((sum, item) => {
    const plan = planByProductId[String(item.productId)];
    const price = getItemPrice(item, plan);
    return sum + price * item.quantity;
  }, 0);

  const handleCheckout = () => {
    if (items.length === 0) return;
    navigate("/checkout");
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/shop" className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">ตะกร้าสินค้า</h1>
            <p className="text-white/40 text-sm">{items.length} รายการ</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24">
            <ShoppingCart className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <h3 className="text-white/60 text-lg font-semibold mb-2">ตะกร้าว่างเปล่า</h3>
            <p className="text-white/30 text-sm mb-6">เพิ่ม NEOXP ที่คุณสนใจลงตะกร้า</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ccff00] text-black font-bold text-sm hover:bg-[#a0cc00] transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              ไปที่ร้านค้า
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="space-y-3 lg:col-span-2">
              {items.map((item) => (
                <div key={item.id} className="cyber-card p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                      <img
                        src={item.product?.imageUrl ?? "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&q=80"}
                        alt={item.product?.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&q=80"; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/shop/${item.product?.slug ?? ""}`}>
                        <h3 className="text-white font-bold text-sm hover:text-[#ccff00] transition-colors truncate">
                          {item.product?.name ?? "NEOXP"}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/40 text-xs capitalize">{item.product?.category}</span>
                        <span className="text-white/20 text-xs">•</span>
                        <span className="text-white/40 text-xs">{item.product?.platform}</span>
                      </div>
                      {item.product?.saleType === "both" && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-white/40 text-[10px] uppercase tracking-wider">Plan</span>
                          <div className="flex rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-1">
                            {(["buy", "rent"] as const).map((p) => {
                              const current = planByProductId[String(item.productId)] ?? "buy";
                              const active = current === p;
                              return (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => {
                                    const next = { ...safeReadPlans(), [String(item.productId)]: p };
                                    safeWritePlans(next);
                                    toast.success(`เลือกแผน: ${p === "buy" ? "ซื้อขาด" : "เช่า"}`, {
                                      style: { background: "#111", border: "1px solid rgba(204,255,0,0.3)", color: "#fff" },
                                    });
                                    utils.cart.get.invalidate();
                                  }}
                                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                    active ? "bg-[#ccff00] text-black" : "text-white/60 hover:text-white"
                                  }`}
                                >
                                  {p === "buy" ? "ซื้อขาด" : "เช่า"}
                                </button>
                              );
                            })}
                          </div>
                          {planByProductId[String(item.productId)] === "rent" && (
                            <span className="text-[#00e5ff] text-xs font-semibold">
                              ฿{Number(item.product?.rentalPrice ?? 0).toLocaleString()} / {item.product?.rentalDurationDays ?? 30} วัน
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[#ccff00] font-bold">
                        ฿{getItemPrice(item, planByProductId[String(item.productId)]).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeItem.mutate({ id: item.id })}
                        disabled={removeItem.isPending}
                        className="p-1.5 rounded-lg hover:bg-[rgba(255,77,77,0.1)] text-white/30 hover:text-[#ff4d4d] transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => clearCart.mutate()}
                className="text-white/30 text-xs hover:text-[#ff4d4d] transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> ล้างตะกร้า
              </button>
            </div>

            {/* Order Summary — sticky */}
            <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {[
                  { label: "Visa", color: "bg-[#1a1f71] text-white" },
                  { label: "MC", color: "bg-[#eb001b] text-white" },
                  { label: "PromptPay", color: "bg-[#00427a] text-white" },
                  { label: "Stripe", color: "bg-[#635bff] text-white" },
                  { label: "Crypto", color: "bg-[#f7931a] text-black" },
                ].map((b) => (
                  <span
                    key={b.label}
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${b.color}`}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
              <div className="cyber-card p-5">
                <h3 className="text-white font-bold text-base mb-4">สรุปคำสั่งซื้อ</h3>
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-white/60 truncate max-w-[160px]">{item.product?.name}</span>
                      <span className="text-white font-medium">
                        ฿{getItemPrice(item).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="section-divider mb-4" />
                <div className="flex justify-between mb-1">
                  <span className="text-white/60 text-sm">ยอดรวม</span>
                  <span className="text-white font-bold">฿{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-white/60 text-sm">VAT (7%)</span>
                  <span className="text-white/60 text-sm">รวมแล้ว</span>
                </div>
                <div className="flex justify-between text-lg font-black mb-5">
                  <span className="text-white">ยอดชำระ</span>
                  <span className="text-[#ccff00]">฿{subtotal.toLocaleString()}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#ccff00] text-black font-bold text-base hover:bg-[#a0cc00] transition-all hover:shadow-[0_0_30px_rgba(204,255,0,0.5)]"
                >
                  <CreditCard className="w-5 h-5" />
                  ชำระเงิน
                </button>

                <div className="flex items-center justify-center gap-2 mt-3">
                  <Lock className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-white/30 text-xs">ปลอดภัยด้วย SSL Encryption</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="cyber-card p-4">
                <div className="space-y-2">
                  {[
                    { icon: CheckCircle, text: "ดาวน์โหลดได้ทันทีหลังชำระ" },
                    { icon: CheckCircle, text: "รับประกันคืนเงิน 30 วัน" },
                    { icon: CheckCircle, text: "อัปเดตฟรีตลอดชีพ" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/50">
                      <item.icon className="w-3.5 h-3.5 text-[#ccff00] shrink-0" />
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
