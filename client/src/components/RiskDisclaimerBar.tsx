import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export const RISK_BAR_STORAGE_KEY = "ea_bot_shop_risk_bar_dismissed_v1";

export function RiskDisclaimerBar() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(RISK_BAR_STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(RISK_BAR_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
    window.dispatchEvent(new Event("ea-risk-dismiss"));
  };

  if (dismissed) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-950/40 px-4 py-2 text-center text-xs text-amber-100/90">
      <div className="container relative mx-auto flex items-center justify-center gap-2 pr-8">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
        <span>
          การเทรด Forex/CFD มีความเสี่ยงสูง อาจสูญเสียเงินทุนทั้งหมด ผลตอบแทนในอดีตไม่การันตีผลในอนาคต — สินค้าไม่ใช่คำแนะนำการลงทุน{" "}
          <Link href="/risk" className="font-semibold text-[#ccff00] underline hover:no-underline">
            อ่านเพิ่มเติม
          </Link>
        </span>
        <button
          type="button"
          aria-label="ปิด"
          onClick={dismiss}
          className="absolute right-0 top-1/2 -translate-y-1/2 rounded p-1 text-amber-200/70 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
