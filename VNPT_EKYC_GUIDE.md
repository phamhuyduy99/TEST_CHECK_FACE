# Hướng dẫn Tích hợp VNPT eKYC SDK

## 1. Thông tin Token của bạn

| Trường | Giá trị |
|--------|---------|
| Token ID | `3771f04f-3161-0794-e063-63199f0a9b41` |
| Token Key | `MFwwDQYJ...` (RSA public key) |
| Access Token | Bearer JWT - **hết hạn sau 8 tiếng** |

---

## 2. Những file đã được tích hợp

```
client/
├── index.html              ✅ Thêm 3 scripts VNPT SDK
├── src/
│   ├── App.tsx             ✅ Thêm route ?ekyc
│   └── components/
│       └── VnptEkyc.tsx    ✅ React component wrapper

server/
├── .env                    ✅ Thêm VNPT_TOKEN_ID, VNPT_TOKEN_KEY, VNPT_ACCESS_TOKEN
├── src/
│   ├── config.ts           ✅ Expose vnpt config
│   ├── server.ts           ✅ Dùng VNPT AI làm primary liveness check
│   └── services/
│       └── vnptAiService.ts ✅ Service gọi VNPT AI API
```

---

## 3. Cách chạy và test

### Bước 1 - Chạy dự án
```bash
npm run dev:no-python
```

### Bước 2 - Mở trình duyệt

| URL | Chức năng |
|-----|-----------|
| `http://localhost:5173/` | Camera liveness cũ |
| `http://localhost:5173/?ekyc` | **VNPT eKYC SDK** ← mới |
| `http://localhost:5173/?test` | FaceMeshTest |

### Bước 3 - Luồng eKYC
1. Vào `http://localhost:5173/?ekyc`
2. SDK tự load → hiện giao diện chọn loại giấy tờ
3. Chụp mặt trước / mặt sau CCCD
4. Chụp khuôn mặt (liveness check)
5. SDK trả kết quả → xem trong Console (`F12 → Console`)

---

## 4. Xử lý Access Token hết hạn (quan trọng!)

Access token **hết hạn sau 8 tiếng**. Khi hết hạn SDK sẽ báo lỗi auth.

### Cách lấy token mới thủ công
Gọi API này từ server của bạn:

```bash
curl -X POST https://api.idg.vnpt.vn/auth/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "thangdt@gmail.com",
    "password": "<mật khẩu của bạn>",
    "client_id": "clientapp",
    "grant_type": "password",
    "client_secret": "password"
  }'
```

Copy `access_token` từ response → cập nhật vào:
- `server/.env` → `VNPT_ACCESS_TOKEN=...`
- `client/src/components/VnptEkyc.tsx` → trường `AUTHORIZION`

### Cách tự động refresh (khuyến nghị cho production)
Liên hệ VNPT để được cấp API endpoint refresh token riêng, sau đó implement trong `server/src/services/vnptAiService.ts`.

---

## 5. Dữ liệu trả về từ SDK

Kết quả trả về trong `onResult` callback tại `App.tsx`:

```json
{
  "type_document": 9,
  "liveness_face": {
    "liveness": "success",
    "liveness_msg": "Người thật",
    "is_eye_open": "yes"
  },
  "ocr": {
    "id": "034197004375",
    "name": "NGUYỄN VĂN A",
    "birth_day": "01/01/1990",
    "gender": "Nam",
    "nationality": "Việt Nam",
    "origin_location": "...",
    "recent_location": "...",
    "valid_date": "01/01/2030",
    "card_type": "CĂN CƯỚC CÔNG DÂN"
  },
  "compare": {
    "result": "Khuôn mặt khớp 99.7%",
    "msg": "MATCH",
    "prob": 99.7
  },
  "liveness_card_front": {
    "liveness": "success",
    "liveness_msg": "Giấy tờ thật",
    "face_swapping": false,
    "fake_liveness": false
  },
  "base64_face_img": "data:image/jpeg;base64,..."
}
```

---

## 6. Tuỳ chỉnh SDK

Mở file `client/src/components/VnptEkyc.tsx`, sửa `INIT_CONFIG`:

| Config | Giá trị | Ý nghĩa |
|--------|---------|---------|
| `FLOW_TYPE` | `'FACE'` / `'DOCUMENT'` | Chỉ check mặt hoặc cả giấy tờ |
| `TYPE_DOCUMENT` | `99` | 99 = hiện menu chọn loại giấy tờ |
| `CHECK_LIVENESS_FACE` | `true/false` | Bật/tắt check liveness mặt |
| `CHECK_MASKED_FACE` | `true/false` | Bật/tắt check che mặt |
| `COMPARE_FACE` | `true/false` | Bật/tắt so khớp mặt với CCCD |
| `LANGUAGE` | `'vi'` / `'en'` | Ngôn ngữ giao diện |
| `ADVANCE_LIVENESS_FACE` | `true/false` | Dùng liveness oval (nâng cao) |

### Ví dụ: Chỉ check liveness mặt, không cần giấy tờ
```tsx
<VnptEkyc flowType="FACE" onResult={(res) => console.log(res)} />
```

### Ví dụ: eKYC đầy đủ (giấy tờ + mặt)
```tsx
<VnptEkyc flowType="DOCUMENT" onResult={(res) => {
  if (res.compare?.msg === 'MATCH') {
    console.log('✅ Xác thực thành công:', res.ocr?.name);
  }
}} />
```

---

## 7. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách fix |
|-----|-------------|----------|
| SDK không load | File `ekyc-web-sdk-2.1.0.js` không tồn tại trên CDN | Liên hệ VNPT lấy file SDK về đặt vào `client/public/` |
| `401 Unauthorized` | Access token hết hạn | Lấy token mới theo mục 4 |
| Webcam không mở | Chạy trên `http://` | Dùng `https://` hoặc `localhost` |
| SDK init lỗi | `FaceVNPTBrowserSDK` chưa load | Kiểm tra script `VNPTBrowserSDKApp.js` trong Network tab |

---

## 8. Bảo mật (production)

> ⚠️ **Không deploy lên internet với access token hardcode trong code!**

Theo khuyến cáo của VNPT, dùng một trong 2 cách:

**Cách A - Token ngắn hạn (30 phút):**
- Server backend gọi API VNPT lấy token 30 phút
- Trả token đó về cho client
- Client dùng token này gọi SDK

**Cách B - Server proxy (an toàn nhất):**
- Client chỉ giao tiếp với server của bạn
- Server của bạn gọi API VNPT với token bí mật
- Client không bao giờ thấy token thật

---

## 9. Liên hệ hỗ trợ

- **Portal**: https://ekyc.vnpt.vn
- **Tài liệu**: Đăng nhập portal → Tích hợp → Tích hợp SDK Web
- **Hỗ trợ kỹ thuật**: Liên hệ VNPT AI để được cấp API refresh token tự động
