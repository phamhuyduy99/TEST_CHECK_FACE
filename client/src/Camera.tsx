import useLivenessCapture from './hooks/useLivenessCapture';
import useUpload from './hooks/useUpload';
import useFaceDetection from './hooks/useFaceDetection';
import useMediaPipeFaceDetection from './hooks/useMediaPipeFaceDetection';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorAlert from './components/ErrorAlert';
import SuccessResult from './components/SuccessResult';
import ControlButtons from './components/ControlButtons';
import LivenessGuide from './components/LivenessGuide';
import FaceInfo from './components/FaceInfo';
import { useState, useEffect } from 'react';

interface FaceDetectionInfo {
  confidence: number;
  landmarks: number;
  descriptor: Float32Array;
  detection: {
    box: { x: number; y: number; width: number; height: number };
  };
  landmarkPositions: Array<{ x: number; y: number }>;
}

export default function Camera() {
  const [faceDescriptor1, setFaceDescriptor1] = useState<Float32Array | null>(null);
  const [faceMatchResult, setFaceMatchResult] = useState<string>('');
  const [faceInfo1, setFaceInfo1] = useState<FaceDetectionInfo | null>(null);
  const [faceInfo2, setFaceInfo2] = useState<FaceDetectionInfo | null>(null);
  const [liveDetection, setLiveDetection] = useState<boolean>(false);
  const [overlayCanvasRef] = useState<HTMLCanvasElement | null>(document.createElement('canvas'));
  const [imagePreview1, setImagePreview1] = useState<string>('');
  const [imagePreview2, setImagePreview2] = useState<string>('');
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [faceDetectedDuringRecording, setFaceDetectedDuringRecording] = useState(false);
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
  const { mediaPipeLoaded, detectFaceMediaPipe } = useMediaPipeFaceDetection();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (recording && modelsLoaded && mediaPipeLoaded && videoRef.current && overlayCanvasRef) {
      const video = videoRef.current;
      overlayCanvasRef.width = video.videoWidth;
      overlayCanvasRef.height = video.videoHeight;

      interval = setInterval(async () => {
        // Dùng cả 2 models để tăng độ chính xác
        const [faceApiDetection, mediaPipeDetection] = await Promise.all([
          detectFace(video),
          detectFaceMediaPipe(video),
        ]);

        // Chỉ cần 1 trong 2 detect được là OK
        const detected = !!faceApiDetection || mediaPipeDetection;
        setLiveDetection(detected);
        
        // Track nếu đã từng detect được người trong video
        if (detected) {
          setFaceDetectedDuringRecording(true);
        }

        if (faceApiDetection && overlayCanvasRef) {
          const ctx = overlayCanvasRef.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, overlayCanvasRef.width, overlayCanvasRef.height);
            // Vẽ bounding box
            const box = faceApiDetection.detection.box;
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            // Vẽ landmarks
            ctx.fillStyle = '#ff0000';
            faceApiDetection.landmarkPositions.forEach((point: { x: number; y: number }) => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
              ctx.fill();
            });
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, modelsLoaded, mediaPipeLoaded]);

  const handleCaptureWithDetection = async (imageNumber: number) => {
    if (!modelsLoaded || !videoRef.current) {
      setMessage('⚠️ Models chưa load xong!');
      return;
    }

    const detection = await detectFace(videoRef.current);
    if (!detection) {
      setMessage(
        '🚨 KHÔNG PHÁT HIỆN KHUÔN MẶT! Vui lòng đảm bảo khuôn mặt rõ ràng trong khung hình.'
      );
      return;
    }

    captureImage(imageNumber);

    if (imageNumber === 1) {
      setFaceDescriptor1(detection.descriptor);
      setFaceInfo1(detection);
      setMessage(`✅ Ảnh 1: Phát hiện khuôn mặt thành công!`);

      if (canvasRef.current) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = canvasRef.current.width;
          canvas.height = canvasRef.current.height;
          ctx.drawImage(canvasRef.current, 0, 0);

          // Vẽ bounding box
          const box = detection.detection.box;
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 4;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          setImagePreview1(canvas.toDataURL('image/jpeg'));
        }
      }
    } else {
      setFaceInfo2(detection);
      setMessage(`✅ Ảnh 2: Phát hiện khuôn mặt thành công!`);

      if (canvasRef.current) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = canvasRef.current.width;
          canvas.height = canvasRef.current.height;
          ctx.drawImage(canvasRef.current, 0, 0);

          // Vẽ bounding box
          const box = detection.detection.box;
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 4;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          setImagePreview2(canvas.toDataURL('image/jpeg'));
        }
      }

      if (faceDescriptor1) {
        const result = compareFaces(faceDescriptor1, detection.descriptor);
        const matchText = result.match
          ? `✅ Khớp! Độ tương đồng: ${(result.similarity * 100).toFixed(1)}%`
          : `❌ Không khớp! Độ tương đồng: ${(result.similarity * 100).toFixed(1)}%`;
        setFaceMatchResult(matchText);
        setMessage(matchText);
      }
    }
  };

  const handleReset = () => {
    resetRecording();
    setFaceDescriptor1(null);
    setFaceMatchResult('');
    setFaceInfo1(null);
    setFaceInfo2(null);
    setLiveDetection(false);
    setImagePreview1('');
    setImagePreview2('');
    setVideoPreview('');
    setFaceDetectedDuringRecording(false);
  };

  const handleStopRecording = () => {
    if (!faceDetectedDuringRecording) {
      setMessage('❌ KHÔNG PHÁT HIỆN NGƯỜI TRONG VIDEO! Video không được lưu. Vui lòng quay lại.');
      stopRecording();
      setFaceDetectedDuringRecording(false);
      return;
    }
    
    stopRecording();
    
    // Tạo video preview
    setTimeout(() => {
      if (videoBlob) {
        const url = URL.createObjectURL(videoBlob);
        setVideoPreview(url);
        setMessage('✅ Video đã lưu thành công! Phát hiện người trong video.');
      }
    }, 100);
    
    setFaceDetectedDuringRecording(false);
  };

  const handleUpload = () => {
    if (videoBlob && image1 && image2) {
      uploadData(videoBlob, image1, image2, setMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4 pb-32">
      {uploading && <LoadingOverlay progress={uploadProgress} />}

      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6 text-gray-800">
          Kiểm tra Liveness Khuôn mặt
        </h1>

        {(!modelsLoaded || !mediaPipeLoaded) && (
          <div className="mb-4 p-4 bg-yellow-100 border-2 border-yellow-500 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-600 border-t-transparent"></div>
              <p className="font-bold text-yellow-800">Đang tải AI Models...</p>
            </div>
            <p className="text-sm text-yellow-700">
              {!modelsLoaded && '• Face-API.js '}
              {!mediaPipeLoaded && '• MediaPipe (Google)'}
            </p>
          </div>
        )}

        <div className="mb-4 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg bg-black aspect-video"
          />
          {recording && overlayCanvasRef && (
            <canvas
              ref={el => {
                if (el && overlayCanvasRef) {
                  el.width = overlayCanvasRef.width;
                  el.height = overlayCanvasRef.height;
                  const ctx = el.getContext('2d');
                  const overlayCtx = overlayCanvasRef.getContext('2d');
                  if (ctx && overlayCtx) {
                    ctx.drawImage(overlayCanvasRef, 0, 0);
                  }
                }
              }}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
          )}
          {recording && (
            <div
              className={`absolute top-4 right-4 px-4 py-3 rounded-full font-bold shadow-xl transition-all ${
                liveDetection
                  ? 'bg-green-500 text-white text-base sm:text-lg'
                  : 'bg-red-600 text-white text-lg sm:text-xl animate-bounce'
              }`}
            >
              {liveDetection ? '✅ Phát hiện người' : '⚠️ Không thấy người'}
            </div>
          )}
          <LivenessGuide isRecording={recording} onComplete={handleStopRecording} />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg font-bold ${
              message.includes('KHÔNG PHÁT HIỆN')
                ? 'bg-red-100 border-4 border-red-600 text-red-900 text-lg sm:text-xl animate-pulse shadow-lg'
                : 'bg-blue-100 text-blue-800 text-sm sm:text-base'
            }`}
          >
            {message}
          </div>
        )}

        <FaceInfo detection={faceInfo1} imageNumber={1} />
        {imagePreview1 && (
          <div className="mb-4">
            <img
              src={imagePreview1}
              alt="Ảnh 1"
              className="w-full rounded-lg border-2 border-green-500 shadow-lg"
            />
          </div>
        )}

        <FaceInfo detection={faceInfo2} imageNumber={2} />
        {imagePreview2 && (
          <div className="mb-4">
            <img
              src={imagePreview2}
              alt="Ảnh 2"
              className="w-full rounded-lg border-2 border-green-500 shadow-lg"
            />
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

        {videoPreview && (
          <div className="mb-4">
            <h3 className="font-bold text-lg mb-2 text-gray-800">🎥 Video Liveness đã quay:</h3>
            <video
              src={videoPreview}
              controls
              className="w-full rounded-lg border-2 border-blue-500 shadow-lg"
            />
          </div>
        )}

        <ErrorAlert error={error} onClose={() => setError(null)} />
        <SuccessResult uploadedUrls={uploadedUrls} />
      </div>

      {/* Sticky Control Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl p-3 sm:p-4 z-40">
        <div className="max-w-2xl mx-auto">
          <ControlButtons
            stream={stream}
            recording={recording}
            videoBlob={videoBlob}
            image1={image1}
            image2={image2}
            uploading={uploading || !modelsLoaded || !mediaPipeLoaded}
            onStartCamera={startCamera}
            onStopCamera={stopCamera}
            onStartRecording={startRecording}
            onStopRecording={handleStopRecording}
            onCaptureImage={handleCaptureWithDetection}
            onUpload={handleUpload}
            onResetRecording={handleReset}
          />
        </div>
      </div>
    </div>
  );
}
