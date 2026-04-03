import Layout from "@/components/Layout";
import { BarChart3, Bot, CheckCircle, Shield, TrendingUp, Users, Zap } from "lucide-react";
import { Link } from "wouter";

export default function About() {
  const team = [
    { name: "Alex T.", role: "Head of Development", avatar: "A", desc: "10+ ปีประสบการณ์ Algorithmic Trading" },
    { name: "Mint P.", role: "Quant Analyst", avatar: "M", desc: "อดีตนักวิเคราะห์จาก Investment Bank" },
    { name: "Krit S.", role: "Risk Manager", avatar: "K", desc: "เชี่ยวชาญด้าน Risk Management & Portfolio" },
  ];

  const milestones = [
    { year: "2020", title: "เริ่มต้น", desc: "เริ่มพัฒนา NEOXP แรกสำหรับ XAUUSD" },
    { year: "2021", title: "ขยายตลาด", desc: "เปิดตัว EA สำหรับ Forex หลักทุกคู่" },
    { year: "2022", title: "Community", desc: "สร้าง Community นักเทรดกว่า 500 คน" },
    { year: "2023", title: "1,000+ Users", desc: "ผู้ใช้งานเกิน 1,000 คน ผลตอบแทนเฉลี่ย 95%" },
    { year: "2024", title: "NEOXP Store", desc: "เปิดตัวแพลตฟอร์มขาย NEOXP อย่างเป็นทางการ" },
  ];

  return (
    <Layout>
      <div className="container py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="text-[#ccff00] text-xs font-bold uppercase tracking-widest mb-3">เกี่ยวกับเรา</div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            ทีมงาน <span className="gradient-text">NEOXP Store</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            เราคือทีมนักพัฒนาและนักเทรดมืออาชีพที่มีประสบการณ์กว่า 10 ปี ในการพัฒนา Expert Advisor สำหรับตลาด Forex และ Crypto
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { value: "1,400+", label: "นักเทรดที่ไว้วางใจ", icon: Users, color: "#ccff00" },
            { value: "342", label: "NEOXP Bots พัฒนาแล้ว", icon: Bot, color: "#00e5ff" },
            { value: "88.9%", label: "Win Rate เฉลี่ย", icon: BarChart3, color: "#ff00b3" },
            { value: "10+ ปี", label: "ประสบการณ์", icon: TrendingUp, color: "#7c3aed" },
          ].map((s, i) => (
            <div key={i} className="cyber-card p-5 text-center">
              <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-black text-white mb-1">{s.value}</div>
              <div className="text-white/40 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div className="cyber-card p-8">
            <div className="w-12 h-12 rounded-xl bg-[rgba(204,255,0,0.1)] flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-[#ccff00]" />
            </div>
            <h2 className="text-white font-black text-2xl mb-3">พันธกิจของเรา</h2>
            <p className="text-white/60 leading-relaxed">
              เราเชื่อว่าทุกคนสามารถเข้าถึง Automated Trading ได้ ไม่ว่าจะเป็นนักเทรดมือใหม่หรือมืออาชีพ NEOXP Store มุ่งมั่นพัฒนาเครื่องมือที่ทรงพลัง โปร่งใส และใช้งานได้จริง
            </p>
            <div className="mt-4 space-y-2">
              {["โปร่งใส - สถิติจาก Live Account จริง", "คุณภาพ - ทดสอบอย่างเข้มงวดก่อนวางขาย", "สนับสนุน - ทีมงานพร้อมช่วยเหลือตลอด 24/7"].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                  <CheckCircle className="w-4 h-4 text-[#ccff00] shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="cyber-card p-8">
            <div className="w-12 h-12 rounded-xl bg-[rgba(255,0,179,0.1)] flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-[#ff00b3]" />
            </div>
            <h2 className="text-white font-black text-2xl mb-3">ความน่าเชื่อถือ</h2>
            <p className="text-white/60 leading-relaxed">
              ทุก EA ที่วางขายผ่านการทดสอบอย่างเข้มงวดทั้ง Backtest และ Forward Test บน Live Account เป็นเวลาอย่างน้อย 6 เดือน ก่อนนำมาเสนอให้กับลูกค้า
            </p>
            <div className="mt-4 p-3 rounded-xl bg-[rgba(255,0,179,0.05)] border border-[rgba(255,0,179,0.15)]">
              <p className="text-[#ff00b3] text-xs font-semibold">รับประกันคืนเงิน 30 วัน</p>
              <p className="text-white/40 text-xs mt-1">หากไม่พอใจในผลลัพธ์ภายใน 30 วัน ยินดีคืนเงินเต็มจำนวน</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-white text-center mb-8">ประวัติความเป็นมา</h2>
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-[rgba(204,255,0,0.15)]" />
            <div className="space-y-6">
              {milestones.map((m, i) => (
                <div key={i} className={`flex items-center gap-6 ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}>
                  <div className={`flex-1 ${i % 2 === 0 ? "text-right" : "text-left"}`}>
                    <div className="cyber-card p-4 inline-block">
                      <div className="text-[#ccff00] text-xs font-bold mb-1">{m.year}</div>
                      <div className="text-white font-bold text-sm">{m.title}</div>
                      <div className="text-white/50 text-xs mt-0.5">{m.desc}</div>
                    </div>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-[#ccff00] shrink-0 z-10 shadow-[0_0_10px_rgba(204,255,0,0.5)]" />
                  <div className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-white text-center mb-8">ทีมงาน</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {team.map((member, i) => (
              <div key={i} className="cyber-card p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(204,255,0,0.15)] border border-[rgba(204,255,0,0.3)] flex items-center justify-center text-[#ccff00] font-black text-2xl mx-auto mb-4">
                  {member.avatar}
                </div>
                <h3 className="text-white font-bold text-base">{member.name}</h3>
                <p className="text-[#ccff00] text-xs font-semibold mb-2">{member.role}</p>
                <p className="text-white/50 text-sm">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#ccff00] text-black font-bold text-base hover:bg-[#a0cc00] transition-all hover:shadow-[0_0_30px_rgba(204,255,0,0.5)]">
            <Bot className="w-5 h-5" />
            ดู NEOXP Bots ทั้งหมด
          </Link>
        </div>
      </div>
    </Layout>
  );
}
