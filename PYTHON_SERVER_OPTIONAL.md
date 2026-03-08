# Python Server - Optional

## ⚠️ Lưu Ý Quan Trọng

**Python server là OPTIONAL (không bắt buộc)**. Dự án hoạt động hoàn toàn tốt mà không cần Python server.

## 🚀 Chạy Không Cần Python (Khuyến Nghị)

```bash
npm run dev:no-python
```

Hệ thống sử dụng:
- ✅ **Face-API.js** (JavaScript) - Face detection + Landmarks
- ✅ **Challenge Liveness** (JavaScript) - Active liveness detection
- ✅ **Anti-Spoofing** (JavaScript) - Passive detection

## 📦 Nếu Muốn Dùng Python Server

### 1. Cài Python

**Windows:**
- Download từ: https://www.python.org/downloads/
- Chọn "Add Python to PATH" khi cài đặt

**Kiểm tra:**
```bash
python --version
# Hoặc
python3 --version
```

### 2. Setup Python Server

```bash
cd python-liveness-server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Chạy Full Stack

```bash
npm run dev
```

## 🎯 So Sánh

| Feature | JavaScript Only | + Python Server |
|---------|----------------|-----------------|
| Face Detection | ✅ Face-API.js | ✅ Face-API.js |
| Active Liveness | ✅ Challenges | ✅ Challenges |
| Anti-Spoofing | ✅ 5 methods | ✅ 5 methods + Python |
| Performance | ⚡ Fast | 🐢 Slower (network) |
| Privacy | ✅ 100% local | ⚠️ Send to server |
| Setup | ✅ Easy | ⚠️ Need Python |

## 💡 Khuyến Nghị

**Dùng JavaScript Only** (`npm run dev:no-python`) vì:
- ✅ Đơn giản hơn
- ✅ Nhanh hơn (không qua network)
- ✅ Bảo mật hơn (100% client-side)
- ✅ Không cần cài Python

**Chỉ dùng Python nếu:**
- Cần deep learning models nâng cao
- Cần server-side verification
- Có yêu cầu đặc biệt về accuracy

## 🔧 Troubleshooting

### Python not found
```bash
# Cài Python từ python.org
# Hoặc chạy không cần Python:
npm run dev:no-python
```

### pip install fails
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Hoặc chạy không cần Python:
npm run dev:no-python
```

### Port 5000 already in use
```bash
# Đổi port trong python-liveness-server/app.py
# Hoặc chạy không cần Python:
npm run dev:no-python
```

---

**Kết luận:** Dự án hoạt động tốt mà không cần Python server! 🎉
