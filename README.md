# Ứng dụng Kiểm tra Liveness Khuôn mặt

## Cấu trúc dự án
```
MINI_CHECK_FACE_TIME/
├── client/          # Frontend React + Vite + Tailwind
├── server/          # Backend Node.js + Express
└── CLOUDINARY_SETUP.md  # Hướng dẫn cấu hình Cloudinary
```

## Cài đặt và chạy

### 1. Cấu hình Cloudinary (BẮT BUỘC)
Đọc file `CLOUDINARY_SETUP.md` để lấy API credentials và cấu hình file `server/.env`

### 2. Backend (Terminal 1) - Auto-reload
```bash
cd server
npm run dev
```
Server sẽ chạy tại: http://localhost:3000 và tự động reload khi code thay đổi

### 3. Frontend (Terminal 2) - Hot Module Replacement
```bash
cd client
npm run dev
```
Client sẽ chạy tại: http://localhost:5173 và tự động reload khi code thay đổi

## Tính năng
1. ✅ Bật camera thiết bị (máy tính/điện thoại)
2. ✅ Quay video liveness (hướng dẫn người dùng thực hiện động tác)
3. ✅ Chụp 2 ảnh khuôn mặt
4. ✅ Upload video + 2 ảnh lên Cloudinary (cloud storage)
5. ✅ Hướng dẫn động tác real-time và đếm ngược thời gian

## Công nghệ sử dụng
- **Frontend**: React, Vite (HMR), Tailwind CSS, WebRTC API, MediaRecorder API
- **Backend**: Node.js, Express, Multer, Cloudinary SDK, Nodemon (auto-reload)
- **Storage**: Cloudinary (Free tier: 25GB)

## File được lưu
- Video và ảnh được upload lên **Cloudinary**
- Xem tại: https://console.cloudinary.com/ → Media Library
- Folder: `liveness-check/videos` và `liveness-check/images`
