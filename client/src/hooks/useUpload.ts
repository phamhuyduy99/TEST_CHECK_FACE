import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UploadedUrls {
  video: {
    url: string;
    publicId: string;
    size: string;
    duration: string;
  };
  image1: {
    url: string;
    publicId: string;
    size: string;
  };
  image2: {
    url: string;
    publicId: string;
    size: string;
  };
  liveness?: {
    isReal: boolean;
    confidence: number;
    scores?: {
      texture: number;
      color: number;
      frequency: number;
      edge: number;
    };
  };
  message: string;
}

interface ErrorState {
  title: string;
  message: string;
  details: string[];
}

export default function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrls, setUploadedUrls] = useState<UploadedUrls | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const uploadData = async (
    videoBlob: Blob,
    image1: Blob,
    image2: Blob,
    setMessage: (msg: string) => void,
    attempt = 1
  ): Promise<void> => {
    if (!videoBlob || !image1 || !image2) {
      setMessage('Vui lòng quay video và chụp đủ 2 ảnh trước khi gửi');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setRetryCount(attempt - 1);

    let progressInterval: ReturnType<typeof setInterval> | undefined;
    const startProgress = () => {
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + Math.random() * 8;
          return next >= 90 ? 90 : next; // Dừng ứng ở 90%
        });
      }, 400);
    };

    startProgress();

    const formData = new FormData();
    formData.append('video', videoBlob, 'liveness.webm');
    formData.append('image1', image1, 'face1.jpg');
    formData.append('image2', image2, 'face2.jpg');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 phút timeout

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (progressInterval) clearInterval(progressInterval);

      const result = await response.json();
      if (response.ok) {
        setUploadProgress(100);
        setMessage(`✅ Upload thành công lên Cloudinary!`);
        setUploadedUrls(result);
      } else {
        throw new Error(result.error || 'Upload thất bại');
      }
    } catch (err: unknown) {
      if (progressInterval) clearInterval(progressInterval);

      const error = err as Error & { name?: string };

      // Retry logic
      if (attempt < 3) {
        // console.log(`🔄 Thử lại lần ${attempt + 1}/3...`);
        setMessage(`⚠️ Lỗi upload. Đang thử lại (${attempt + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return uploadData(videoBlob, image1, image2, setMessage, attempt + 1);
      }

      // Hết retry, hiển thị lỗi
      let errorDetails = [
        'Server đang chạy chưa? (npm run dev)',
        'Cấu hình Cloudinary đúng chưa?',
        'Kết nối mạng ổn định không?',
        `Đã thử ${attempt} lần nhưng vẫn thất bại`,
      ];

      if (error.name === 'AbortError') {
        errorDetails = ['Upload quá lâu (timeout 2 phút)', 'Thử lại với kết nối mạng tốt hơn'];
      }

      setError({
        title: 'Lỗi kết nối',
        message: 'Không thể kết nối đến server. Vui lòng kiểm tra:',
        details: errorDetails,
      });
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  return {
    uploading,
    uploadProgress,
    uploadedUrls,
    error,
    retryCount,
    setError,
    setUploadedUrls, // Export để reset
    uploadData,
  };
}
