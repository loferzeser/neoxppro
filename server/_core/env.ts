const required = (key: string, value: string, onlyInProd = true) => {
  if (onlyInProd && process.env.NODE_ENV !== "production") return;
  if (!value) throw new Error(`[ENV] ${key} is required in production`);
};

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  apiEncryptionKey: process.env.API_ENCRYPTION_KEY ?? "",
  // Email
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? "587"),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: process.env.SMTP_FROM ?? "noreply@neoxp.store",
  // Enterprise
  frontendAppUrl: process.env.FRONTEND_APP_URL ?? "http://localhost:5173",
  csrfSecret: process.env.CSRF_SECRET ?? "",
  sentryDsn: process.env.SENTRY_DSN ?? "",
  // S3
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
};

// Fail-fast validation
required("JWT_SECRET", ENV.cookieSecret);
required("DATABASE_URL", ENV.databaseUrl);
