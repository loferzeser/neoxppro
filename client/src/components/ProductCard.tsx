import { ShoppingCart, Star, TrendingUp, Zap } from "lucide-react";
import { Link } from "@/lib/router";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

interface ProductCardProps {
  product: {
    id: number;
    slug: string;
    name: string;
    shortDesc?: string | null;
    price: string;
    salePrice?: string | null;
    saleType?: "buy_once" | "rent" | "both" | null;
    rentalPrice?: string | null;
    rentalDurationDays?: number | null;
    category: string;
    platform: string;
    imageUrl?: string | null;
    winRate?: string | null;
    monthlyReturn?: string | null;
    maxDrawdown?: string | null;
    isFeatured: boolean;
    isNew: boolean;
    downloadCount: number;
    tags?: string[] | null;
  };
}

const categoryColors: Record<string, string> = {
  scalping: "#ccff00",
  swing: "#00e5ff",
  grid: "#ff00b3",
  hedging: "#ff9500",
  trend: "#7c3aed",
  arbitrage: "#10b981",
  indicator_tv: "#00e5ff",
  strategy_tv: "#7c3aed",
  script_tv: "#38bdf8",
  tool: "#f97316",
  other: "#6b7280",
};

const categoryBg: Record<string, string> = {
  scalping: "rgba(204,255,0,0.1)",
  swing: "rgba(0,229,255,0.1)",
  grid: "rgba(255,0,179,0.1)",
  hedging: "rgba(255,149,0,0.1)",
  trend: "rgba(124,58,237,0.1)",
  arbitrage: "rgba(16,185,129,0.1)",
  indicator_tv: "rgba(0,229,255,0.1)",
  strategy_tv: "rgba(124,58,237,0.1)",
  script_tv: "rgba(56,189,248,0.1)",
  tool: "rgba(249,115,22,0.1)",
  other: "rgba(107,114,128,0.1)",
};

const platformImages: Record<string, string> = {
  scalping: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80",
  swing: "https://images.unsplash.com/photo-1642790551116-18e150f248e3?w=400&q=80",
  grid: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=400&q=80",
  hedging: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80",
  trend: "https://images.unsplash.com/photo-1642790551116-18e150f248e3?w=400&q=80",
  arbitrage: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=400&q=80",
  indicator_tv: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&q=80",
  strategy_tv: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80",
  script_tv: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80",
  tool: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80",
  other: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80",
};

export default function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`, {
        style: { background: "#111", border: "1px solid rgba(204,255,0,0.3)", color: "#fff" },
      });
    },
    onError: () => toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่"),
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    addToCart.mutate({ productId: product.id });
  };

  const displayPrice = product.salePrice ?? product.price;
  const originalPrice = product.salePrice ? product.price : null;
  const rentLabel =
    product.saleType === "rent" || product.saleType === "both"
      ? `เช่า ${product.rentalDurationDays ?? 30} วัน`
      : null;
  const catColor = categoryColors[product.category] ?? "#6b7280";
  const catBg = categoryBg[product.category] ?? "rgba(107,114,128,0.1)";
  const imgSrc = product.imageUrl ?? platformImages[product.category] ?? platformImages.other;

  return (
    <Link href={`/shop/${product.slug}`}>
      <div className="cyber-card group cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative overflow-hidden rounded-t-xl" style={{ height: "180px" }}>
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {product.isNew && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ccff00] text-black">
                NEW
              </span>
            )}
            {product.isFeatured && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[rgba(255,0,179,0.9)] text-white">
                HOT
              </span>
            )}
          </div>

          {/* Platform badge */}
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 rounded bg-black/70 text-white/80 text-[10px] font-bold uppercase">
              {product.platform}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Category */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
              style={{ color: catColor, background: catBg }}
            >
              {product.category}
            </span>
          </div>

          {/* Name */}
          <h3 className="text-white font-bold text-base mb-1 line-clamp-1 group-hover:text-[#ccff00] transition-colors">
            {product.name}
          </h3>
          <p className="text-white/50 text-xs mb-3 line-clamp-2 flex-1">{product.shortDesc}</p>

          {/* Stats */}
          {(product.winRate || product.monthlyReturn) && (
            <div className="grid grid-cols-3 gap-2 mb-3 p-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
              {product.winRate && (
                <div className="text-center">
                  <div className="text-[#ccff00] text-sm font-bold">{product.winRate}%</div>
                  <div className="text-white/40 text-[10px]">Win Rate</div>
                </div>
              )}
              {product.monthlyReturn && (
                <div className="text-center">
                  <div className="text-[#ccff00] text-sm font-bold">+{product.monthlyReturn}%</div>
                  <div className="text-white/40 text-[10px]">Monthly</div>
                </div>
              )}
              {product.maxDrawdown && (
                <div className="text-center">
                  <div className="text-[#ff4d4d] text-sm font-bold">{product.maxDrawdown}%</div>
                  <div className="text-white/40 text-[10px]">Drawdown</div>
                </div>
              )}
            </div>
          )}

          {/* Price + CTA */}
          <div className="flex items-center justify-between mt-auto">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[#ccff00] font-bold text-lg">
                  ฿{Number(displayPrice).toLocaleString()}
                </span>
                {originalPrice && (
                  <span className="text-white/30 text-xs line-through">
                    ฿{Number(originalPrice).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="text-white/30 text-[10px]">
                {product.saleType === "rent"
                  ? rentLabel
                  : product.saleType === "both"
                    ? `${rentLabel} / ซื้อขาด`
                    : "ซื้อครั้งเดียว"}
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={addToCart.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#ccff00] text-black text-xs font-bold hover:bg-[#a0cc00] transition-all hover:shadow-[0_0_15px_rgba(204,255,0,0.4)] disabled:opacity-50"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {addToCart.isPending ? "..." : "ซื้อเลย"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
