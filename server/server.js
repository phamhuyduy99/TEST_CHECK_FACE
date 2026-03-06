require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 120000 // 2 phút
});

// Sử dụng memory storage thay vì disk
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Helper function để upload buffer lên Cloudinary với retry
const uploadToCloudinary = (buffer, options, retries = 3) => {
  return new Promise((resolve, reject) => {
    const attemptUpload = (attemptsLeft) => {
      const stream = cloudinary.uploader.upload_stream(
        { ...options, timeout: 120000 },
        (error, result) => {
          if (error) {
            console.error(`❌ Lỗi upload (còn ${attemptsLeft} lần thử):`, error.message);
            if (attemptsLeft > 0) {
              console.log(`🔄 Thử lại...`);
              setTimeout(() => attemptUpload(attemptsLeft - 1), 2000);
            } else {
              reject(error);
            }
          } else {
            resolve(result);
          }
        }
      );
      Readable.from(buffer).pipe(stream);
    };
    attemptUpload(retries);
  });
};

app.post('/api/upload', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📥 Nhận request upload');
    
    if (!req.files || !req.files.video || !req.files.image1 || !req.files.image2) {
      return res.status(400).json({ error: 'Thiếu file video hoặc ảnh' });
    }

    // Upload video lên Cloudinary
    console.log('☁️  Đang upload video lên Cloudinary...');
    const videoResult = await uploadToCloudinary(req.files.video[0].buffer, {
      resource_type: 'video',
      folder: 'liveness-check/videos',
      chunk_size: 6000000 // 6MB chunks
    });

    // Upload 2 ảnh lên Cloudinary
    console.log('☁️  Đang upload ảnh 1...');
    const image1Result = await uploadToCloudinary(req.files.image1[0].buffer, {
      resource_type: 'image',
      folder: 'liveness-check/images'
    });

    console.log('☁️  Đang upload ảnh 2...');
    const image2Result = await uploadToCloudinary(req.files.image2[0].buffer, {
      resource_type: 'image',
      folder: 'liveness-check/images'
    });

    const result = {
      video: {
        url: videoResult.secure_url,
        publicId: videoResult.public_id,
        size: `${(videoResult.bytes / 1024 / 1024).toFixed(2)} MB`,
        duration: `${videoResult.duration?.toFixed(1)}s`
      },
      image1: {
        url: image1Result.secure_url,
        publicId: image1Result.public_id,
        size: `${(image1Result.bytes / 1024).toFixed(0)} KB`
      },
      image2: {
        url: image2Result.secure_url,
        publicId: image2Result.public_id,
        size: `${(image2Result.bytes / 1024).toFixed(0)} KB`
      },
      message: 'Upload thành công lên Cloudinary'
    };

    console.log('✅ Upload thành công:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Lỗi upload:', error);
    res.status(500).json({ error: 'Lỗi upload lên Cloudinary', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME || '⚠️  CHƯA CẤU HÌNH'}`);
  console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/upload`);
});
