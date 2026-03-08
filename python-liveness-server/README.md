# Python Liveness Detection Server

## 🎯 Tính năng

Advanced liveness detection sử dụng:
- ✅ **LBP (Local Binary Patterns)** - Phân tích texture
- ✅ **Color Diversity** - Phân tích màu sắc
- ✅ **FFT Analysis** - Phân tích tần số
- ✅ **Edge Density** - Phân tích cạnh

## 🚀 Cài đặt

```bash
cd python-liveness-server

# Tạo virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## ▶️ Chạy Server

```bash
python app.py
```

Server chạy tại: http://localhost:5000

## 📡 API Endpoints

### POST /check-liveness
Kiểm tra liveness từ ảnh

**Request:**
```
Content-Type: multipart/form-data
Body: image (file)
```

**Response:**
```json
{
  "isReal": true,
  "confidence": 0.87,
  "scores": {
    "texture": 0.92,
    "color": 0.85,
    "frequency": 0.78,
    "edge": 0.88
  }
}
```

## 🔗 Tích hợp với Node.js Backend

Trong `server/src/routes/upload.ts`, thêm:

```typescript
import axios from 'axios';
import FormData from 'form-data';

const checkLiveness = async (imageBuffer: Buffer) => {
  const formData = new FormData();
  formData.append('image', imageBuffer, 'face.jpg');
  
  const response = await axios.post('http://localhost:5000/check-liveness', formData, {
    headers: formData.getHeaders()
  });
  
  return response.data;
};
```
