import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Download, Package, ShoppingBag } from "lucide-react";
import { Link, useParams } from "@/lib/router";

export default function OrderSuccess({ params }: { params?: { orderNumber: string } }) {
  const routerParams = useParams<{ orderNumber: string }>();
  const orderNumber = params?.orderNumber || routerParams.orderNumber;
  const { data, isLoading } = trpc.orders.byNumber.useQuery(
    { orderNumber: orderNumber ?? "" },
    { enabled: !!orderNumber }
  );

  return (
    <Layout>
      <div className="container py-16 max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 rounded-full bg-[rgba(204,255,0,0.1)] border-2 border-[rgba(204,255,0,0.4)] flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(204,255,0,0.2)]">
          <CheckCircle className="w-12 h-12 text-[#ccff00]" />
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
          ชำระเงิน <span className="gradient-text">สำเร็จ!</span>
        </h1>
        <p className="text-white/60 text-base mb-2">
          ขอบคุณสำหรับการสั่งซื้อ NEOXP ของคุณ
        </p>
        {orderNumber && (
          <p className="text-white/40 text-sm mb-8">
            หมายเลขคำสั่งซื้อ: <span className="text-[#ccff00] font-bold">{orderNumber}</span>
          </p>
        )}

        {/* Order Details */}
        {!isLoading && data && (
          <div className="cyber-card p-6 mb-6 text-left">
            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#ccff00]" />
              รายการสินค้า
            </h3>
            <div className="space-y-3">
              {data.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                  <div>
                    <p className="text-white text-sm font-medium">{item.productName}</p>
                    <p className="text-white/40 text-xs mt-0.5">ดาวน์โหลดได้ทันที</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#ccff00] font-bold text-sm">฿{Number(item.price).toLocaleString()}</span>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(204,255,0,0.1)] border border-[rgba(204,255,0,0.2)] text-[#ccff00] text-xs font-medium hover:bg-[rgba(204,255,0,0.2)] transition-all"
                    >
                      <Download className="w-3 h-3" />
                      ดาวน์โหลด
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="cyber-card p-5 mb-8 text-left">
          <h3 className="text-white font-bold text-sm mb-3">ขั้นตอนถัดไป</h3>
          <div className="space-y-2">
            {[
              "ไปที่ Dashboard เพื่อดาวน์โหลด NEOXP ของคุณ",
              "ติดตั้ง EA ลงใน MetaTrader 4/5",
              "ตั้งค่า EA ตามคู่มือที่แนบมา",
              "เริ่มต้น Automated Trading ได้เลย!",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-white/60">
                <span className="w-5 h-5 rounded-full bg-[rgba(204,255,0,0.1)] border border-[rgba(204,255,0,0.2)] text-[#ccff00] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ccff00] text-black font-bold hover:bg-[#a0cc00] transition-all hover:shadow-[0_0_20px_rgba(204,255,0,0.4)]"
          >
            <Download className="w-4 h-4" />
            ไปที่ Dashboard
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[rgba(255,255,255,0.15)] text-white font-semibold hover:bg-white/5 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            ซื้อ EA เพิ่มเติม
          </Link>
        </div>
      </div>
    </Layout>
  );
}
