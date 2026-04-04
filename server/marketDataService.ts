import { z } from "zod";

// Alpha Vantage API (ฟรี 25-500 requests/วัน)
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || "demo";
const BASE_URL = "https://www.alphavantage.co/query";

interface TickerData {
  pair: string;
  price: string;
  change: string;
  up: boolean;
}

// Cache ข้อมูล 30 วินาที เพื่อประหยัด API calls
let cachedData: TickerData[] | null = null;
let lastFetch = 0;
const CACHE_DURATION = 30000; // 30 seconds

export async function getMarketData(): Promise<TickerData[]> {
  const now = Date.now();
  
  // ใช้ cache ถ้ายังไม่หมดอายุ
  if (cachedData && now - lastFetch < CACHE_DURATION) {
    return cachedData;
  }

  try {
    // ดึงข้อมูลจริงจาก Alpha Vantage
    const [forex1, forex2, forex3, crypto1, crypto2] = await Promise.all([
      fetchForex("EUR", "USD"),
      fetchForex("GBP", "USD"),
      fetchForex("USD", "JPY"),
      fetchCrypto("BTC"),
      fetchCrypto("ETH"),
    ]);

    const data: TickerData[] = [
      forex1,
      forex2,
      forex3,
      crypto1,
      crypto2,
      // Fallback สำหรับ indices (Alpha Vantage ฟรีไม่มี indices)
      { pair: "NAS100", price: "18,234", change: "+0.55%", up: true },
      { pair: "SPX500", price: "5,102", change: "-0.08%", up: false },
      { pair: "AUD/USD", price: "0.6548", change: "+0.14%", up: true },
      { pair: "USD/CAD", price: "1.3612", change: "-0.19%", up: false },
      { pair: "XAU/USD", price: "2,341.80", change: "+0.42%", up: true },
    ];

    cachedData = data;
    lastFetch = now;
    return data;
  } catch (error) {
    console.error("Market data fetch error:", error);
    // Fallback เป็นข้อมูลสมมติถ้า API ล้ม
    return getFallbackData();
  }
}

async function fetchForex(from: string, to: string): Promise<TickerData> {
  const url = `${BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${ALPHA_VANTAGE_KEY}`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  const rate = data["Realtime Currency Exchange Rate"];
  if (!rate) throw new Error("No forex data");
  
  const price = parseFloat(rate["5. Exchange Rate"]);
  const change = parseFloat(rate["9. Change Percent"].replace("%", ""));
  
  return {
    pair: `${from}/${to}`,
    price: price.toFixed(4),
    change: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
    up: change >= 0,
  };
}

async function fetchCrypto(symbol: string): Promise<TickerData> {
  const url = `${BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=USD&apikey=${ALPHA_VANTAGE_KEY}`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  const rate = data["Realtime Currency Exchange Rate"];
  if (!rate) throw new Error("No crypto data");
  
  const price = parseFloat(rate["5. Exchange Rate"]);
  const change = parseFloat(rate["9. Change Percent"].replace("%", ""));
  
  return {
    pair: `${symbol}/USD`,
    price: price > 1000 ? price.toLocaleString("en-US", { maximumFractionDigits: 0 }) : price.toFixed(2),
    change: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
    up: change >= 0,
  };
}

function getFallbackData(): TickerData[] {
  return [
    { pair: "EUR/USD", price: "1.0834", change: "-0.11%", up: false },
    { pair: "GBP/USD", price: "1.2662", change: "+0.07%", up: true },
    { pair: "USD/JPY", price: "149.82", change: "+0.23%", up: true },
    { pair: "BTC/USD", price: "67,420", change: "+1.84%", up: true },
    { pair: "ETH/USD", price: "3,521", change: "+2.12%", up: true },
    { pair: "NAS100", price: "18,234", change: "+0.55%", up: true },
    { pair: "SPX500", price: "5,102", change: "-0.08%", up: false },
    { pair: "AUD/USD", price: "0.6548", change: "+0.14%", up: true },
    { pair: "USD/CAD", price: "1.3612", change: "-0.19%", up: false },
    { pair: "XAU/USD", price: "2,341.80", change: "+0.42%", up: true },
  ];
}
