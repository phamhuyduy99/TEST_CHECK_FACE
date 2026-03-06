import useLivenessCapture from './hooks/useLivenessCapture';
import useUpload from './hooks/useUpload';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorAlert from './components/ErrorAlert';
import SuccessResult from './components/SuccessResult';
import ControlButtons from './components/ControlButtons';
import LivenessGuide from './components/LivenessGuide';

export default function Camera() {
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
    resetRecording
  } = useLivenessCapture();

  const {
    uploading,
    uploadProgress,
    uploadedUrls,
    error,
    setError,
    uploadData
  } = useUpload();

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
          Kiểm tra Liveness Khuôn mặt
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
          onCaptureImage={captureImage}
          onUpload={handleUpload}
          onResetRecording={resetRecording}
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
