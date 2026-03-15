# VNPT eKYC - Xác thực giấy tờ tùy thân

Ứng dụng xác thực eKYC sử dụng VNPT AI API, hỗ trợ OCR giấy tờ, kiểm tra liveness khuôn mặt và so khớp khuôn mặt.

## Tính năng

- **OCR giấy tờ** - Đọc thông tin CCCD/CMT/Hộ chiếu/Bằng lái xe
- **Kiểm tra liveness thẻ** - Phát hiện thẻ giả mạo, photocopy
- **Kiểm tra liveness khuôn mặt** - Phân biệt người thật vs ảnh/video giả (skin-tone detection)
- **Phát hiện khẩu trang** - Kiểm tra che mặt
- **So khớp khuôn mặt** - So sánh selfie với ảnh trên giấy tờ
- **Điều hướng đa bước** - Nút quay lại giữa các bước, giữ ảnh preview
- **Xử lý ảnh thông minh** - Tự động convert HEIC→JPEG (heic2any), resize trước khi upload
- **Validation ảnh** - Kiểm tra kích thước file (100KB–10MB) trước khi gửi
- **Đa ngôn ngữ** - Tiếng Việt / English
- **Mobile-friendly** - Hỗ trợ đổi camera trước/sau, tap-to-focus, responsive

## Công nghệ

### Frontend
- React 19 + TypeScript + Vite
- Tailwind CSS v4
- WebRTC (camera capture) + ImageCapture API (high quality grab)
- heic2any (HEIC/HEIF → JPEG conversion)

### Backend
- Node.js + Express + TypeScript
- Multer (file upload, limit 10MB)
- Sharp (resize ảnh trước khi upload VNPT)
- VNPT AI API (OCR + liveness + face compare)

## Cấu trúc dự án

```
MINI_CHECK_FACE_TIME/
├── client/                    # Frontend React + Vite
│   ├── src/
│   │   ├── components/ekyc/
│   │   │   ├── StepSelectDoc.tsx    # Chọn loại giấy tờ
│   │   │   ├── GuideModal.tsx       # Hướng dẫn chụp giấy tờ
│   │   │   ├── FaceGuideModal.tsx   # Hướng dẫn chụp khuôn mặt
│   │   │   ├── StepCapture.tsx      # Chụp/upload ảnh giấy tờ (có back nav)
│   │   │   ├── StepFaceCapture.tsx  # Chụp selfie (auto-detect + back nav)
│   │   │   ├── StepProgress.tsx     # Thanh tiến trình
│   │   │   ├── StepResult.tsx       # Hiển thị kết quả
│   │   │   └── TokenModal.tsx       # Cập nhật Access Token
│   │   ├── hooks/
│   │   │   ├── useWebcam.ts         # Camera hook (flip, tap-to-focus, captureHQ)
│   │   │   └── useEkyc.ts           # API call hook
│   │   ├── pages/
│   │   │   └── EkycFlowPage.tsx     # Điều phối luồng eKYC
│   │   ├── i18n.tsx                 # VI/EN translations
│   │   └── App.tsx
│   └── vite.config.js
└── server/                    # Backend Node.js
    └── src/
        ├── services/
        │   └── vnptAiService.ts     # 13 VNPT APIs + upload + resize
        ├── config.ts
        └── server.ts
```

## Cài đặt

```bash
# Lần đầu - cài dependencies
npm run setup
```

## Chạy ứng dụng

### Dev mode (hot reload)
```bash
npm run dev
```
- Client: `https://localhost:5173`
- Server: `http://localhost:3000`

### Production mode
```bash
npm run build
npm run preview
```
- Client: `https://localhost:5173` hoặc `https://192.168.1.x:5173`
- Server: `http://localhost:3000`

> **Lưu ý**: HTTPS bắt buộc để camera hoạt động trên mobile. Lần đầu truy cập trên điện thoại cần bấm "Advanced → Proceed" để chấp nhận self-signed certificate.

## Luồng hoạt động

```
1. Chọn loại giấy tờ (CCCD / Hộ chiếu / Bằng lái / Khác)
2. Xem hướng dẫn chụp
3. Chụp/upload mặt trước giấy tờ  ← có nút quay lại
4. Chụp/upload mặt sau giấy tờ   ← có nút quay lại bước 3
5. Chụp khuôn mặt selfie (auto-detect)  ← có nút quay lại bước 4
6. Server xử lý song song:
   - Resize ảnh (max 1600px, quality 85) → upload lên VNPT
   - OCR đọc thông tin giấy tờ
   - Kiểm tra liveness thẻ
   - Kiểm tra liveness khuôn mặt
   - Phát hiện khẩu trang
   - So khớp khuôn mặt với ảnh CCCD
7. Hiển thị kết quả (tab Thông tin / Xác thực)
```

## Xử lý ảnh

| Nguồn | Xử lý |
|-------|-------|
| Upload HEIC/HEIF | heic2any → JPEG (client-side) |
| Upload WEBP/BMP/PNG | Canvas → JPEG (client-side) |
| Upload JPEG | Giữ nguyên |
| Camera capture | ImageCapture.grabFrame() → JPEG 95% |
| Server resize | Sharp: max 1600×1600, quality 85, chỉ khi > 2MB hoặc > 2000px |

## Cấu hình

### server/.env
```env
# VNPT AI
VNPT_TOKEN_ID=<token_id>
VNPT_TOKEN_KEY=<token_key>
VNPT_ACCESS_TOKEN=<access_token>   # Hết hạn sau 8 tiếng

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
```

Lấy token tại: https://ekyc.vnpt.vn → Quản lý Token

### client/.env.development
```env
VITE_API_URL=http://192.168.1.x:3000   # IP máy tính trên LAN
```

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/ekyc` | Full eKYC: front + back + face |
| POST | `/api/ekyc/face` | Chỉ check liveness khuôn mặt |
| GET | `/api/health` | Kiểm tra cấu hình |

## Bảo mật

- Client không gọi trực tiếp VNPT API → không bị CORS
- Tất cả API calls đi qua backend proxy (server Node.js)
- CORS chỉ cho phép origins đã cấu hình
- File size limit: 10MB/ảnh (validate cả client lẫn server)

## Scripts

| Script | Mô tả |
|--------|-------|
| `npm run setup` | Cài dependencies lần đầu |
| `npm run dev` | Chạy dev mode (client + server) |
| `npm run build` | Build production client |
| `npm run preview` | Chạy production mode (client + server) |
| `npm run dev:client` | Chỉ chạy client |
| `npm run dev:server` | Chỉ chạy server |

## License

MIT
