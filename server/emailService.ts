import { getDb } from "./db";
import { emailQueue } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { eq, lte, and } from "drizzle-orm";

// ===== QUEUE =====
export async function queueEmail(params: {
  to: string;
  subject: string;
  template: string;
  payload?: Record<string, unknown>;
  scheduledAt?: Date;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(emailQueue).values({
    to: params.to,
    subject: params.subject,
    template: params.template,
    payload: params.payload ?? {},
    scheduledAt: params.scheduledAt ?? new Date(),
  });
}

// ===== TEMPLATES =====
const templates: Record<string, (p: Record<string, unknown>) => { html: string; text: string }> = {
  order_confirmed: (p) => ({
    html: `<h2>ยืนยันคำสั่งซื้อ #${p.orderNumber}</h2><p>ขอบคุณที่ซื้อสินค้ากับเรา ยอดรวม ฿${p.totalAmount}</p><p><a href="${ENV.frontendAppUrl}/dashboard">ดาวน์โหลดสินค้า</a></p>`,
    text: `ยืนยันคำสั่งซื้อ #${p.orderNumber} ยอดรวม ฿${p.totalAmount}`,
  }),
  welcome: (p) => ({
    html: `<h2>ยินดีต้อนรับ ${p.name}!</h2><p>บัญชีของคุณพร้อมใช้งานแล้ว</p><p><a href="${ENV.frontendAppUrl}/shop">เลือกซื้อสินค้า</a></p>`,
    text: `ยินดีต้อนรับ ${p.name}! บัญชีของคุณพร้อมใช้งานแล้ว`,
  }),
  password_reset: (p) => ({
    html: `<h2>รีเซ็ตรหัสผ่าน</h2><p><a href="${p.resetUrl}">คลิกที่นี่เพื่อรีเซ็ตรหัสผ่าน</a> (หมดอายุใน 1 ชั่วโมง)</p>`,
    text: `รีเซ็ตรหัสผ่าน: ${p.resetUrl}`,
  }),
  affiliate_approved: (p) => ({
    html: `<h2>บัญชี Affiliate ได้รับการอนุมัติ!</h2><p>รหัสของคุณ: <strong>${p.code}</strong></p><p>แชร์ลิงก์: ${ENV.frontendAppUrl}?ref=${p.code}</p>`,
    text: `Affiliate อนุมัติแล้ว รหัส: ${p.code}`,
  }),
  contact_form: (p) => ({
    html: `<h2>ข้อความจากเว็บไซต์</h2><p><strong>ชื่อ:</strong> ${p.name}</p><p><strong>อีเมล:</strong> ${p.email}</p><p><strong>หัวข้อ:</strong> ${p.subject}</p><hr/><p>${String(p.message).replace(/\n/g, "<br/>")}</p>`,
    text: `จาก: ${p.name} <${p.email}>\nหัวข้อ: ${p.subject}\n\n${p.message}`,
  }),
  contact_autoreply: (p) => ({
    html: `<h2>ขอบคุณ ${p.name}!</h2><p>เราได้รับข้อความของคุณแล้ว ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง</p><p><a href="${ENV.frontendAppUrl}">กลับไปที่เว็บไซต์</a></p>`,
    text: `ขอบคุณ ${p.name}! เราได้รับข้อความของคุณแล้ว จะติดต่อกลับภายใน 24 ชั่วโมง`,
  }),
};

// ===== SMTP SENDER =====
async function sendViaSMTP(to: string, subject: string, html: string, text: string): Promise<void> {
  if (!ENV.smtpHost || !ENV.smtpUser) {
    console.log(`[Email] SMTP not configured. Would send to ${to}: ${subject}`);
    return;
  }
  // Dynamic import to avoid loading nodemailer when not needed
  const nodemailer = await import("nodemailer").catch(() => null);
  if (!nodemailer) {
    console.warn("[Email] nodemailer not installed. Run: pnpm add nodemailer");
    return;
  }
  const transporter = nodemailer.default.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpPort === 465,
    auth: { user: ENV.smtpUser, pass: ENV.smtpPass },
  });
  await transporter.sendMail({ from: ENV.smtpFrom, to, subject, html, text });
}

// ===== PROCESS QUEUE (call from a cron or background job) =====
export async function processEmailQueue(batchSize = 10): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const now = new Date();
  const items = await db
    .select()
    .from(emailQueue)
    .where(and(eq(emailQueue.status, "queued"), lte(emailQueue.scheduledAt, now)))
    .limit(batchSize);

  let sent = 0;
  for (const item of items) {
    const tpl = templates[item.template];
    if (!tpl) {
      await db.update(emailQueue).set({ status: "skipped" }).where(eq(emailQueue.id, item.id));
      continue;
    }
    try {
      const { html, text } = tpl(item.payload as Record<string, unknown>);
      await sendViaSMTP(item.to, item.subject, html, text);
      await db.update(emailQueue).set({ status: "sent", sentAt: new Date() }).where(eq(emailQueue.id, item.id));
      sent++;
    } catch (err) {
      const attempts = (item.attempts ?? 0) + 1;
      await db.update(emailQueue).set({
        attempts,
        lastError: String(err),
        status: attempts >= 3 ? "failed" : "queued",
      }).where(eq(emailQueue.id, item.id));
    }
  }
  return sent;
}
