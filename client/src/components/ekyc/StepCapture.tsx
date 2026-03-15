import { useRef, useState } from 'react';
import useWebcam from '../../hooks/useWebcam';
import StepProgress from './StepProgress';
import { useT } from '../../i18n';

interface Props {
  title: string;
  step: number;
  totalSteps?: number;
  onNext: (file: File) => void;
  onGuide?: () => void;
  facingMode?: 'user' | 'environment';
}

export default function StepCapture({ title, step, totalSteps = 4, onNext, onGuide, facingMode: initialFacingMode = 'environment' }: Props) {
  const { videoRef, active, error, facingMode, start, stop, flip, capture } = useWebcam(initialFacingMode);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { t } = useT();

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const handleCapture = async () => {
    const video = videoRef.current;
    if (video && video.videoWidth === 0) {
      await new Promise<void>(resolve => {
        const onReady = () => { video.removeEventListener('loadeddata', onReady); resolve(); };
        video.addEventListener('loadeddata', onReady);
        setTimeout(resolve, 1000);
      });
    }
    const file = capture();
    if (!file) return;
    stop();
    setCapturedFile(file);
    setPreview(await fileToDataUrl(file));
  };

  // Kiểm tra file có phải ảnh hợp lệ (jpg/jpeg/png) không
  const isAllowedType = (file: File) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    return allowed.includes(file.type) || ['jpg', 'jpeg', 'png'].includes(ext);
  };

  const isHeic = (file: File) =>
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.hei[cf]$/i.test(file.name);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    // Chặn HEIC/HEIF và các định dạng không hỗ trợ
    if (isHeic(file) || !isAllowedType(file)) {
      setUploadError(t.uploadTypeError);
      return;
    }

    setUploadError(null);
    if (active) stop();
    const dataUrl = await fileToDataUrl(file);
    setCapturedFile(file);
    setPreview(dataUrl);
  };

  const handleRetake = () => {
    setPreview(null);
    setCapturedFile(null);
    setCameraLoading(true);
    start().then(() => setCameraLoading(false));
  };

  const handleStartCamera = () => {
    setCameraLoading(true);
    start().then(() => setCameraLoading(false));
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
      <div className="w-full max-w-sm">
        <div className="relative bg-[#0a1a24] rounded-2xl overflow-hidden flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-contain" />
          ) : cameraLoading ? (
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin w-8 h-8 text-[#00d4a0]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-[#00d4a0] text-sm">Đang khởi động camera...</p>
            </div>
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
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#00d4a0] rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00d4a0] rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00d4a0] rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#00d4a0] rounded-br" />
              </div>
              {/* Flip camera button */}
              <button
                onClick={flip}
                className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition"
                title="Đổi camera"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5m0 0v5m0-5l-6 6M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
              </button>
            </>
          ) : (
            /* Initial state - 2 buttons */
            <div className="flex flex-col gap-3 w-48">
              <button
                onClick={handleStartCamera}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-gray-800 font-semibold text-sm hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                {t.takePhoto}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-gray-800 font-semibold text-sm hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                {t.upload}
              </button>
            </div>
          )}
        </div>

        {/* Hidden file input — chỉ chấp nhận jpg/jpeg/png */}
        <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png" className="hidden" onChange={handleUpload} />

        {(error || uploadError) && (
          <p className="text-red-400 text-xs text-center mt-2">{uploadError || error}</p>
        )}

        {/* Tips */}
        <div className="mt-4 space-y-1">
          {preview ? (
            <>
              <p className="text-sm text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00d4a0] inline-block" />
                {t.tipRetake}
              </p>
              <p className="text-sm text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00d4a0] inline-block" />
                {t.tipNext}
              </p>
            </>
          ) : !active ? (
            <p className="text-sm text-gray-400 text-center">
              {t.tipPlace}
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
              {t.upload}
            </button>
            <button
              onClick={handleCapture}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              {t.takePhoto}
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
              {t.upload}
            </button>
            <button
              onClick={handleRetake}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              {t.retake}
            </button>
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-[#00d4a0]/20 hover:border-[#00d4a0] transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {t.next}
            </button>
          </div>
        )}
      </div>

      {onGuide && (
        <button onClick={onGuide} className="mt-8 text-[#00d4a0] font-semibold text-sm underline underline-offset-2">
          {t.guide}
        </button>
      )}
    </div>
  );
}
