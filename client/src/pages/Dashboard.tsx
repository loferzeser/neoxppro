import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Bot,
  Download,
  ExternalLink,
  Loader2,
  Package,
  Settings,
  ShoppingBag,
  User,
  Users,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useEffect, useState } from "react";

// ===== PURCHASES TAB =====
function PurchasesTab() {
  const { data: purchases, isLoading } = trpc.orders.myPurchases.useQuery();
  const utils = trpc.useUtils();
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);

  const getLink = trpc.downloads.getLink.useMutation({
    onError: (e) => toast.error(e.message),
  });

  const handleDownload = async (orderNumber: string, itemId: number) => {
    if (loadingItemId) return;
    setLoadingItemId(itemId);
    try {
      const result = await getLink.mutateAsync({ orderNumber, itemId });
      if (result.downloadUrl) {
        window.open(result.downloadUrl, "_blank");
      } else {
        toast.error("ไม่พบ Download URL กรุณาติดต่อ Support");
      }
    } catch {
      // error handled by onError
    } finally {
      setLoadingItemId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="cyber-card p-5 animate-pulse">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-white/5 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/5 rounded w-1/2" />
                <div className="h-3 bg-white/5 rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!purchases || purchases.length === 0) {
    return (
      <div className="text-center py-16">
        <Bot className="w-16 h-16 text-white/10 mx-auto mb-4" />
        <h3 className="text-white/60 text-lg font-semibold mb-2">ยังไม่มี NEOXP</h3>
        <p className="text-white/30 text-sm mb-6">ซื้อ NEOXP แรกของคุณได้เลย</p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ccff00] text-black font-bold text-sm hover:bg-[#a0cc00] transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          ไปที่ร้านค้า
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {purchases.map((p, i) => {
        const isExpired =
          p.item.downloadExpiry &&
          new Date(p.item.downloadExpiry as unknown as string) < new Date();
        return (
          <div key={i} className="cyber-card p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[rgba(204,255,0,0.1)] border border-[rgba(204,255,0,0.2)] flex items-center justify-center shrink-0">
                <Bot className="w-7 h-7 text-[#ccff00]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base truncate">{p.item.productName}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-white/40 text-xs">{p.product?.platform ?? "MT4/MT5"}</span>
                  <span className="text-white/20 text-xs">•</span>
                  <span className="text-white/40 text-xs capitalize">{p.product?.category ?? "NEOXP"}</span>
                  {isExpired && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[rgba(255,77,77,0.1)] text-[#ff4d4d]">หมดอายุ</span>
                  )}
                </div>
                {p.item.downloadExpiry && !isExpired && (
                  <p className="text-white/30 text-[10px] mt-0.5">
                    หมดอายุ: {new Date(p.item.downloadExpiry as unknown as string).toLocaleDateString("th-TH")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[#ccff00] font-bold text-sm">฿{Number(p.item.price).toLocaleString()}</span>
                <button
                  onClick={() => handleDownload(p.order.orderNumber, p.item.id)}
                  disabled={!!isExpired || loadingItemId === p.item.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[rgba(204,255,0,0.1)] border border-[rgba(204,255,0,0.2)] text-[#ccff00] text-xs font-medium hover:bg-[rgba(204,255,0,0.2)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingItemId === p.item.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  ดาวน์โหลด
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===== ORDERS TAB =====
function OrdersTab() {
  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery();

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "รอชำระเงิน", color: "#ff9500", bg: "rgba(255,149,0,0.1)" },
    paid: { label: "ชำระแล้ว", color: "#00e5ff", bg: "rgba(0,229,255,0.1)" },
    processing: { label: "กำลังดำเนินการ", color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
    completed: { label: "สำเร็จ", color: "#ccff00", bg: "rgba(204,255,0,0.1)" },
    cancelled: { label: "ยกเลิก", color: "#ff4d4d", bg: "rgba(255,77,77,0.1)" },
    refunded: { label: "คืนเงิน", color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="cyber-card p-5 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 text-white/10 mx-auto mb-4" />
        <h3 className="text-white/60 text-lg font-semibold mb-2">ยังไม่มีคำสั่งซื้อ</h3>
        <p className="text-white/30 text-sm">ประวัติคำสั่งซื้อของคุณจะแสดงที่นี่</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const s = statusConfig[order.status] ?? statusConfig.pending;
        return (
          <div key={order.id} className="cyber-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-sm">{order.orderNumber}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ color: s.color, background: s.bg }}
                  >
                    {s.label}
                  </span>
                </div>
                <div className="text-white/40 text-xs">
                  {new Date(order.createdAt).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[#ccff00] font-bold">฿{Number(order.totalAmount).toLocaleString()}</div>
                <Link
                  href={`/dashboard/orders`}
                  className="flex items-center gap-1 text-white/40 text-xs hover:text-[#ccff00] transition-colors mt-1"
                >
                  ดูรายละเอียด <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===== SETTINGS TAB =====
function SettingsTab() {
  const { user } = useAuth();

  const roleLabel: Record<string, { label: string; color: string; bg: string }> = {
    user: { label: "User", color: "#ccff00", bg: "rgba(204,255,0,0.1)" },
    service: { label: "Service", color: "#00e5ff", bg: "rgba(0,229,255,0.1)" },
    admin: { label: "Admin", color: "#ff00b3", bg: "rgba(255,0,179,0.1)" },
    super_admin: { label: "Super Admin", color: "#ff9500", bg: "rgba(255,149,0,0.1)" },
    developer: { label: "Developer", color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  };
  const role = roleLabel[user?.role ?? "user"] ?? roleLabel.user;

  return (
    <div className="space-y-6">
      <div className="cyber-card p-6">
        <h3 className="text-white font-bold text-base mb-4">ข้อมูลบัญชี</h3>
        <div className="space-y-4">
          {[
            { label: "ชื่อ", value: user?.name ?? "-" },
            { label: "อีเมล", value: user?.email ?? "-" },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5">{f.label}</label>
              <div className="px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white text-sm">
                {f.value}
              </div>
            </div>
          ))}
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5">บทบาท</label>
            <div className="px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)]">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ color: role.color, background: role.bg }}
              >
                {role.label}
              </span>
            </div>
          </div>
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5">สมาชิกตั้งแต่</label>
            <div className="px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white/60 text-sm">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
                : "-"}
            </div>
          </div>
        </div>
      </div>

      {/* Affiliate shortcut */}
      <div className="cyber-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(204,255,0,0.1)] flex items-center justify-center">
            <Users className="w-5 h-5 text-[#ccff00]" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Affiliate Program</p>
            <p className="text-white/40 text-xs">รับค่าคอมมิชชั่น 10% ต่อการซื้อ</p>
          </div>
        </div>
        <Link
          href="/affiliate"
          className="px-4 py-2 rounded-xl bg-[rgba(204,255,0,0.1)] border border-[rgba(204,255,0,0.2)] text-[#ccff00] text-xs font-semibold hover:bg-[rgba(204,255,0,0.2)] transition-all"
        >
          จัดการ
        </Link>
      </div>
    </div>
  );
}

// ===== MAIN DASHBOARD =====
export default function Dashboard() {
  const { isAuthenticated, loading, user } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <div className="w-8 h-8 border-2 border-[#ccff00] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) return null;

  const activeTab = location.includes("/orders")
    ? "orders"
    : location.includes("/settings")
    ? "settings"
    : "purchases";

  const tabs = [
    { id: "purchases", label: "EA ของฉัน", href: "/dashboard", icon: Bot },
    { id: "orders", label: "คำสั่งซื้อ", href: "/dashboard/orders", icon: Package },
    { id: "settings", label: "ตั้งค่า", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(204,255,0,0.15)] border border-[rgba(204,255,0,0.3)] flex items-center justify-center">
            <User className="w-7 h-7 text-[#ccff00]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">
              สวัสดี, {user?.name?.split(" ")[0] ?? "นักเทรด"}!
            </h1>
            <p className="text-white/40 text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-[rgba(255,255,255,0.06)]">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "text-[#ccff00] border-[#ccff00]"
                  : "text-white/50 border-transparent hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Link>
          ))}
        </div>

        {activeTab === "purchases" && <PurchasesTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </Layout>
  );
}
