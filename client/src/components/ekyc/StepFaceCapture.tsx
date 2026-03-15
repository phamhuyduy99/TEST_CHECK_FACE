import { useEffect, useRef, useState, useCallback } from 'react';
import useWebcam from '../../hooks/useWebcam';
import StepProgress from './StepProgress';
import { useT } from '../../i18n';

// ─────────────────────────────────────────────────────────────────────────────
// ENUM: Các trạng thái phase của màn hình xác thực khuôn mặt
// ─────────────────────────────────────────────────────────────────────────────
enum Phase {
  /** Camera đang khởi động, chưa có stream */
  Loading = 'loading',
  /** Camera đã sẵn sàng, đang phân tích khuôn mặt liên tục */
  Detecting = 'detecting',
  /** Đã xác nhận khuôn mặt hợp lệ, đang chụp + xử lý */
  Capturing = 'capturing',
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUM: Kết quả phân tích khuôn mặt từ canvas
// ─────────────────────────────────────────────────────────────────────────────
enum FaceStatus {
  /** Không phát hiện khuôn mặt (chưa đưa mặt vào khung) */
  NoFace = 'no_face',
  /** Khuôn mặt quá xa (pixel da quá ít, mặt nhỏ) */
  TooFar = 'too_far',
  /** Khuôn mặt quá gần (pixel da chiếm > ngưỡng cao) */
  TooClose = 'too_close',
  /** Khuôn mặt vừa khung hình */
  Good = 'good',
}

// ─────────────────────────────────────────────────────────────────────────────
// HẰNG SỐ cấu hình
// ─────────────────────────────────────────────────────────────────────────────

/** Tần suất phân tích canvas (ms) — 200ms = 5 lần/giây */
const DETECT_INTERVAL_MS = 200;

/**
 * Số frame liên tiếp cần đạt FaceStatus.Good trước khi tự động chụp.
 * 5 frame × 200ms = 1 giây giữ vững → chụp
 */
const GOOD_FRAMES_REQUIRED = 5;

/**
 * Ngưỡng phân loại FaceStatus theo tỉ lệ pixel da:
 * - < SKIN_NO_FACE   → NoFace  (chưa đưa mặt vào)
 * - < SKIN_TOO_FAR   → TooFar  (mặt quá xa, nhỏ)
 * - < SKIN_TOO_CLOSE → Good    (vừa khung)
 * - >= SKIN_TOO_CLOSE → TooClose (mặt quá gần, to)
 */
const SKIN_NO_FACE = 0.05; // dưới 5%  → chưa thấy mặt
const SKIN_TOO_FAR = 0.2; // 5–20%    → mặt quá xa
const SKIN_TOO_CLOSE = 0.62; // trên 62% → mặt quá gần

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Phát hiện pixel màu da (skin tone detection)
// Dùng không gian màu RGB với ngưỡng đơn giản, hoạt động tốt với đa sắc da
// ─────────────────────────────────────────────────────────────────────────────
function isSkinPixel(r: number, g: number, b: number): boolean {
  // Điều kiện màu da theo nghiên cứu Kovac et al.:
  // R > 95, G > 40, B > 20
  // max(R,G,B) - min(R,G,B) > 15
  // |R - G| > 15, R > G, R > B
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return r > 95 && g > 40 && b > 20 && max - min > 15 && Math.abs(r - g) > 15 && r > g && r > b;
}

/**
 * Phân tích frame video hiện tại để xác định trạng thái khuôn mặt.
 *
 * Thuật toán:
 * 1. Vẽ frame video lên canvas ẩn
 * 2. Lấy pixel trong vùng hình chữ nhật bao quanh oval (vùng trung tâm)
 * 3. Đếm số pixel màu da
 * 4. Tính tỉ lệ → phân loại FaceStatus
 *
 * @param video  - HTMLVideoElement đang stream
 * @param canvas - Canvas ẩn dùng để đọc pixel
 * @returns FaceStatus
 */
function analyzeFace(video: HTMLVideoElement, canvas: HTMLCanvasElement): FaceStatus {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return FaceStatus.NoFace;

  // Resize canvas theo kích thước video thực
  canvas.width = vw;
  canvas.height = vh;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return FaceStatus.NoFace;

  // Vẽ frame hiện tại lên canvas (mirror vì camera trước đã bị flip CSS)
  ctx.save();
  ctx.translate(vw, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, vw, vh);
  ctx.restore();

  // Xác định vùng oval trung tâm để lấy mẫu pixel
  // Vùng lấy mẫu: 50% chiều rộng × 70% chiều cao, căn giữa
  const sampleW = Math.floor(vw * 0.5);
  const sampleH = Math.floor(vh * 0.7);
  const sampleX = Math.floor((vw - sampleW) / 2);
  const sampleY = Math.floor((vh - sampleH) / 2);

  // Lấy dữ liệu pixel trong vùng lấy mẫu
  const imageData = ctx.getImageData(sampleX, sampleY, sampleW, sampleH);
  const data = imageData.data; // mảng [R, G, B, A, R, G, B, A, ...]

  let skinCount = 0;
  const totalPixels = sampleW * sampleH;

  // Duyệt từng pixel (bước 4 = mỗi pixel có 4 giá trị RGBA)
  // Để tăng tốc, chỉ lấy mẫu 1/4 số pixel (bước 16 thay vì 4)
  for (let i = 0; i < data.length; i += 16) {
    if (isSkinPixel(data[i], data[i + 1], data[i + 2])) {
      skinCount++;
    }
  }

  // Tỉ lệ pixel da trên tổng pixel lấy mẫu (đã chia 4 do bước 16)
  const skinRatio = (skinCount * 4) / totalPixels;

  if (skinRatio < SKIN_NO_FACE) return FaceStatus.NoFace;
  if (skinRatio < SKIN_TOO_FAR) return FaceStatus.TooFar;
  if (skinRatio >= SKIN_TOO_CLOSE) return FaceStatus.TooClose;
  return FaceStatus.Good;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  onNext: (file: File) => void;
  onBack?: () => void;
  onGuide: () => void;
  step?: number;
  totalSteps?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function StepFaceCapture({ onNext, onBack, onGuide, step = 3, totalSteps = 4 }: Props) {
  // ── Webcam hook: dùng camera trước (user) cho selfie ──────────────────────
  // autoStart=false: tránh gọi camera trước user gesture → browser từ chối
  // Component này chỉ render sau khi user bấm “TÔI ĐÃ HIỂU” nên đã có gesture
  const { videoRef, setVideoRef, active, error, captureHQ, stop, start } = useWebcam('user', false);

  // Gọi start() ngay khi mount — lúc này đã có user gesture nên browser cho phép
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    start();
  }, []);

  // ── Phase hiện tại của màn hình ───────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>(Phase.Loading);

  // ── Trạng thái khuôn mặt hiện tại (dùng để hiển thị hint) ────────────────
  const [faceStatus, setFaceStatus] = useState<FaceStatus>(FaceStatus.NoFace);

  // ── Đếm số frame liên tiếp đạt Good (để tự động chụp) ────────────────────
  const goodFrameCount = useRef(0);
  const [goodProgress, setGoodProgress] = useState(0);

  // ── Canvas ẩn dùng để phân tích pixel ────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  // ── Ref tránh chạy detection loop nhiều lần ──────────────────────────────
  const detectingRef = useRef(false);

  // ── Ref tránh gọi capture nhiều lần ──────────────────────────────────────
  const capturedRef = useRef(false);

  const { t } = useT();

  // ─── Map FaceStatus → hint config (text + màu) ─────────────────────────
  const hintConfig: Record<FaceStatus, { text: string; bg: string; color: string }> = {
    [FaceStatus.NoFace]: { text: t.hintNoFace, bg: 'rgba(255,255,255,0.15)', color: '#fff' },
    [FaceStatus.TooFar]: { text: t.hintTooFar, bg: 'rgba(251,191,36,0.9)', color: '#1a1a00' },
    [FaceStatus.TooClose]: { text: t.hintTooClose, bg: 'rgba(251,191,36,0.9)', color: '#1a1a00' },
    [FaceStatus.Good]: { text: t.hintGood, bg: '#00d4a0', color: '#0d1f2d' },
  };

  // Progress % cho Good frames (0–100) — dùng state để trigger re-render

  // ─── Hàm chụp ảnh: chuyển phase → Capturing → gọi capture() → onNext ────
  const doCapture = useCallback(() => {
    if (capturedRef.current) return;
    capturedRef.current = true;
    setPhase(Phase.Capturing);

    requestAnimationFrame(() => {
      setTimeout(async () => {
        // Dùng captureHQ() ưu tiên — raw frame qua ImageCapture API
        // Fallback tự động về capture() nếu không hỗ trợ
        const file = await captureHQ(224 / 294);
        if (!file) {
          capturedRef.current = false;
          goodFrameCount.current = 0;
          setPhase(Phase.Detecting);
          return;
        }
        stop();
        onNext(file);
      }, 150);
    });
  }, [captureHQ, stop, onNext]);

  // ─── Detection loop: chạy khi phase = Detecting ──────────────────────────
  useEffect(() => {
    // Chỉ chạy khi camera active và đang ở phase Detecting
    if (!active || phase !== Phase.Detecting) return;
    if (detectingRef.current) return;
    detectingRef.current = true;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;

      // Phân tích frame hiện tại
      const status = analyzeFace(video, canvasRef.current);
      setFaceStatus(status);

      if (status === FaceStatus.Good) {
        goodFrameCount.current += 1;
        setGoodProgress(
          Math.min(100, Math.round((goodFrameCount.current / GOOD_FRAMES_REQUIRED) * 100))
        );

        if (goodFrameCount.current >= GOOD_FRAMES_REQUIRED) {
          clearInterval(interval);
          detectingRef.current = false;
          doCapture();
        }
      } else {
        goodFrameCount.current = 0;
        setGoodProgress(0);
      }
    }, DETECT_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      detectingRef.current = false;
    };
  }, [active, phase, videoRef, doCapture]);

  // ─── Khi camera active lần đầu → chuyển sang Detecting ──────────────────
  useEffect(() => {
    if (active && phase === Phase.Loading) {
      setPhase(Phase.Detecting);
    }
  }, [active, phase]);

  return (
    <div
      className="relative flex flex-col items-center min-h-screen px-4 pt-8 pb-6"
      style={{ background: 'linear-gradient(135deg, #0d1f2d 0%, #0a2a3a 50%, #0d1f2d 100%)' }}
    >
      {/* ── Tiêu đề ── */}
      <h2 className="text-[#00d4a0] font-bold text-xl tracking-widest mb-2 uppercase">
        {t.captureFace}
      </h2>

      {/* ── Progress bar ── */}
      <StepProgress current={step} total={totalSteps} />

      {onBack && (
        <button
          onClick={() => { stop(); onBack(); }}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>
      )}

      {/* ── Hint message ──
          - Phase.Loading   : không hiện gì
          - Phase.Detecting : hiện hint theo faceStatus
          - Phase.Capturing : không hiện hint (đang xử lý)
      ── */}
      <div className="h-9 flex items-center justify-center mb-4">
        {phase === Phase.Detecting &&
          (() => {
            const cfg = hintConfig[faceStatus];
            return (
              <span
                key={faceStatus}
                className="text-sm font-bold px-5 py-1.5 rounded-full animate-fade-in flex items-center gap-2"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {faceStatus === FaceStatus.TooFar && '⚠️ '}
                {faceStatus === FaceStatus.TooClose && '⚠️ '}
                {cfg.text}
                {faceStatus === FaceStatus.Good && goodProgress < 100 && (
                  <span className="text-xs opacity-70">{goodProgress}%</span>
                )}
              </span>
            );
          })()}
      </div>

      {/* ── Vùng oval camera ── */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 260, height: 340 }}
      >
        {/* ── SVG: viền oval tĩnh + spinner arc quay khi Capturing ── */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 260 340"
          fill="none"
          style={{ overflow: 'visible' }}
        >
          {/* Viền oval nền (luôn hiện, màu thay đổi theo phase) */}
          <ellipse
            cx="130"
            cy="170"
            rx="115"
            ry="150"
            stroke={
              phase === Phase.Capturing
                ? '#00d4a0'
                : faceStatus === FaceStatus.Good
                  ? '#00d4a0'
                  : faceStatus === FaceStatus.TooFar || faceStatus === FaceStatus.TooClose
                    ? 'rgba(251,191,36,0.8)'
                    : 'rgba(255,255,255,0.2)'
            }
            strokeWidth="2"
            fill="none"
            style={{ transition: 'stroke 0.3s' }}
          />

          {/* Spinner arc quay quanh viền oval (chỉ hiện khi Capturing) */}
          {phase === Phase.Capturing && (
            <>
              {/* Arc chính quay */}
              <ellipse
                cx="130"
                cy="170"
                rx="115"
                ry="150"
                stroke="#00d4a0"
                strokeWidth="3"
                fill="none"
                strokeDasharray="130 900" /* arc dài 130px, khoảng trống 900px */
                strokeLinecap="round"
                style={{
                  transformOrigin: '130px 170px',
                  animation: 'spin-oval 1.2s linear infinite',
                }}
              />
              {/* Arc phụ ngược chiều (tạo hiệu ứng đẹp hơn) */}
              <ellipse
                cx="130"
                cy="170"
                rx="115"
                ry="150"
                stroke="rgba(0,212,160,0.3)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="60 970"
                strokeLinecap="round"
                style={{
                  transformOrigin: '130px 170px',
                  animation: 'spin-oval 1.8s linear infinite reverse',
                }}
              />
            </>
          )}
        </svg>

        {/* ── Mask oval: clip video thành hình oval bằng border-radius ── */}
        <div
          className="overflow-hidden relative"
          style={{
            width: 224,
            height: 294,
            borderRadius: '50%' /* tạo hình oval */,
          }}
        >
          {/* Loading placeholder: hiện khi camera chưa sẵn sàng */}
          {!active && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: '#0a1a24' }}
            >
              {/* Spinner nhỏ ở giữa khi đang tải camera */}
              <svg className="animate-spin w-8 h-8 text-[#00d4a0]" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          )}

          {/* Video stream từ camera trước (mirror CSS để tự nhiên hơn) */}
          <video
            ref={setVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{
              display: active ? 'block' : 'none',
              transform: 'scaleX(-1)',
            }}
          />
        </div>

        {/* ── Chấm xanh ở giữa (chỉ hiện khi Loading, giống ảnh thiết kế) ── */}
        {phase === Phase.Loading && (
          <div
            className="absolute rounded-full bg-[#00d4a0]"
            style={{ width: 52, height: 52, opacity: 0.75 }}
          />
        )}
      </div>

      {/* ── Lỗi camera: hiện thông báo + nút thử lại để hỏi lại quyền ── */}
      {error && (
        <div className="flex flex-col items-center gap-3 mt-4">
          <p className="text-red-400 text-xs text-center max-w-xs">
            {error === 'camera_denied' ? t.cameraErrorDenied
              : error === 'camera_not_found' ? t.cameraErrorNotFound
              : t.cameraError}
          </p>
          {/* Nhấn nút này sẽ gọi getUserMedia lại → browser hiện popup hỏi quyền */}
          <button
            onClick={() => start()}
            className="px-5 py-2 rounded-lg bg-[#00d4a0] text-[#0d1f2d] text-sm font-bold hover:bg-[#00bf8f] transition"
          >
            {t.allowCamera}
          </button>
        </div>
      )}

      {/* ── Nút Hướng dẫn (mở lại FaceGuideModal) ── */}
      <button
        onClick={onGuide}
        className="mt-auto pt-8 text-[#00d4a0] font-semibold text-sm underline underline-offset-2"
      >
        {t.guide}
      </button>

      {/* ── CSS animations ── */}
      <style>{`
        /* Spinner quay quanh viền oval */
        @keyframes spin-oval {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* Fade-in + slide-down cho hint message */
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
