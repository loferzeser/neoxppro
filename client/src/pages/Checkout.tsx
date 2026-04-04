import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { CouponInput } from "@/components/CouponInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Bitcoin,
  Building2,
  CheckCircle,
  CreditCard,
  Lock,
  Loader2,
  QrCode,
  Tag,
} from "lucide-react";
import { Link, useLocation } from "@/lib/router";
import { toast } from "sonner";
import { useEffect, useState } from "react";

type PayTab = "card" | "promptpay" | "bank_transfer" | "crypto";
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

const bankAccountNumber = import.meta.env.VITE_BANK_ACCOUNT_NUMBER as string | undefined;
const bankAccountName = import.meta.env.VITE_BANK_ACCOUNT_NAME as string | undefined;
const cryptoBtcAddress = import.meta.env.VITE_CRYPTO_BTC_ADDRESS as string | undefined;
const cryptoUsdtTrc20Address = import.meta.env.VITE_CRYPTO_USDT_TRC20_ADDRESS as string | undefined;

function getItemPrice(
  item: { product?: { saleType?: string | null; rentalPrice?: string | null; salePrice?: string | null; price?: string | null } | null },
  plan?: SalePlan
) {
  if (item.product?.saleType === "rent" && item.product?.rentalPrice) return Number(item.product.rentalPrice);
  if (item.product?.saleType === "both" && plan === "rent" && item.product?.rentalPrice) return Number(item.product.rentalPrice);
  return Number(item.product?.salePrice ?? item.product?.price ?? 0);
}

export default function Checkout() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();

  const { data: cartItems, isLoading: cartLoading } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });
  const createOrder = trpc.orders.createPending.useMutation();
  const createStripeSession = trpc.checkout.createSession.useMutation();

  const [processing, setProcessing] = useState(false);
  const [payTab, setPayTab] = useState<PayTab>("card");
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [affiliateCode, setAffiliateCode] = useState(() => {
    // auto-read ?ref= from URL
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("ref") ?? "";
    }
    return "";
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) window.location.href = getLoginUrl();
  }, [loading, isAuthenticated]);

  if (loading || cartLoading) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#ccff00] border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) return null;

  const items = cartItems ?? [];
  const planByProductId = safeReadPlans();
  const subtotal = items.reduce((sum, item) => {
    const plan = planByProductId[String(item.productId)];
    return sum + getItemPrice(item, plan) * item.quantity;
  }, 0);
  const finalTotal = Math.max(0, subtotal - discount);

  if (items.length === 0) { navigate("/cart"); return null; }

  const mapTabToPaymentMethod = (): "card" | "promptpay" | "bank_transfer" | "crypto" => {
    if (payTab === "promptpay") return "promptpay";
    if (payTab === "bank_transfer") return "bank_transfer";
    if (payTab === "crypto") return "crypto";
    return "card";
  };

  const handlePlaceOrder = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const pm = mapTabToPaymentMethod();
      const { orderNumber } = await createOrder.mutateAsync({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          plan: planByProductId[String(i.productId)],
        })),
        customerEmail: user?.email ?? undefined,
        customerName: user?.name ?? undefined,
        paymentMethod: pm,
        couponCode: couponCode || undefined,
        affiliateCode: affiliateCode || undefined,
      });

      if (pm === "card" || pm === "promptpay") {
        toast.info("กำลังเชื่อมต่อ Stripe…");
        const { url } = await createStripeSession.mutateAsync({
          orderNumber,
          origin: window.location.origin,
          paymentMethod: pm === "promptpay" ? "promptpay" : "card",
        });
        window.open(url, "_blank");
        navigate(`/order-success/${orderNumber}`);
      } else {
        toast.success("สร้างคำสั่งซื้อแล้ว");
        navigate(`/order-success/${orderNumber}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl py-8">
        <div className="mb-8 flex items-center gap-3">
          <Link href="/cart" className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">ชำระเงิน</h1>
            <p className="text-sm text-white/40">เลือกวิธีชำระและยืนยันคำสั่งซื้อ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left */}
          <div className="space-y-5 lg:col-span-3">
            {/* Buyer info */}
            <div className="cyber-card p-5">
              <h3 className="mb-4 text-base font-bold text-white">ข้อมูลผู้ซื้อ</h3>
              <div className="space-y-3">
                {[
                  { label: "ชื่อ-นามสกุล", value: user?.name ?? "-" },
                  { label: "อีเมล (รับ Download Link)", value: user?.email ?? "-" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">{f.label}</label>
                    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-white">
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div className="cyber-card p-5">
              <h3 className="mb-4 text-base font-bold text-white">วิธีชำระเงิน</h3>
              <Tabs value={payTab} onValueChange={(v) => setPayTab(v as PayTab)} className="w-full">
                <TabsList className="mb-4 grid w-full grid-cols-2 gap-1 bg-[#111] p-1 md:grid-cols-4">
                  {[
                    { value: "card", icon: CreditCard, label: "บัตร" },
                    { value: "promptpay", icon: QrCode, label: "PromptPay" },
                    { value: "bank_transfer", icon: Building2, label: "โอน" },
                    { value: "crypto", icon: Bitcoin, label: "Crypto" },
                  ].map((t) => (
                    <TabsTrigger
                      key={t.value}
                      value={t.value}
                      className="data-[state=active]:bg-[rgba(204,255,0,0.12)] data-[state=active]:text-[#ccff00]"
                    >
                      <t.icon className="mr-1 h-4 w-4" />
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="card" className="mt-0 space-y-2 text-sm text-white/60">
                  <p>ชำระผ่าน Stripe Checkout ด้วยบัตรเครดิต/เดบิต (Visa, Mastercard, JCB) ใน THB</p>
                  <p className="text-xs text-[#ccff00]/80">Stripe Payment Element รองรับหลายบัตรในหน้าชำระเงิน</p>
                </TabsContent>
                <TabsContent value="promptpay" className="mt-0 space-y-2 text-sm text-white/60">
                  <p>สแกน QR PromptPay ผ่าน Stripe (สกุลเงิน THB)</p>
                  <p className="text-xs text-[#ff00b3]">เลือกแท็บนี้แล้วกดยืนยัน — หน้าชำระเงินจะมี PromptPay</p>
                </TabsContent>
                <TabsContent value="bank_transfer" className="mt-0 space-y-2 text-sm text-white/60">
                  <p>สร้างคำสั่งซื้อแล้วโอนเงินตามรายละเอียดด้านล่าง</p>
                  <div className="rounded-xl border border-[rgba(0,229,255,0.2)] bg-[rgba(0,229,255,0.05)] p-3 text-xs">
                    <p className="font-semibold text-[#00e5ff]">โอนเงิน</p>
                    <p>เลขบัญชี: {bankAccountNumber ?? "ยังไม่ตั้งค่า (VITE_BANK_ACCOUNT_NUMBER)"}</p>
                    <p>ชื่อบัญชี: {bankAccountName ?? "ยังไม่ตั้งค่า (VITE_BANK_ACCOUNT_NAME)"}</p>
                  </div>
                </TabsContent>
                <TabsContent value="crypto" className="mt-0 space-y-2 text-sm text-white/60">
                  <p>ส่งคริปโตไปยังที่อยู่ด้านล่าง คำสั่งซื้อจะอยู่สถานะ pending จนกว่าทีมงานจะยืนยัน</p>
                  <div className="rounded-xl border border-[rgba(204,255,0,0.2)] bg-[rgba(204,255,0,0.05)] p-3 font-mono text-xs text-[#ccff00]">
                    BTC: {cryptoBtcAddress ?? "ยังไม่ตั้งค่า"}<br />
                    USDT (TRC20): {cryptoUsdtTrc20Address ?? "ยังไม่ตั้งค่า"}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Affiliate code */}
            {affiliateCode && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(0,229,255,0.06)] border border-[rgba(0,229,255,0.15)] text-xs text-[#00e5ff]">
                <Tag className="w-3.5 h-3.5" />
                ใช้รหัส Affiliate: <span className="font-mono font-bold">{affiliateCode}</span>
              </div>
            )}
          </div>

          {/* Right — Order summary */}
          <div className="space-y-4 lg:col-span-2">
            <div className="cyber-card p-5">
              <h3 className="mb-4 text-base font-bold text-white">สรุปคำสั่งซื้อ</h3>

              {/* Items */}
              <div className="mb-4 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="max-w-[160px] truncate text-white/60">{item.product?.name}</span>
                    <span className="font-medium text-white">
                      ฿{getItemPrice(item, planByProductId[String(item.productId)]).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mb-4">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">โค้ดส่วนลด</p>
                <CouponInput
                  orderAmount={subtotal}
                  onApplied={(amt, code) => { setDiscount(amt); setCouponCode(code); }}
                  onRemoved={() => { setDiscount(0); setCouponCode(""); }}
                />
              </div>

              <div className="section-divider mb-4" />

              {/* Totals */}
              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">ยอดรวม</span>
                  <span className="text-white">฿{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#ccff00]">ส่วนลด</span>
                    <span className="text-[#ccff00] font-semibold">-฿{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black pt-1 border-t border-[rgba(255,255,255,0.06)]">
                  <span className="text-white">ยอดชำระ</span>
                  <span className="text-[#ccff00]">฿{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={processing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ccff00] py-4 text-base font-bold text-black transition-all hover:bg-[#a0cc00] hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ? (
                  <><Loader2 className="h-5 w-5 animate-spin" />กำลังดำเนินการ...</>
                ) : (
                  <><CreditCard className="h-5 w-5" />ยืนยันคำสั่งซื้อ</>
                )}
              </button>

              <div className="mt-3 flex items-center justify-center gap-2">
                <Lock className="h-3.5 w-3.5 text-white/30" />
                <span className="text-xs text-white/30">ปลอดภัยด้วย SSL Encryption</span>
              </div>
            </div>

            <div className="cyber-card p-4">
              <div className="space-y-2">
                {["ดาวน์โหลดได้ทันทีหลังชำระ", "รับประกันคืนเงิน 30 วัน", "อัปเดตฟรีตลอดชีพ"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-white/50">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[#ccff00]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
