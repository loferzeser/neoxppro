import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await createConnection(DATABASE_URL);

// Show tables
const [tables] = await conn.execute("SHOW TABLES");
console.log("Tables:", tables.map(r => Object.values(r)[0]));

// Seed products
const products = [
  {
    slug: "gold-scalper-pro",
    name: "Gold Scalper Pro",
    shortDesc: "EA Scalping XAUUSD ที่มีความแม่นยำสูง ผลตอบแทนสม่ำเสมอทุกเดือน",
    description: "Gold Scalper Pro คือ Expert Advisor ที่ออกแบบมาเฉพาะสำหรับการเทรด XAUUSD (Gold) ด้วยกลยุทธ์ Scalping ที่ผ่านการทดสอบมาแล้วกว่า 5 ปี\n\nคุณสมบัติเด่น:\n- ระบบ Scalping อัตโนมัติ 24/5\n- Risk Management ในตัว\n- ทำงานได้ดีในทุกสภาวะตลาด\n- ไม่ใช้ Martingale\n- ทดสอบบน Live Account จริง",
    price: "9900.00",
    salePrice: "7900.00",
    category: "scalping",
    platform: "MT4",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    winRate: "87.3",
    monthlyReturn: "12.5",
    maxDrawdown: "8.2",
    profitFactor: "2.45",
    totalTrades: 15420,
    isActive: 1, isFeatured: 1, isNew: 1,
    tags: JSON.stringify(["XAUUSD","Scalping","Low Risk","MT4"]),
    screenshotUrls: JSON.stringify([]),
    downloadCount: 342,
  },
  {
    slug: "forex-trend-master",
    name: "Forex Trend Master",
    shortDesc: "EA ตามเทรนด์สำหรับคู่เงินหลัก EUR/USD, GBP/USD ผลตอบแทนสูง",
    description: "Forex Trend Master ใช้กลยุทธ์ Trend Following ที่ผสมผสาน Moving Average, RSI และ MACD เพื่อจับเทรนด์ได้อย่างแม่นยำ\n\nเหมาะสำหรับ:\n- EUR/USD, GBP/USD, USD/JPY\n- Timeframe H1, H4, D1\n- Capital ขั้นต่ำ $500",
    price: "14900.00",
    salePrice: "12900.00",
    category: "trend",
    platform: "MT5",
    imageUrl: "https://images.unsplash.com/photo-1642790551116-18e150f248e3?w=800&q=80",
    winRate: "79.8",
    monthlyReturn: "18.3",
    maxDrawdown: "12.1",
    profitFactor: "3.12",
    totalTrades: 8930,
    isActive: 1, isFeatured: 1, isNew: 0,
    tags: JSON.stringify(["EURUSD","GBPUSD","Trend","MT5"]),
    screenshotUrls: JSON.stringify([]),
    downloadCount: 218,
  },
  {
    slug: "crypto-grid-bot",
    name: "Crypto Grid Bot",
    shortDesc: "Grid Trading Bot สำหรับ BTC/USD และ ETH/USD ในตลาด Crypto",
    description: "Crypto Grid Bot ใช้กลยุทธ์ Grid Trading ที่ทำกำไรได้ทั้งในตลาดขาขึ้นและขาลง โดยการวาง Order ไว้ในช่วงราคาที่กำหนด\n\nจุดเด่น:\n- ทำกำไรได้ในทุกทิศทาง\n- Compound Interest อัตโนมัติ\n- ตั้งค่าง่าย",
    price: "19900.00",
    salePrice: null,
    category: "grid",
    platform: "MT5",
    imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80",
    winRate: "91.2",
    monthlyReturn: "22.7",
    maxDrawdown: "15.4",
    profitFactor: "4.21",
    totalTrades: 22100,
    isActive: 1, isFeatured: 1, isNew: 1,
    tags: JSON.stringify(["BTCUSD","ETHUSD","Grid","Crypto","MT5"]),
    screenshotUrls: JSON.stringify([]),
    downloadCount: 156,
  },
  {
    slug: "news-trader-ai",
    name: "News Trader AI",
    shortDesc: "EA เทรดข่าว NFP, CPI, FOMC ด้วย AI วิเคราะห์ตลาดแบบ Real-time",
    description: "News Trader AI ใช้ Machine Learning ในการวิเคราะห์ข่าวเศรษฐกิจและเทรดอัตโนมัติในช่วงเวลาที่ตลาดผันผวนสูง\n\nรองรับข่าว:\n- NFP (Non-Farm Payroll)\n- CPI, PPI\n- FOMC Meeting\n- GDP Data",
    price: "24900.00",
    salePrice: "19900.00",
    category: "other",
    platform: "MT4",
    imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80",
    winRate: "82.5",
    monthlyReturn: "31.2",
    maxDrawdown: "18.7",
    profitFactor: "2.87",
    totalTrades: 4520,
    isActive: 1, isFeatured: 0, isNew: 1,
    tags: JSON.stringify(["News","AI","NFP","FOMC","MT4"]),
    screenshotUrls: JSON.stringify([]),
    downloadCount: 89,
  },
  {
    slug: "swing-master-pro",
    name: "Swing Master Pro",
    shortDesc: "EA Swing Trading สำหรับนักเทรดที่ต้องการผลตอบแทนระยะกลาง",
    description: "Swing Master Pro วิเคราะห์ Price Action และ Support/Resistance เพื่อจับจุดเข้าออกที่แม่นยำในกรอบเวลา H4 และ D1\n\nเหมาะสำหรับ:\n- นักเทรดที่ไม่ต้องการดูหน้าจอตลอดเวลา\n- Capital ขั้นต่ำ $1,000\n- ผลตอบแทนระยะกลาง 3-6 เดือน",
    price: "16900.00",
    salePrice: null,
    category: "swing",
    platform: "both",
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80",
    winRate: "74.6",
    monthlyReturn: "15.8",
    maxDrawdown: "9.3",
    profitFactor: "2.68",
    totalTrades: 6780,
    isActive: 1, isFeatured: 0, isNew: 0,
    tags: JSON.stringify(["Swing","Price Action","H4","MT4","MT5"]),
    screenshotUrls: JSON.stringify([]),
    downloadCount: 124,
  },
  {
    slug: "hedge-master-v2",
    name: "Hedge Master V2",
    shortDesc: "EA Hedging ขั้นสูงที่ป้องกันความเสี่ยงและทำกำไรพร้อมกัน",
    description: "Hedge Master V2 ใช้กลยุทธ์ Hedging ที่ซับซ้อนเพื่อลดความเสี่ยงและสร้างกำไรในทุกสภาวะตลาด\n\nเทคนิคพิเศษ:\n- Dynamic Hedging\n- Correlation Analysis\n- Multi-pair Trading\n- Auto Rebalancing",
    price: "29900.00",
    salePrice: "24900.00",
    category: "hedging",
    platform: "MT5",
    imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80",
    winRate: "93.1",
    monthlyReturn: "28.4",
    maxDrawdown: "6.8",
    profitFactor: "5.32",
    totalTrades: 31200,
    isActive: 1, isFeatured: 1, isNew: 0,
    tags: JSON.stringify(["Hedging","Multi-pair","Low Risk","MT5"]),
    screenshotUrls: JSON.stringify([]),
    downloadCount: 201,
  },
  {
    slug: "tv-rsi-divergence-pro-rental",
    name: "TradingView RSI Divergence Pro",
    shortDesc: "Indicator สำหรับ TradingView พร้อมระบบแจ้งเตือน divergence แบบเรียลไทม์ (เช่ารายเดือน)",
    description: "อินดิเคเตอร์สำหรับ TradingView ที่ช่วยจับ RSI divergence พร้อม alert อัตโนมัติ เหมาะกับสายเทรด intraday/swing\n\nสิ่งที่ได้:\n- สคริปต์ Pine สำหรับใช้งานบน TradingView\n- คู่มือการตั้งค่า\n- สิทธิ์การใช้งานแบบเช่า 30 วัน",
    price: "2490.00",
    salePrice: null,
    category: "indicator_tv",
    platform: "both",
    saleType: "rent",
    rentalPrice: "990.00",
    rentalDurationDays: 30,
    imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80",
    winRate: null,
    monthlyReturn: null,
    maxDrawdown: null,
    profitFactor: null,
    totalTrades: null,
    isActive: 1, isFeatured: 1, isNew: 1,
    tags: JSON.stringify(["TradingView", "Indicator", "RSI", "Rental"]),
    screenshotUrls: JSON.stringify([]),
    downloadCount: 0,
  },
];

for (const p of products) {
  try {
    await conn.execute(
      `INSERT IGNORE INTO products (slug, name, shortDesc, description, price, salePrice, category, platform, saleType, rentalPrice, rentalDurationDays, imageUrl, winRate, monthlyReturn, maxDrawdown, profitFactor, totalTrades, isActive, isFeatured, isNew, tags, screenshotUrls, downloadCount, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [p.slug, p.name, p.shortDesc, p.description, p.price, p.salePrice, p.category, p.platform, p.saleType ?? "buy_once", p.rentalPrice ?? null, p.rentalDurationDays ?? null, p.imageUrl, p.winRate, p.monthlyReturn, p.maxDrawdown, p.profitFactor, p.totalTrades, p.isActive, p.isFeatured, p.isNew, p.tags, p.screenshotUrls, p.downloadCount]
    );
    console.log(`✓ Inserted: ${p.name}`);
  } catch (e) {
    console.error(`✗ Failed ${p.name}:`, e.message);
  }
}

const [rows] = await conn.execute("SELECT id, name, price FROM products");
console.log("Products in DB:", rows);

const flags = [
  ["ai_bot_enabled", 1, "Floating AI assistant"],
  ["stripe_live_mode", 0, "Use Stripe live keys"],
  ["promptpay_enabled", 1, "PromptPay via Stripe"],
  ["crypto_payments_enabled", 1, "Show crypto instructions"],
  ["maintenance_mode", 0, "Maintenance gate"],
  ["registration_open", 1, "Allow sign-ups"],
  ["reviews_enabled", 1, "Product reviews"],
];
for (const [name, value, description] of flags) {
  try {
    await conn.execute(
      `INSERT IGNORE INTO feature_flags (\`name\`, \`value\`, \`description\`, \`updatedAt\`) VALUES (?, ?, ?, NOW())`,
      [name, value, description]
    );
  } catch (e) {
    console.warn("feature_flags", name, e.message);
  }
}

const sys = [
  ["shop_name", "NEOXP Store", "shop", "Display name"],
  ["shop_url", "https://neoxp.shop", "shop", "Public URL"],
  ["support_email", "support@neoxp.shop", "shop", "Support"],
  ["max_download_attempts", "5", "orders", "Max downloads"],
  ["download_link_expiry_days", "365", "orders", "Expiry"],
  ["default_currency", "THB", "orders", "Currency"],
  ["min_order_amount", "0", "orders", "Minimum"],
  ["stripe_currency", "thb", "orders", "Stripe currency"],
  ["ai_model_name", "gpt-4o", "ai", "Model"],
  ["ai_max_tokens", "2048", "ai", "Max tokens"],
  ["ai_temperature", "0.7", "ai", "Temperature"],
];
for (const [key, value, category, description] of sys) {
  try {
    await conn.execute(
      `INSERT IGNORE INTO system_config (\`key\`, \`value\`, \`category\`, \`description\`, \`updatedAt\`) VALUES (?, ?, ?, ?, NOW())`,
      [key, value, category, description]
    );
  } catch (e) {
    console.warn("system_config", key, e.message);
  }
}

await conn.end();
