import { useRef, useState, useCallback, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// useWebcam — Hook quản lý toàn bộ vòng đời camera WebRTC
//
// GIẢI QUYẾT CÁC VẤN ĐỀ CHẤT LƯỢNG ẢNH:
//
// 1. ẢNH MỜ DO CAMERA KHÔNG LẤY NÉT
//    - Yêu cầu focusMode: 'continuous' ngay trong getUserMedia constraints
//    - Sau khi stream mở, gọi thêm applyConstraints() để đảm bảo focus được áp dụng
//    - Cung cấp focusAt() để user chạm vào màn hình lấy nét thủ công (tap-to-focus)
//
// 2. ẢNH MỜ DO CANVAS RENDER CHẤT LƯỢNG THẤP
//    - Dùng imageSmoothingQuality: 'high' khi vẽ lên canvas
//    - Tắt alpha channel (alpha: false) để tăng tốc render và giảm artifact
//    - JPEG quality 0.95 thay vì 0.92
//
// 3. ẢNH MỜ DO ImageCapture API LẤY FRAME TỪ VIDEO BUFFER ĐÃ COMPRESSED
//    - captureHQ() dùng ImageCapture.grabFrame() lấy raw ImageBitmap trực tiếp
//      từ camera sensor, không qua WebRTC video compression pipeline
//    - grabFrame() trả về full resolution của camera (ví dụ 4032×3024 trên iPhone)
//      thay vì resolution của video stream (thường bị giới hạn ở 1080p hoặc thấp hơn)
//    - Fallback về capture() thông thường nếu browser không hỗ trợ ImageCapture
//
// 4. RACE CONDITION: STREAM MỞ TRƯỚC KHI <video> ELEMENT MOUNT
//    - setVideoRef là ref callback thay vì useRef thông thường
//    - React gọi setVideoRef(element) ngay khi <video> mount vào DOM
//    - Trong callback: nếu streamRef đã có → gắn srcObject ngay lập tức
//    - Không cần setTimeout hay useEffect để chờ
//
// 5. MEMORY LEAK: STREAM KHÔNG ĐƯỢC GIẢI PHÓNG
//    - stop() dừng tất cả track và xóa srcObject
//    - useEffect cleanup dừng stream khi component unmount
//    - startWithMode() dừng stream cũ trước khi mở stream mới
// ─────────────────────────────────────────────────────────────────────────────

export default function useWebcam(
  initialFacingMode: 'user' | 'environment' = 'user',
  autoStart = true
) {
  // ── Refs ──────────────────────────────────────────────────────────────────

  /**
   * Ref trỏ đến <video> element trong DOM.
   * Được cập nhật qua setVideoRef callback thay vì gán trực tiếp,
   * để đảm bảo stream được gắn ngay khi element mount.
   */
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Ref giữ MediaStream hiện tại.
   * Dùng ref (không phải state) vì không cần trigger re-render khi thay đổi,
   * và cần truy cập giá trị mới nhất trong các callback bất đồng bộ.
   */
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Ref lưu facingMode hiện tại để tránh stale closure.
   * Nếu dùng state, các useCallback capture giá trị cũ tại thời điểm tạo.
   */
  const facingModeRef = useRef<'user' | 'environment'>(initialFacingMode);

  // ── State (chỉ để trigger re-render UI) ──────────────────────────────────

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(initialFacingMode);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  // ── setVideoRef: Ref Callback ─────────────────────────────────────────────

  /**
   * Ref callback thay thế cho useRef thông thường.
   *
   * VẤN ĐỀ với useRef thông thường:
   *   - startWithMode() là async, resolve sau vài trăm ms
   *   - Lúc đó React có thể chưa render xong <video> element
   *   - videoRef.current = null → không gắn được srcObject → màn hình đen
   *
   * GIẢI PHÁP với ref callback:
   *   - React tự động gọi setVideoRef(element) ngay khi <video> mount vào DOM
   *   - Tại thời điểm đó, nếu streamRef đã có stream → gắn srcObject ngay
   *   - Không cần setTimeout, không cần useEffect watch active
   *
   * @param el - HTMLVideoElement khi mount, null khi unmount
   */
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    // Cập nhật ref để các hàm khác (capture, focusAt) có thể dùng
    (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;

    if (el && streamRef.current) {
      // <video> vừa mount VÀ stream đã sẵn sàng → gắn ngay
      el.srcObject = streamRef.current;
    }
  }, []);

  // ── startWithMode ─────────────────────────────────────────────────────────

  /**
   * Mở camera với facingMode chỉ định.
   *
   * CONSTRAINTS CHẤT LƯỢNG CAO:
   * - width/height ideal 1920×1080: yêu cầu camera stream ở Full HD
   *   Browser sẽ cố gắng đáp ứng, nếu không được thì fallback về resolution thấp hơn
   * - focusMode 'continuous': camera tự động lấy nét liên tục
   *   Đặt trong getUserMedia constraints để áp dụng ngay từ đầu
   *
   * SAU KHI STREAM MỞ:
   * - Gọi thêm applyConstraints() với focusMode 'continuous'
   *   Một số thiết bị (đặc biệt Android) bỏ qua constraint trong getUserMedia
   *   nhưng lại áp dụng được khi gọi applyConstraints() sau khi track đã active
   */
  const startWithMode = useCallback(async (mode: 'user' | 'environment') => {
    setError(null);

    // Dừng stream cũ để giải phóng camera hardware và tránh track leak
    streamRef.current?.getTracks().forEach(t => t.stop());

    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          // Yêu cầu Full HD để có đủ pixel cho OCR
          // 'ideal' = ưu tiên nhưng không bắt buộc, browser tự fallback
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          // Yêu cầu lấy nét liên tục ngay từ khi mở stream
          // Một số browser (Chrome Android) hỗ trợ constraint này trong getUserMedia
          advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
        },
      });

      streamRef.current = s;

      // Áp dụng lại focusMode sau khi track đã active
      // Lý do: nhiều thiết bị Android bỏ qua focusMode trong getUserMedia constraints
      // nhưng lại áp dụng được khi gọi applyConstraints() sau khi stream đã chạy
      // .catch() để không crash nếu thiết bị không hỗ trợ (iOS Safari, webcam PC, v.v.)
      s.getVideoTracks()[0]?.applyConstraints({
        advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
      }).catch(() => {});

      // Gắn stream vào <video> element nếu đã mount
      // Nếu chưa mount, setVideoRef callback sẽ gắn khi element xuất hiện
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }

      setActive(true);
    } catch (err: unknown) {
      // Phân loại lỗi để UI hiển thị thông báo phù hợp
      const name = err instanceof Error ? (err as { name?: string }).name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('camera_denied');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('camera_not_found');
      } else {
        setError('camera_error');
      }
    }
  }, []);

  const start = useCallback(() => startWithMode(facingModeRef.current), [startWithMode]);

  const flip = useCallback(() => {
    const next = facingModeRef.current === 'user' ? 'environment' : 'user';
    facingModeRef.current = next;
    setFacingMode(next);
    startWithMode(next);
  }, [startWithMode]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  // ── capture: Chụp ảnh đồng bộ từ video element ───────────────────────────

  /**
   * Chụp ảnh từ frame video hiện tại bằng Canvas API.
   *
   * ĐÂY LÀ PHƯƠNG THỨC FALLBACK — dùng khi captureHQ() không khả dụng.
   * Chất lượng thấp hơn captureHQ() vì lấy frame từ video buffer đã compressed.
   *
   * CROP LOGIC:
   * - Không truyền cropRatio (CCCD): lấy full frame, VNPT server tự crop
   * - Truyền cropRatio (selfie oval): crop theo tỉ lệ oval để khớp với UI
   *
   * CANVAS QUALITY:
   * - alpha: false → tắt alpha channel, tăng tốc render, giảm artifact JPEG
   * - imageSmoothingQuality: 'high' → dùng bicubic interpolation thay vì bilinear
   * - JPEG quality 0.95 → chất lượng cao, file ~400-600KB
   *
   * @param cropRatio - width/height của vùng muốn crop. undefined = full frame
   */
  const capture = useCallback((cropRatio?: number): File | null => {
    const video = videoRef.current;
    if (!video) return null;

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    // Debug: log resolution thực tế để kiểm tra camera có stream đúng không
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      const s = track.getSettings();
      console.log(`[capture] video: ${vw}×${vh} | track: ${s.width}×${s.height}`);
    }

    // Tính vùng crop từ video frame
    let srcX = 0, srcY = 0, srcW = vw, srcH = vh;
    if (cropRatio) {
      // Crop theo tỉ lệ cropRatio, căn giữa
      // Dùng cho selfie oval (224/294 ≈ 0.76) để ảnh khớp với vùng hiển thị
      const videoRatio = vw / vh;
      if (videoRatio > cropRatio) {
        // Video rộng hơn → crop 2 bên trái/phải
        srcH = vh;
        srcW = Math.round(vh * cropRatio);
        srcX = Math.round((vw - srcW) / 2);
      } else {
        // Video dọc hơn → crop trên/dưới
        srcW = vw;
        srcH = Math.round(vw / cropRatio);
        srcY = Math.round((vh - srcH) / 2);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = srcW;
    canvas.height = srcH;

    // alpha: false → browser không cần xử lý transparency → render nhanh hơn
    // và JPEG output không bị artifact từ alpha channel
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return null;

    // imageSmoothingQuality: 'high' → dùng bicubic interpolation
    // Quan trọng khi scale down (video 1080p → canvas nhỏ hơn)
    // hoặc scale up (video thấp hơn expected)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Mirror camera trước để ảnh không bị ngược
    // CSS đã mirror video bằng scaleX(-1), canvas cần làm tương tự
    if (facingModeRef.current === 'user') {
      ctx.translate(srcW, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

    // JPEG 0.95: cân bằng giữa chất lượng và file size
    // 0.95 → ~400-600KB, đủ để VNPT OCR đọc được
    // Không dùng 1.0 vì file quá lớn (>2MB) gây chậm upload
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);

    const file = new File([u8arr], `capture_${Date.now()}.jpg`, { type: mime });
    // Sanity check: file < 1KB → canvas trống (video chưa load xong)
    return file.size > 1000 ? file : null;
  }, []);

  // ── captureHQ: Chụp ảnh chất lượng cao qua ImageCapture API ──────────────

  /**
   * Chụp ảnh chất lượng cao bằng ImageCapture.grabFrame().
   *
   * TẠI SAO captureHQ() TỐT HƠN capture()?
   *
   * capture() lấy frame từ <video> element:
   *   Camera → encode H.264/VP8 → WebRTC stream → decode → video buffer → canvas
   *   Mỗi bước encode/decode đều làm giảm chất lượng (lossy compression)
   *   Video stream thường bị giới hạn ở 1080p hoặc thấp hơn
   *
   * captureHQ() dùng ImageCapture.grabFrame():
   *   Camera → raw ImageBitmap (không qua video compression pipeline)
   *   Trả về full resolution của camera sensor (ví dụ 4032×3024 trên iPhone 12)
   *   Không bị artifact từ video codec
   *
   * HỖ TRỢ:
   *   - Chrome Android: ✅ hỗ trợ đầy đủ
   *   - Chrome Desktop: ✅ hỗ trợ
   *   - Firefox: ❌ không hỗ trợ → fallback về capture()
   *   - Safari iOS: ❌ không hỗ trợ → fallback về capture()
   *
   * @param cropRatio - width/height của vùng muốn crop. undefined = full frame
   */
  const captureHQ = useCallback(async (cropRatio?: number): Promise<File | null> => {
    const track = streamRef.current?.getVideoTracks()[0];

    // Kiểm tra ImageCapture API có khả dụng không
    // typeof check để tránh ReferenceError trên browser không hỗ trợ
    if (!track || typeof (window as unknown as { ImageCapture?: unknown }).ImageCapture === 'undefined') {
      console.log('[captureHQ] ImageCapture not supported, falling back to capture()');
      return capture(cropRatio);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imageCapture = new (window as any).ImageCapture(track);

      // grabFrame() lấy raw ImageBitmap từ camera, không qua video compression
      // Đây là điểm khác biệt quan trọng so với drawImage(video, ...)
      const bitmap: ImageBitmap = await imageCapture.grabFrame();

      const vw = bitmap.width;
      const vh = bitmap.height;
      console.log(`[captureHQ] grabFrame: ${vw}×${vh} (vs video stream)`);

      // Tính vùng crop (logic giống capture())
      let srcX = 0, srcY = 0, srcW = vw, srcH = vh;
      if (cropRatio) {
        const videoRatio = vw / vh;
        if (videoRatio > cropRatio) {
          srcH = vh; srcW = Math.round(vh * cropRatio);
          srcX = Math.round((vw - srcW) / 2);
        } else {
          srcW = vw; srcH = Math.round(vw / cropRatio);
          srcY = Math.round((vh - srcH) / 2);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = srcW;
      canvas.height = srcH;

      const ctx = canvas.getContext('2d', { alpha: false })!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (facingModeRef.current === 'user') {
        ctx.translate(srcW, 0);
        ctx.scale(-1, 1);
      }

      // Vẽ ImageBitmap (raw) thay vì video element (compressed)
      ctx.drawImage(bitmap, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

      // Giải phóng ImageBitmap sau khi dùng xong để tránh memory leak
      bitmap.close();

      // Dùng toBlob() thay vì toDataURL() vì:
      // - toBlob() là async, không block main thread
      // - toBlob() hiệu quả hơn với file lớn (không cần base64 encode/decode)
      return new Promise(resolve => {
        canvas.toBlob(blob => {
          if (!blob || blob.size < 1000) { resolve(null); return; }
          resolve(new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.95);
      });
    } catch (err) {
      // grabFrame() có thể fail nếu camera đang bận hoặc track đã stop
      console.warn('[captureHQ] grabFrame failed, falling back:', err);
      return capture(cropRatio);
    }
  }, [capture]);

  // ── focusAt: Tap-to-focus ─────────────────────────────────────────────────

  /**
   * Lấy nét tại điểm user chạm trên màn hình (tap-to-focus).
   *
   * CÁCH HOẠT ĐỘNG:
   * - pointOfInterest nhận tọa độ [0,1] × [0,1] (tỉ lệ trên video element)
   * - Browser map tọa độ này sang sensor coordinates của camera
   * - Camera lấy nét vào vùng đó
   *
   * HỖ TRỢ:
   * - Chrome Android: ✅ hỗ trợ pointOfInterest
   * - iOS Safari: ❌ không hỗ trợ → .catch() bỏ qua lỗi
   * - Desktop: ❌ webcam thường không hỗ trợ → .catch() bỏ qua lỗi
   *
   * @param relX - tọa độ X tương đối [0, 1] trên video element
   * @param relY - tọa độ Y tương đối [0, 1] trên video element
   */
  const focusAt = useCallback((relX: number, relY: number) => {
    streamRef.current?.getVideoTracks()[0]?.applyConstraints({
      advanced: [{
        // focusMode: 'manual' để camera không tự override điểm focus
        focusMode: 'manual',
        // pointOfInterest: điểm user chạm, tính theo tỉ lệ [0,1]
        pointOfInterest: { x: relX, y: relY },
      } as MediaTrackConstraintSet],
    }).catch(() => {
      // Thiết bị không hỗ trợ pointOfInterest → bỏ qua, không crash
    });
  }, []);

  // ── Auto-start on mount ───────────────────────────────────────────────────

  useEffect(() => {
    if (autoStart) startWithMode(initialFacingMode);

    // Cleanup: dừng camera khi component unmount
    // Quan trọng để giải phóng camera hardware và tắt đèn camera
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    videoRef,
    setVideoRef,   // Dùng làm ref={setVideoRef} trên <video> element
    active,
    error,
    facingMode,
    start,
    stop,
    flip,
    capture,       // Đồng bộ, fallback, dùng khi cần kết quả ngay
    captureHQ,     // Bất đồng bộ, chất lượng cao hơn qua ImageCapture API
    focusAt,       // Tap-to-focus
  };
}
