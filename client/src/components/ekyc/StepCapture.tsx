import { useRef, useState, useEffect } from 'react';
import heic2any from 'heic2any';
import useWebcam from '../../hooks/useWebcam';
import StepProgress from './StepProgress';
import { useT } from '../../i18n';

interface Props {
  title: string;
  step: number;
  totalSteps?: number;
  onNext: (file: File, source: 'camera' | 'upload') => void;
  onBack?: () => void;
  onGuide?: () => void;
  facingMode?: 'user' | 'environment';
  cropRatio?: number;
  initialFile?: File | null;
}

type Mode = 'select' | 'camera' | 'preview';

export default function StepCapture({
  title,
  step,
  totalSteps = 4,
  onNext,
  onBack,
  onGuide,
  facingMode: initialFacingMode = 'environment',
  cropRatio,
  initialFile,
}: Props) {
  const [mode, setMode] = useState<Mode>(initialFile ? 'preview' : 'select');
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(initialFile ?? null);
  const [fileSource, setFileSource] = useState<'camera' | 'upload'>('camera');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { t } = useT();

// StepCapture.tsx — bỏ capture khỏi destructure vì chỉ dùng captureHQ
  const { videoRef, setVideoRef, active, error, facingMode, start, stop, flip, captureHQ, focusAt } = useWebcam(
    initialFacingMode,
    false
  );
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (initialFile) fileToDataUrl(initialFile).then(setPreview);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTapFocus = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const el = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const relX = (clientX - el.left) / el.width;
    const relY = (clientY - el.top) / el.height;
    focusAt(relX, relY);
    setFocusPoint({ x: clientX - el.left, y: clientY - el.top });
    setTimeout(() => setFocusPoint(null), 800);
  };

  const handleChooseCamera = () => {
    setMode('camera');
    start();
  };

  const handleChooseUpload = () => {
    fileRef.current?.click();
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  // HEIC/HEIF → JPEG bằng heic2any, các định dạng khác (WEBP/BMP/GIF) → JPEG qua canvas
  const normalizeToJpeg = async (file: File): Promise<File> => {
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || /\.hei[cf]$/i.test(file.name);
    if (isHeic) {
      const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 }) as Blob;
      return new File([blob], file.name.replace(/\.hei[cf]$/i, '.jpg'), { type: 'image/jpeg' });
    }
    const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg';
    if (isJpeg) return file;
    // WEBP / BMP / GIF / PNG / ... → convert sang JPEG qua canvas
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          if (!blob) { reject(new Error('canvas toBlob failed')); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.92);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode failed')); };
      img.src = url;
    });
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    if (video && video.videoWidth === 0) {
      await new Promise<void>(resolve => {
        const onReady = () => { video.removeEventListener('loadeddata', onReady); resolve(); };
        video.addEventListener('loadeddata', onReady);
        setTimeout(resolve, 1000);
      });
    }
    const file = await captureHQ(cropRatio);
    if (!file) return;
    stop();
    setFileSource('camera');
    setCapturedFile(file);
    setPreview(await fileToDataUrl(file));
    setMode('preview');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      setUploadError(t.uploadTypeError);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(t.uploadSizeError);
      return;
    }
    if (file.size < 100 * 1024) {
      setUploadError(t.uploadTooSmall);
      return;
    }
    setUploadError(null);
    stop();
    setConverting(true);
    const normalized = await normalizeToJpeg(file).catch(() => file);
    setConverting(false);
    setFileSource('upload');
    setCapturedFile(normalized);
    setPreview(await fileToDataUrl(normalized));
    setMode('preview');
  };

  const handleRetake = () => {
    setPreview(null);
    setCapturedFile(null);
    setMode('select');
  };

  const cameraErrorMsg =
    error === 'camera_denied' ? t.cameraErrorDenied
    : error === 'camera_not_found' ? t.cameraErrorNotFound
    : error ? t.cameraError
    : null;

  return (
    <div className="relative flex flex-col items-center min-h-screen px-4 pt-10 pb-6">
      <h2 className="text-[#00d4a0] font-bold text-xl tracking-widest mb-2 uppercase">{title}</h2>
      <StepProgress current={step} total={totalSteps} />

      {onBack && (mode === 'select' || mode === 'preview') && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>
      )}

      <div className="w-full max-w-sm">

        {/* ── SELECT MODE ── */}
        {mode === 'select' && (
          <div className="relative bg-[#0a1a24] rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-4 py-12 px-6">
            <button
              onClick={handleChooseCamera}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-white text-[#0d1f2d] font-bold text-sm hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              {t.takePhoto}
            </button>
            <button
              onClick={handleChooseUpload}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-white text-[#0d1f2d] font-bold text-sm hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              {t.upload}
            </button>
          </div>
        )}

        {/* ── CAMERA MODE ── */}
        {mode === 'camera' && (
          <div
            className="relative bg-[#0a1a24] rounded-2xl overflow-hidden w-full"
            style={{ aspectRatio: '4/3' }}
            onClick={handleTapFocus}
            onTouchStart={handleTapFocus}
          >
            {active ? (
              <>
                <video
                  ref={setVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover block ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  style={{ minHeight: '1px' }}
                />
                {/* Viewfinder */}
                {cropRatio ? (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative z-10 w-[88%]" style={{ aspectRatio: String(cropRatio) }}>
                      <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-[#00d4a0] rounded-tl" />
                      <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-[#00d4a0] rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-[#00d4a0] rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-[#00d4a0] rounded-br" />
                      {/* Hint lấy nét */}
                      {!focusPoint && (
                        <p className="absolute -bottom-6 left-0 right-0 text-center text-white/60 text-xs">
                          Chạm để lấy nét
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-6 pointer-events-none">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#00d4a0] rounded-tl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00d4a0] rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00d4a0] rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#00d4a0] rounded-br" />
                  </div>
                )}
                {/* Tap-to-focus ring — z-20 để hiện trên overlay */}
                {focusPoint && (
                  <div
                    className="absolute z-20 w-12 h-12 border-2 border-yellow-300 rounded-full pointer-events-none"
                    style={{
                      left: focusPoint.x - 24,
                      top: focusPoint.y - 24,
                      animation: 'focusPulse 0.8s ease-out forwards',
                    }}
                  />
                )}
                {/* Flip */}
                <button
                  onClick={flip}
                  className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5m0 0v5m0-5l-6 6M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                  </svg>
                </button>
              </>
            ) : !error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <svg className="animate-spin w-8 h-8 text-[#00d4a0]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <p className="text-[#00d4a0] text-sm">{t.startingCamera}</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
                <p className="text-red-400 text-sm text-center">{cameraErrorMsg}</p>
                <button
                  onClick={() => start()}
                  className="px-6 py-2.5 rounded-xl bg-[#00d4a0] text-[#0d1f2d] font-semibold text-sm"
                >
                  {t.allowCamera}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── PREVIEW MODE ── */}
        {mode === 'preview' && preview && (
          <div className="relative bg-[#0a1a24] rounded-2xl overflow-hidden">
            <img src={preview} alt="preview" className="w-full h-auto block" />
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />

        {converting && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <svg className="animate-spin w-8 h-8 text-[#00d4a0]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-[#00d4a0] text-sm">Đang xử lý ảnh...</p>
          </div>
        )}

        {uploadError && <p className="text-red-400 text-xs text-center mt-2">{uploadError}</p>}

        {/* Tips */}
        <div className="mt-4">
          {mode === 'select' && (
            <p className="text-sm text-gray-300 text-center">{t.tipPlace}</p>
          )}
          {mode === 'preview' && (
            <div className="space-y-1">
              <p className="text-sm text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00d4a0] inline-block" />{t.tipRetake}
              </p>
              <p className="text-sm text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00d4a0] inline-block" />{t.tipNext}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {mode === 'camera' && active && (
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => { stop(); setMode('select'); }}
              className="flex-1 py-3 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition"
            >
              ← {t.retake}
            </button>
            <button
              onClick={handleCapture}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00d4a0] text-[#0d1f2d] text-sm font-bold hover:bg-[#00bf8f] transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              {t.takePhoto}
            </button>
          </div>
        )}

        {mode === 'preview' && (
          <div className="flex gap-3 mt-5">
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
              onClick={() => capturedFile && onNext(capturedFile, fileSource)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00d4a0] text-[#0d1f2d] text-sm font-bold hover:bg-[#00bf8f] transition"
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
        <button
          onClick={onGuide}
          className="mt-8 text-[#00d4a0] font-bold text-base underline underline-offset-2"
        >
          {t.guide}
        </button>
      )}
    </div>
  );
}
