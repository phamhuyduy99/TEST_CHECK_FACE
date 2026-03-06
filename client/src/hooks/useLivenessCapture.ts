import { useState, useRef, useEffect } from 'react';

export default function useLivenessCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [image1, setImage1] = useState<Blob | null>(null);
  const [image2, setImage2] = useState<Blob | null>(null);
  const [message, setMessage] = useState('');

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setMessage('Camera đã bật');
    } catch (err) {
      setMessage('Lỗi: Không thể truy cập camera');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setMessage('Camera đã tắt');
    }
  };

  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoBlob(blob);
      setMessage(`Video đã được ghi lại (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
      setRecording(false);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100);
    setRecording(true);
    setMessage('Đang quay video... Thực hiện theo hướng dẫn trên màn hình');
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const captureImage = (imageNumber: number) => {
    if (!videoRef.current) return;

    if (recording) {
      setMessage('⚠️ Vui lòng dừng quay video trước khi chụp ảnh!');
      return;
    }

    if (!videoBlob) {
      setMessage('⚠️ Vui lòng quay video trước khi chụp ảnh!');
      return;
    }

    if (imageNumber === 2 && !image1) {
      setMessage('⚠️ Vui lòng chụp ảnh 1 trước!');
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      blob => {
        if (!blob) return;
        if (imageNumber === 1) {
          setImage1(blob);
          setMessage(`Đã chụp ảnh 1 (${(blob.size / 1024).toFixed(0)} KB)`);
        } else {
          setImage2(blob);
          setMessage(`Đã chụp ảnh 2 (${(blob.size / 1024).toFixed(0)} KB)`);
        }
      },
      'image/jpeg',
      0.95
    );
  };

  const resetRecording = () => {
    setVideoBlob(null);
    setImage1(null);
    setImage2(null);
    setMessage('Video đã bị xóa. Bắt đầu quay lại!');
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return {
    videoRef,
    canvasRef,
    stream,
    recording,
    videoBlob,
    image1,
    image2,
    message,
    setMessage,
    startCamera,
    stopCamera,
    startRecording,
    stopRecording,
    captureImage,
    resetRecording,
  };
}
