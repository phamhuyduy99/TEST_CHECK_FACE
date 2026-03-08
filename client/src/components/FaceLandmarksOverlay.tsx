import { useEffect, useRef } from 'react';

interface FaceLandmarksOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarks: any;
  show: boolean;
}

export default function FaceLandmarksOverlay({
  videoRef,
  landmarks,
  show,
}: FaceLandmarksOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!show || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFrame = () => {
      if (!video || !canvas) return;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (landmarks && landmarks.detection && landmarks.landmarks) {
        const box = landmarks.detection.box;
        const points = landmarks.landmarks.positions;

        // Vẽ bounding box (khung xanh lá)
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Vẽ tất cả 68 landmarks (chấm đỏ nhỏ)
        ctx.fillStyle = '#ff0000';
        points.forEach((point: any) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Vẽ các điểm quan trọng lớn hơn (mắt, mũi, miệng)
        const keyIndices = [36, 39, 42, 45, 30, 48, 54]; // left eye, right eye, nose, mouth corners
        ctx.fillStyle = '#00ff00';
        keyIndices.forEach(idx => {
          if (points[idx]) {
            ctx.beginPath();
            ctx.arc(points[idx].x, points[idx].y, 4, 0, 2 * Math.PI);
            ctx.fill();
          }
        });

        // Vẽ đường viền khuôn mặt (jaw line)
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 16; i++) {
          if (i === 0) {
            ctx.moveTo(points[i].x, points[i].y);
          } else {
            ctx.lineTo(points[i].x, points[i].y);
          }
        }
        ctx.stroke();

        // Vẽ đường viền mắt trái
        ctx.strokeStyle = '#00ffff';
        ctx.beginPath();
        for (let i = 36; i <= 41; i++) {
          if (i === 36) {
            ctx.moveTo(points[i].x, points[i].y);
          } else {
            ctx.lineTo(points[i].x, points[i].y);
          }
        }
        ctx.closePath();
        ctx.stroke();

        // Vẽ đường viền mắt phải
        ctx.beginPath();
        for (let i = 42; i <= 47; i++) {
          if (i === 42) {
            ctx.moveTo(points[i].x, points[i].y);
          } else {
            ctx.lineTo(points[i].x, points[i].y);
          }
        }
        ctx.closePath();
        ctx.stroke();

        // Vẽ đường viền miệng
        ctx.strokeStyle = '#ff00ff';
        ctx.beginPath();
        for (let i = 48; i <= 59; i++) {
          if (i === 48) {
            ctx.moveTo(points[i].x, points[i].y);
          } else {
            ctx.lineTo(points[i].x, points[i].y);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }
    };

    const interval = setInterval(drawFrame, 100);
    return () => clearInterval(interval);
  }, [show, videoRef, landmarks]);

  if (!show) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}
