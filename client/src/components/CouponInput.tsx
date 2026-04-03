import { trpc } from "@/lib/trpc";
import { Tag, X } from "lucide-react";
import { useState } from "react";

interface Props {
  orderAmount: number;
  onApplied: (discount: number, code: string) => void;
  onRemoved: () => void;
}

export function CouponInput({ orderAmount, onApplied, onRemoved }: Props) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [error, setError] = useState("");

  const validate = trpc.coupons.validate.useMutation({
    onSuccess: (data) => {
      if (data.valid && data.discountAmount) {
        setApplied({ code: code.toUpperCase(), discount: data.discountAmount });
        onApplied(data.discountAmount, code.toUpperCase());
        setError("");
      } else {
        setError(data.reason ?? "โค้ดไม่ถูกต้อง");
      }
    },
    onError: (e) => setError(e.message),
  });

  const handleApply = () => {
    if (!code.trim()) return;
    setError("");
    validate.mutate({ code: code.trim(), orderAmount });
  };

  const handleRemove = () => {
    setApplied(null);
    setCode("");
    setError("");
    onRemoved();
  };

  const inputClass =
    "flex-1 px-3 py-2.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#ccff00] transition-all";

  if (applied) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[rgba(204,255,0,0.08)] border border-[rgba(204,255,0,0.2)]">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#ccff00]" />
          <span className="text-[#ccff00] text-sm font-semibold">{applied.code}</span>
          <span className="text-white/60 text-sm">ลด ฿{applied.discount.toLocaleString()}</span>
        </div>
        <button onClick={handleRemove} className="text-white/40 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className={inputClass}
          placeholder="โค้ดส่วนลด"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />
        <button
          onClick={handleApply}
          disabled={validate.isPending || !code.trim()}
          className="px-4 py-2.5 rounded-xl bg-[rgba(204,255,0,0.1)] border border-[rgba(204,255,0,0.2)] text-[#ccff00] text-sm font-semibold hover:bg-[rgba(204,255,0,0.2)] transition-all disabled:opacity-40"
        >
          {validate.isPending ? "..." : "ใช้"}
        </button>
      </div>
      {error && <p className="text-[#ff4d4d] text-xs">{error}</p>}
    </div>
  );
}
