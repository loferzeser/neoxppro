# แก้ปัญหา Google OAuth - ไม่ขึ้นเมนูบัญชีหลังล็อกอิน

## สาเหตุ
Cookie ไม่ถูกส่งระหว่าง Railway backend (`neoxppro-production.up.railway.app`) กับ Cloudflare frontend (`neoxp.shop`) เพราะเป็นคนละ domain

## วิธีแก้ (ทำตามลำดับ)

### 1. เพิ่ม Environment Variable ใน Railway

ไปที่ Railway Dashboard → neoxppro → Variables → เพิ่มตัวแปรนี้:

```
COOKIE_DOMAIN=.neoxp.shop
```

**สำคัญ:** ต้องมีจุด (.) ข้างหน้า เพื่อให้ cookie ใช้ได้ทั้ง `neoxp.shop` และ `*.neoxp.shop`

### 2. Redeploy Railway

หลังเพิ่ม environment variable แล้ว Railway จะ redeploy อัตโนมัติ

### 3. ตรวจสอบว่า Cookie ถูกตั้งค่าถูกต้อง

1. เปิด `https://neoxp.shop`
2. กด F12 → Console
3. พิมพ์: `document.cookie`
4. ควรเห็น `ea-bot-shop-session=...`

หรือดูใน:
- F12 → Application → Cookies → `https://neoxp.shop`
- ควรเห็น cookie ชื่อ `ea-bot-shop-session`

### 4. ทดสอบ Login

1. ไปที่ `https://neoxp.shop`
2. กด "เข้าสู่ระบบ"
3. เลือก "ลงชื่อเข้าใช้ด้วย Google"
4. เลือกบัญชี Google
5. หลังจาก redirect กลับมา ควรเห็นเมนูบัญชีที่มุมขวาบน

## การตรวจสอบเพิ่มเติม

### ดู Railway Logs
```bash
# ใน Railway Dashboard → Deployments → View Logs
# หาบรรทัดนี้หลังจาก login:
[Google OAuth] Setting cookie: { name: 'ea-bot-shop-session', options: { domain: '.neoxp.shop', ... } }
```

### ตรวจสอบ Cookie ใน Browser
```javascript
// ใน Console (F12)
document.cookie.split(';').forEach(c => console.log(c.trim()))
```

ควรเห็น:
```
ea-bot-shop-session=eyJhbGc...
```

### ตรวจสอบ Network Request
1. F12 → Network
2. Refresh หน้า
3. เลือก request ไปที่ `/api/trpc/auth.me`
4. ดู Headers → Request Headers → Cookie
5. ควรมี `ea-bot-shop-session=...`

## ถ้ายังไม่ได้

### ตรวจสอบ Google OAuth Redirect URI
ใน Google Cloud Console ต้องมี:
```
https://neoxppro-production.up.railway.app/api/auth/google/callback
```

### ตรวจสอบ Environment Variables ใน Railway
ต้องมีครบ:
```
GOOGLE_CLIENT_ID=722594958338-i6n1gi99csrkk35d39q95k94h3d5hc2r.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-secret>
GOOGLE_REDIRECT_URI=https://neoxppro-production.up.railway.app/api/auth/google/callback
FRONTEND_APP_URL=https://neoxp.shop
CORS_ALLOWED_ORIGINS=https://neoxp.shop,https://neoxppro.natthakornchoochuay21.workers.dev
COOKIE_DOMAIN=.neoxp.shop
```

### ลอง Clear Cookies
1. F12 → Application → Cookies
2. ลบ cookies ทั้งหมดของ `neoxp.shop`
3. ลอง login ใหม่

## สิ่งที่เปลี่ยนแปลงในโค้ด

ไฟล์ `server/_core/cookies.ts` - เพิ่มการรองรับ `COOKIE_DOMAIN`:
```typescript
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

return {
  httpOnly: true,
  path: "/",
  sameSite,
  secure,
  ...(cookieDomain && !isLocalHost ? { domain: cookieDomain } : {}),
};
```

ไฟล์ `server/_core/googleOAuth.ts` - เพิ่ม logging:
```typescript
console.log("[Google OAuth] Setting cookie:", {
  name: COOKIE_NAME,
  options: cookieOptions,
  maxAge: ONE_YEAR_MS,
  redirectTo: getPostLoginRedirect(),
});
```

## คำสั่ง Git (ถ้าต้องการ deploy เอง)

```bash
git add .
git commit -m "fix: add COOKIE_DOMAIN support for cross-domain auth"
git push origin main
```

Railway จะ auto-deploy หลัง push
