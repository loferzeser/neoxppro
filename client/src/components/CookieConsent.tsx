import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useEffect, useState } from "react";

const STORAGE_KEY = "ea_bot_shop_cookie_consent_v1";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const saveConsent = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] border-t border-[rgba(204,255,0,0.2)] bg-[#0a0a0a]/95 backdrop-blur-md px-4 py-4 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
      <div className="container mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/80">
          เราใช้คุกกี้เพื่อการทำงานของเว็บไซต์และปรับปรุงประสบการณ์การใช้งาน
          การใช้งานต่อถือว่าคุณยอมรับ{" "}
          <Link href="/cookies" className="text-[#ccff00] underline hover:no-underline">
            นโยบายคุกกี้
          </Link>{" "}
          และ{" "}
          <Link href="/privacy" className="text-[#ccff00] underline hover:no-underline">
            ความเป็นส่วนตัว
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => saveConsent("rejected")}
            className="border-white/20 text-white hover:bg-white/10"
          >
            ปฏิเสธ
          </Button>
          <Button
            type="button"
            onClick={() => saveConsent("accepted")}
            className="bg-[#ccff00] text-black hover:bg-[#a0cc00] font-bold"
          >
            ยอมรับ
          </Button>
        </div>
      </div>
    </div>
  );
}
