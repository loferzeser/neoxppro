import type { NextFunction, Request, Response } from "express";

export function createRateLimiter(options: { windowMs: number; max: number }) {
  const buckets = new Map<string, number[]>();

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const key = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    let timestamps = buckets.get(key) ?? [];
    timestamps = timestamps.filter((t) => now - t < options.windowMs);
    if (timestamps.length >= options.max) {
      res.status(429).json({ error: "Too many requests" });
      return;
    }
    timestamps.push(now);
    buckets.set(key, timestamps);
    next();
  };
}
