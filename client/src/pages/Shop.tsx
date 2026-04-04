import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { Bot, Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearch } from "wouter";

const categories = [
  { value: "", label: "ทั้งหมด" },
  { value: "scalping", label: "Scalping" },
  { value: "swing", label: "Swing Trading" },
  { value: "grid", label: "Grid" },
  { value: "hedging", label: "Hedging" },
  { value: "trend", label: "Trend Following" },
  { value: "arbitrage", label: "Arbitrage" },
  { value: "indicator_tv", label: "TradingView Indicator" },
  { value: "strategy_tv", label: "TradingView Strategy" },
  { value: "script_tv", label: "TradingView Script" },
  { value: "tool", label: "Tools" },
  { value: "other", label: "Other" },
];

const platforms = [
  { value: "", label: "ทุก Platform" },
  { value: "MT4", label: "MT4" },
  { value: "MT5", label: "MT5" },
  { value: "both", label: "MT4 & MT5" },
];

const sortOptions = [
  { value: "newest", label: "ใหม่ล่าสุด" },
  { value: "price_asc", label: "ราคา: ต่ำ → สูง" },
  { value: "price_desc", label: "ราคา: สูง → ต่ำ" },
  { value: "popular", label: "ยอดนิยม" },
];

export default function Shop() {
  console.log("[Shop] Component rendering");
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [platform, setPlatform] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  console.log("[Shop] Calling trpc.products.list");
  const { data: products, isLoading, isError } = trpc.products.list.useQuery({
    search: search || undefined,
    category: category || undefined,
    platform: platform || undefined,
    limit: 50,
    offset: 0,
  });

  // Sort products client-side
  const sortedProducts = products ? [...products].sort((a, b) => {
    if (sort === "price_asc") return Number(a.salePrice ?? a.price) - Number(b.salePrice ?? b.price);
    if (sort === "price_desc") return Number(b.salePrice ?? b.price) - Number(a.salePrice ?? a.price);
    if (sort === "popular") return b.downloadCount - a.downloadCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }) : [];

  const activeFilters = [
    category && { label: category, clear: () => setCategory("") },
    platform && { label: platform, clear: () => setPlatform("") },
    search && { label: `"${search}"`, clear: () => setSearch("") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[#ccff00] text-xs font-bold uppercase tracking-widest mb-2">NEOXP Store</div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            ร้านค้า <span className="gradient-text">NEOXP Bots</span>
          </h1>
          <p className="text-white/50 text-sm">
            {isLoading ? "กำลังโหลด..." : `พบ ${sortedProducts.length} สินค้า`}
          </p>
        </div>

        {/* Search + Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="ค้นหา NEOXP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#ccff00] focus:shadow-[0_0_0_2px_rgba(204,255,0,0.15)] transition-all"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2.5 bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm focus:outline-none focus:border-[#ccff00] transition-all"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#111]">{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters ? "bg-[rgba(204,255,0,0.1)] border-[rgba(204,255,0,0.3)] text-[#ccff00]" : "bg-[#111] border-[rgba(255,255,255,0.1)] text-white/70 hover:text-white"}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            ตัวกรอง
            {activeFilters.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#ccff00] text-black text-[10px] font-bold flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="cyber-card p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 block">หมวดหมู่</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${category === c.value ? "bg-[#ccff00] text-black" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 block">Platform</label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPlatform(p.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${platform === p.value ? "bg-[#ccff00] text-black" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {activeFilters.map((f, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(204,255,0,0.1)] border border-[rgba(204,255,0,0.2)] text-[#ccff00] text-xs">
                {f.label}
                <button onClick={f.clear} className="hover:text-white transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => { setCategory(""); setPlatform(""); setSearch(""); }}
              className="text-white/40 text-xs hover:text-white/60 transition-colors"
            >
              ล้างทั้งหมด
            </button>
          </div>
        )}

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${category === c.value ? "bg-[#ccff00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]" : "bg-[#111] border border-[rgba(255,255,255,0.08)] text-white/60 hover:text-white hover:border-[rgba(255,255,255,0.2)]"}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1,2,3,4,5,6,7,8].map((i) => (
              <div key={i} className="cyber-card h-80 animate-pulse">
                <div className="h-44 bg-white/5 rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                  <div className="h-4 bg-white/5 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-24">
            <Bot className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <h3 className="text-white/70 text-lg font-semibold mb-2">โหลดสินค้าล้มเหลว</h3>
            <p className="text-white/30 text-sm">กรุณารีเฟรชหน้าเว็บ หรือเช็กการเชื่อมต่อ API/ฐานข้อมูล</p>
          </div>
        ) : sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <Bot className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <h3 className="text-white/60 text-lg font-semibold mb-2">ไม่พบสินค้า</h3>
            <p className="text-white/30 text-sm mb-6">ลองเปลี่ยนตัวกรองหรือคำค้นหา</p>
            <button
              onClick={() => { setCategory(""); setPlatform(""); setSearch(""); }}
              className="px-6 py-2.5 rounded-xl bg-[rgba(204,255,0,0.1)] border border-[rgba(204,255,0,0.2)] text-[#ccff00] text-sm font-medium hover:bg-[rgba(204,255,0,0.15)] transition-all"
            >
              ล้างตัวกรอง
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
