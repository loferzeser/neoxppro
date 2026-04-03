# NEOXP Go-Live Checklist

## Runtime & Deployment
- [ ] Frontend (`Cloudflare Pages`) built with `VITE_API_BASE_URL` set to Railway API URL
- [ ] Backend (`Railway`) has `PORT`, `JWT_SECRET`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_APP_URL`
- [ ] Health check passes at `/api/healthz`
- [ ] Cloudflare Pages: `client/public/_redirects` ships with the build (SPA fallback to `/index.html`; hashed `/assets/*` files still resolve as static files)

## Auth & Access
- [ ] OAuth login redirects back to frontend domain after callback
- [ ] Email/password register/login works in production
- [ ] Role access checks verified for `service`, `admin`, `super_admin`, `developer`
- [ ] Admin routes blocked for unauthorized users

## Commerce & Payment
- [ ] Create pending order and Stripe checkout session works
- [ ] Stripe webhook marks only valid orders as paid
- [ ] Client-side payment confirmation cannot bypass Stripe webhook for card/promptpay
- [ ] Download links expire correctly for rental products

## Security & Privacy
- [ ] `CORS_ALLOWED_ORIGINS` allowlist is strict
- [ ] Cookie flags are correct (`secure`, `httpOnly`, `sameSite`)
- [ ] Cookie consent banner appears and stores user choice
- [ ] Basic security headers present (`nosniff`, `frame deny`, `referrer policy`)

## Operations
- [ ] Error tracking enabled (Sentry or equivalent)
- [ ] Uptime monitor checks frontend + `/api/healthz`
- [ ] DB backup policy documented and tested
- [ ] Rollback procedure tested with last known good frontend+backend pair
- [ ] Admin `Catalog` panel loads products and can add/toggle product assets
- [ ] Admin `Operations` panel can list webhook events and retry a failed event
- [ ] Admin `Security` panel shows CORS/cookie/CSRF/Sentry diagnostics

## Rollback Plan
1. Re-deploy previous stable Railway backend release.
2. Re-deploy previous stable Cloudflare Pages build.
3. Validate `/api/healthz`, login, and checkout flow.
4. Keep broken release frozen for postmortem.

## E2E Scenarios
- [ ] Register with email/password -> login -> logout
- [ ] Admin (`admin` role) creates product, adds versioned asset, updates sale/rental fields
- [ ] Place order -> complete Stripe checkout -> webhook recorded as `processed`
- [ ] Simulate failed webhook and retry from Operations panel
- [ ] Verify `service` cannot write Security panel settings

