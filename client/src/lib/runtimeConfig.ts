const HARDCODED_API_URL = "https://neoxppro-production.up.railway.app";

export function getApiBaseUrl() {
  const fromEnv = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");
  return fromEnv || HARDCODED_API_URL;
}

export function getApiUrl(path: string) {
  const base = getApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
