# VNPT eKYC - Xác thực giấy tờ tùy thân

Ứng dụng xác thực eKYC sử dụng VNPT AI API, hỗ trợ OCR giấy tờ, kiểm tra liveness khuôn mặt và so khớp khuôn mặt.

## Tính năng

- **OCR giấy tờ** - Đọc thông tin CCCD/CMT/Hộ chiếu/Bằng lái xe
- **Kiểm tra liveness thẻ** - Phát hiện thẻ giả mạo, photocopy
- **Kiểm tra liveness khuôn mặt** - Phân biệt người thật vs ảnh/video giả
- **Phát hiện khẩu trang** - Kiểm tra che mặt
- **So khớp khuôn mặt** - So sánh selfie với ảnh trên giấy tờ
- **Đa ngôn ngữ** - Tiếng Việt / English
- **Mobile-friendly** - Hỗ trợ đổi camera trước/sau, responsive

## Công nghệ

### Frontend
- React 19 + TypeScript + Vite
- Tailwind CSS v4
- WebRTC (camera capture)

### Backend
- Node.js + Express + TypeScript
- Multer (file upload)
- VNPT AI API (OCR + liveness + face compare)

## Cấu trúc dự án

```
MINI_CHECK_FACE_TIME/
├── client/                    # Frontend React + Vite
│   ├── src/
│   │   ├── components/ekyc/   # UI components
│   │   │   ├── StepSelectDoc.tsx
│   │   │   ├── GuideModal.tsx
│   │   │   ├── StepCapture.tsx
│   │   │   ├── StepProgress.tsx
│   │   │   └── StepResult.tsx
│   │   ├── hooks/
│   │   │   ├── useWebcam.ts   # Camera hook (flip support)
│   │   │   └── useEkyc.ts     # API call hook
│   │   ├── pages/
│   │   │   └── EkycFlowPage.tsx
│   │   ├── i18n.tsx           # VI/EN translations
│   │   └── App.tsx
│   └── vite.config.js
└── server/                    # Backend Node.js
    └── src/
        ├── services/
        │   └── vnptAiService.ts  # 13 VNPT APIs
        ├── config.ts
        └── server.ts
```

## Cài đặt

```bash
# Lần đầu - cài dependencies
npm run setup
```

## Chạy ứng dụng

### Dev mode (hot reload, dùng khi code)
```bash
npm run dev
```
- Client: `https://localhost:5173`
- Server: `http://localhost:3000`

### Production mode (nhanh hơn trên mobile)
```bash
# Build trước (chạy 1 lần hoặc sau khi sửa code)
npm run build

# Chạy
npm run preview
```
- Client: `https://localhost:5173` hoặc `https://192.168.1.x:5173`
- Server: `http://localhost:3000`

> **Lưu ý**: HTTPS là bắt buộc để camera hoạt động trên mobile. Lần đầu truy cập trên điện thoại cần bấm "Advanced → Proceed" để chấp nhận self-signed certificate.

## Luồng hoạt động

```
1. Chọn loại giấy tờ (CCCD / Hộ chiếu / Bằng lái / Khác)
2. Xem hướng dẫn chụp
3. Chụp mặt trước giấy tờ (camera sau)
4. Chụp mặt sau giấy tờ (camera sau)
5. Chụp khuôn mặt selfie (camera trước)
6. Server xử lý song song:
   - Upload 3 ảnh lên VNPT
   - OCR đọc thông tin giấy tờ
   - Kiểm tra liveness thẻ
   - Kiểm tra liveness khuôn mặt
   - Phát hiện khẩu trang
   - So khớp khuôn mặt với ảnh CCCD
7. Hiển thị kết quả
```

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
- File size limit: 10MB/ảnh

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
