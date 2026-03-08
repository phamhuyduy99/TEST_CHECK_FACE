# Debug Faceplugin SDK - Lỗi "protobuf parsing failed"

## 🔍 Kiểm tra ngay

### 1. Kiểm tra Network Tab
1. Mở DevTools (F12)
2. Tab Network → Filter "onnx"
3. Refresh trang
4. Tìm request đến `fr_liveness.onnx`
5. Kiểm tra:
   - Status: 200 (OK) hay 404 (Not Found)?
   - Response Type: Binary hay HTML?
   - Size: ~1.8MB hay 0 bytes?

### 2. Kiểm tra file model có tồn tại
Mở trình duyệt và truy cập:
```
http://localhost:5173/faceplugin-models/fr_liveness.onnx
```

**Kết quả mong đợi**: Trình duyệt tải về file binary (1.8MB)
**Nếu lỗi 404**: File không có trong public folder

### 3. Kiểm tra cấu trúc thư mục
```
client/
├── public/
│   ├── faceplugin-models/
│   │   ├── fr_liveness.onnx (1.8MB) ✅
│   │   ├── fr_detect.onnx
│   │   ├── opencv_js.wasm ✅
│   │   ├── ort-wasm-simd-threaded.wasm ✅
│   │   └── ... (các WASM files khác)
│   └── models/ (Face-API.js models)
```

## 🛠️ Giải pháp

### Nếu file model không có
```bash
cd client
copy node_modules\\faceplugin-face-recognition-js\\model\\*.onnx public\\faceplugin-models\\
```

### Nếu WASM files thiếu
```bash
copy node_modules\\faceplugin-face-recognition-js\\js\\opencv_js.wasm public\\faceplugin-models\\
copy node_modules\\onnxruntime-web\\dist\\*.wasm public\\faceplugin-models\\
```

## 📊 Trạng thái hiện tại

✅ Face-API.js: Hoạt động tốt
✅ Fallback heuristic liveness: Đã implement
❌ Faceplugin SDK: Lỗi load model

## 🎯 Kết quả mong đợi

Sau khi fix, console sẽ hiện:
```
✅ Faceplugin liveness model loaded
```

Thay vì:
```
❌ Failed to load liveness model: Error: Can't create a session...
⚠️ Faceplugin not available, using face detection only
```

## 🔄 Fallback hiện tại

App vẫn chạy được với heuristic liveness detection:
- Phân tích brightness + variance của ảnh
- Confidence: 0.75-0.95
- Không chính xác bằng Faceplugin nhưng đủ dùng tạm

## 📝 Next Steps

1. Kiểm tra Network tab theo hướng dẫn trên
2. Verify file models đã copy đúng chưa
3. Nếu vẫn lỗi, share screenshot Network tab để debug tiếp
