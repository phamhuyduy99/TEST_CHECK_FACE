interface Props {
  docLabel: string;
  onStart: () => void;
  onClose: () => void;
}

export default function GuideModal({ docLabel, onStart, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
        >
          ✕
        </button>

        <h2 className="text-center font-bold text-gray-800 text-lg mb-5">
          Hướng dẫn chụp ảnh {docLabel}
        </h2>

        {/* Steps */}
        <div className="flex justify-center gap-8 mb-5">
          <div className="flex flex-col items-center gap-2">
            <div className="w-28 h-20 border-2 border-[#00d4a0] rounded-lg flex items-center justify-center bg-gray-50">
              <svg viewBox="0 0 80 52" className="w-20 h-14">
                <rect x="2" y="2" width="76" height="48" rx="4" fill="#e8f5f0" stroke="#00d4a0" strokeWidth="2" strokeDasharray="4 2"/>
                <rect x="8" y="8" width="22" height="28" rx="2" fill="#b2dfdb"/>
                <circle cx="19" cy="18" r="5" fill="#80cbc4"/>
                <rect x="34" y="10" width="36" height="4" rx="2" fill="#b2dfdb"/>
                <rect x="34" y="18" width="28" height="3" rx="2" fill="#b2dfdb"/>
                <rect x="34" y="25" width="32" height="3" rx="2" fill="#b2dfdb"/>
              </svg>
            </div>
            <span className="text-xs text-gray-500">Bước 1: Chụp mặt trước</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-28 h-20 border-2 border-[#00d4a0] rounded-lg flex items-center justify-center bg-gray-50">
              <svg viewBox="0 0 80 52" className="w-20 h-14">
                <rect x="2" y="2" width="76" height="48" rx="4" fill="#e8f5f0" stroke="#00d4a0" strokeWidth="2" strokeDasharray="4 2"/>
                <rect x="8" y="10" width="28" height="18" rx="2" fill="#b2dfdb"/>
                <rect x="8" y="32" width="20" height="4" rx="2" fill="#b2dfdb"/>
                <circle cx="58" cy="20" r="10" fill="none" stroke="#80cbc4" strokeWidth="2"/>
                <path d="M52 20 Q58 14 64 20 Q58 26 52 20Z" fill="#80cbc4"/>
              </svg>
            </div>
            <span className="text-xs text-gray-500">Bước 2: Chụp mặt sau</span>
          </div>
        </div>

        {/* Tips */}
        <ul className="text-sm text-gray-600 space-y-1 mb-5 list-disc list-inside">
          <li>Đưa giấy tờ vào gần camera sao cho 4 góc của giấy tờ trùng với vùng giới hạn</li>
          <li>Chụp rõ nét và đầy đủ thông tin trên giấy tờ</li>
        </ul>

        {/* Don'ts */}
        <div className="flex justify-center gap-6 mb-6">
          {['Không chụp quá mờ', 'Không chụp mất góc', 'Không chụp lóa sáng'].map((tip) => (
            <div key={tip} className="flex flex-col items-center gap-1">
              <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center relative">
                <svg viewBox="0 0 60 40" className="w-14 h-10 opacity-50">
                  <rect x="2" y="2" width="56" height="36" rx="3" fill="#ddd"/>
                  <rect x="6" y="6" width="16" height="20" rx="2" fill="#bbb"/>
                  <rect x="26" y="8" width="26" height="3" rx="1" fill="#bbb"/>
                  <rect x="26" y="14" width="20" height="3" rx="1" fill="#bbb"/>
                </svg>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✕</span>
                </div>
              </div>
              <span className="text-xs text-gray-500 text-center w-16">{tip}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          className="w-full py-3 rounded-xl bg-[#00d4a0] hover:bg-[#00bf8f] text-white font-bold text-sm tracking-widest transition"
        >
          BẮT ĐẦU
        </button>
      </div>
    </div>
  );
}
