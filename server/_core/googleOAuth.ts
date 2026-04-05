/**
 * Google OAuth 2.0 — standalone, no external SDK needed
 *
 * Setup:
 * 1. Go to https://console.cloud.google.com → APIs & Services → Credentials
 * 2. Create OAuth 2.0 Client ID (Web application)
 * 3. Add Authorized redirect URI: https://your-api.railway.app/api/auth/google/callback
 * 4. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Railway env
 */

import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? "";

function getPostLoginRedirect() {
  const url = process.env.FRONTEND_APP_URL?.trim() ?? "http://localhost:5173";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  id_token: string;
}> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json();
}

async function getGoogleUserInfo(accessToken: string): Promise<{
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to get user info: ${await res.text()}`);
  return res.json();
}

export function registerGoogleOAuthRoutes(app: Express) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    console.warn("[Google OAuth] Skipped — GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI not set");
    return;
  }

  // Step 1: Redirect to Google
  app.get("/api/auth/google", (_req: Request, res: Response) => {
    const state = Buffer.from(Date.now().toString()).toString("base64");
    const url = buildGoogleAuthUrl(state);
    res.redirect(302, url);
  });

  // Step 2: Google redirects back here
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query["code"] as string | undefined;
    const error = req.query["error"] as string | undefined;

    if (error || !code) {
      console.error("[Google OAuth] Callback error:", error);
      res.redirect(302, `${getPostLoginRedirect()}/auth?error=oauth_failed`);
      return;
    }

    try {
      const tokens = await exchangeCodeForTokens(code);
      const googleUser = await getGoogleUserInfo(tokens.access_token);

      if (!googleUser.email_verified) {
        res.redirect(302, `${getPostLoginRedirect()}/auth?error=email_not_verified`);
        return;
      }

      const openId = `google:${googleUser.sub}`;

      await db.upsertUser({
        openId,
        name: googleUser.name,
        email: googleUser.email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: googleUser.name,
        expiresInMs: ONE_YEAR_MS,
      });

      const frontendUrl = getPostLoginRedirect();
      const cookieOptions = getSessionCookieOptions(req);

      // Try setting cookie directly (works if same domain)
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Also pass token via URL hash so frontend can store it (cross-domain fallback)
      res.redirect(302, `${frontendUrl}/#/auth/callback?token=${encodeURIComponent(sessionToken)}`);
    } catch (err) {
      console.error("[Google OAuth] Failed:", err);
      res.redirect(302, `${getPostLoginRedirect()}/auth?error=server_error`);
    }
  });

  console.log("[Google OAuth] Routes registered: GET /api/auth/google");
}
