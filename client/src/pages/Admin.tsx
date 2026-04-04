import Layout from "@/components/Layout";
import { RoleBadge } from "@/components/RoleBadge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import type { UserRole } from "@shared/types";
import {
  BarChart3,
  Bot,
  Check,
  Edit,
  Package,
  Plus,
  Settings,
  Shield,
  Trash2,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useLocation } from "@/lib/router";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const PRODUCT_CATEGORIES = [
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
] as const;

const SALE_TYPES = ["buy_once", "rent", "both"] as const;

// ===== STATS OVERVIEW =====
function AdminStats() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();

  const cards = [
    { label: "คำสั่งซื้อทั้งหมด", value: stats?.totalOrders ?? 0, icon: Package, color: "#ccff00" },
    { label: "รายได้รวม", value: `฿${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: TrendingUp, color: "#00e5ff", raw: true },
    { label: "ผู้ใช้งาน", value: stats?.totalUsers ?? 0, icon: Users, color: "#ff00b3" },
    { label: "สินค้าทั้งหมด", value: stats?.totalProducts ?? 0, icon: Bot, color: "#7c3aed" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <div key={i} className="cyber-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${card.color}15` }}>
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
            </div>
          </div>
          <div className="text-2xl font-black text-white mb-0.5">
            {isLoading ? <div className="h-7 bg-white/5 rounded w-16 animate-pulse" /> : card.value}
          </div>
          <div className="text-white/40 text-xs">{card.label}</div>
        </div>
      ))}
    </div>
  );
}

// ===== PRODUCT FORM =====
function ProductForm({ product, onClose, onSaved }: { product?: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    slug: product?.slug ?? "",
    name: product?.name ?? "",
    shortDesc: product?.shortDesc ?? "",
    description: product?.description ?? "",
    price: product?.price ?? "",
    salePrice: product?.salePrice ?? "",
    category: product?.category ?? "scalping",
    platform: product?.platform ?? "MT4",
    saleType: product?.saleType ?? "buy_once",
    rentalPrice: product?.rentalPrice ?? "",
    rentalDurationDays: product?.rentalDurationDays ?? 30,
    imageUrl: product?.imageUrl ?? "",
    fileUrl: product?.fileUrl ?? "",
    winRate: product?.winRate ?? "",
    monthlyReturn: product?.monthlyReturn ?? "",
    maxDrawdown: product?.maxDrawdown ?? "",
    profitFactor: product?.profitFactor ?? "",
    totalTrades: product?.totalTrades ?? "",
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    isNew: product?.isNew ?? true,
    tags: (product?.tags ?? []).join(", "),
  });

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => { toast.success("เพิ่มสินค้าสำเร็จ"); onSaved(); },
    onError: (e) => toast.error(e.message),
  });
  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => { toast.success("อัปเดตสินค้าสำเร็จ"); onSaved(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
      totalTrades: form.totalTrades ? Number(form.totalTrades) : undefined,
      salePrice: form.salePrice || undefined,
      winRate: form.winRate || undefined,
      monthlyReturn: form.monthlyReturn || undefined,
      maxDrawdown: form.maxDrawdown || undefined,
      profitFactor: form.profitFactor || undefined,
      rentalPrice: form.rentalPrice || undefined,
      rentalDurationDays:
        form.saleType === "buy_once" ? undefined : Number(form.rentalDurationDays || 30),
    };
    if (product) {
      updateProduct.mutate({ id: product.id, ...data } as any);
    } else {
      createProduct.mutate(data as any);
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#ccff00] focus:shadow-[0_0_0_2px_rgba(204,255,0,0.1)] transition-all";
  const labelClass = "text-white/50 text-xs uppercase tracking-wider block mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="text-white font-bold text-lg">{product ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>ชื่อสินค้า *</label>
              <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="NEOXP Name" />
            </div>
            <div>
              <label className={labelClass}>Slug *</label>
              <input required className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="ea-bot-name" />
            </div>
          </div>
          <div>
            <label className={labelClass}>คำอธิบายสั้น</label>
            <input className={inputClass} value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} placeholder="คำอธิบายสั้น..." />
          </div>
          <div>
            <label className={labelClass}>รายละเอียดเต็ม</label>
            <textarea rows={4} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="รายละเอียดสินค้า..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>ราคา (฿) *</label>
              <input required type="number" className={inputClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="9900" />
            </div>
            <div>
              <label className={labelClass}>ราคาลด (฿)</label>
              <input type="number" className={inputClass} value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} placeholder="7900" />
            </div>
            <div>
              <label className={labelClass}>หมวดหมู่</label>
              <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#111]">{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>รูปแบบการขาย</label>
              <select
                className={inputClass}
                value={form.saleType}
                onChange={(e) => setForm({ ...form, saleType: e.target.value })}
              >
                {SALE_TYPES.map((type) => (
                  <option key={type} value={type} className="bg-[#111]">{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>ราคาเช่า (฿)</label>
              <input
                type="number"
                className={inputClass}
                disabled={form.saleType === "buy_once"}
                value={form.rentalPrice}
                onChange={(e) => setForm({ ...form, rentalPrice: e.target.value })}
                placeholder="เช่น 990"
              />
            </div>
            <div>
              <label className={labelClass}>ระยะเวลาเช่า (วัน)</label>
              <input
                type="number"
                min={1}
                className={inputClass}
                disabled={form.saleType === "buy_once"}
                value={form.rentalDurationDays}
                onChange={(e) => setForm({ ...form, rentalDurationDays: Number(e.target.value) || 30 })}
                placeholder="30"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Platform</label>
              <select className={inputClass} value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                {["MT4", "MT5", "both"].map((p) => (
                  <option key={p} value={p} className="bg-[#111]">{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Image URL</label>
              <input className={inputClass} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className={labelClass}>File URL (Download Link)</label>
            <input className={inputClass} value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { key: "winRate", label: "Win Rate (%)" },
              { key: "monthlyReturn", label: "Monthly Return (%)" },
              { key: "maxDrawdown", label: "Max Drawdown (%)" },
              { key: "profitFactor", label: "Profit Factor" },
            ].map((f) => (
              <div key={f.key}>
                <label className={labelClass}>{f.label}</label>
                <input type="number" step="0.01" className={inputClass} value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder="0.00" />
              </div>
            ))}
          </div>
          <div>
            <label className={labelClass}>Tags (คั่นด้วย ,)</label>
            <input className={inputClass} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="XAUUSD, Scalping, Low Risk" />
          </div>
          <div className="flex gap-4">
            {[
              { key: "isActive", label: "เปิดใช้งาน" },
              { key: "isFeatured", label: "แนะนำ" },
              { key: "isNew", label: "สินค้าใหม่" },
            ].map((f) => (
              <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${(form as any)[f.key] ? "bg-[#ccff00] border-[#ccff00]" : "border-white/20 bg-transparent"}`}
                  onClick={() => setForm({ ...form, [f.key]: !(form as any)[f.key] })}
                >
                  {(form as any)[f.key] && <Check className="w-3 h-3 text-black" />}
                </div>
                <span className="text-white/60 text-sm">{f.label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-white/60 font-medium hover:bg-white/5 transition-all">
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={createProduct.isPending || updateProduct.isPending}
              className="flex-1 py-3 rounded-xl bg-[#ccff00] text-black font-bold hover:bg-[#a0cc00] transition-all disabled:opacity-50"
            >
              {createProduct.isPending || updateProduct.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== PRODUCTS TAB =====
function ProductsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [assetProduct, setAssetProduct] = useState<any>(null);
  const utils = trpc.useUtils();

  const { data: products, isLoading } = trpc.products.adminList.useQuery({ limit: 200 });
  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => { utils.products.adminList.invalidate(); toast.success("ลบสินค้าแล้ว"); },
    onError: (e) => toast.error(e.message),
  });

  const handleSaved = () => {
    utils.products.adminList.invalidate();
    setShowForm(false);
    setEditProduct(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold">สินค้าทั้งหมด ({products?.length ?? 0})</h3>
        <button
          onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ccff00] text-black text-sm font-bold hover:bg-[#a0cc00] transition-all"
        >
          <Plus className="w-4 h-4" />
          เพิ่มสินค้า
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 cyber-card animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {products?.map((p) => (
            <div key={p.id} className="cyber-card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                <img src={p.imageUrl ?? "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&q=80"} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm truncate">{p.name}</span>
                  {!p.isActive && <span className="text-xs px-1.5 py-0.5 rounded bg-[rgba(255,77,77,0.1)] text-[#ff4d4d]">ปิด</span>}
                  {p.isFeatured && <span className="text-xs px-1.5 py-0.5 rounded bg-[rgba(255,0,179,0.1)] text-[#ff00b3]">Featured</span>}
                </div>
                <div className="text-white/40 text-xs mt-0.5">
                  {p.category} • {p.platform} • {p.saleType ?? "buy_once"} • ฿{Number(p.salePrice ?? p.price).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setAssetProduct(p)}
                  className="rounded-lg border border-white/20 px-2 py-1 text-[11px] text-white/70 hover:text-[#ccff00]"
                >
                  Assets
                </button>
                <button
                  onClick={() => { setEditProduct(p); setShowForm(true); }}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-[#ccff00] transition-all"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { if (confirm("ลบสินค้านี้?")) deleteProduct.mutate({ id: p.id }); }}
                  className="p-2 rounded-lg hover:bg-[rgba(255,77,77,0.1)] text-white/40 hover:text-[#ff4d4d] transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showForm || editProduct) && (
        <ProductForm
          product={editProduct}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
          onSaved={handleSaved}
        />
      )}
      {assetProduct && (
        <ProductAssetsModal
          product={assetProduct}
          onClose={() => setAssetProduct(null)}
        />
      )}
    </div>
  );
}

function ProductAssetsModal({ product, onClose }: { product: any; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data } = trpc.admin.productAssets.useQuery({ productId: product.id });
  const [version, setVersion] = useState("");
  const [fileKey, setFileKey] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const add = trpc.admin.addProductAsset.useMutation({
    onSuccess: () => {
      utils.admin.productAssets.invalidate({ productId: product.id });
      toast.success("Asset added");
      setVersion("");
      setFileKey("");
      setFileUrl("");
    },
    onError: (e) => toast.error(e.message),
  });
  const toggle = trpc.admin.setProductAssetActive.useMutation({
    onSuccess: () => utils.admin.productAssets.invalidate({ productId: product.id }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-white">Assets - {product.name}</h3>
          <button onClick={onClose} className="text-white/60">Close</button>
        </div>
        <div className="mb-3 grid gap-2 md:grid-cols-3">
          <input className="rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-xs text-white" placeholder="version (e.g. 1.0.0)" value={version} onChange={(e)=>setVersion(e.target.value)} />
          <input className="rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-xs text-white" placeholder="file key" value={fileKey} onChange={(e)=>setFileKey(e.target.value)} />
          <input className="rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-xs text-white" placeholder="file url (optional)" value={fileUrl} onChange={(e)=>setFileUrl(e.target.value)} />
        </div>
        <button
          type="button"
          onClick={() => add.mutate({ productId: product.id, version, fileKey, fileUrl: fileUrl || undefined })}
          className="mb-4 rounded-lg bg-[#ccff00] px-3 py-2 text-xs font-bold text-black"
        >
          Add asset
        </button>
        <div className="space-y-2">
          {data?.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-white/10 p-2 text-xs">
              <div className="min-w-0">
                <p className="truncate text-white">{a.version} - {a.fileKey}</p>
                <p className="text-white/40">{a.isActive ? "active" : "inactive"}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle.mutate({ assetId: a.id, isActive: !a.isActive })}
                className="rounded-md border border-white/20 px-2 py-1 text-white/80"
              >
                {a.isActive ? "Disable" : "Enable"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== ORDERS TAB =====
function OrdersTab() {
  const { data: orders, isLoading } = trpc.orders.adminList.useQuery();
  const utils = trpc.useUtils();
  const updateStatus = trpc.orders.adminUpdateStatus.useMutation({
    onSuccess: () => { utils.orders.adminList.invalidate(); toast.success("อัปเดตสถานะแล้ว"); },
  });

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "รอชำระ", color: "#ff9500" },
    paid: { label: "ชำระแล้ว", color: "#00e5ff" },
    processing: { label: "ดำเนินการ", color: "#7c3aed" },
    completed: { label: "สำเร็จ", color: "#ccff00" },
    cancelled: { label: "ยกเลิก", color: "#ff4d4d" },
    refunded: { label: "คืนเงิน", color: "#6b7280" },
  };

  return (
    <div>
      <h3 className="text-white font-bold mb-4">คำสั่งซื้อทั้งหมด ({orders?.length ?? 0})</h3>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 cyber-card animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {orders?.map((order) => {
            const s = statusConfig[order.status] ?? statusConfig.pending;
            return (
              <div key={order.id} className="cyber-card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">{order.orderNumber}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: s.color, background: `${s.color}15` }}>{s.label}</span>
                  </div>
                  <div className="text-white/40 text-xs mt-0.5">
                    {order.customerName ?? "N/A"} • {new Date(order.createdAt).toLocaleDateString("th-TH")}
                  </div>
                </div>
                <div className="text-[#ccff00] font-bold text-sm shrink-0">฿{Number(order.totalAmount).toLocaleString()}</div>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value as any })}
                  className="px-2 py-1.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-white/70 text-xs focus:outline-none focus:border-[#ccff00] transition-all"
                >
                  {Object.entries(statusConfig).map(([v, s]) => (
                    <option key={v} value={v} className="bg-[#111]">{s.label}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== USERS TAB =====
function UsersTab() {
  const { data: users, isLoading } = trpc.admin.users.useQuery();
  const utils = trpc.useUtils();
  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { utils.admin.users.invalidate(); toast.success("อัปเดตบทบาทแล้ว"); },
  });

  return (
    <div>
      <h3 className="text-white font-bold mb-4">ผู้ใช้งานทั้งหมด ({users?.length ?? 0})</h3>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 cyber-card animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {users?.map((user) => (
            <div key={user.id} className="cyber-card p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-[rgba(204,255,0,0.1)] border border-[rgba(204,255,0,0.2)] flex items-center justify-center text-[#ccff00] font-bold text-sm shrink-0">
                {(user.name ?? "U")[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{user.name ?? "N/A"}</div>
                <div className="text-white/40 text-xs truncate">{user.email ?? user.openId}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <RoleBadge role={user.role as UserRole} />
                <select
                  value={user.role}
                  onChange={(e) =>
                    updateRole.mutate({ userId: user.id, role: e.target.value as UserRole })
                  }
                  className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-2 py-1.5 text-xs text-white/70 focus:border-[#ccff00] focus:outline-none"
                >
                  {(["user", "service", "admin", "super_admin", "developer"] as const).map((r) => (
                    <option key={r} value={r} className="bg-[#111]">
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SystemSettingsTab() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.systemSettings.useQuery();
  const upsert = trpc.admin.upsertSystemSetting.useMutation({
    onSuccess: () => {
      utils.admin.systemSettings.invalidate();
      toast.success("บันทึกแล้ว");
    },
    onError: (e) => toast.error(e.message),
  });

  const keys = [
    { key: "shop_name", category: "shop", description: "ชื่อร้าน", def: "NEOXP Store" },
    { key: "shop_url", category: "shop", description: "URL ร้าน", def: "" },
    { key: "support_email", category: "shop", description: "อีเมลซัพพอร์ต", def: "" },
  ];

  if (isLoading) return <p className="text-white/40">กำลังโหลด…</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {keys.map((k) => {
        const row = data?.find((r) => r.key === k.key);
        const val = row?.value ?? k.def;
        return (
          <div key={k.key} className="cyber-card space-y-2 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#ccff00]">{k.key}</p>
            <p className="text-[10px] text-white/40">{k.description}</p>
            <input
              defaultValue={val}
              className="w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm text-white"
              onBlur={(e) =>
                upsert.mutate({
                  key: k.key,
                  value: e.target.value,
                  category: k.category,
                  description: k.description,
                })
              }
            />
          </div>
        );
      })}
    </div>
  );
}

function CatalogPanel() {
  return (
    <div className="space-y-8">
      <ProductsTab />
    </div>
  );
}

function OperationsPanel() {
  const utils = trpc.useUtils();
  const { data: webhooks, isLoading: loadingWebhooks } = trpc.admin.webhookEvents.useQuery({ limit: 50 });
  const { data: health, isLoading: loadingHealth } = trpc.admin.integrationHealth.useQuery();
  const { data: licenses, isLoading: loadingLicenses } = trpc.admin.productLicenses.useQuery({ limit: 50 });
  const retry = trpc.admin.retryWebhookEvent.useMutation({
    onSuccess: () => {
      utils.admin.webhookEvents.invalidate();
      toast.success("Retry queued");
    },
    onError: (e) => toast.error(e.message),
  });
  const runHealth = trpc.admin.runIntegrationHealthCheck.useMutation({
    onSuccess: () => {
      utils.admin.integrationHealth.invalidate();
      toast.success("Health checks updated");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="cyber-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Integration Health</h3>
          <button
            type="button"
            onClick={() => runHealth.mutate()}
            className="rounded-lg bg-[#ccff00] px-3 py-1.5 text-xs font-bold text-black"
          >
            Run checks
          </button>
        </div>
        {loadingHealth ? (
          <p className="text-xs text-white/40">Loading...</p>
        ) : (
          <div className="space-y-2">
            {health?.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg border border-white/10 p-2 text-xs">
                <span className="text-white">{h.service}</span>
                <span className="text-white/70">{h.lastStatus}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="cyber-card p-4">
        <h3 className="mb-3 text-sm font-bold text-white">Webhook Events</h3>
        {loadingWebhooks ? (
          <p className="text-xs text-white/40">Loading...</p>
        ) : (
          <div className="space-y-2">
            {webhooks?.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg border border-white/10 p-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate text-white">{w.provider} - {w.eventId}</p>
                  <p className="text-white/50">{w.status} | retry {w.retryCount}</p>
                </div>
                <button
                  type="button"
                  onClick={() => retry.mutate({ id: w.id })}
                  className="rounded-md border border-white/20 px-2 py-1 text-white/80"
                >
                  Retry
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="cyber-card p-4">
        <h3 className="mb-3 text-sm font-bold text-white">Product Licenses</h3>
        {loadingLicenses ? (
          <p className="text-xs text-white/40">Loading...</p>
        ) : (
          <div className="space-y-2">
            {licenses?.map((l) => (
              <div key={l.id} className="rounded-lg border border-white/10 p-2 text-xs text-white/80">
                {l.licenseKey} | {l.status} | seats {l.seats}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SecurityPanel() {
  const { data, isLoading } = trpc.admin.securitySnapshot.useQuery();
  const utils = trpc.useUtils();
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const { data: blockedIps } = trpc.security.listBlockedIps.useQuery();
  const blockIp = trpc.security.blockIp.useMutation({
    onSuccess: () => { utils.security.listBlockedIps.invalidate(); toast.success("Blocked"); setIp(""); setReason(""); },
    onError: (e) => toast.error(e.message),
  });
  const unblockIp = trpc.security.unblockIp.useMutation({
    onSuccess: () => { utils.security.listBlockedIps.invalidate(); toast.success("Unblocked"); },
  });

  return (
    <div className="space-y-5">
      <div className="cyber-card space-y-3 p-4">
        <h3 className="text-sm font-bold text-white">Security Snapshot</h3>
        {isLoading ? (
          <p className="text-xs text-white/40">Loading...</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: "Trust Proxy", value: data?.trustProxy },
              { label: "CSRF", value: data?.csrfConfigured ? "✅ configured" : "⚠️ not set" },
              { label: "Sentry", value: data?.sentryConfigured ? "✅ configured" : "⚠️ not set" },
              { label: "CORS", value: data?.corsAllowlist?.join(", ") || "-" },
            ].map((r) => (
              <div key={r.label} className="rounded-lg border border-white/10 p-2">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">{r.label}</p>
                <p className="text-white mt-0.5">{r.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="cyber-card p-4">
        <h3 className="text-sm font-bold text-white mb-3">IP Blocklist</h3>
        <div className="flex gap-2 mb-3">
          <input
            className="flex-1 rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-xs text-white placeholder-white/30"
            placeholder="IP address"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
          />
          <input
            className="flex-1 rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-xs text-white placeholder-white/30"
            placeholder="เหตุผล"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            type="button"
            onClick={() => blockIp.mutate({ ip, reason })}
            disabled={!ip || !reason}
            className="rounded-lg bg-[#ff4d4d] px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
          >
            Block
          </button>
        </div>
        <div className="space-y-1.5">
          {blockedIps?.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-lg border border-white/10 p-2 text-xs">
              <div>
                <span className="text-white font-mono">{b.ip}</span>
                <span className="text-white/40 ml-2">{b.reason}</span>
              </div>
              <button
                type="button"
                onClick={() => unblockIp.mutate({ ip: b.ip })}
                className="text-[#ccff00] hover:underline"
              >
                Unblock
              </button>
            </div>
          ))}
          {!blockedIps?.length && <p className="text-white/30 text-xs">ไม่มี IP ที่ถูกบล็อก</p>}
        </div>
      </div>

      <SystemSettingsTab />
    </div>
  );
}

// ===== COUPONS TAB =====
function CouponsTab() {
  const utils = trpc.useUtils();
  const { data: coupons, isLoading } = trpc.coupons.adminList.useQuery();
  const toggle = trpc.coupons.adminToggle.useMutation({
    onSuccess: () => { utils.coupons.adminList.invalidate(); toast.success("อัปเดตแล้ว"); },
  });
  const create = trpc.coupons.adminCreate.useMutation({
    onSuccess: () => { utils.coupons.adminList.invalidate(); toast.success("สร้างโค้ดแล้ว"); setShowForm(false); },
    onError: (e) => toast.error(e.message),
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", discountType: "percent" as "percent" | "fixed", discountValue: "", usageLimit: "", expiresAt: "" });

  const inputClass = "w-full px-3 py-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#ccff00] transition-all";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold">โค้ดส่วนลด ({coupons?.length ?? 0})</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ccff00] text-black text-sm font-bold hover:bg-[#a0cc00] transition-all"
        >
          <Plus className="w-4 h-4" />
          สร้างโค้ด
        </button>
      </div>

      {showForm && (
        <div className="cyber-card p-5 mb-4 space-y-3">
          <h4 className="text-white font-semibold text-sm">สร้างโค้ดใหม่</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/50 text-xs block mb-1">โค้ด *</label>
              <input className={inputClass} placeholder="SAVE20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">ประเภท</label>
              <select className={inputClass} value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}>
                <option value="percent" className="bg-[#111]">เปอร์เซ็นต์ (%)</option>
                <option value="fixed" className="bg-[#111]">จำนวนเงิน (฿)</option>
              </select>
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">ค่าส่วนลด *</label>
              <input type="number" className={inputClass} placeholder={form.discountType === "percent" ? "20" : "500"} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">จำกัดการใช้</label>
              <input type="number" className={inputClass} placeholder="ไม่จำกัด" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">หมดอายุ</label>
              <input type="datetime-local" className={inputClass} value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5">ยกเลิก</button>
            <button
              type="button"
              disabled={create.isPending || !form.code || !form.discountValue}
              onClick={() => create.mutate({ code: form.code, discountType: form.discountType, discountValue: form.discountValue, usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined, expiresAt: form.expiresAt || undefined })}
              className="flex-1 py-2 rounded-xl bg-[#ccff00] text-black font-bold text-sm disabled:opacity-50"
            >
              {create.isPending ? "กำลังสร้าง..." : "สร้าง"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 cyber-card animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {coupons?.map((c) => (
            <div key={c.id} className="cyber-card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono font-bold text-sm">{c.code}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${c.isActive ? "bg-[rgba(204,255,0,0.1)] text-[#ccff00]" : "bg-[rgba(255,77,77,0.1)] text-[#ff4d4d]"}`}>
                    {c.isActive ? "ใช้งาน" : "ปิด"}
                  </span>
                </div>
                <div className="text-white/40 text-xs mt-0.5">
                  {c.discountType === "percent" ? `${c.discountValue}%` : `฿${c.discountValue}`}
                  {" • "}ใช้แล้ว {c.usageCount}/{c.usageLimit ?? "∞"}
                  {c.expiresAt && ` • หมดอายุ ${new Date(c.expiresAt).toLocaleDateString("th-TH")}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggle.mutate({ id: c.id, isActive: !c.isActive })}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/70 hover:text-[#ccff00] transition-colors"
              >
                {c.isActive ? "ปิด" : "เปิด"}
              </button>
            </div>
          ))}
          {!coupons?.length && <p className="text-white/30 text-sm text-center py-8">ยังไม่มีโค้ดส่วนลด</p>}
        </div>
      )}
    </div>
  );
}

// ===== AFFILIATES TAB =====
function AffiliatesTab() {
  const utils = trpc.useUtils();
  const { data: affiliates, isLoading } = trpc.affiliates.adminList.useQuery();
  const approve = trpc.affiliates.adminApprove.useMutation({
    onSuccess: () => { utils.affiliates.adminList.invalidate(); toast.success("อนุมัติแล้ว"); },
    onError: (e) => toast.error(e.message),
  });

  const statusColor: Record<string, string> = { pending: "#ff9500", active: "#ccff00", suspended: "#ff4d4d" };

  return (
    <div>
      <h3 className="text-white font-bold mb-4">Affiliates ({affiliates?.length ?? 0})</h3>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 cyber-card animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {affiliates?.map((a) => (
            <div key={a.id} className="cyber-card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono font-bold text-sm">{a.code}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: statusColor[a.status], background: `${statusColor[a.status]}15` }}>
                    {a.status}
                  </span>
                </div>
                <div className="text-white/40 text-xs mt-0.5">
                  Commission: {a.commissionRate}% • รายได้: ฿{Number(a.totalEarned).toLocaleString()} • จ่ายแล้ว: ฿{Number(a.totalPaid).toLocaleString()}
                </div>
              </div>
              {a.status === "pending" && (
                <button
                  type="button"
                  onClick={() => approve.mutate({ userId: a.userId })}
                  disabled={approve.isPending}
                  className="rounded-lg bg-[#ccff00] px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
                >
                  อนุมัติ
                </button>
              )}
            </div>
          ))}
          {!affiliates?.length && <p className="text-white/30 text-sm text-center py-8">ยังไม่มี Affiliate</p>}
        </div>
      )}
    </div>
  );
}

const STAFF_ROLES: UserRole[] = ["service", "admin", "super_admin", "developer"];

function canAccessAdminPanel(role: string | undefined | null): role is UserRole {
  return !!role && STAFF_ROLES.includes(role as UserRole);
}

// ===== MAIN ADMIN =====
export default function Admin() {
  const { isAuthenticated, loading, user } = useAuth();
  const { data: panelAccess } = trpc.admin.panelAccess.useQuery(undefined, { enabled: !!user });
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<
    "catalog" | "operations" | "security" | "users" | "coupons" | "affiliates"
  >("catalog");

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
      if (!canAccessAdminPanel(user?.role)) {
        toast.error("You do not have access to the admin panel");
        navigate("/");
      }
    }
  }, [loading, isAuthenticated, user, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#ccff00] border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !canAccessAdminPanel(user?.role)) return null;

  const role = user!.role as UserRole;
  const showCatalog = panelAccess?.panels.catalog.read ?? ["admin", "super_admin", "developer"].includes(role);
  const showOperations = panelAccess?.panels.operations.read ?? ["service", "admin", "super_admin", "developer"].includes(role);
  const showUsers = ["super_admin", "developer"].includes(role);
  const showSecurity = panelAccess?.panels.security.read ?? ["super_admin", "developer"].includes(role);
  const showCoupons = ["admin", "super_admin", "developer"].includes(role);
  const showAffiliates = ["admin", "super_admin", "developer"].includes(role);

  const tabs = [
    { id: "catalog" as const, label: "Catalog", icon: Bot, show: showCatalog },
    { id: "operations" as const, label: "Operations", icon: Package, show: showOperations },
    { id: "coupons" as const, label: "Coupons", icon: Zap, show: showCoupons },
    { id: "affiliates" as const, label: "Affiliates", icon: Users, show: showAffiliates },
    { id: "security" as const, label: "Security", icon: Settings, show: showSecurity },
    { id: "users" as const, label: "Users", icon: Users, show: showUsers },
  ];

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[rgba(255,0,179,0.3)] bg-[rgba(255,0,179,0.15)]">
              <Shield className="h-6 w-6 text-[#ff00b3]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Admin Panel</h1>
              <p className="text-sm text-white/40">NEOXP Store</p>
            </div>
          </div>
          <RoleBadge role={role} />
        </div>

        <div className="mb-6 flex flex-wrap gap-1 border-b border-[rgba(255,255,255,0.06)]">
          {tabs.filter((t) => t.show).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`mb-[-1px] flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "border-[#ff00b3] text-[#ff00b3]"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AdminStats />
        {activeTab === "catalog" && showCatalog && <CatalogPanel />}
        {activeTab === "operations" && showOperations && <OperationsPanel />}
        {activeTab === "coupons" && showCoupons && <CouponsTab />}
        {activeTab === "affiliates" && showAffiliates && <AffiliatesTab />}
        {activeTab === "security" && showSecurity && <SecurityPanel />}
        {activeTab === "users" && showUsers && <UsersTab />}
      </div>
    </Layout>
  );
}
