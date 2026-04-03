import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  CheckCircle,
  Download,
  Shield,
  ShoppingCart,
  Star,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

const categoryLabels: Record<string, string> = {
  indicator_tv: "TradingView Indicator",
  strategy_tv: "TradingView Strategy",
  script_tv: "TradingView Script",
  tool: "Tools",
};

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"overview" | "specs" | "reviews">("overview");

  const { data: product, isLoading, error } = trpc.products.bySlug.useQuery({ slug: slug ?? "" }, { enabled: !!slug });
  const { data: reviews } = trpc.products.reviews.useQuery({ productId: product?.id ?? 0 }, { enabled: !!product?.id });

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success(`เพิ่ม ${product?.name} ลงตะกร้าแล้ว`, {
        style: { background: "#111", border: "1px solid rgba(204,255,0,0.3)", color: "#fff" },
      });
    },
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    if (product) addToCart.mutate({ productId: product.id });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-white/5 rounded w-32" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-80 bg-white/5 rounded-xl" />
              <div className="space-y-4">
                <div className="h-8 bg-white/5 rounded w-2/3" />
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <Bot className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">ไม่พบสินค้า</h2>
          <p className="text-white/40 mb-6">สินค้า NEOXP นี้อาจถูกลบหรือไม่มีอยู่ในระบบ</p>
          <Link href="/shop" className="inline-flex items-center gap-2 text-[#ccff00] font-semibold">
            <ArrowLeft className="w-4 h-4" /> กลับไปร้านค้า
          </Link>
        </div>
      </Layout>
    );
  }

  const isRentOnly = product.saleType === "rent";
  const displayPrice = isRentOnly ? (product.rentalPrice ?? product.price) : (product.salePrice ?? product.price);
  const originalPrice = isRentOnly ? null : (product.salePrice ? product.price : null);
  const discount = originalPrice ? Math.round((1 - Number(displayPrice) / Number(originalPrice)) * 100) : 0;

  const stats = [
    { label: "Win Rate", value: product.winRate ? `${product.winRate}%` : "N/A", icon: BarChart3, color: "#ccff00", good: true },
    { label: "Monthly Return", value: product.monthlyReturn ? `+${product.monthlyReturn}%` : "N/A", icon: TrendingUp, color: "#ccff00", good: true },
    { label: "Max Drawdown", value: product.maxDrawdown ? `${product.maxDrawdown}%` : "N/A", icon: TrendingDown, color: "#ff4d4d", good: false },
    { label: "Profit Factor", value: product.profitFactor ?? "N/A", icon: Zap, color: "#00e5ff", good: true },
    { label: "Total Trades", value: product.totalTrades?.toLocaleString() ?? "N/A", icon: BarChart3, color: "#ff00b3", good: true },
    { label: "Downloads", value: product.downloadCount.toLocaleString(), icon: Download, color: "#7c3aed", good: true },
  ];

  return (
    <Layout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/shop" className="hover:text-[#ccff00] transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> ร้านค้า
          </Link>
          <span>/</span>
          <span className="text-white/70 capitalize">{categoryLabels[product.category] ?? product.category}</span>
          <span>/</span>
          <span className="text-white truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left: Image + Screenshots */}
          <div>
            <div className="relative rounded-2xl overflow-hidden mb-4" style={{ height: "320px" }}>
              <img
                src={product.imageUrl ?? "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80"}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
              {product.isNew && (
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-[#ccff00] text-black text-xs font-bold uppercase">NEW</span>
                </div>
              )}
              {discount > 0 && (
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 rounded-full bg-[#ff00b3] text-white text-xs font-bold">-{discount}%</span>
                </div>
              )}
            </div>
            {/* Screenshots */}
            {Array.isArray(product.screenshotUrls) && product.screenshotUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {product.screenshotUrls.slice(0, 3).map((url, i) => (
                  <div key={i} className="rounded-lg overflow-hidden h-20">
                    <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info + Purchase */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-[rgba(204,255,0,0.1)] text-[#ccff00] text-xs font-bold uppercase">
                {categoryLabels[product.category] ?? product.category}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 text-white/60 text-xs font-bold">{product.platform}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">{product.name}</h1>
            <p className="text-white/60 text-base leading-relaxed mb-6">{product.shortDesc}</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {stats.slice(0, 3).map((stat, i) => (
                <div key={i} className="cyber-card p-3 text-center">
                  <div className="text-xl font-black mb-0.5" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="cyber-card p-5 mb-5">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-[#ccff00]">฿{Number(displayPrice).toLocaleString()}</span>
                    {originalPrice && (
                      <span className="text-white/30 text-lg line-through">฿{Number(originalPrice).toLocaleString()}</span>
                    )}
                  </div>
                  <div className="text-white/40 text-xs mt-0.5">
                    {product.saleType === "rent"
                      ? `เช่า ${product.rentalDurationDays ?? 30} วัน`
                      : product.saleType === "both"
                        ? `ซื้อขาด หรือเช่า ${product.rentalDurationDays ?? 30} วัน`
                        : "ซื้อครั้งเดียว • ใช้ได้ตลอดชีพ"}
                  </div>
                  {product.saleType === "both" && product.rentalPrice && (
                    <div className="text-[#00e5ff] text-xs mt-1">
                      แผนเช่า: ฿{Number(product.rentalPrice).toLocaleString()} / {product.rentalDurationDays ?? 30} วัน
                    </div>
                  )}
                </div>
                {discount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-[rgba(255,0,179,0.15)] text-[#ff00b3] text-sm font-bold border border-[rgba(255,0,179,0.3)]">
                    ประหยัด {discount}%
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-5">
                {[
                  "ดาวน์โหลดได้ทันทีหลังชำระเงิน",
                  "ใช้งานได้กับ " + product.platform,
                  "อัปเดตฟรีตลอดชีพ",
                  "รับประกันคืนเงิน 30 วัน",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="w-4 h-4 text-[#ccff00] shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addToCart.isPending}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#ccff00] text-black font-bold text-base hover:bg-[#a0cc00] transition-all hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] disabled:opacity-50"
              >
                <ShoppingCart className="w-5 h-5" />
                {addToCart.isPending ? "กำลังเพิ่ม..." : "เพิ่มลงตะกร้า"}
              </button>
              {!isAuthenticated && (
                <p className="text-white/30 text-xs text-center mt-2">
                  <a href={getLoginUrl()} className="text-[#ccff00] hover:underline">เข้าสู่ระบบ</a> เพื่อซื้อสินค้า
                </p>
              )}
            </div>

            {/* Tags */}
            {Array.isArray(product.tags) && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-white/5 text-white/40 text-xs">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[rgba(255,255,255,0.06)] mb-6">
          <div className="flex gap-1">
            {(["overview", "specs", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${activeTab === tab ? "text-[#ccff00] border-[#ccff00]" : "text-white/50 border-transparent hover:text-white"}`}
              >
                {tab === "overview" ? "รายละเอียด" : tab === "specs" ? "สถิติ" : `รีวิว (${reviews?.length ?? 0})`}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="prose prose-invert max-w-none">
            <div className="text-white/70 leading-relaxed whitespace-pre-wrap text-sm">
              {product.description ?? "ยังไม่มีรายละเอียดสินค้า"}
            </div>
          </div>
        )}

        {activeTab === "specs" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="cyber-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <span className="text-white/50 text-xs uppercase tracking-wider">{stat.label}</span>
                </div>
                <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "reviews" && (
          <div>
            {reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((r, i) => (
                  <div key={i} className="cyber-card p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-[rgba(204,255,0,0.15)] border border-[rgba(204,255,0,0.3)] flex items-center justify-center text-[#ccff00] font-bold shrink-0">
                        {(r.user?.name ?? "U")[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-semibold text-sm">{r.user?.name ?? "Anonymous"}</span>
                          {r.review.isVerified && (
                            <span className="flex items-center gap-1 text-[#ccff00] text-xs">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= r.review.rating ? "fill-[#ccff00] text-[#ccff00]" : "text-white/20"}`} />
                          ))}
                        </div>
                        {r.review.title && <p className="text-white font-medium text-sm mb-1">{r.review.title}</p>}
                        {r.review.content && <p className="text-white/60 text-sm">{r.review.content}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/40">ยังไม่มีรีวิว</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
