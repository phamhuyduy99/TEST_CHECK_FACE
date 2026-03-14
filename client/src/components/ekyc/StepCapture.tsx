import { useRef, useState } from 'react';
import useWebcam from '../../hooks/useWebcam';
import StepProgress from './StepProgress';

interface Props {
  title: string;
  step: number;
  totalSteps?: number;
  onNext: (file: File) => void;
  onGuide?: () => void;
  facingMode?: 'user' | 'environment';
}

export default function StepCapture({ title, step, totalSteps = 4, onNext, onGuide, facingMode = 'environment' }: Props) {
  const { videoRef, active, error, start, stop, capture } = useWebcam(facingMode);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCapture = () => {
    const file = capture();
    if (!file) return;
    setCapturedFile(file);
    setPreview(URL.createObjectURL(file));
    stop();
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedFile(file);
    setPreview(URL.createObjectURL(file));
    if (active) stop();
  };

  const handleRetake = () => {
    setPreview(null);
    setCapturedFile(null);
    start();
  };

  const handleNext = () => {
    if (capturedFile) onNext(capturedFile);
  };

  return (
    <div className="flex flex-col items-center min-h-screen px-4 pt-10 pb-6">
      {/* Title */}
      <h2 className="text-[#00d4a0] font-bold text-xl tracking-widest mb-2 uppercase">{title}</h2>
      <StepProgress current={step} total={totalSteps} />

      {/* Camera / Preview box */}
      <div className="w-full max-w-lg">
        <div className="relative bg-[#0a1a24] rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-contain" />
          ) : active ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              {/* Corner guides */}
              <div className="absolute inset-6 pointer-events-none">
                {/* top-left */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#00d4a0] rounded-tl" />
                {/* top-right */}
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00d4a0] rounded-tr" />
                {/* bottom-left */}
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00d4a0] rounded-bl" />
                {/* bottom-right */}
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#00d4a0] rounded-br" />
              </div>
            </>
          ) : (
            /* Initial state - 2 buttons */
            <div className="flex flex-col gap-3 w-56">
              <button
                onClick={start}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-gray-800 font-semibold text-sm hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                CHỤP ẢNH
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-gray-800 font-semibold text-sm hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                TẢI ẢNH LÊN
              </button>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

        {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}

        {/* Tips */}
        <div className="mt-4 space-y-1">
          {preview ? (
            <>
              <p className="text-sm text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00d4a0] inline-block" />
                Chọn 'Chụp lại' nếu ảnh mờ, loá, không rõ nét
              </p>
              <p className="text-sm text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00d4a0] inline-block" />
                Chọn 'Tiếp theo' để sang bước tiếp theo
              </p>
            </>
          ) : !active ? (
            <p className="text-sm text-gray-400 text-center">
              Xin vui lòng đặt giấy tờ nằm vừa khung hình chữ nhật, chụp đủ ánh sáng và rõ nét
            </p>
          ) : null}
        </div>

        {/* Action buttons */}
        {active && !preview && (
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              TẢI ẢNH LÊN
            </button>
            <button
              onClick={handleCapture}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              CHỤP ẢNH
            </button>
          </div>
        )}

        {preview && (
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              TẢI ẢNH LÊN
            </button>
            <button
              onClick={handleRetake}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              CHỤP LẠI
            </button>
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-[#00d4a0]/20 hover:border-[#00d4a0] transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              TIẾP THEO
            </button>
          </div>
        )}
      </div>

      {onGuide && (
        <button onClick={onGuide} className="mt-8 text-[#00d4a0] font-semibold text-sm underline underline-offset-2">
          Hướng dẫn
        </button>
      )}
    </div>
  );
}
