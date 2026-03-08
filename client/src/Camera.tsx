import useLivenessCapture from './hooks/useLivenessCapture';
import useUpload from './hooks/useUpload';
import useFaceDetection from './hooks/useFaceDetection';
import livenessService from './services/livenessService';
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
  const [faceMatchResult, setFaceMatchResult] = useState<string>('');
  const [faceInfo1, setFaceInfo1] = useState<FaceDetectionInfo | null>(null);
  const [faceInfo2, setFaceInfo2] = useState<FaceDetectionInfo | null>(null);
  const [liveDetection, setLiveDetection] = useState<boolean>(false);
  const [overlayCanvasRef] = useState<HTMLCanvasElement | null>(document.createElement('canvas'));
  const [imagePreview1, setImagePreview1] = useState<string>('');
  const [imagePreview2, setImagePreview2] = useState<string>('');
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [faceDetectedDuringRecording, setFaceDetectedDuringRecording] = useState(false);
  const [showButtons, setShowButtons] = useState(true);
  const [livenessStatus, setLivenessStatus] = useState<string>('');
  const [isRealPerson, setIsRealPerson] = useState<boolean | null>(null);
  const [livenessCanvas] = useState<HTMLCanvasElement>(() => {
    const canvas = document.createElement('canvas');
    canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    return canvas;
  });
  const [performanceMode, setPerformanceMode] = useState<'auto' | 'high' | 'low'>('auto');
  const [realPersonDetectedCount, setRealPersonDetectedCount] = useState<number>(0);
  const [autoCaptureDone, setAutoCaptureDone] = useState<boolean>(false);
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
  const { modelsLoaded, detectFace } = useFaceDetection();
  // Skip MediaPipe - chỉ dùng Face-API.js (nhanh hơn)
  // const { mediaPipeLoaded, detectFaceMediaPipe } = useMediaPipeFaceDetection();

  // Auto-detect performance mode
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency || 2;
    const memory = (navigator as { deviceMemory?: number }).deviceMemory || 4;

    if (isMobile && (cores <= 4 || memory <= 4)) {
      setPerformanceMode('low');
      console.log('📱 Low-end device, performance mode');
    } else if (cores >= 8 && memory >= 8) {
      setPerformanceMode('high');
      console.log('🚀 High-end device, quality mode');
    } else {
      setPerformanceMode('auto');
      console.log('⚖️ Mid-range device, balanced mode');
    }

    livenessService.loadModels().catch(err => {
      console.error('Faceplugin load failed:', err);
    });
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let frameCount = 0;
    let lastFacePosition = { x: 0, y: 0 };
    let stableFrames = 0;

    if (stream && modelsLoaded && videoRef.current && overlayCanvasRef) {
      const video = videoRef.current;
      overlayCanvasRef.width = video.videoWidth;
      overlayCanvasRef.height = video.videoHeight;
      livenessCanvas.width = video.videoWidth;
      livenessCanvas.height = video.videoHeight;
      const ctx = overlayCanvasRef.getContext('2d');

      const checkInterval =
        performanceMode === 'low' ? 1500 : performanceMode === 'high' ? 800 : 1000;
      const livenessFrameSkip = performanceMode === 'low' ? 4 : performanceMode === 'high' ? 2 : 3;

      interval = setInterval(async () => {
        frameCount++;

        const faceApiDetection = await detectFace(video);
        const detected = !!faceApiDetection;
        setLiveDetection(detected);

        if (detected) {
          setFaceDetectedDuringRecording(true);

          const box = faceApiDetection.detection.box;
          const centerX = box.x + box.width / 2;
          const centerY = box.y + box.height / 2;

          const distance = Math.sqrt(
            Math.pow(centerX - lastFacePosition.x, 2) + Math.pow(centerY - lastFacePosition.y, 2)
          );

          if (distance < 30) {
            stableFrames++;
          } else {
            stableFrames = 0;
          }

          lastFacePosition = { x: centerX, y: centerY };
        } else {
          stableFrames = 0;
        }

        if (detected && frameCount % livenessFrameSkip === 0 && stableFrames >= 2) {
          try {
            const livenessCtx = livenessCanvas.getContext('2d', {
              alpha: false,
              willReadFrequently: true,
            });

            if (livenessCtx) {
              livenessCtx.drawImage(video, 0, 0, livenessCanvas.width, livenessCanvas.height);

              const box = faceApiDetection.detection.box;
              const faceBbox = {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height,
              };

              const livenessResult = await livenessService.checkLiveness(
                livenessCanvas,
                faceBbox,
                video.videoWidth
              );

              setIsRealPerson(livenessResult.isReal);
              setLivenessStatus(
                livenessResult.isReal
                  ? `✅ Người thật (${(livenessResult.confidence * 100).toFixed(0)}%)`
                  : `❌ Giả mạo (${(livenessResult.confidence * 100).toFixed(0)}%)`
              );

              if (livenessResult.isReal && livenessResult.confidence > 0.7 && !autoCaptureDone) {
                setRealPersonDetectedCount(prev => prev + 1);

                if (realPersonDetectedCount === 1 && !image1) {
                  captureImage(1);
                  setMessage('✅ Tự động chụp ảnh 1!');
                }

                if (realPersonDetectedCount === 3 && image1 && !image2) {
                  captureImage(2);
                  setMessage('✅ Tự động chụp ảnh 2! Hoàn tất!');
                  setAutoCaptureDone(true);
                }
              }
            }
          } catch (err) {
            console.error('Liveness check error:', err);
          }
        }

        if (faceApiDetection && ctx) {
          ctx.clearRect(0, 0, overlayCanvasRef.width, overlayCanvasRef.height);
          const box = faceApiDetection.detection.box;

          ctx.strokeStyle =
            isRealPerson === true ? '#00ff00' : isRealPerson === false ? '#ff0000' : '#ffff00';
          ctx.lineWidth = 3;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          if (performanceMode === 'high') {
            ctx.fillStyle = '#ff0000';
            faceApiDetection.landmarkPositions.forEach((point: { x: number; y: number }) => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
              ctx.fill();
            });
          }
        }
      }, checkInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
      livenessService.clearCache();
    };
  }, [
    stream,
    modelsLoaded,
    performanceMode,
    realPersonDetectedCount,
    image1,
    image2,
    autoCaptureDone,
  ]);

  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoPreview(url);
      setMessage('✅ Video đã lưu thành công! Phát hiện người trong video.');
      return () => URL.revokeObjectURL(url);
    }
  }, [videoBlob, setMessage]);

  const handleReset = () => {
    resetRecording();
    setFaceMatchResult('');
    setFaceInfo1(null);
    setFaceInfo2(null);
    setLiveDetection(false);
    setImagePreview1('');
    setImagePreview2('');
    setVideoPreview('');
    setFaceDetectedDuringRecording(false);
    setRealPersonDetectedCount(0);
    setAutoCaptureDone(false);
  };

  const handleStopRecording = () => {
    if (!faceDetectedDuringRecording) {
      setMessage('❌ KHÔNG PHÁT HIỆN NGƯỜI TRONG VIDEO! Video không được lưu. Vui lòng quay lại.');
      stopRecording();
      setFaceDetectedDuringRecording(false);
      setVideoPreview('');
      return;
    }

    stopRecording();
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

        {!modelsLoaded && (
          <div className="mb-4 p-4 bg-yellow-100 border-2 border-yellow-500 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-600 border-t-transparent"></div>
              <p className="font-bold text-yellow-800">Đang tải AI Models...</p>
            </div>
            <p className="text-sm text-yellow-700">• Face-API.js (Phát hiện khuôn mặt)</p>
            <p className="text-sm text-yellow-700">• Faceplugin SDK (Kiểm tra liveness)</p>
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
          {recording &&
            overlayCanvasRef &&
            overlayCanvasRef.width > 0 &&
            overlayCanvasRef.height > 0 && (
              <canvas
                ref={el => {
                  if (
                    el &&
                    overlayCanvasRef &&
                    overlayCanvasRef.width > 0 &&
                    overlayCanvasRef.height > 0
                  ) {
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
            <>
              <div
                className={`absolute top-4 right-4 px-4 py-3 rounded-full font-bold shadow-xl transition-all ${
                  liveDetection
                    ? 'bg-green-500 text-white text-base sm:text-lg'
                    : 'bg-red-600 text-white text-lg sm:text-xl animate-bounce'
                }`}
              >
                {liveDetection ? '✅ Phát hiện người' : '⚠️ Không thấy người'}
              </div>
              {livenessStatus && (
                <div
                  className={`absolute top-20 right-4 px-4 py-2 rounded-lg font-bold shadow-xl text-sm ${
                    isRealPerson === true
                      ? 'bg-blue-500 text-white'
                      : isRealPerson === false
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-500 text-white'
                  }`}
                >
                  {livenessStatus}
                </div>
              )}
            </>
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

      {/* Toggle Button with Tooltip */}
      <div className="fixed bottom-4 right-4 z-50 group">
        <button
          onClick={() => setShowButtons(!showButtons)}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 hover:scale-110 transition-all text-2xl cursor-pointer"
          aria-label={showButtons ? 'Ẩn bảng điều khiển' : 'Hiện bảng điều khiển'}
        >
          {showButtons ? '👇' : '👆'}
        </button>
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {showButtons ? 'Ẩn bảng điều khiển' : 'Hiện bảng điều khiển'}
        </div>
      </div>

      {/* Sticky Control Buttons */}
      {showButtons && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl p-3 sm:p-4 z-40">
          <div className="max-w-2xl mx-auto">
            <ControlButtons
              stream={stream}
              recording={recording}
              videoBlob={videoBlob}
              image1={image1}
              image2={image2}
              uploading={uploading || !modelsLoaded}
              onStartCamera={startCamera}
              onStopCamera={stopCamera}
              onStartRecording={startRecording}
              onStopRecording={handleStopRecording}
              onUpload={handleUpload}
              onResetRecording={handleReset}
            />
          </div>
        </div>
      )}
    </div>
  );
}
