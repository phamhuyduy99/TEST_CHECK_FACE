import { useRef, useState, useCallback, useEffect } from 'react';

export default function useWebcam(facingMode: 'user' | 'environment' = 'user') {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  const start = useCallback(async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) videoRef.current.srcObject = s;
      setStream(s);
      setActive(true);
    } catch {
      setError('Không thể mở camera. Kiểm tra quyền truy cập.');
    }
  }, [facingMode]);

  const stop = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStream(null);
    setActive(false);
  }, [stream]);

  const capture = useCallback((): File | null => {
    const video = videoRef.current;
    if (!video) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new File([u8arr], `capture_${Date.now()}.jpg`, { type: mime });
  }, []);

  // cleanup on unmount
  useEffect(() => () => { stream?.getTracks().forEach(t => t.stop()); }, [stream]);

  return { videoRef, active, error, start, stop, capture };
}
