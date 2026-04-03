import { Bot, Home } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-4">
      <div
        className="text-[120px] font-black leading-none mb-4"
        style={{ background: "linear-gradient(135deg, #ccff00 0%, #ff00b3 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
      >
        404
      </div>
      <Bot className="w-16 h-16 text-white/10 mx-auto mb-4" />
      <h1 className="text-2xl font-black text-white mb-2">ไม่พบหน้าที่คุณต้องการ</h1>
      <p className="text-white/40 text-sm mb-8 max-w-sm">หน้านี้อาจถูกลบหรือ URL ไม่ถูกต้อง กลับไปหน้าหลักได้เลย</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ccff00] text-black font-bold hover:bg-[#a0cc00] transition-all hover:shadow-[0_0_20px_rgba(204,255,0,0.4)]"
      >
        <Home className="w-4 h-4" />
        กลับหน้าหลัก
      </Link>
    </div>
  );
}
