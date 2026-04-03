export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getApiBaseUrl } from "./lib/runtimeConfig";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  if (typeof window === "undefined") return "/";

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL as string | undefined;
  const appId = import.meta.env.VITE_APP_ID as string | undefined;
  const callbackBase = getApiBaseUrl() || window.location.origin;
  const redirectUri = `${callbackBase}/api/oauth/callback`;
  const state = btoa(redirectUri);

  if (!oauthPortalUrl || !appId) {
    // Avoid crashing the whole app when env isn't configured (e.g., static Pages deploy).
    // Backend/OAuth must be configured separately for real sign-in.
    return "/auth";
  }

  let url: URL;
  try {
    // Supports absolute or relative portal URL.
    url = new URL(`${oauthPortalUrl.replace(/\/$/, "")}/app-auth`, window.location.origin);
  } catch {
    return "/auth";
  }

  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
