import { useRef, useState, useCallback, useEffect } from 'react';

export default function useWebcam(initialFacingMode: 'user' | 'environment' = 'user', autoStart = true) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(initialFacingMode);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  const startWithMode = useCallback(async (mode: 'user' | 'environment') => {
    setError(null);
    // stop existing stream first
    streamRef.current?.getTracks().forEach(t => t.stop());
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setActive(true);
    } catch {
      setError('Không thể mở camera. Kiểm tra quyền truy cập.');
    }
  }, []);

  const start = useCallback(() => startWithMode(facingMode), [facingMode, startWithMode]);

  const flip = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    startWithMode(next);
  }, [facingMode, startWithMode]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  const capture = useCallback((): File | null => {
    const video = videoRef.current;
    if (!video) return null;
    const w = video.videoWidth || video.clientWidth || 640;
    const h = video.videoHeight || video.clientHeight || 480;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    // mirror nếu camera trước (user) để ảnh không bị ngược
    if (facingMode === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    const file = new File([u8arr], `capture_${Date.now()}.jpg`, { type: mime });
    return file.size > 1000 ? file : null;
  }, [facingMode]);

  useEffect(() => {
    // Chỉ auto-start nếu được cho phép (StepFaceCapture tắt để tự start sau user gesture)
    if (autoStart) startWithMode(initialFacingMode);
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { videoRef, active, error, facingMode, start, stop, flip, capture };
}
