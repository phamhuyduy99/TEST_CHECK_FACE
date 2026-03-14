# Hướng dẫn Fix Lỗi CORS - VNPT eKYC SDK

## Nguyên nhân lỗi CORS

SDK eKYC gọi API về server VNPT (`api.idg.vnpt.vn`). Nếu domain của bạn chưa được VNPT whitelist hoặc chạy sai host/port → bị chặn CORS.

---

## 1. Môi trường Dev (localhost)

### Cấu hình đúng trong `VnptEkyc.tsx`

Mở `client/src/components/VnptEkyc.tsx`, đảm bảo `INIT_CONFIG` có:

```ts
const INIT_CONFIG = {
  BACKEND_URL: 'https://api.idg.vnpt.vn/',   // ✅ Phải có dấu / ở cuối
  TOKEN_KEY: 'MFwwDQYJ...==',
  TOKEN_ID: '3771f04f-3161-0794-e063-63199f0a9b41',
  AUTHORIZION: 'eyJhbGci...',                 // ✅ KHÔNG có chữ "bearer " phía trước
  // ...
}
```

> ⚠️ **Lưu ý quan trọng về AUTHORIZION:**
> - ❌ Sai: `"bearer eyJhbGci..."`
> - ✅ Đúng: `"eyJhbGci..."` (chỉ lấy phần token, bỏ chữ `bearer`)

---

### Cấu hình Vite dev server để tránh CORS

Mở `client/vite.config.js`, thêm proxy:

```js
export default {
  server: {
    host: 'localhost',   // ✅ Phải là localhost, KHÔNG dùng 127.0.0.1
    port: 5173,
    proxy: {
      '/vnpt-api': {
        target: 'https://api.idg.vnpt.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/vnpt-api/, ''),
      },
    },
  },
}
```

> VNPT chỉ whitelist `localhost` chứ **không** whitelist `127.0.0.1`. Chạy sai host sẽ bị CORS ngay cả ở dev.

---

### Kiểm tra đang chạy đúng host chưa

Mở trình duyệt vào:
```
http://localhost:5173/?ekyc
```

Nếu bạn thấy URL là `http://127.0.0.1:5173` → **sai**, phải đổi thành `localhost`.

---

## 2. Môi trường Production

Sau khi deploy lên domain thật (VD: `https://myapp.vercel.app`), domain đó **chưa được VNPT whitelist** → bị CORS.

### Bước xử lý

**Bước 1:** Deploy xong, lấy domain chính xác của bạn, ví dụ:
```
https://myapp.vercel.app
```

**Bước 2:** Liên hệ VNPT để thêm domain vào whitelist:
- Link liên hệ: https://ekyc.vnpt.vn/vi/contact
- Nội dung yêu cầu: *"Thêm domain `https://myapp.vercel.app` vào danh sách CORS được phép gọi API eKYC"*

**Bước 3:** Sau khi VNPT xác nhận → test lại trên production.

---

## 3. Checklist debug CORS nhanh

Mở `F12 → Console`, nếu thấy lỗi dạng:

```
Access to fetch at 'https://api.idg.vnpt.vn/...' from origin 'http://...' 
has been blocked by CORS policy
```

Kiểm tra lần lượt:

- [ ] `AUTHORIZION` không có chữ `bearer ` phía trước
- [ ] `BACKEND_URL` là `https://api.idg.vnpt.vn/` (có dấu `/` cuối)
- [ ] Đang truy cập qua `localhost` chứ không phải `127.0.0.1`
- [ ] Access token chưa hết hạn (hết hạn sau 8 tiếng)
- [ ] Nếu production: domain đã được VNPT whitelist chưa

---

## 4. Kiểm tra token còn hạn không

Paste access token vào https://jwt.io → xem trường `exp`:

```json
{
  "exp": 1773491395,   ← timestamp Unix
  "user_name": "thangdt@gmail.com",
  "client_id": "8_hour"
}
```

Chuyển `exp` sang thời gian thực tại: https://www.epochconverter.com

Nếu đã quá thời gian đó → token hết hạn, cần lấy token mới (xem `VNPT_EKYC_GUIDE.md` mục 4).

---

## 5. Liên hệ hỗ trợ

| Vấn đề | Liên hệ |
|--------|---------|
| Thêm CORS domain production | https://ekyc.vnpt.vn/vi/contact |
| Lấy token mới / API refresh token | https://ekyc.vnpt.vn → Quản lý Token |
| Tải SDK version mới nhất | https://ekyc.vnpt.vn → Tích hợp → Tải SDK |
