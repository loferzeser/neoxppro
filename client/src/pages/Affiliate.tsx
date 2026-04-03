import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Copy, DollarSign, Link2, TrendingUp, Users } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function AffiliatePage() {
  const { isAuthenticated, loading } = useAuth();
  const { data: stats, refetch } = trpc.affiliates.myStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const apply = trpc.affiliates.apply.useMutation({
    onSuccess: () => { toast.success("สมัครสำเร็จ! รอการอนุมัติ"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) window.location.href = getLoginUrl();
  }, [loading, isAuthenticated]);

  if (loading || !isAuthenticated) return null;

  const refLink = stats?.code
    ? `${window.location.origin}?ref=${stats.code}`
    : null;

  const copyLink = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink);
    toast.success("คัดลอกลิงก์แล้ว");
  };

  const statusColor: Record<string, string> = {
    pending: "#ff9500",
    active: "#ccff00",
    suspended: "#ff4d4d",
  };

  return (
    <Layout>
      <div className="container py-10 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-1">Affiliate Program</h1>
          <p className="text-white/50 text-sm">แนะนำเพื่อน รับค่าคอมมิชชั่นทุกการซื้อ</p>
        </div>

        {!stats ? (
          <div className="cyber-card p-8 text-center">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h2 className="text-white font-bold text-lg mb-2">เข้าร่วม Affiliate Program</h2>
            <p className="text-white/50 text-sm mb-6">รับค่าคอมมิชชั่น 10% จากทุกการซื้อที่มาจากลิงก์ของคุณ</p>
            <button
              onClick={() => apply.mutate()}
              disabled={apply.isPending}
              className="px-6 py-3 rounded-xl bg-[#ccff00] text-black font-bold hover:bg-[#a0cc00] transition-all disabled:opacity-50"
            >
              {apply.isPending ? "กำลังสมัคร..." : "สมัครเลย"}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Status */}
            <div className="cyber-card p-5 flex items-center justify-between">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-1">สถานะ</p>
                <span
                  className="text-sm font-bold px-3 py-1 rounded-full"
                  style={{ color: statusColor[stats.status], background: `${statusColor[stats.status]}15` }}
                >
                  {stats.status === "pending" ? "รอการอนุมัติ" : stats.status === "active" ? "ใช้งานได้" : "ถูกระงับ"}
                </span>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Commission Rate</p>
                <p className="text-[#ccff00] font-black text-2xl">{stats.commissionRate}%</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "รายได้รวม", value: `฿${Number(stats.totalEarned).toLocaleString()}`, icon: DollarSign, color: "#ccff00" },
                { label: "จ่ายแล้ว", value: `฿${Number(stats.totalPaid).toLocaleString()}`, icon: TrendingUp, color: "#00e5ff" },
                { label: "รอรับ", value: `฿${(stats.pendingEarnings ?? 0).toLocaleString()}`, icon: TrendingUp, color: "#ff9500" },
              ].map((s, i) => (
                <div key={i} className="cyber-card p-4 text-center">
                  <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
                  <p className="text-white font-black text-xl">{s.value}</p>
                  <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Referral Link */}
            {stats.status === "active" && refLink && (
              <div className="cyber-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Link2 className="w-4 h-4 text-[#ccff00]" />
                  <p className="text-white font-semibold text-sm">ลิงก์แนะนำของคุณ</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white/60 text-sm truncate">
                    {refLink}
                  </div>
                  <button
                    onClick={copyLink}
                    className="px-4 py-2.5 rounded-xl bg-[rgba(204,255,0,0.1)] border border-[rgba(204,255,0,0.2)] text-[#ccff00] hover:bg-[rgba(204,255,0,0.2)] transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-white/30 text-xs mt-2">รหัสของคุณ: <span className="text-[#ccff00] font-mono">{stats.code}</span></p>
              </div>
            )}

            {/* Conversions */}
            {stats.conversions && stats.conversions.length > 0 && (
              <div className="cyber-card p-5">
                <h3 className="text-white font-semibold text-sm mb-3">ประวัติ Conversion</h3>
                <div className="space-y-2">
                  {stats.conversions.slice(0, 10).map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                      <div>
                        <p className="text-white text-xs">Order #{c.orderId}</p>
                        <p className="text-white/40 text-[10px]">{new Date(c.createdAt).toLocaleDateString("th-TH")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#ccff00] text-sm font-bold">+฿{Number(c.commissionAmount).toLocaleString()}</p>
                        <p className="text-white/40 text-[10px]">{c.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
