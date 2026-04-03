import Layout from "@/components/Layout";
import { SeoHead } from "@/components/SeoHead";
import type { ReactNode } from "react";

export function LegalShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Layout>
      <SeoHead title={`${title} | NEOXP Store`} description={description} />
      <div className="container max-w-3xl py-12">
        <p className="mb-8 rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 text-xs leading-relaxed text-amber-200/90">
          <strong>หมายเหตุสำคัญ:</strong> เอกสารด้านล่างเป็น<strong>แม่แบบทั่วไปสำหรับเว็บพาณิชย์อิเล็กทรอนิกส์</strong> ไม่ใช่คำแนะนำทางกฎหมายหรือบัญชี
          ก่อนเปิดใช้งานจริงควรให้ผู้เชี่ยวชาญ (ทนายความ / ผู้สอบบัญชี) ตรวจและปรับให้ตรงกับธุรกิจและกฎหมายที่ใช้บังคับ
        </p>
        <article className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-white/70 prose-li:text-white/70 prose-strong:text-white">
          <h1 className="text-2xl font-black text-white md:text-3xl">{title}</h1>
          {children}
        </article>
      </div>
    </Layout>
  );
}
