import useLivenessCapture from './hooks/useLivenessCapture';
import useUpload from './hooks/useUpload';
import useFaceDetection from './hooks/useFaceDetection';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorAlert from './components/ErrorAlert';
import SuccessResult from './components/SuccessResult';
import ControlButtons from './components/ControlButtons';
import LivenessGuide from './components/LivenessGuide';
import { useState } from 'react';

export default function Camera() {
  const [faceDescriptor1, setFaceDescriptor1] = useState<Float32Array | null>(null);
  const [faceMatchResult, setFaceMatchResult] = useState<string>('');
  const {
    videoRef,
    canvasRef,
    stream,
    recording,
    videoBlob,
    image1,
    image2,
    message,
    setMessage,
    startCamera,
    stopCamera,
    startRecording,
    stopRecording,
    captureImage,
    resetRecording,
  } = useLivenessCapture();

  const { uploading, uploadProgress, uploadedUrls, error, setError, uploadData } = useUpload();
  const { modelsLoaded, detectFace, compareFaces } = useFaceDetection();

  const handleCaptureWithDetection = async (imageNumber: number) => {
    captureImage(imageNumber);

    if (!modelsLoaded || !videoRef.current) return;

    const detection = await detectFace(videoRef.current);
    if (detection) {
      if (imageNumber === 1) {
        setFaceDescriptor1(detection.descriptor);
        setMessage(`✅ Ảnh 1: Phát hiện khuôn mặt thành công!`);
      } else {
        setMessage(`✅ Ảnh 2: Phát hiện khuôn mặt thành công!`);

        if (faceDescriptor1) {
          const result = compareFaces(faceDescriptor1, detection.descriptor);
          const matchText = result.match
            ? `✅ Khớp! Độ tương đồng: ${(result.similarity * 100).toFixed(1)}%`
            : `❌ Không khớp! Độ tương đồng: ${(result.similarity * 100).toFixed(1)}%`;
          setFaceMatchResult(matchText);
          setMessage(matchText);
        }
      }
    } else {
      setMessage(`⚠️ Không phát hiện được khuôn mặt trong ảnh ${imageNumber}`);
    }
  };

  const handleReset = () => {
    resetRecording();
    setFaceDescriptor1(null);
    setFaceMatchResult('');
  };

  const handleUpload = () => {
    if (videoBlob && image1 && image2) {
      uploadData(videoBlob, image1, image2, setMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4">
      {uploading && <LoadingOverlay progress={uploadProgress} />}

      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6 text-gray-800">
          Kiểm tra Liveness Khuôn mặt {!modelsLoaded && '(Đang tải models...)'}
        </h1>

        <div className="mb-4 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg bg-black aspect-video"
          />
          <LivenessGuide isRecording={recording} onComplete={stopRecording} />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {message && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded text-sm sm:text-base">
            {message}
          </div>
        )}

        {faceMatchResult && (
          <div
            className={`mb-4 p-3 rounded text-sm sm:text-base font-semibold ${
              faceMatchResult.includes('✅ Khớp')
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {faceMatchResult}
          </div>
        )}

        <ErrorAlert error={error} onClose={() => setError(null)} />
        <SuccessResult uploadedUrls={uploadedUrls} />

        <ControlButtons
          stream={stream}
          recording={recording}
          videoBlob={videoBlob}
          image1={image1}
          image2={image2}
          uploading={uploading}
          onStartCamera={startCamera}
          onStopCamera={stopCamera}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onCaptureImage={handleCaptureWithDetection}
          onUpload={handleUpload}
          onResetRecording={handleReset}
        />

        <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 sm:p-4 rounded">
          <p className="font-semibold mb-2">Hướng dẫn:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Nhấn "Bật Camera" và cho phép truy cập</li>
            <li>Nhấn "Bắt đầu quay Liveness"</li>
            <li>Thực hiện: quay mặt trái, phải, chớp mắt, cười</li>
            <li>Nhấn "Dừng quay"</li>
            <li>Chụp 2 ảnh khuôn mặt</li>
            <li>Nhấn "Gửi dữ liệu lên Server"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
