import { useRef, useEffect, useState } from 'react';
import livenessService from '../services/livenessService';

export default function CameraLiveness() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [livenessStatus, setLivenessStatus] = useState<string>('Đang khởi tạo...');
  const [isReal, setIsReal] = useState<boolean | null>(null);
  const [confidence, setConfidence] = useState<number>(0);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let stream: MediaStream | undefined;

    async function setupCameraAndCheck() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        await livenessService.loadModels();
        setLivenessStatus('Đang kiểm tra...');

        intervalId = setInterval(async () => {
          if (!videoRef.current) return;
          const result = await livenessService.checkLiveness(videoRef.current);
          setConfidence(result.confidence);
          if (result.isReal) {
            setLivenessStatus('✅ Người thật');
            setIsReal(true);
          } else {
            setLivenessStatus('❌ Phát hiện giả mạo (ảnh/video)');
            setIsReal(false);
          }
        }, 500);
      } catch (error) {
        setLivenessStatus('❌ Lỗi: ' + (error instanceof Error ? error.message : 'Unknown'));
      }
    }

    setupCameraAndCheck();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <video
        ref={videoRef}
        className="w-full max-w-lg rounded-lg shadow-lg"
        autoPlay
        playsInline
        muted
      />
      <div
        className={`text-xl font-bold px-6 py-3 rounded-lg ${
          isReal === true
            ? 'bg-green-100 text-green-800'
            : isReal === false
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
        }`}
      >
        {livenessStatus}
      </div>
      {confidence > 0 && (
        <div className="text-sm text-gray-600">Độ tin cậy: {(confidence * 100).toFixed(1)}%</div>
      )}
    </div>
  );
}
