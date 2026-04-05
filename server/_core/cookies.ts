import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname;
  const isLocalHost =
    !hostname ||
    LOCAL_HOSTS.has(hostname) ||
    isIpAddress(hostname) ||
    hostname === "127.0.0.1" ||
    hostname === "::1";
  const secure = isSecureRequest(req) || process.env.NODE_ENV === "production";
  const sameSite = secure && !isLocalHost ? "none" : "lax";

  // Explicit domain for cross-domain cookies (Railway backend → Cloudflare frontend)
  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

  return {
    httpOnly: true,
    path: "/",
    sameSite,
    secure,
    ...(cookieDomain && !isLocalHost ? { domain: cookieDomain } : {}),
  };
}
