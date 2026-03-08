interface SpoofingAlertProps {
  reason: string;
  onRetry: () => void;
}

export default function SpoofingAlert({ reason, onRetry }: SpoofingAlertProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-bounce-in">
        <div className="text-center">
          <div className="mb-4">
            <span className="text-6xl">🚨</span>
          </div>
          
          <h2 className="text-2xl font-bold text-red-600 mb-3">
            Phát hiện gian lận!
          </h2>
          
          <p className="text-gray-700 mb-2">
            Hệ thống đã phát hiện hành vi gian lận:
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800 font-medium">
              {reason}
            </p>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <p>⚠️ Vui lòng sử dụng khuôn mặt thật</p>
            <p>⚠️ Không sử dụng ảnh, video, màn hình</p>
            <p>⚠️ Đảm bảo ánh sáng đủ và camera rõ nét</p>
          </div>
          
          <button
            onClick={onRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    </div>
  );
}
