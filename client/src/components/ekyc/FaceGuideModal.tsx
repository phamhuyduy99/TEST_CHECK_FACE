import { useT } from '../../i18n';

interface Props {
  onConfirm: () => void;
  onClose: () => void;
}

export default function FaceGuideModal({ onConfirm, onClose }: Props) {
  const { t } = useT();
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
        >
          ✕
        </button>

        <h2 className="font-bold text-gray-800 text-lg mb-1">{t.faceGuideTitle}</h2>
        <p className="text-gray-500 text-sm mb-4">{t.faceGuideSub}</p>

        {/* Video hướng dẫn */}
        <div className="rounded-xl overflow-hidden mb-4">
          <video
            src="/face-guide.mp4"
            controls
            playsInline
            className="w-full"
          />
        </div>

        {/* Tips */}
        <ul className="text-sm text-gray-600 space-y-1.5 mb-5">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00d4a0] shrink-0" />
            {t.faceGuideTip1}
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00d4a0] shrink-0" />
            {t.faceGuideTip2}
          </li>
        </ul>

        <button
          onClick={onConfirm}
          className="w-full py-3 rounded-xl bg-[#00d4a0] hover:bg-[#00bf8f] text-white font-bold text-sm tracking-widest transition"
        >
          {t.faceGuideConfirm}
        </button>
      </div>
    </div>
  );
}
