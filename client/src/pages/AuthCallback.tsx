import { useEffect } from "react";
import { COOKIE_NAME } from "@/const";

const TOKEN_STORAGE_KEY = COOKIE_NAME;

// This page handles the Google OAuth callback token
// Server redirects to /#/auth/callback?token=... after successful login
export default function AuthCallback() {
  useEffect(() => {
    const hash = window.location.hash; // e.g. #/auth/callback?token=xxx
    const queryStr = hash.includes("?") ? hash.split("?")[1] : "";
    const params = new URLSearchParams(queryStr);
    const token = params.get("token");

    if (token) {
      // Store in localStorage for cross-domain use
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      // Also try cookie (works if same domain)
      const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `${TOKEN_STORAGE_KEY}=${token}; expires=${expires}; path=/; SameSite=Lax`;
      console.log("[AuthCallback] Token stored");
    } else {
      console.warn("[AuthCallback] No token in URL");
    }

    // Redirect to home
    window.location.replace("/#/");
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
