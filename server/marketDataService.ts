import { z } from "zod";

// Twelve Data API (ฟรี 800 requests/วัน, real-time data)
const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY || "";
const BASE_URL = "https://api.twelvedata.com";

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

  // ถ้าไม่มี API key ใช้ fallback
  if (!TWELVE_DATA_KEY) {
    console.warn("TWELVE_DATA_API_KEY not set, using fallback data");
    return getFallbackData();
  }

  try {
    // ดึงข้อมูลจริงจาก Twelve Data (รองรับ batch request)
    const symbols = [
      "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD",
      "BTC/USD", "ETH/USD", "XAU/USD",
      "NDX", "SPX" // Nasdaq 100 & S&P 500
    ];
    
    const url = `${BASE_URL}/quote?symbol=${symbols.join(",")}&apikey=${TWELVE_DATA_KEY}`;
    const res = await fetch(url);
    const json = await res.json();
    
    // Twelve Data returns object with symbol keys for batch requests
    const data: TickerData[] = [];
    
    for (const symbol of symbols) {
      const quote = json[symbol];
      if (!quote || quote.code === 400) continue;
      
      const price = parseFloat(quote.close || quote.price || "0");
      const change = parseFloat(quote.percent_change || "0");
      
      // Format display name
      let displayName = symbol;
      if (symbol === "NDX") displayName = "NAS100";
      if (symbol === "SPX") displayName = "SPX500";
      
      data.push({
        pair: displayName,
        price: price > 1000 
          ? price.toLocaleString("en-US", { maximumFractionDigits: 0 })
          : price.toFixed(4),
        change: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
        up: change >= 0,
      });
    }

    if (data.length === 0) {
      throw new Error("No data received from API");
    }

    cachedData = data;
    lastFetch = now;
    return data;
  } catch (error) {
    console.error("Market data fetch error:", error);
    // Fallback เป็นข้อมูลสมมติถ้า API ล้ม
    return getFallbackData();
  }
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
