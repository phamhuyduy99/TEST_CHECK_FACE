# Hướng dẫn cấu hình Cloudinary

## Bước 1: Đăng ký tài khoản Cloudinary (FREE)
1. Truy cập: https://cloudinary.com/users/register_free
2. Đăng ký tài khoản miễn phí (có thể dùng Google/GitHub)
3. Xác nhận email

## Bước 2: Lấy thông tin API
1. Đăng nhập vào: https://console.cloudinary.com/
2. Tại Dashboard, bạn sẽ thấy:
   - **Cloud Name**: tên cloud của bạn
   - **API Key**: key API
   - **API Secret**: secret key (click vào mắt để xem)

## Bước 3: Cấu hình file .env
Mở file `server/.env` và điền thông tin:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

## Bước 4: Chạy server
```bash
cd server
npm start
```

## Kiểm tra
- Nếu cấu hình đúng, khi start server sẽ thấy: `☁️ Cloudinary: your_cloud_name`
- Nếu chưa cấu hình, sẽ thấy: `☁️ Cloudinary: ⚠️ CHƯA CẤU HÌNH`

## Xem file đã upload
1. Đăng nhập Cloudinary Dashboard
2. Vào **Media Library**
3. Tìm folder `liveness-check/videos` và `liveness-check/images`

## Free Tier Limits
- Storage: 25 GB
- Bandwidth: 25 GB/tháng
- Transformations: 25,000/tháng
- Đủ để test và demo!
