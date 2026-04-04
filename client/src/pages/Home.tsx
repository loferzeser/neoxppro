import Layout from "@/components/Layout";
import { SeoHead } from "@/components/SeoHead";
import ProductCard from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle,
  Download,
  Shield,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";

// ===== ANIMATED COUNTER =====
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 2000;
          const step = target / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </div>
  );
}

// ===== WEBGL FLUID BACKGROUND =====
function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; color: string; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
        color: Math.random() > 0.5 ? "#ccff00" : "#ff00b3",
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.005;

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = particles[i].color;
            ctx.globalAlpha = (1 - dist / 150) * 0.08;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

// ===== RECENT TRADES FEED =====
const initialTrades = [
  { pair: "XAUUSD", profit: "+$4,502", time: "2m ago", type: "BUY" },
  { pair: "EURUSD", profit: "+$320", time: "5m ago", type: "SELL" },
  { pair: "GBPJPY", profit: "+$8,908", time: "8m ago", type: "BUY" },
  { pair: "USDJPY", profit: "+$2,101", time: "12m ago", type: "SELL" },
  { pair: "BTCUSD", profit: "+$12,450", time: "15m ago", type: "BUY" },
];

function TradeFeed() {
  const [trades, setTrades] = useState(initialTrades);

  useEffect(() => {
    const pairs = ["XAUUSD", "EURUSD", "GBPJPY", "USDJPY", "BTCUSD", "ETHUSD", "AUDUSD", "NZDUSD"];
    const interval = setInterval(() => {
      const profit = Math.floor(Math.random() * 15000) + 200;
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      const type = Math.random() > 0.5 ? "BUY" : "SELL";
      setTrades((prev) => [
        { pair, profit: `+$${profit.toLocaleString()}`, time: "just now", type },
        ...prev.slice(0, 4),
      ]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cyber-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
        <h3 className="text-white font-semibold text-sm">Recent Trades</h3>
        <span className="ml-auto text-white/30 text-xs">Live</span>
      </div>
      <div className="space-y-2">
        {trades.map((trade, i) => (
          <div
            key={i}
            className={`flex items-center justify-between p-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] transition-all duration-300 ${i === 0 ? "border-[rgba(204,255,0,0.2)] bg-[rgba(204,255,0,0.03)]" : ""}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trade.type === "BUY" ? "bg-[rgba(204,255,0,0.15)] text-[#ccff00]" : "bg-[rgba(255,0,179,0.15)] text-[#ff00b3]"}`}
              >
                {trade.type}
              </span>
              <span className="text-white text-xs font-medium">{trade.pair}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#ccff00] text-xs font-bold">{trade.profit}</span>
              <span className="text-white/30 text-xs">{trade.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  console.log("[Home] Component rendering");
  
  let isAuthenticated = false;
  let featuredProducts = null;
  let isLoading = true;
  let isError = false;
  let error = null;

  try {
    const auth = useAuth();
    console.log("[Home] useAuth returned:", { isAuthenticated: auth.isAuthenticated, loading: auth.loading });
    isAuthenticated = auth.isAuthenticated;

    const query = trpc.products.list.useQuery(
      { featured: true, limit: 6 },
      { retry: 1 }
    );
    console.log("[Home] tRPC query state:", { isLoading: query.isLoading, isError: query.isError, hasData: !!query.data });
    featuredProducts = query.data;
    isLoading = query.isLoading;
    isError = query.isError;
    error = query.error;
  } catch (err) {
    console.error("[Home] Error in hooks:", err);
    return (
      <Layout>
        <div style={{ color: "white", padding: "20px" }}>
          <h1>Error loading page</h1>
          <pre>{String(err)}</pre>
        </div>
      </Layout>
    );
  }

  const kpiData = [
    { value: 118, suffix: "%", label: "Monthly Profit", icon: TrendingUp, color: "#ccff00" },
    { value: 1400, suffix: "+", label: "Active Traders", icon: Users, color: "#00e5ff" },
    { value: 88.9, suffix: "%", label: "Win Rate", icon: BarChart3, color: "#ccff00" },
    { value: 342, suffix: "", label: "Profitable EAs", icon: Bot, color: "#ff00b3" },
  ];

  const features = [
    { icon: Zap, title: "ผลตอบแทนสูง", desc: "NEOXP Bots ที่ผ่านการทดสอบจริง มีสถิติผลตอบแทนเฉลี่ย 80-150% ต่อเดือน", color: "#ccff00" },
    { icon: Shield, title: "ปลอดภัย 100%", desc: "ระบบรักษาความปลอดภัยระดับสูง ไฟล์ EA ถูกส่งผ่าน Secure Download Link", color: "#00e5ff" },
    { icon: BarChart3, title: "สถิติจริง", desc: "ทุก EA มาพร้อมสถิติการเทรดจริงจาก Live Account ไม่ใช่ Backtest เท่านั้น", color: "#ff00b3" },
    { icon: Download, title: "ดาวน์โหลดทันที", desc: "หลังชำระเงินรับ Download Link ทันที ใช้งานได้เลยกับ MT4/MT5", color: "#ccff00" },
    { icon: Users, title: "Community", desc: "เข้าร่วม Community นักเทรดกว่า 1,400+ คน แลกเปลี่ยนความรู้และกลยุทธ์", color: "#7c3aed" },
    { icon: CheckCircle, title: "รับประกัน 30 วัน", desc: "ไม่พอใจยินดีคืนเงินภายใน 30 วัน ไม่มีคำถาม ไม่มีเงื่อนไข", color: "#10b981" },
  ];

  const testimonials = [
    { name: "คุณสมชาย ว.", company: "นักเทรดอิสระ", quote: "ใช้ EA จากที่นี่มา 6 เดือน ทำกำไรได้สม่ำเสมอ ทีมงานซัพพอร์ตดีมาก ตอบทุกคำถาม", rating: 5, avatar: "ส" },
    { name: "คุณนภา ร.", company: "Forex Trader", quote: "ซื้อ Scalping EA ไป Win Rate 89% จริงๆ ตามที่บอก ประทับใจมากครับ", rating: 5, avatar: "น" },
    { name: "คุณวิชัย ป.", company: "Fund Manager", quote: "ใช้ Grid EA สำหรับ XAUUSD ผลตอบแทนดีเกินคาด แนะนำเลยครับ", rating: 5, avatar: "ว" },
  ];

  return (
    <Layout>
      <SeoHead
        title="NEOXP Store - TradingView Indicators & Trading Bots"
        description="ร้านขาย Expert Advisor (EA) Trading Bots คุณภาพสูง พร้อมระบบสั่งซื้อและสนับสนุน"
      />
      <FluidBackground />

      {/* ===== HERO ===== */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,0,0,0.3)] to-[#0a0a0a] pointer-events-none z-10" />
        <div className="container relative z-20 py-20">
          <div className="max-w-3xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(204,255,0,0.1)] border border-[rgba(204,255,0,0.2)] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse" />
              <span className="text-[#ccff00] text-xs font-semibold tracking-wider uppercase">
                Expert Advisor Trading Bots
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6">
              เทรด Forex
              <br />
              ด้วย <span className="gradient-text">AI Bot</span>
              <br />
              ที่ดีที่สุด
            </h1>

            <p className="text-white/60 text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
              แหล่งรวม Expert Advisor (EA) Trading Bots คุณภาพสูง พร้อมสถิติจริงจาก Live Account ดาวน์โหลดได้ทันทีหลังชำระเงิน
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#ccff00] text-black font-bold text-base hover:bg-[#a0cc00] transition-all hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] group"
              >
                <ShoppingCart className="w-5 h-5" />
                ดู NEOXP Bots ทั้งหมด
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              {!isAuthenticated && (
                <a
                  href={getLoginUrl()}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-[rgba(255,255,255,0.15)] text-white font-semibold text-base hover:bg-white/5 transition-all"
                >
                  เข้าสู่ระบบ
                </a>
              )}
            </div>

            <div className="flex items-center gap-6 mt-10">
              <div className="flex -space-x-2">
                {["ส", "น", "ว", "ก"].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-[rgba(204,255,0,0.2)] border-2 border-[#0a0a0a] flex items-center justify-center text-[#ccff00] text-xs font-bold">
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-[#ccff00] text-[#ccff00]" />)}
                </div>
                <p className="text-white/50 text-xs mt-0.5">1,400+ นักเทรดไว้วางใจ</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== KPI STATS ===== */}
      <section className="py-16 relative z-10">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {kpiData.map((kpi, i) => (
              <div key={i} className="cyber-card p-5 text-center">
                <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                  <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
                <div className="text-3xl font-black" style={{ color: kpi.color }}>
                  <AnimatedCounter target={kpi.value} suffix={kpi.suffix} />
                </div>
                <div className="text-white/50 text-xs mt-1">{kpi.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <TradeFeed />
            </div>
            <div className="cyber-card p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Platform Support</h3>
              <div className="space-y-3">
                {[
                  { name: "MetaTrader 4 (MT4)", count: "180+ EAs", pct: 70 },
                  { name: "MetaTrader 5 (MT5)", count: "120+ EAs", pct: 45 },
                  { name: "Both MT4 & MT5", count: "60+ EAs", pct: 25 },
                ].map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/70">{p.name}</span>
                      <span className="text-[#ccff00]">{p.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#ccff00] to-[#a0cc00]"
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <div className="text-white/40 text-xs">รองรับ Broker ชั้นนำ</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["IC Markets", "Exness", "XM", "Pepperstone", "FBS"].map((b) => (
                    <span key={b} className="px-2 py-0.5 rounded bg-white/5 text-white/60 text-[10px]">{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="py-16 relative z-10">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-[#ccff00] text-xs font-bold uppercase tracking-widest mb-2">Featured EAs</div>
              <h2 className="text-3xl md:text-4xl font-black text-white">
                NEOXP Bots <span className="gradient-text">ยอดนิยม</span>
              </h2>
              <p className="text-white/50 mt-2 text-sm">คัดสรรเฉพาะ EA ที่มีผลงานดีที่สุด</p>
            </div>
            <Link href="/shop" className="hidden sm:flex items-center gap-2 text-[#ccff00] text-sm font-semibold hover:gap-3 transition-all">
              ดูทั้งหมด <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isError ? (
            <div className="cyber-card border border-red-500/30 bg-red-950/20 p-8 text-center">
              <p className="text-red-300 font-semibold mb-2">โหลดรายการสินค้าไม่สำเร็จ</p>
              <p className="text-white/50 text-sm mb-1">
                ตรวจสอบว่าเซิร์ฟเวอร์รันอยู่ และตั้งค่า <code className="text-[#ccff00]">DATABASE_URL</code> ใน
                environment แล้ว
              </p>
              <p className="text-white/30 text-xs font-mono break-all">{error?.message}</p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Bot className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">ยังไม่มีสินค้า กรุณาเพิ่มสินค้าผ่าน Admin Panel</p>
              <Link href="/shop" className="inline-flex items-center gap-2 mt-4 text-[#ccff00] text-sm">
                ดูร้านค้า <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link href="/shop" className="inline-flex items-center gap-2 text-[#ccff00] text-sm font-semibold">
              ดูทั้งหมด <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ===== FEATURES ===== */}
      <section className="py-16 relative z-10">
        <div className="container">
          <div className="text-center mb-12">
            <div className="text-[#ccff00] text-xs font-bold uppercase tracking-widest mb-2">Why Choose Us</div>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              ทำไมต้องเลือก <span className="gradient-text">NEOXP Store</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="cyber-card p-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}15` }}>
                  <f.icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-16 relative z-10">
        <div className="container">
          <div className="text-center mb-12">
            <div className="text-[#ccff00] text-xs font-bold uppercase tracking-widest mb-2">Reviews</div>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              เสียงจาก <span className="gradient-text">ลูกค้าจริง</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="cyber-card p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-[#ccff00] text-[#ccff00]" />)}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                  <div className="w-9 h-9 rounded-full bg-[rgba(204,255,0,0.15)] border border-[rgba(204,255,0,0.3)] flex items-center justify-center text-[#ccff00] font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{t.name}</div>
                    <div className="text-white/40 text-xs">{t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 relative z-10">
        <div className="container">
          <div className="relative rounded-2xl overflow-hidden p-8 md:p-12 text-center" style={{ background: "linear-gradient(135deg, rgba(204,255,0,0.08) 0%, rgba(255,0,179,0.08) 100%)", border: "1px solid rgba(204,255,0,0.15)" }}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(204,255,0,0.05)_0%,transparent_70%)]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                พร้อมเริ่มต้น <span className="gradient-text">Automated Trading</span> แล้วหรือยัง?
              </h2>
              <p className="text-white/60 text-base mb-8 max-w-xl mx-auto">
                เลือก NEOXP Bot/Indicator ที่เหมาะกับสไตล์การเทรดของคุณ และเริ่มทำกำไรได้ทันที
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#ccff00] text-black font-bold text-base hover:bg-[#a0cc00] transition-all hover:shadow-[0_0_40px_rgba(204,255,0,0.5)]">
                  <ShoppingCart className="w-5 h-5" />
                  เลือก NEOXP เลย
                </Link>
                <Link href="/about" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-[rgba(255,255,255,0.15)] text-white font-semibold text-base hover:bg-white/5 transition-all">
                  เรียนรู้เพิ่มเติม
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
