# Development Guide

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- Git
- Cloudinary account (free tier)

### Installation

**1. Clone repository:**
```bash
git clone https://github.com/phamhuyduy99/TEST_CHECK_FACE.git
cd TEST_CHECK_FACE
```

**2. Setup Cloudinary:**
- Đăng ký tại: https://cloudinary.com/users/register_free
- Lấy credentials tại Dashboard
- Tạo file `server/.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**3. Install dependencies:**
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### Running Development

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
Server: http://localhost:3000 (auto-reload)

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Client: http://localhost:5173 (HMR enabled)

## 📝 Development Workflow

### 1. Tạo Feature Branch
```bash
git checkout -b feature/ten-tinh-nang
```

### 2. Code & Test
- Sửa code
- Test trên browser
- Check console logs

### 3. Commit
```bash
git add .
git commit -m "feat: mô tả tính năng"
```

### 4. Push & PR
```bash
git push origin feature/ten-tinh-nang
```

## 🧪 Testing

### Manual Testing
1. Bật camera → OK?
2. Quay video 5s → Có hướng dẫn?
3. Chụp 2 ảnh → Disabled đúng?
4. Upload → Progress bar 0→90→100?
5. Retry khi fail → Thử 3 lần?

### Browser Testing
- Chrome (recommended)
- Firefox
- Safari
- Mobile browsers

## 🐛 Debugging

### Frontend Debug
```javascript
// Trong component
console.log('State:', { videoBlob, image1, image2 });

// Trong hook
console.log('📤 Uploading:', formData);
```

### Backend Debug
```javascript
// Trong server.js
console.log('📥 Received files:', req.files);
console.log('☁️ Cloudinary result:', result);
```

### Common Issues

**Camera không bật:**
- Check HTTPS (localhost OK)
- Check browser permissions
- Check camera đang dùng bởi app khác

**Upload fail:**
- Check server đang chạy
- Check .env credentials
- Check network connection
- Check Cloudinary quota

**Progress bar nhảy:**
- Check logic trong useUpload.js
- Đảm bảo dừng ở 90%

## 📦 Project Structure

### Frontend Components
```
components/
├── ControlButtons.jsx    # Tất cả nút bấm
├── ErrorAlert.jsx        # Error UI
├── LivenessGuide.jsx     # Hướng dẫn 5s
├── LoadingOverlay.jsx    # Progress bar
└── SuccessResult.jsx     # Hiển thị URLs
```

### Custom Hooks
```
hooks/
├── useLivenessCapture.js # Camera + Recording logic
└── useUpload.js          # Upload + Retry logic
```

## 🎨 Styling

### Tailwind Classes
```javascript
// Button
"bg-blue-600 hover:bg-blue-700 cursor-pointer"

// Responsive
"text-sm sm:text-base"
"p-2 sm:p-4"
"grid-cols-1 sm:grid-cols-2"

// Disabled
"disabled:bg-gray-400 disabled:cursor-not-allowed"
```

## 🔧 Configuration

### Vite Config
```javascript
// client/vite.config.js
{
  server: {
    port: 5173,
    open: true,
    hmr: true
  }
}
```

### Tailwind Config
```javascript
// client/tailwind.config.js
{
  content: ["./index.html", "./src/**/*.{js,jsx}"]
}
```

## 📊 Performance Tips

### Frontend
- Sử dụng useCallback cho functions
- Memoize expensive calculations
- Lazy load components nếu cần

### Backend
- Memory storage (không ghi disk)
- Chunk upload (6MB)
- Retry với delay

## 🔐 Security

### Environment Variables
- NEVER commit `.env`
- Use `.env.example` for template
- Rotate credentials định kỳ

### CORS
- Chỉ allow localhost khi dev
- Update origins cho production

## 📚 Resources

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind Docs](https://tailwindcss.com)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
