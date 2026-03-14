import { useState } from 'react';
import useWebcam from '../hooks/useWebcam';

interface Props {
  label: string;
  icon: string;
  onCapture: (f: File) => void;
  captured: File | null;
}

export default function WebcamCapture({ label, icon, onCapture, captured }: Props) {
  const { videoRef, active, error, start, stop, capture } = useWebcam();
  const [preview, setPreview] = useState<string | null>(null);

  const handleCapture = () => {
    const file = capture();
    if (!file) return;
    onCapture(file);
    setPreview(URL.createObjectURL(file));
    stop();
  };

  const handleRetake = () => {
    setPreview(null);
    start();
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-600 text-center">
        {icon} {label}
      </span>

      <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-[4/3]">
        {preview ? (
          <img src={preview} alt="captured" className="w-full h-full object-cover" />
        ) : active ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
            <span className="text-4xl">{icon}</span>
            <span className="text-xs">{captured ? '✅ Đã chụp' : 'Chưa chụp'}</span>
          </div>
        )}

        {active && !preview && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-4 border-2 border-white/40 rounded-xl" />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}

      {preview ? (
        <button
          onClick={handleRetake}
          className="w-full py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
        >
          🔄 Chụp lại
        </button>
      ) : active ? (
        <button
          onClick={handleCapture}
          className="w-full py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
        >
          📸 Chụp
        </button>
      ) : (
        <button
          onClick={start}
          className="w-full py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
        >
          📷 Mở camera
        </button>
      )}
    </div>
  );
}
