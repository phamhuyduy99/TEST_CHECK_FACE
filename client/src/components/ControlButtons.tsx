interface ControlButtonsProps {
  stream: MediaStream | null;
  recording: boolean;
  videoBlob: Blob | null;
  image1: Blob | null;
  image2: Blob | null;
  uploading: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCaptureImage: (imageNumber: number) => void;
  onUpload: () => void;
  onResetRecording: () => void;
}

export default function ControlButtons({ 
  stream, 
  recording, 
  videoBlob, 
  image1, 
  image2, 
  uploading,
  onStartCamera,
  onStopCamera,
  onStartRecording,
  onStopRecording,
  onCaptureImage,
  onUpload,
  onResetRecording
}: ControlButtonsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4">
      {!stream ? (
        <button 
          onClick={onStartCamera}
          className="col-span-1 sm:col-span-2 bg-green-600 text-white px-4 py-2.5 sm:py-3 rounded-lg hover:bg-green-700 text-sm sm:text-base font-medium cursor-pointer"
        >
          Bật Camera
        </button>
      ) : (
        <button 
          onClick={onStopCamera}
          className="col-span-1 sm:col-span-2 bg-red-600 text-white px-4 py-2.5 sm:py-3 rounded-lg hover:bg-red-700 text-sm sm:text-base font-medium cursor-pointer"
        >
          Tắt Camera
        </button>
      )}

      {stream && !recording && !videoBlob && (
        <button 
          onClick={onStartRecording}
          className="col-span-1 sm:col-span-2 bg-blue-600 text-white px-4 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 text-sm sm:text-base font-medium cursor-pointer"
        >
          Bắt đầu quay Liveness
        </button>
      )}

      {stream && videoBlob && (
        <button 
          onClick={onResetRecording}
          className="col-span-1 sm:col-span-2 bg-yellow-600 text-white px-4 py-2.5 sm:py-3 rounded-lg hover:bg-yellow-700 text-sm sm:text-base font-medium cursor-pointer"
        >
          🔄 Quay lại
        </button>
      )}

      {recording && (
        <button 
          onClick={onStopRecording}
          className="col-span-1 sm:col-span-2 bg-orange-600 text-white px-4 py-2.5 sm:py-3 rounded-lg hover:bg-orange-700 text-sm sm:text-base font-medium cursor-pointer"
        >
          Dừng quay
        </button>
      )}

      {stream && (
        <>
          <button 
            onClick={() => onCaptureImage(1)}
            className="bg-purple-600 text-white px-4 py-2.5 sm:py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base font-medium cursor-pointer"
            disabled={recording || !videoBlob}
          >
            Chụp ảnh 1 {image1 && '✓'}
          </button>
          <button 
            onClick={() => onCaptureImage(2)}
            className="bg-purple-600 text-white px-4 py-2.5 sm:py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base font-medium cursor-pointer"
            disabled={recording || !videoBlob || !image1}
          >
            Chụp ảnh 2 {image2 && '✓'}
          </button>
        </>
      )}

      {videoBlob && image1 && image2 && (
        <button 
          onClick={onUpload}
          disabled={uploading}
          className="col-span-1 sm:col-span-2 bg-indigo-600 text-white px-4 py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 text-sm sm:text-base font-medium cursor-pointer"
        >
          {uploading ? 'Đang gửi...' : 'Gửi dữ liệu lên Server'}
        </button>
      )}
    </div>
  );
}
