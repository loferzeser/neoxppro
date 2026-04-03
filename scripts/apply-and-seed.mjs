import { createConnection } from "mysql2/promise";
import { config } from "dotenv";
config({ path: ".env" });

const conn = await createConnection(process.env.DATABASE_URL);

// Create products table (TiDB compatible - no json defaults)
await conn.execute(`CREATE TABLE IF NOT EXISTS products (
  id int AUTO_INCREMENT NOT NULL,
  slug varchar(128) NOT NULL,
  name varchar(255) NOT NULL,
  shortDesc text,
  description text,
  price decimal(10,2) NOT NULL,
  salePrice decimal(10,2),
  category enum('scalping','swing','grid','hedging','trend','arbitrage','other') NOT NULL DEFAULT 'other',
  platform enum('MT4','MT5','both') NOT NULL DEFAULT 'MT4',
  currency varchar(10) NOT NULL DEFAULT 'THB',
  imageUrl text,
  screenshotUrls json,
  fileKey text,
  fileUrl text,
  winRate decimal(5,2),
  monthlyReturn decimal(5,2),
  maxDrawdown decimal(5,2),
  profitFactor decimal(5,2),
  totalTrades int,
  isActive boolean NOT NULL DEFAULT true,
  isFeatured boolean NOT NULL DEFAULT false,
  isNew boolean NOT NULL DEFAULT false,
  downloadCount int NOT NULL DEFAULT 0,
  tags json,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY products_slug_unique (slug)
)`);
console.log("✓ products table ready");

await conn.execute(`CREATE TABLE IF NOT EXISTS reviews (
  id int AUTO_INCREMENT NOT NULL,
  productId int NOT NULL,
  userId int NOT NULL,
  rating int NOT NULL,
  title varchar(255),
  content text,
  isVerified boolean NOT NULL DEFAULT false,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
)`);
console.log("✓ reviews table ready");

const [tables] = await conn.execute("SHOW TABLES");
console.log("All tables:", tables.map(r => Object.values(r)[0]));

// Seed products
const products = [
  ["gold-scalper-pro","Gold Scalper Pro","EA Scalping XAUUSD ที่มีความแม่นยำสูง ผลตอบแทนสม่ำเสมอทุกเดือน","Gold Scalper Pro คือ Expert Advisor ที่ออกแบบมาเฉพาะสำหรับการเทรด XAUUSD (Gold) ด้วยกลยุทธ์ Scalping ที่ผ่านการทดสอบมาแล้วกว่า 5 ปี\n\nคุณสมบัติเด่น:\n- ระบบ Scalping อัตโนมัติ 24/5\n- Risk Management ในตัว\n- ทำงานได้ดีในทุกสภาวะตลาด\n- ไม่ใช้ Martingale\n- ทดสอบบน Live Account จริง","9900.00","7900.00","scalping","MT4","https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80","87.3","12.5","8.2","2.45",15420,1,1,1,342,'["XAUUSD","Scalping","Low Risk","MT4"]'],
  ["forex-trend-master","Forex Trend Master","EA ตามเทรนด์สำหรับคู่เงินหลัก EUR/USD, GBP/USD ผลตอบแทนสูง","Forex Trend Master ใช้กลยุทธ์ Trend Following ที่ผสมผสาน Moving Average, RSI และ MACD เพื่อจับเทรนด์ได้อย่างแม่นยำ\n\nเหมาะสำหรับ:\n- EUR/USD, GBP/USD, USD/JPY\n- Timeframe H1, H4, D1\n- Capital ขั้นต่ำ $500","14900.00","12900.00","trend","MT5","https://images.unsplash.com/photo-1642790551116-18e150f248e3?w=800&q=80","79.8","18.3","12.1","3.12",8930,1,1,0,218,'["EURUSD","GBPUSD","Trend","MT5"]'],
  ["crypto-grid-bot","Crypto Grid Bot","Grid Trading Bot สำหรับ BTC/USD และ ETH/USD ในตลาด Crypto","Crypto Grid Bot ใช้กลยุทธ์ Grid Trading ที่ทำกำไรได้ทั้งในตลาดขาขึ้นและขาลง โดยการวาง Order ไว้ในช่วงราคาที่กำหนด\n\nจุดเด่น:\n- ทำกำไรได้ในทุกทิศทาง\n- Compound Interest อัตโนมัติ\n- ตั้งค่าง่าย","19900.00",null,"grid","MT5","https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80","91.2","22.7","15.4","4.21",22100,1,1,1,156,'["BTCUSD","ETHUSD","Grid","Crypto","MT5"]'],
  ["news-trader-ai","News Trader AI","EA เทรดข่าว NFP, CPI, FOMC ด้วย AI วิเคราะห์ตลาดแบบ Real-time","News Trader AI ใช้ Machine Learning ในการวิเคราะห์ข่าวเศรษฐกิจและเทรดอัตโนมัติในช่วงเวลาที่ตลาดผันผวนสูง\n\nรองรับข่าว:\n- NFP (Non-Farm Payroll)\n- CPI, PPI\n- FOMC Meeting\n- GDP Data","24900.00","19900.00","other","MT4","https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80","82.5","31.2","18.7","2.87",4520,1,0,1,89,'["News","AI","NFP","FOMC","MT4"]'],
  ["swing-master-pro","Swing Master Pro","EA Swing Trading สำหรับนักเทรดที่ต้องการผลตอบแทนระยะกลาง","Swing Master Pro วิเคราะห์ Price Action และ Support/Resistance เพื่อจับจุดเข้าออกที่แม่นยำในกรอบเวลา H4 และ D1\n\nเหมาะสำหรับ:\n- นักเทรดที่ไม่ต้องการดูหน้าจอตลอดเวลา\n- Capital ขั้นต่ำ $1,000\n- ผลตอบแทนระยะกลาง 3-6 เดือน","16900.00",null,"swing","both","https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80","74.6","15.8","9.3","2.68",6780,1,0,0,124,'["Swing","Price Action","H4","MT4","MT5"]'],
  ["hedge-master-v2","Hedge Master V2","EA Hedging ขั้นสูงที่ป้องกันความเสี่ยงและทำกำไรพร้อมกัน","Hedge Master V2 ใช้กลยุทธ์ Hedging ที่ซับซ้อนเพื่อลดความเสี่ยงและสร้างกำไรในทุกสภาวะตลาด\n\nเทคนิคพิเศษ:\n- Dynamic Hedging\n- Correlation Analysis\n- Multi-pair Trading\n- Auto Rebalancing","29900.00","24900.00","hedging","MT5","https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80","93.1","28.4","6.8","5.32",31200,1,1,0,201,'["Hedging","Multi-pair","Low Risk","MT5"]'],
];

for (const p of products) {
  try {
    await conn.execute(
      `INSERT IGNORE INTO products (slug, name, shortDesc, description, price, salePrice, category, platform, imageUrl, winRate, monthlyReturn, maxDrawdown, profitFactor, totalTrades, isActive, isFeatured, isNew, downloadCount, tags)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      p
    );
    console.log(`✓ ${p[1]}`);
  } catch(e) {
    console.error(`✗ ${p[1]}:`, e.message);
  }
}

const [rows] = await conn.execute("SELECT id, name, price FROM products");
console.log(`\n✅ ${rows.length} products in DB`);
rows.forEach(r => console.log(` - [${r.id}] ${r.name} ฿${r.price}`));

await conn.end();
