import { useState } from 'react';

interface FaceDetectionInfo {
  confidence: number;
  landmarks: number;
  descriptor: Float32Array;
  detection: {
    box: { x: number; y: number; width: number; height: number };
  };
  landmarkPositions: Array<{ x: number; y: number }>;
}

export const useFaceCapture = (
  detectFace: (video: HTMLVideoElement) => Promise<FaceDetectionInfo | null>,
  compareFaces: (desc1: Float32Array, desc2: Float32Array) => { match: boolean; similarity: number }
) => {
  const [faceDescriptor1, setFaceDescriptor1] = useState<Float32Array | null>(null);
  const [faceMatchResult, setFaceMatchResult] = useState<string>('');
  const [faceInfo1, setFaceInfo1] = useState<FaceDetectionInfo | null>(null);
  const [faceInfo2, setFaceInfo2] = useState<FaceDetectionInfo | null>(null);
  const [imagePreview1, setImagePreview1] = useState<string>('');
  const [imagePreview2, setImagePreview2] = useState<string>('');

  const handleCaptureImage = async (
    imageNumber: number,
    videoRef: React.RefObject<HTMLVideoElement>,
    canvasRef: React.RefObject<HTMLCanvasElement>,
    modelsLoaded: boolean
  ) => {
    if (!modelsLoaded || !videoRef.current) return;

    const detection = await detectFace(videoRef.current);
    if (!detection) return;

    if (imageNumber === 1) {
      setFaceDescriptor1(detection.descriptor);
      setFaceInfo1(detection);

      if (canvasRef.current) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = canvasRef.current.width;
          canvas.height = canvasRef.current.height;
          ctx.drawImage(canvasRef.current, 0, 0);
          const box = detection.detection.box;
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 4;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          setImagePreview1(canvas.toDataURL('image/jpeg'));
        }
      }
    } else {
      setFaceInfo2(detection);

      if (canvasRef.current) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = canvasRef.current.width;
          canvas.height = canvasRef.current.height;
          ctx.drawImage(canvasRef.current, 0, 0);
          const box = detection.detection.box;
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 4;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          setImagePreview2(canvas.toDataURL('image/jpeg'));
        }
      }

      if (faceDescriptor1) {
        const result = compareFaces(faceDescriptor1, detection.descriptor);
        const matchText = result.match
          ? `✅ Khớp! Độ tương đồng: ${(result.similarity * 100).toFixed(1)}%`
          : `❌ Không khớp! Độ tương đồng: ${(result.similarity * 100).toFixed(1)}%`;
        setFaceMatchResult(matchText);
      }
    }
  };

  const reset = () => {
    setFaceDescriptor1(null);
    setFaceMatchResult('');
    setFaceInfo1(null);
    setFaceInfo2(null);
    setImagePreview1('');
    setImagePreview2('');
  };

  return {
    faceInfo1,
    faceInfo2,
    faceMatchResult,
    imagePreview1,
    imagePreview2,
    handleCaptureImage,
    reset,
  };
};
