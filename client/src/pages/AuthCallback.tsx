import { useEffect } from "react";
import { COOKIE_NAME } from "@/const";

// This page handles the Google OAuth callback token
// Server redirects to /#/auth/callback?token=... after successful login
export default function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
    const token = params.get("token");

    if (token) {
      // Set cookie manually since we're cross-domain
      const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `${COOKIE_NAME}=${token}; expires=${expires}; path=/; SameSite=Lax`;
      console.log("[AuthCallback] Token stored in cookie");
    } else {
      console.warn("[AuthCallback] No token in URL");
    }

    // Redirect to home
    window.location.hash = "/";
    window.location.reload();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-8 h-8 border-2 border-[#ccff00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60">กำลังเข้าสู่ระบบ...</p>
      </div>
    </div>
  );
}
