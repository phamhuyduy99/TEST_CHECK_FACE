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
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">✅</span>
        <h3 className="text-lg font-bold text-green-800">Ảnh {imageNumber}: Phát hiện khuôn mặt</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white rounded p-2">
          <p className="text-gray-600">Độ tin cậy</p>
          <p className="text-xl font-bold text-green-700">
            {(detection.confidence * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded p-2">
          <p className="text-gray-600">Điểm đặc trưng</p>
          <p className="text-xl font-bold text-blue-700">{detection.landmarks} điểm</p>
        </div>
        <div className="bg-white rounded p-2 col-span-2">
          <p className="text-gray-600">Face Descriptor</p>
          <p className="text-xs font-mono text-gray-700">
            {detection.descriptor.length} dimensions
          </p>
        </div>
      </div>
    </div>
  );
}
