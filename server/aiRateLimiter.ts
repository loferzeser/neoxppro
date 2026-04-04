// Simple in-memory rate limiter for AI chat
// Prevents abuse and manages OpenRouter free tier limits

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const userLimits = new Map<string, RateLimitEntry>();

// Limits
export const USER_LIMIT = 10; // 10 messages per hour per user
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkRateLimit(userId: string, ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  
  // Check user limit
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

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  
  for (const [key, entry] of userLimits.entries()) {
    if (now > entry.resetAt) {
      userLimits.delete(key);
    }
  }
  
  console.log(`[Rate Limiter] Cleaned up. Active users: ${userLimits.size}`);
}, 10 * 60 * 1000);
