# Hướng dẫn Deploy lên Render.com - Chi tiết từng bước

## 📋 Tổng quan
Render.com là platform deploy miễn phí, hỗ trợ auto-deploy từ GitHub. Chúng ta sẽ deploy:
- **Backend**: Node.js Web Service
- **Frontend**: Static Site

## 🎯 Yêu cầu
- ✅ Tài khoản GitHub (đã có)
- ✅ Code đã push lên GitHub
- ✅ Tài khoản Cloudinary (đã có)
- ⭐ Tài khoản Render.com (miễn phí)

---

## 📝 PHẦN 1: Chuẩn bị Code

### Bước 1.1: Cập nhật Backend để support production

**Tạo file `server/src/config.ts`:**
```typescript
export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  }
};
```

**Cập nhật `server/src/server.ts`:**
```typescript
import { config } from './config';

// CORS với origin từ env
app.use(cors({
  origin: config.cors.origin
}));

// Cloudinary config
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  timeout: 120000
});

// Listen
app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
});
```

**Cập nhật `server/package.json`:**
```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "dev": "nodemon --exec ts-node src/server.ts"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Bước 1.2: Cập nhật Frontend để support production

**Tạo file `client/.env.production`:**
```env
VITE_API_URL=https://your-backend-name.onrender.com
```

**Cập nhật `client/src/hooks/useUpload.ts`:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Trong uploadData function
const response = await fetch(`${API_URL}/api/upload`, {
  method: 'POST',
  body: formData,
  signal: controller.signal
});
```

**Cập nhật `client/package.json`:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### Bước 1.3: Commit và push

```bash
git add .
git commit -m "chore: Prepare for Render deployment"
git push origin main
```

---

## 🚀 PHẦN 2: Deploy Backend lên Render

### Bước 2.1: Đăng ký Render.com

1. Truy cập: https://render.com
2. Click **"Get Started"**
3. Chọn **"Sign up with GitHub"**
4. Authorize Render truy cập GitHub

### Bước 2.2: Tạo Web Service cho Backend

1. Vào Dashboard: https://dashboard.render.com
2. Click **"New +"** → Chọn **"Web Service"**

3. **Connect Repository:**
   - Chọn repository: `phamhuyduy99/TEST_CHECK_FACE`
   - Click **"Connect"**

4. **Configure Service:**
   ```
   Name: liveness-backend
   Region: Singapore (gần VN nhất)
   Branch: main
   Root Directory: server
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Instance Type: Free
   ```

5. **Environment Variables** (Click "Advanced"):
   ```
   CLOUDINARY_CLOUD_NAME = dkacsh89o
   CLOUDINARY_API_KEY = 575517739462697
   CLOUDINARY_API_SECRET = jEUG47YdjciYFWWUIiGucKy-XJ8
   NODE_ENV = production
   CORS_ORIGIN = https://your-frontend-name.onrender.com
   ```
   ⚠️ **Lưu ý:** CORS_ORIGIN sẽ cập nhật sau khi deploy frontend

6. Click **"Create Web Service"**

7. **Đợi deploy** (3-5 phút):
   - Xem logs real-time
   - Khi thấy "🚀 Server running" → Thành công!
   - Copy URL: `https://liveness-backend.onrender.com`

### Bước 2.3: Test Backend

```bash
# Test endpoint
curl https://liveness-backend.onrender.com/api/upload

# Kết quả mong đợi: 400 Bad Request (vì chưa gửi file)
```

---

## 🎨 PHẦN 3: Deploy Frontend lên Render

### Bước 3.1: Cập nhật API URL

**Cập nhật `client/.env.production`:**
```env
VITE_API_URL=https://liveness-backend.onrender.com
```

**Commit:**
```bash
git add client/.env.production
git commit -m "chore: Update production API URL"
git push origin main
```

### Bước 3.2: Tạo Static Site cho Frontend

1. Vào Dashboard: https://dashboard.render.com
2. Click **"New +"** → Chọn **"Static Site"**

3. **Connect Repository:**
   - Chọn repository: `phamhuyduy99/TEST_CHECK_FACE`
   - Click **"Connect"**

4. **Configure Site:**
   ```
   Name: liveness-frontend
   Branch: main
   Root Directory: client
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

5. **Environment Variables:**
   ```
   VITE_API_URL = https://liveness-backend.onrender.com
   ```

6. Click **"Create Static Site"**

7. **Đợi deploy** (2-3 phút):
   - Xem logs
   - Khi thấy "Site is live" → Thành công!
   - Copy URL: `https://liveness-frontend.onrender.com`

### Bước 3.3: Cập nhật CORS Backend

1. Vào Backend service: https://dashboard.render.com/web/liveness-backend
2. Click **"Environment"** tab
3. Sửa `CORS_ORIGIN`:
   ```
   CORS_ORIGIN = https://liveness-frontend.onrender.com
   ```
4. Click **"Save Changes"**
5. Service sẽ tự động redeploy (1-2 phút)

---

## ✅ PHẦN 4: Kiểm tra & Test

### Bước 4.1: Test Frontend

1. Mở: `https://liveness-frontend.onrender.com`
2. Kiểm tra:
   - ✅ Giao diện hiển thị đúng
   - ✅ Bật camera được
   - ✅ Quay video 5s
   - ✅ Chụp 2 ảnh
   - ✅ Upload thành công
   - ✅ Hiển thị URLs từ Cloudinary

### Bước 4.2: Test trên Mobile

1. Mở link trên điện thoại
2. Cho phép truy cập camera
3. Test toàn bộ flow

### Bước 4.3: Check Logs

**Backend logs:**
```
Dashboard → liveness-backend → Logs
```

**Frontend logs:**
```
F12 → Console (trên browser)
```

---

## 🔧 PHẦN 5: Troubleshooting

### Lỗi 1: Backend build failed

**Nguyên nhân:** TypeScript compile error

**Giải pháp:**
```bash
# Local test
cd server
npm run build

# Fix errors, commit, push
git add .
git commit -m "fix: TypeScript errors"
git push origin main
```

### Lỗi 2: CORS error

**Nguyên nhân:** CORS_ORIGIN chưa đúng

**Giải pháp:**
1. Vào Backend Environment
2. Kiểm tra `CORS_ORIGIN` = frontend URL
3. Save và redeploy

### Lỗi 3: Upload failed

**Nguyên nhân:** Cloudinary credentials sai

**Giải pháp:**
1. Check Backend logs
2. Verify Environment Variables
3. Test Cloudinary credentials local

### Lỗi 4: Camera không bật

**Nguyên nhân:** Render chỉ support HTTPS

**Giải pháp:**
- Render tự động có HTTPS
- Đảm bảo dùng `https://` không phải `http://`

### Lỗi 5: Free tier sleep

**Nguyên nhân:** Render free tier sleep sau 15 phút không dùng

**Giải pháp:**
- Lần đầu truy cập sẽ chậm (30s-1 phút)
- Hoặc upgrade lên paid plan ($7/tháng)

---

## 📊 PHẦN 6: Monitoring & Maintenance

### 6.1: Xem Metrics

**Backend:**
```
Dashboard → liveness-backend → Metrics
- CPU usage
- Memory usage
- Request count
```

**Frontend:**
```
Dashboard → liveness-frontend → Analytics
- Page views
- Bandwidth
```

### 6.2: Auto Deploy

Render tự động deploy khi push code:
```bash
git add .
git commit -m "feat: New feature"
git push origin main
# Render sẽ tự động deploy trong 3-5 phút
```

### 6.3: Manual Deploy

1. Vào service dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

### 6.4: Rollback

1. Vào service dashboard
2. Click **"Events"** tab
3. Chọn deploy cũ → Click **"Rollback"**

---

## 💰 PHẦN 7: Chi phí & Limits

### Free Tier Limits:

**Backend (Web Service):**
- ✅ 750 hours/tháng (đủ chạy 24/7)
- ✅ 512MB RAM
- ✅ 0.1 CPU
- ⚠️ Sleep sau 15 phút không dùng
- ⚠️ Cold start: 30s-1 phút

**Frontend (Static Site):**
- ✅ 100GB bandwidth/tháng
- ✅ Unlimited requests
- ✅ Global CDN
- ✅ Không sleep

**Cloudinary:**
- ✅ 25GB storage
- ✅ 25GB bandwidth/tháng
- ✅ 25,000 transformations

### Upgrade Options:

**Backend → Starter ($7/tháng):**
- Không sleep
- 512MB RAM
- Faster CPU

**Backend → Standard ($25/tháng):**
- 2GB RAM
- Dedicated CPU

---

## 🎯 PHẦN 8: Custom Domain (Optional)

### 8.1: Mua Domain

- Namecheap: ~$10/năm
- GoDaddy: ~$12/năm
- Google Domains: ~$12/năm

### 8.2: Setup trên Render

**Frontend:**
1. Dashboard → liveness-frontend → Settings
2. Scroll to **"Custom Domain"**
3. Add domain: `liveness.yourdomain.com`
4. Copy CNAME record

**DNS Settings:**
```
Type: CNAME
Name: liveness
Value: liveness-frontend.onrender.com
TTL: 3600
```

**Backend:**
1. Dashboard → liveness-backend → Settings
2. Add domain: `api.yourdomain.com`
3. Copy CNAME record

**DNS Settings:**
```
Type: CNAME
Name: api
Value: liveness-backend.onrender.com
TTL: 3600
```

### 8.3: Update Environment

**Backend:**
```
CORS_ORIGIN = https://liveness.yourdomain.com
```

**Frontend:**
```
VITE_API_URL = https://api.yourdomain.com
```

Commit và push → Auto deploy!

---

## 📚 PHẦN 9: Resources

### Render Docs:
- https://render.com/docs
- https://render.com/docs/deploy-node-express-app
- https://render.com/docs/deploy-vite

### Support:
- Render Community: https://community.render.com
- GitHub Issues: https://github.com/phamhuyduy99/TEST_CHECK_FACE/issues

### Monitoring:
- Render Dashboard: https://dashboard.render.com
- Cloudinary Console: https://console.cloudinary.com

---

## ✨ PHẦN 10: Checklist Cuối cùng

Deploy thành công khi:

**Backend:**
- [ ] Service status: Live (màu xanh)
- [ ] Logs không có error
- [ ] Test endpoint trả về response
- [ ] Environment variables đầy đủ

**Frontend:**
- [ ] Site status: Live (màu xanh)
- [ ] Mở được trên browser
- [ ] Camera hoạt động
- [ ] Upload thành công
- [ ] Hiển thị URLs

**Integration:**
- [ ] Frontend gọi được Backend
- [ ] CORS không bị block
- [ ] Upload lên Cloudinary OK
- [ ] Test trên mobile OK

---

## 🎉 Hoàn thành!

**URLs của bạn:**
- Frontend: `https://liveness-frontend.onrender.com`
- Backend: `https://liveness-backend.onrender.com`
- GitHub: `https://github.com/phamhuyduy99/TEST_CHECK_FACE`

**Share với team:**
```
🚀 Liveness Check App đã deploy!
📱 Web: https://liveness-frontend.onrender.com
🔧 API: https://liveness-backend.onrender.com
📖 Docs: https://github.com/phamhuyduy99/TEST_CHECK_FACE/tree/main/docs
```

Chúc mừng! 🎊
