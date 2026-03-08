import useLivenessCapture from './hooks/useLivenessCapture';
import useUpload from './hooks/useUpload';
import useFaceDetection from './hooks/useFaceDetection';
import { useChallengeLiveness } from './hooks/useChallengeLiveness';
import challengeLivenessService from './services/challengeLivenessServiceFaceAPI';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorAlert from './components/ErrorAlert';
import SuccessResult from './components/SuccessResult';
import ControlButtons from './components/ControlButtons';
import FaceLandmarksOverlay from './components/FaceLandmarksOverlay';
import FaceInfo from './components/FaceInfo';
import SpoofingAlert from './components/SpoofingAlert';
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
  const [overlayCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [showButtons, setShowButtons] = useState(true);
  const [challengePassed, setChallengePassed] = useState<boolean>(false);
  const [antiSpoofWarning, setAntiSpoofWarning] = useState<string>('');
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

  const { uploading, uploadProgress, uploadedUrls, error, setError, setUploadedUrls, uploadData } = useUpload();
  const { modelsLoaded, detectFace } = useFaceDetection();
  const {
    challenge,
    progress,
    completed,
    finalScore,
    faceLandmarks,
    spoofingDetected,
    spoofingReason,
    startChallenge,
    reset: resetChallenge,
  } = useChallengeLiveness(videoRef, recording);

  useEffect(() => {
    if (recording && !challenge && !challengePassed && !spoofingDetected && !completed) {
      const timer = setTimeout(() => startChallenge(), 1000);
      return () => clearTimeout(timer);
    }
  }, [recording, challenge, challengePassed, spoofingDetected, completed, startChallenge]);

  useEffect(() => {
    if (!completed) return;

    const passedCount = challengeLivenessService.challengeHistory.filter(
      (c: any) => c.score > 0
    ).length;

    if (finalScore >= 0.8 && passedCount === 5) {
      setChallengePassed(true);
      setMessage(`✅ Challenge hoàn thành! Pass: ${passedCount}/5 - Bạn là người thật!`);

      setTimeout(() => {
        if (recording) {
          stopRecording();
          setTimeout(() => {
            captureImage(1);
            setTimeout(() => captureImage(2), 500);
          }, 500);
        }
      }, 1000);
    } else {
      const antiSpoofFailed = (challengeLivenessService as any).antiSpoofingFailed;

      if (antiSpoofFailed) {
        const details = (challengeLivenessService as any).antiSpoofingDetails || [];
        const failedReasons = details.filter((d: any) => !d.passed).map((d: any) => d.reason).join(', ');
        
        setMessage(
          `🚨 PHÁT HIỆN GIẢ MẠO! Hệ thống phát hiện bạn đang dùng video ghi sẵn hoặc màn hình. Vui lòng dùng camera thật!`
        );
        setAntiSpoofWarning(`Lý do: ${failedReasons}`);
      } else {
        setMessage(
          `❌ KHÔNG XÁC NHẬN ĐƯỢC LÀ NGƯỜI THẬT! Pass: ${passedCount}/5. Vui lòng thử lại.`
        );
      }
      setTimeout(() => {
        if (recording) {
          stopRecording();
        }
      }, 1000);
    }
  }, [completed, finalScore, setMessage, recording, stopRecording, captureImage]);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency || 2;
    const memory = (navigator as { deviceMemory?: number }).deviceMemory || 4;

    if (isMobile && (cores <= 4 || memory <= 4)) {
      // console.log('📱 Low-end device, performance mode');
    } else if (cores >= 8 && memory >= 8) {
      // console.log('🚀 High-end device, quality mode');
    } else {
      // console.log('⚖️ Mid-range device, balanced mode');
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (stream && modelsLoaded && videoRef.current) {
      const video = videoRef.current;

      interval = setInterval(async () => {
        await detectFace(video);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stream, modelsLoaded, detectFace, videoRef]);

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
    setVideoPreview('');
    setChallengePassed(false);
    setAntiSpoofWarning('');
    resetChallenge();
    setError(null);
    setUploadedUrls(null); // Ẩn kết quả upload
  };

  const handleStopRecording = () => {
    if (!challengePassed) {
      setMessage('❌ CHƯA HOÀN THÀNH CHALLENGE! Vui lòng làm theo hướng dẫn.');
      return;
    }

    stopRecording();
  };

  const handleUpload = () => {
    if (videoBlob && image1 && image2) {
      uploadData(videoBlob, image1, image2, setMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4 pb-32">
      {spoofingDetected && (
        <SpoofingAlert 
          reason={spoofingReason} 
          onRetry={() => {
            handleReset();
            startCamera();
          }} 
        />
      )}
      
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
            <p className="text-sm text-yellow-700">
              • Face-API.js (Phát hiện khuôn mặt + Challenge Liveness)
            </p>
          </div>
        )}

        {antiSpoofWarning && (
          <div className="mb-4 p-4 bg-orange-100 border-2 border-orange-500 rounded-lg">
            <p className="font-bold text-orange-800 mb-2">⚠️ Chi tiết phát hiện giả mạo:</p>
            <p className="text-sm text-orange-700">{antiSpoofWarning}</p>
            <div className="mt-3 p-3 bg-white rounded">
              <p className="text-xs text-gray-600 font-semibold mb-1">💡 Gợi ý khắc phục:</p>
              <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                <li>Sử dụng camera thật, không phải video ghi sẵn</li>
                <li>Tăng độ sáng phòng, đảm bảo ánh sáng tốt</li>
                <li>Di chuyển đầu nhẹ nhàng trong khi quay</li>
                <li>Không dùng màn hình điện thoại/máy tính</li>
              </ul>
            </div>
          </div>
        )}

        {recording && !challengePassed && (
          <div className="mb-4 p-4 bg-red-100 border-2 border-red-500 rounded-lg text-center">
            <p className="font-bold text-red-800 text-lg">⚠️ BẮT BUỘC: Hoàn thành Challenge!</p>
            <p className="text-sm text-red-700">Làm theo hướng dẫn trên màn hình</p>
          </div>
        )}

        {completed && !challengePassed && (
          <div className="mb-4 p-4 bg-red-100 border-2 border-red-500 rounded-lg">
            <p className="text-2xl font-bold text-red-800 text-center mb-3">
              ❌ Fail:{' '}
              {challengeLivenessService.challengeHistory.filter((c: any) => c.score > 0).length}/5 -
              Score: {(finalScore * 100).toFixed(0)}%
            </p>
            <p className="text-sm text-red-700 text-center mb-3">
              ❌ KHÔNG xác nhận được là người thật! Vui lòng thử lại.
            </p>
            <div className="bg-white rounded-lg p-3 mt-2">
              <p className="font-bold text-gray-800 mb-2">📋 Chi tiết thử thách:</p>
              {challengeLivenessService.challengeHistory.map((ch: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-1 border-b last:border-b-0"
                >
                  <span className="text-sm text-gray-700">
                    {idx + 1}. {ch.instruction}
                    {ch.timeout && <span className="text-xs text-orange-600 ml-2">(Timeout)</span>}
                    {ch.replayDetected && <span className="text-xs text-red-600 ml-2">({ch.replayReason || 'Replay'})</span>}
                  </span>
                  <span
                    className={`text-sm font-bold ${ch.score >= 1.0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {ch.score >= 1.0 ? '✅ Pass' : `❌ Fail (${ch.score.toFixed(1)})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {challengePassed && (
          <div className="mb-4 p-4 bg-green-100 border-2 border-green-500 rounded-lg">
            <p className="text-2xl font-bold text-green-800 text-center mb-3">
              🎉 Pass:{' '}
              {challengeLivenessService.challengeHistory.filter((c: any) => c.score > 0).length}/5 -
              Score: {(finalScore * 100).toFixed(0)}%
            </p>
            <p className="text-sm text-green-700 text-center mb-3">
              ✅ Xác nhận người thật! Có thể dừng quay.
            </p>
            <div className="bg-white rounded-lg p-3 mt-2">
              <p className="font-bold text-gray-800 mb-2">📋 Chi tiết thử thách:</p>
              {challengeLivenessService.challengeHistory.map((ch: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-1 border-b last:border-b-0"
                >
                  <span className="text-sm text-gray-700">
                    {idx + 1}. {ch.instruction}
                    {ch.timeout && <span className="text-xs text-orange-600 ml-2">(Timeout)</span>}
                    {ch.replayDetected && <span className="text-xs text-red-600 ml-2">({ch.replayReason || 'Replay'})</span>}
                  </span>
                  <span
                    className={`text-sm font-bold ${ch.score >= 1.0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {ch.score >= 1.0 ? '✅ Pass' : `❌ Fail (${ch.score.toFixed(1)})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg bg-black md:aspect-video object-cover"
            style={{ aspectRatio: window.innerWidth < 768 ? 'auto' : '16/9', height: window.innerWidth < 768 ? '100vh' : 'auto' }}
          />
          {recording && challenge && (() => {
            const currentChallengeIndex = challengeLivenessService.challengeHistory.length;
            const lastChallenge = challengeLivenessService.challengeHistory[currentChallengeIndex - 1];
            const isLastChallengePass = lastChallenge && lastChallenge.score >= 1.0;
            const showAsCompleted = progress >= 100 && lastChallenge && lastChallenge.type === challenge.type;
            
            return (
              <div className="absolute top-4 left-4 right-4 z-[100] pointer-events-none">
                <div
                  className={`p-4 rounded-lg shadow-2xl transition-all ${
                    showAsCompleted && isLastChallengePass
                      ? 'bg-green-500 text-white scale-105'
                      : showAsCompleted && !isLastChallengePass
                      ? 'bg-red-500 text-white scale-105'
                      : 'bg-blue-500 text-white animate-pulse'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-2xl font-bold">{challenge.instruction}</div>
                    <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
                      {challengeLivenessService.challengeHistory.length}/5
                    </div>
                  </div>

                  <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        showAsCompleted && isLastChallengePass
                          ? 'bg-green-200'
                          : showAsCompleted && !isLastChallengePass
                          ? 'bg-red-200'
                          : 'bg-white'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {showAsCompleted && (
                    <div className="mt-2 text-xl font-bold animate-bounce">
                      {isLastChallengePass ? '✅ Hoàn thành! 🎉' : '❌ Thất bại!'}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
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
              <FaceLandmarksOverlay videoRef={videoRef} landmarks={faceLandmarks} show={true} />
              {challenge && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg">
                  <div className="text-sm mb-1">
                    <span className="font-bold">Progress:</span> {progress.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-300">
                    Pass:{' '}
                    {
                      challengeLivenessService.challengeHistory.filter((c: any) => c.score > 0)
                        .length
                    }
                    /5
                  </div>
                </div>
              )}
            </>
          )}
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
        {image1 && (
          <div className="mb-4">
            <h3 className="font-bold text-lg mb-2 text-gray-800">📸 Ảnh 1:</h3>
            <img
              src={URL.createObjectURL(image1)}
              alt="Ảnh 1"
              className="w-full rounded-lg border-2 border-green-500 shadow-lg"
            />
          </div>
        )}

        <FaceInfo detection={faceInfo2} imageNumber={2} />
        {image2 && (
          <div className="mb-4">
            <h3 className="font-bold text-lg mb-2 text-gray-800">📸 Ảnh 2:</h3>
            <img
              src={URL.createObjectURL(image2)}
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

      {showButtons && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl p-3 sm:p-4 z-40">
          <div className="max-w-2xl mx-auto">
            <ControlButtons
              stream={stream}
              recording={recording}
              videoBlob={videoBlob}
              image1={image1}
              image2={image2}
              uploading={uploading}
              modelsLoaded={modelsLoaded}
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
