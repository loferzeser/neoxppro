import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  User,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "@/lib/router";
import { NotificationBell } from "./NotificationBell";
import { CookieConsent } from "@/components/CookieConsent";
import { RISK_BAR_STORAGE_KEY, RiskDisclaimerBar } from "@/components/RiskDisclaimerBar";

// ===== LIVE TICKER =====
const tickerData = [
  { pair: "XAU/USD", price: "2,341.80", change: "+0.42%", up: true },
  { pair: "EUR/USD", price: "1.0834", change: "-0.11%", up: false },
  { pair: "GBP/USD", price: "1.2662", change: "+0.07%", up: true },
  { pair: "USD/JPY", price: "149.82", change: "+0.23%", up: true },
  { pair: "BTC/USD", price: "67,420", change: "+1.84%", up: true },
  { pair: "ETH/USD", price: "3,521", change: "+2.12%", up: true },
  { pair: "NAS100", price: "18,234", change: "+0.55%", up: true },
  { pair: "SPX500", price: "5,102", change: "-0.08%", up: false },
  { pair: "AUD/USD", price: "0.6548", change: "+0.14%", up: true },
  { pair: "USD/CAD", price: "1.3612", change: "-0.19%", up: false },
];

function LiveTicker() {
  const [prices, setPrices] = useState(tickerData);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) =>
        prev.map((item) => {
          const delta = (Math.random() - 0.48) * 0.05;
          const currentPrice = parseFloat(item.price.replace(/,/g, ""));
          const newPrice = currentPrice * (1 + delta / 100);
          const changeNum = ((newPrice - currentPrice) / currentPrice) * 100;
          const up = changeNum >= 0;
          return {
            ...item,
            price: newPrice > 1000
              ? newPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })
              : newPrice.toFixed(4),
            change: `${up ? "+" : ""}${changeNum.toFixed(2)}%`,
            up,
          };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const doubled = [...prices, ...prices];

  return (
    <div className="bg-[#050505] border-b border-[rgba(204,255,0,0.15)] overflow-hidden h-8 flex items-center">
      <div className="flex items-center gap-2 px-3 shrink-0 border-r border-[rgba(204,255,0,0.2)] h-full bg-[rgba(204,255,0,0.05)]">
        <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
        <span className="text-[#ccff00] text-xs font-bold tracking-widest uppercase">LIVE</span>
      </div>
      <div className="overflow-hidden flex-1">
        <div className="ticker-track">
          {doubled.map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-4 shrink-0">
              <span className="text-white/60 text-xs font-medium">{item.pair}</span>
              <span className="text-white text-xs font-semibold">{item.price}</span>
              <span className={`text-xs font-bold ${item.up ? "text-[#ccff00]" : "text-[#ff4d4d]"}`}>
                {item.change}
              </span>
              <span className="text-white/20 text-xs">|</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== CART ICON WITH COUNT =====
function CartIcon() {
  const { isAuthenticated } = useAuth();
  const { data: cartItems } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });
  const count = cartItems?.length ?? 0;

  return (
    <Link href="/cart" className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
      <ShoppingCart className="w-5 h-5 text-white/70 hover:text-white" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#ccff00] text-black text-[10px] font-bold flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

// ===== NAVIGATION =====
const navLinks = [
  { href: "/", label: "หน้าแรก" },
  { href: "/shop", label: "ร้านค้า" },
  { href: "/affiliate", label: "Affiliate" },
  { href: "/about", label: "เกี่ยวกับ" },
  { href: "/contact", label: "ติดต่อ" },
];

function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`relative z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-[rgba(5,5,5,0.97)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-[rgba(5,5,5,0.85)] backdrop-blur-md border-b border-[rgba(255,255,255,0.04)]"
      }`}
    >
      <div className="container">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="NEOXP Logo" 
                className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(204,255,0,0.5)] group-hover:drop-shadow-[0_0_15px_rgba(204,255,0,0.7)] transition-all"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-bold text-lg tracking-tight">
                NEO<span className="text-[#ccff00]">XP</span>
              </span>
              <span className="text-white/40 text-[10px] tracking-widest uppercase">Store</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location === link.href
                      ? "text-[#ccff00] bg-[rgba(204,255,0,0.08)]"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <CartIcon />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-[rgba(204,255,0,0.15)] border border-[rgba(204,255,0,0.3)] flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#ccff00]" />
                    </div>
                    <span className="hidden sm:block text-sm text-white/80 max-w-[100px] truncate">
                      {user?.name ?? "User"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 bg-[#111] border-[rgba(255,255,255,0.1)] text-white"
                >
                  <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.06)]">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-white/40 truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-[#ccff00]" />
                      แดชบอร์ด
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                    <Link href="/dashboard/orders" className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-white/60" />
                      คำสั่งซื้อของฉัน
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                    <Link href="/dashboard/settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-white/60" />
                      ตั้งค่า
                    </Link>
                  </DropdownMenuItem>
                  {["service", "admin", "super_admin", "developer"].includes(user?.role ?? "") && (
                    <>
                      <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.06)]" />
                      <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                        <Link href="/admin" className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-[#ff00b3]" />
                          <span className="text-[#ff00b3]">Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.06)]" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="hover:bg-white/5 cursor-pointer text-red-400 hover:text-red-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    ออกจากระบบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <a
                href={getLoginUrl()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ccff00] text-black text-sm font-bold hover:bg-[#a0cc00] transition-all hover:shadow-[0_0_20px_rgba(204,255,0,0.4)]"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:block">เข้าสู่ระบบ</span>
              </a>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 rounded-lg hover:bg-white/5">
                  <Menu className="w-5 h-5 text-white/70" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#0a0a0a] border-[rgba(255,255,255,0.06)] w-72 p-0">
                <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.06)]">
                  <span className="text-white font-bold">เมนู</span>
                  <button onClick={() => setMobileOpen(false)}>
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>
                <nav className="p-4 space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        location === link.href
                          ? "text-[#ccff00] bg-[rgba(204,255,0,0.08)]"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}

// ===== FOOTER =====
function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-[rgba(255,255,255,0.06)] mt-20">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="NEOXP Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-white font-bold text-xl">NEO<span className="text-[#ccff00]">XP</span> Store</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              แหล่งรวม Expert Advisor (EA) Trading Bots คุณภาพสูง สำหรับนักเทรดมืออาชีพ พร้อมสถิติจริงและการสนับสนุนตลอด 24/7
            </p>
            <div className="mt-3 text-xs text-white/40">
              <Link href="/privacy" className="hover:text-[#ccff00] transition-colors underline">
                นโยบายความเป็นส่วนตัว
              </Link>
              {" | "}
              <Link href="/terms" className="hover:text-[#ccff00] transition-colors underline">
                ข้อกำหนดการใช้งาน
              </Link>
            </div>
            <div className="flex items-center gap-3 mt-4">
              {["fab fa-telegram", "fab fa-discord", "fab fa-twitter", "fab fa-youtube"].map((icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[rgba(204,255,0,0.1)] hover:text-[#ccff00] text-white/50 transition-all">
                  <i className={`${icon} text-sm`} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">ลิงก์ด่วน</h4>
            <ul className="space-y-2">
              {[
                { href: "/shop", label: "ร้านค้า NEOXP Bots" },
                { href: "/about", label: "เกี่ยวกับเรา" },
                { href: "/contact", label: "ติดต่อเรา" },
                { href: "/dashboard", label: "แดชบอร์ด" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/50 hover:text-[#ccff00] text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">หมวดหมู่</h4>
            <ul className="space-y-2">
              {["Scalping EA", "Swing Trading EA", "Grid EA", "Hedging EA", "Trend Following EA"].map((cat) => (
                <li key={cat}>
                  <Link href={`/shop?category=${cat.split(" ")[0].toLowerCase()}`} className="text-white/50 hover:text-[#ccff00] text-sm transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="section-divider my-8" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            © 2026 NEOXP Store. All rights reserved. | {" "}
            <a href="https://neoxp.shop/#/privacy" className="text-white/40 hover:text-[#ccff00] transition-colors">
              Privacy Policy
            </a>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/privacy" className="text-white/40 text-xs hover:text-[#ccff00] transition-colors">
              ความเป็นส่วนตัว
            </Link>
            <Link href="/terms" className="text-white/40 text-xs hover:text-[#ccff00] transition-colors">
              ข้อกำหนด
            </Link>
            <Link href="/refund" className="text-white/40 text-xs hover:text-[#ccff00] transition-colors">
              คืนเงิน
            </Link>
            <Link href="/cookies" className="text-white/40 text-xs hover:text-[#ccff00] transition-colors">
              คุกกี้
            </Link>
            <Link href="/risk" className="text-white/40 text-xs hover:text-[#ccff00] transition-colors">
              ความเสี่ยง
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ===== MAIN LAYOUT =====
export default function Layout({ children }: { children: React.ReactNode }) {
  const [riskDismissed, setRiskDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem(RISK_BAR_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onDismiss = () => setRiskDismissed(true);
    window.addEventListener("ea-risk-dismiss", onDismiss);
    return () => window.removeEventListener("ea-risk-dismiss", onDismiss);
  }, []);

  const mainTop = riskDismissed ? "pt-24" : "pt-[8.5rem]";

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        <RiskDisclaimerBar />
        <LiveTicker />
        <Header />
      </div>
      <main className={`flex-1 ${mainTop}`}>
        {children}
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}
