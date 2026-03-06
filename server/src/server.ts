import 'dotenv/config';
import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 120000
});

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

interface CloudinaryOptions {
  resource_type: 'video' | 'image';
  folder: string;
  chunk_size?: number;
  timeout?: number;
}

// Upload to Cloudinary with retry
const uploadToCloudinary = (
  buffer: Buffer,
  options: CloudinaryOptions,
  retries = 3
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const attemptUpload = (attemptsLeft: number) => {
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
          } else if (result) {
            resolve(result);
          }
        }
      );
      Readable.from(buffer).pipe(stream);
    };
    attemptUpload(retries);
  });
};

interface UploadFiles {
  video?: Express.Multer.File[];
  image1?: Express.Multer.File[];
  image2?: Express.Multer.File[];
}

app.post(
  '/api/upload',
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 }
  ]),
  async (req: Request, res: Response) => {
    try {
      console.log('📥 Nhận request upload');

      const files = req.files as UploadFiles;

      if (!files?.video || !files?.image1 || !files?.image2) {
        return res.status(400).json({ error: 'Thiếu file video hoặc ảnh' });
      }

      // Upload video
      console.log('☁️  Đang upload video lên Cloudinary...');
      const videoResult = await uploadToCloudinary(files.video[0].buffer, {
        resource_type: 'video',
        folder: 'liveness-check/videos',
        chunk_size: 6000000
      });

      // Upload images
      console.log('☁️  Đang upload ảnh 1...');
      const image1Result = await uploadToCloudinary(files.image1[0].buffer, {
        resource_type: 'image',
        folder: 'liveness-check/images'
      });

      console.log('☁️  Đang upload ảnh 2...');
      const image2Result = await uploadToCloudinary(files.image2[0].buffer, {
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Lỗi upload lên Cloudinary',
        details: errorMessage
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME || '⚠️  CHƯA CẤU HÌNH'}`);
  console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/upload`);
});
