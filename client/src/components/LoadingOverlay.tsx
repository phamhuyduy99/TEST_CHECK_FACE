interface LoadingOverlayProps {
  progress: number;
}

export default function LoadingOverlay({ progress }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-indigo-200 border-t-indigo-600 mb-3 sm:mb-4"></div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Đang upload...</h3>
          <p className="text-sm sm:text-base text-gray-600">Vui lòng chờ trong giây lát</p>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
            <span>Tiến trình</span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          🌐 Đang upload lên Cloudinary...
        </div>
      </div>
    </div>
  );
}
