interface FaceInfoProps {
  detection: {
    confidence: number;
    landmarks: number;
    descriptor: Float32Array;
  } | null;
  imageNumber: number;
}

export default function FaceInfo({ detection, imageNumber }: FaceInfoProps) {
  if (!detection) return null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg p-4 sm:p-6 mb-4 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-3xl sm:text-4xl">✅</span>
        <h3 className="text-xl sm:text-2xl font-bold text-green-800">
          Ảnh {imageNumber}: Phát hiện khuôn mặt
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
        <div className="bg-white rounded-lg p-3 shadow">
          <p className="text-gray-600 mb-1">Độ tin cậy</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-700">
            {(detection.confidence * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {detection.confidence > 0.9
              ? '🟢 Rất tốt'
              : detection.confidence > 0.7
                ? '🟡 Tốt'
                : '🟠 Trung bình'}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow">
          <p className="text-gray-600 mb-1">Điểm đặc trưng</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-700">{detection.landmarks} điểm</p>
          <p className="text-xs text-gray-500 mt-1">Mắt, mũi, miệng, viền mặt</p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow col-span-2">
          <p className="text-gray-600 mb-1">Face Descriptor</p>
          <p className="text-sm sm:text-base font-mono text-gray-700">
            {detection.descriptor.length} dimensions vector
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Đặc trưng nhận diện duy nhất của khuôn mặt (dùng để so sánh)
          </p>
        </div>
      </div>
    </div>
  );
}
