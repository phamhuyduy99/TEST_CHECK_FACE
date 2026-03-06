# Kiến trúc Dự án - Liveness Check Application

## 📋 Tổng quan
Ứng dụng web kiểm tra liveness khuôn mặt với kiến trúc Client-Server, sử dụng Cloudinary để lưu trữ media.

## 🏗️ Kiến trúc Tổng thể
```
CLIENT (React + Vite + Tailwind)
    ↓ WebRTC + MediaRecorder
    ↓ HTTP/REST API
SERVER (Node.js + Express + Multer)
    ↓ Cloudinary SDK
CLOUDINARY (Cloud Storage + CDN)
```

## 📁 Cấu trúc Thư mục
```
client/src/
├── components/          # UI Components
├── hooks/              # Custom Hooks
├── Camera.jsx          # Main Component
└── App.jsx

server/
├── server.js           # Express API
├── .env               # Credentials
└── uploads/           # Temp storage
```

## 🔄 Luồng Dữ liệu
1. **Camera**: getUserMedia() → Video Stream
2. **Recording**: MediaRecorder → Video Blob (5s)
3. **Capture**: Canvas → Image Blob (x2)
4. **Upload**: FormData → Server → Cloudinary (retry 3x)
5. **Result**: URLs → Display

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind, WebRTC
- **Backend**: Node.js, Express 5, Multer, Cloudinary
- **Storage**: Cloudinary (25GB free)

## 📊 Performance
- Chunk upload: 6MB
- Timeout: 120s
- Retry: 3 lần
- Progress: 0% → 90% → 100%
