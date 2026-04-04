// Simple in-memory rate limiter for AI chat
// Prevents abuse and manages OpenRouter free tier limits

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const userLimits = new Map<string, RateLimitEntry>();
const ipLimits = new Map<string, RateLimitEntry>();

// Limits
const USER_LIMIT = 10; // 10 messages per hour per user
const IP_LIMIT = 20; // 20 messages per hour per IP
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkRateLimit(userId: string | null, ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  
  // Check user limit (if authenticated)
  if (userId) {
    const userEntry = userLimits.get(userId);
    
    if (!userEntry || now > userEntry.resetAt) {
      // Reset or create new entry
      const resetAt = now + WINDOW_MS;
      userLimits.set(userId, { count: 1, resetAt });
      return { allowed: true, remaining: USER_LIMIT - 1, resetAt };
    }
    
    if (userEntry.count >= USER_LIMIT) {
      return { allowed: false, remaining: 0, resetAt: userEntry.resetAt };
    }
    
    userEntry.count++;
    return { allowed: true, remaining: USER_LIMIT - userEntry.count, resetAt: userEntry.resetAt };
  }
  
  // Check IP limit (for anonymous users)
  const ipEntry = ipLimits.get(ip);
  
  if (!ipEntry || now > ipEntry.resetAt) {
    const resetAt = now + WINDOW_MS;
    ipLimits.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: IP_LIMIT - 1, resetAt };
  }
  
  if (ipEntry.count >= IP_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: ipEntry.resetAt };
  }
  
  ipEntry.count++;
  return { allowed: true, remaining: IP_LIMIT - ipEntry.count, resetAt: ipEntry.resetAt };
}

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  
  for (const [key, entry] of userLimits.entries()) {
    if (now > entry.resetAt) {
      userLimits.delete(key);
    }
  }
  
  for (const [key, entry] of ipLimits.entries()) {
    if (now > entry.resetAt) {
      ipLimits.delete(key);
    }
  }
  
  console.log(`[Rate Limiter] Cleaned up. Active users: ${userLimits.size}, IPs: ${ipLimits.size}`);
}, 10 * 60 * 1000);
