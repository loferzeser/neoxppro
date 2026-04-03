import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const sendContact = trpc.contact.send.useMutation({
    onSuccess: () => {
      setSent(true);
      toast.success("ส่งข้อความสำเร็จ! เราจะติดต่อกลับภายใน 24 ชั่วโมง");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendContact.mutate({
      name: form.name,
      email: form.email,
      subject: form.subject || undefined,
      message: form.message,
    });
  };

  const inputClass =
    "w-full px-4 py-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#ccff00] focus:shadow-[0_0_0_2px_rgba(204,255,0,0.1)] transition-all";

  return (
    <Layout>
      <div className="container py-12">
        <div className="text-center mb-12">
          <div className="text-[#ccff00] text-xs font-bold uppercase tracking-widest mb-3">ติดต่อเรา</div>
          <h1 className="text-4xl font-black text-white mb-3">
            มีคำถาม? <span className="gradient-text">ติดต่อเราได้เลย</span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">ทีมงานพร้อมตอบทุกคำถามเกี่ยวกับ NEOXP Bots และการเทรด</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-4">
            {[
              { icon: MessageCircle, title: "Line Official", value: "กำลังเปิดใช้", color: "#00e5ff", desc: "เร็วๆ นี้" },
              { icon: Mail, title: "Email", value: "support@neoxp.store", color: "#ccff00", desc: "ตอบภายใน 24 ชม." },
              { icon: Phone, title: "Telegram", value: "กำลังเปิดใช้", color: "#ff00b3", desc: "เร็วๆ นี้" },
            ].map((c, i) => (
              <div key={i} className="cyber-card p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${c.color}15` }}>
                    <c.icon className="w-5 h-5" style={{ color: c.color }} />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{c.title}</div>
                    <div className="text-white/70 text-sm mt-0.5">{c.value}</div>
                    <div className="text-white/30 text-xs mt-0.5">{c.desc}</div>
                  </div>
                </div>
              </div>
            ))}

            <div className="cyber-card p-5">
              <h3 className="text-white font-bold text-sm mb-3">เวลาทำการ</h3>
              <div className="space-y-1.5 text-sm text-white/50">
                <div className="flex justify-between">
                  <span>จันทร์ - ศุกร์</span>
                  <span className="text-[#ccff00]">09:00 - 22:00</span>
                </div>
                <div className="flex justify-between">
                  <span>เสาร์ - อาทิตย์</span>
                  <span className="text-[#ccff00]">10:00 - 20:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="cyber-card p-6">
              {sent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-[rgba(204,255,0,0.1)] border-2 border-[rgba(204,255,0,0.3)] flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-[#ccff00]" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">ส่งข้อความสำเร็จ!</h3>
                  <p className="text-white/50 mb-1">เราจะติดต่อกลับภายใน 24 ชั่วโมง</p>
                  <p className="text-white/30 text-xs">ตรวจสอบอีเมลยืนยันที่ {form.email}</p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    className="mt-5 text-[#ccff00] text-sm hover:underline"
                  >
                    ส่งข้อความใหม่
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-white font-bold text-base mb-4">ส่งข้อความหาเรา</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5">ชื่อ *</label>
                      <input
                        required
                        className={inputClass}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="ชื่อของคุณ"
                      />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5">อีเมล *</label>
                      <input
                        required
                        type="email"
                        className={inputClass}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5">หัวข้อ</label>
                    <select
                      className={inputClass}
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    >
                      <option value="" className="bg-[#111]">เลือกหัวข้อ...</option>
                      <option value="สอบถามการซื้อ EA" className="bg-[#111]">สอบถามการซื้อ EA</option>
                      <option value="ปัญหาทางเทคนิค" className="bg-[#111]">ปัญหาทางเทคนิค</option>
                      <option value="ขอคืนเงิน" className="bg-[#111]">ขอคืนเงิน</option>
                      <option value="ความร่วมมือ" className="bg-[#111]">ความร่วมมือ</option>
                      <option value="อื่นๆ" className="bg-[#111]">อื่นๆ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-wider block mb-1.5">ข้อความ *</label>
                    <textarea
                      required
                      rows={5}
                      className={inputClass}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="รายละเอียดคำถามหรือปัญหาของคุณ..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sendContact.isPending}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#ccff00] text-black font-bold hover:bg-[#a0cc00] transition-all hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] disabled:opacity-60"
                  >
                    {sendContact.isPending ? (
                      <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />กำลังส่ง...</>
                    ) : (
                      <><Send className="w-4 h-4" />ส่งข้อความ</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
