import { useState, useEffect, useCallback } from 'react';
import livenessService from '../services/livenessService';

interface FaceDetection {
  detection: {
    box: { x: number; y: number; width: number; height: number };
  };
  landmarkPositions: Array<{ x: number; y: number }>;
}

export const useLivenessDetection = (
  stream: MediaStream | null,
  modelsLoaded: boolean,
  videoRef: React.RefObject<HTMLVideoElement>,
  detectFace: (video: HTMLVideoElement) => Promise<FaceDetection | null>,
  checkInterval: number,
  livenessFrameSkip: number,
  performanceMode: string
) => {
  const [liveDetection, setLiveDetection] = useState<boolean>(false);
  const [livenessStatus, setLivenessStatus] = useState<string>('');
  const [isRealPerson, setIsRealPerson] = useState<boolean | null>(null);
  const [overlayCanvasRef] = useState<HTMLCanvasElement>(document.createElement('canvas'));
  const [livenessCanvas] = useState<HTMLCanvasElement>(() => {
    const canvas = document.createElement('canvas');
    canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    return canvas;
  });

  const checkLiveness = useCallback(
    async (video: HTMLVideoElement, faceDetection: FaceDetection) => {
      const livenessCtx = livenessCanvas.getContext('2d', {
        alpha: false,
        willReadFrequently: true,
      });

      if (!livenessCtx) return null;

      livenessCtx.drawImage(video, 0, 0, livenessCanvas.width, livenessCanvas.height);

      const box = faceDetection.detection.box;
      const faceBbox = {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      };

      return await livenessService.checkLiveness(livenessCanvas, faceBbox, video.videoWidth);
    },
    [livenessCanvas]
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let frameCount = 0;
    let lastFacePosition = { x: 0, y: 0 };
    let stableFrames = 0;

    if (stream && modelsLoaded && videoRef.current && overlayCanvasRef) {
      const video = videoRef.current;
      overlayCanvasRef.width = video.videoWidth;
      overlayCanvasRef.height = video.videoHeight;
      livenessCanvas.width = video.videoWidth;
      livenessCanvas.height = video.videoHeight;

      interval = setInterval(async () => {
        frameCount++;

        const faceApiDetection = await detectFace(video);
        const detected = !!faceApiDetection;
        setLiveDetection(detected);

        if (detected) {
          const box = faceApiDetection.detection.box;
          const centerX = box.x + box.width / 2;
          const centerY = box.y + box.height / 2;

          const distance = Math.sqrt(
            Math.pow(centerX - lastFacePosition.x, 2) + Math.pow(centerY - lastFacePosition.y, 2)
          );

          stableFrames = distance < 30 ? stableFrames + 1 : 0;
          lastFacePosition = { x: centerX, y: centerY };

          // Check liveness
          if (frameCount % livenessFrameSkip === 0 && stableFrames >= 2) {
            try {
              const livenessResult = await checkLiveness(video, faceApiDetection);

              if (livenessResult) {
                setIsRealPerson(livenessResult.isReal);
                setLivenessStatus(
                  livenessResult.isReal
                    ? `✅ Người thật (${(livenessResult.confidence * 100).toFixed(0)}%)`
                    : `❌ Giả mạo (${(livenessResult.confidence * 100).toFixed(0)}%)`
                );
              }
            } catch (err) {
              console.error('Liveness check error:', err);
            }
          }

          // Draw bounding box
          const ctx = overlayCanvasRef.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, overlayCanvasRef.width, overlayCanvasRef.height);
            ctx.strokeStyle =
              isRealPerson === true ? '#00ff00' : isRealPerson === false ? '#ff0000' : '#ffff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);

            if (performanceMode === 'high') {
              ctx.fillStyle = '#ff0000';
              faceApiDetection.landmarkPositions.forEach((point: { x: number; y: number }) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                ctx.fill();
              });
            }
          }
        } else {
          stableFrames = 0;
        }
      }, checkInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
      livenessService.clearCache();
    };
  }, [
    stream,
    modelsLoaded,
    videoRef,
    detectFace,
    checkInterval,
    livenessFrameSkip,
    performanceMode,
    checkLiveness,
    overlayCanvasRef,
    livenessCanvas,
    isRealPerson,
  ]);

  return {
    liveDetection,
    livenessStatus,
    isRealPerson,
    overlayCanvasRef,
  };
};
