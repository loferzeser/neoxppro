# Debug Google Login - ขั้นตอนละเอียด

## 1. เช็คว่าเพิ่ม COOKIE_DOMAIN แล้วหรือยัง

ใน Railway Dashboard → neoxppro → Variables

ต้องมีตัวแปรนี้:
```
COOKIE_DOMAIN=.neoxp.shop
```

ถ้ายังไม่มี → เพิ่มเลย แล้วรอ redeploy

## 2. เช็ค Console ใน Browser

เปิด https://neoxp.shop
กด F12 → Console

พิมพ์คำสั่งนี้:
```javascript
console.log('Cookies:', document.cookie);
console.log('Current domain:', window.location.hostname);
```

## 3. ทดสอบ Login แล้วดู Network

1. F12 → Network tab
2. กด "เข้าสู่ระบบ" → "ลงชื่อเข้าใช้ด้วย Google"
3. เลือกบัญชี Google
4. หลัง redirect กลับมา ดู Network requests

หา request ที่ชื่อ `/api/auth/google/callback`
- ดู Response Headers → Set-Cookie
- ควรเห็น: `ea-bot-shop-session=...; Domain=.neoxp.shop; ...`

## 4. เช็คว่า Cookie ถูกเซ็ตหรือไม่

F12 → Application → Cookies → https://neoxp.shop

ควรเห็น:
- Name: `ea-bot-shop-session`
- Value: `eyJhbGc...` (JWT token)
- Domain: `.neoxp.shop`
- Path: `/`
- Secure: ✓
- HttpOnly: ✓
- SameSite: `None`

## 5. ทดสอบ API Call

ใน Console (F12) พิมพ์:
```javascript
fetch('https://neoxppro-production.up.railway.app/api/trpc/auth.me', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(d => console.log('Auth response:', d))
```

ถ้าได้ user data → cookie ทำงาน
ถ้าได้ error → cookie ไม่ถูกส่ง

## 6. ดู Railway Logs

ใน Railway Dashboard → Deployments → View Logs

หาบรรทัดนี้หลังจาก login:
```
[Google OAuth] Setting cookie: { name: 'ea-bot-shop-session', options: { domain: '.neoxp.shop', ... } }
```

ถ้าไม่เห็น → แปลว่า COOKIE_DOMAIN ยังไม่ถูกตั้ง

## 7. ถ้ายังไม่ได้ - ลอง Clear ทุกอย่าง

```javascript
// ใน Console
document.cookie.split(";").forEach(c => {
  document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.neoxp.shop";
  document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=neoxp.shop";
});
console.log('Cookies cleared');
```

แล้วลอง login ใหม่

## 8. เช็ค Environment Variables ทั้งหมดใน Railway

ต้องมีครบ:
```
COOKIE_DOMAIN=.neoxp.shop
FRONTEND_APP_URL=https://neoxp.shop
CORS_ALLOWED_ORIGINS=https://neoxp.shop,https://neoxppro.natthakornchoochuay21.workers.dev
GOOGLE_CLIENT_ID=722594958338-i6n1gi99csrkk35d39q95k94h3d5hc2r.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-secret>
GOOGLE_REDIRECT_URI=https://neoxppro-production.up.railway.app/api/auth/google/callback
```

## ส่งข้อมูลนี้มาให้ผม:

1. Screenshot ของ Railway Variables (ปิด secret ได้)
2. ผลลัพธ์จาก Console: `document.cookie`
3. Screenshot ของ F12 → Application → Cookies
4. ผลลัพธ์จาก fetch test (ข้อ 5)
5. Railway Logs หลังจาก login (5-10 บรรทัด)
