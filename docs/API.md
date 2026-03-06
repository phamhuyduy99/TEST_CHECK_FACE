# API Documentation

## Base URL
```
http://localhost:3000
```

## Endpoints

### POST /api/upload
Upload video và 2 ảnh lên Cloudinary

**Request:**
```http
POST /api/upload
Content-Type: multipart/form-data

Fields:
- video: File (video/webm, max 50MB)
- image1: File (image/jpeg)
- image2: File (image/jpeg)
```

**Response Success (200):**
```json
{
  "video": {
    "url": "https://res.cloudinary.com/.../video.mp4",
    "publicId": "liveness-check/videos/xxx",
    "size": "2.45 MB",
    "duration": "5.0s"
  },
  "image1": {
    "url": "https://res.cloudinary.com/.../image1.jpg",
    "publicId": "liveness-check/images/xxx",
    "size": "245 KB"
  },
  "image2": {
    "url": "https://res.cloudinary.com/.../image2.jpg",
    "publicId": "liveness-check/images/xxx",
    "size": "238 KB"
  },
  "message": "Upload thành công lên Cloudinary"
}
```

**Response Error (400):**
```json
{
  "error": "Thiếu file video hoặc ảnh"
}
```

**Response Error (500):**
```json
{
  "error": "Lỗi upload lên Cloudinary",
  "details": "Connection timeout"
}
```

## Error Codes
- `400`: Bad Request (thiếu file)
- `500`: Server Error (Cloudinary error)
- `503`: Service Unavailable (timeout)

## Rate Limiting
- Không có rate limit (development)
- Production: Cần thêm rate limiter

## CORS
- Allowed Origins: `http://localhost:5173`
- Methods: `POST, GET, OPTIONS`
- Headers: `Content-Type, Authorization`

## File Constraints
- Max size: 50MB
- Video formats: webm, mp4
- Image formats: jpeg, jpg
- Timeout: 120 seconds
- Retry: 3 attempts

## Cloudinary Configuration
```javascript
{
  timeout: 120000,
  chunk_size: 6000000,
  resource_type: 'video' | 'image',
  folder: 'liveness-check/videos' | 'liveness-check/images'
}
```
