import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { Bot, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getApiUrl } from "@/lib/runtimeConfig";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const login = trpc.auth.loginWithPassword.useMutation({
    onSuccess: () => { toast.success("เข้าสู่ระบบสำเร็จ"); navigate("/"); },
    onError: (e) => toast.error(e.message),
  });
  const register = trpc.auth.registerWithPassword.useMutation({
    onSuccess: () => { toast.success("สร้างบัญชีสำเร็จ"); navigate("/"); },
    onError: (e) => toast.error(e.message),
  });

  const isPending = login.isPending || register.isPending;

  const inputClass =
    "w-full pl-10 pr-4 py-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#ccff00] focus:shadow-[0_0_0_2px_rgba(204,255,0,0.1)] transition-all";

  return (
    <Layout>
      <div className="container py-16 flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(204,255,0,0.1)] border border-[rgba(204,255,0,0.2)] flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-[#ccff00]" />
            </div>
            <h1 className="text-2xl font-black text-white">
              {isRegister ? "สร้างบัญชีใหม่" : "เข้าสู่ระบบ"}
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {isRegister ? "เริ่มต้น Automated Trading กับ NEOXP" : "ยินดีต้อนรับกลับมา"}
            </p>
          </div>

          <div className="cyber-card p-6">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (isRegister) {
                  register.mutate({ name, email, password });
                } else {
                  login.mutate({ email, password });
                }
              }}
            >
              {isRegister && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    className={inputClass}
                    placeholder="ชื่อ-นามสกุล"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  className={inputClass}
                  placeholder="อีเมล"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  className={`${inputClass} pr-10`}
                  placeholder="รหัสผ่าน (อย่างน้อย 8 ตัว)"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#ccff00] text-black font-bold text-base hover:bg-[#a0cc00] transition-all hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : isRegister ? (
                  "สร้างบัญชี"
                ) : (
                  "เข้าสู่ระบบ"
                )}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] text-center">
              <button
                type="button"
                onClick={() => { setIsRegister((v) => !v); setName(""); setEmail(""); setPassword(""); }}
                className="text-sm text-white/50 hover:text-[#ccff00] transition-colors"
              >
                {isRegister ? "มีบัญชีแล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครสมาชิก"}
              </button>
            </div>

            {/* Google OAuth */}
            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <a
                href={getApiUrl("/api/auth/google")}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-white/70 text-sm font-medium hover:bg-white/5 hover:text-white transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                เข้าสู่ระบบด้วย Google
              </a>
            </div>
          </div>

          <p className="text-center text-white/20 text-xs mt-4">
            การเข้าสู่ระบบถือว่าคุณยอมรับ{" "}
            <a href="/terms" className="text-white/40 hover:text-[#ccff00] transition-colors">ข้อกำหนดการใช้งาน</a>
            {" "}และ{" "}
            <a href="/privacy" className="text-white/40 hover:text-[#ccff00] transition-colors">นโยบายความเป็นส่วนตัว</a>
          </p>
        </div>
      </div>
    </Layout>
  );
}
