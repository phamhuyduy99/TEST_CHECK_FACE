import { useEffect, useState, useRef } from 'react';
import { FaceDetection } from '@mediapipe/face_detection';

export default function useMediaPipeFaceDetection() {
  const [mediaPipeLoaded, setMediaPipeLoaded] = useState(false);
  const faceDetectionRef = useRef<FaceDetection | null>(null);

  useEffect(() => {
    const loadMediaPipe = async () => {
      try {
        const faceDetection = new FaceDetection({
          locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
        });

        faceDetection.setOptions({
          model: 'short',
          minDetectionConfidence: 0.5,
        });

        await faceDetection.initialize();
        faceDetectionRef.current = faceDetection;
        setMediaPipeLoaded(true);
        console.log('✅ MediaPipe Face Detection loaded');
      } catch (err) {
        console.error('❌ Error loading MediaPipe:', err);
      }
    };

    loadMediaPipe();
  }, []);

  const detectFaceMediaPipe = async (videoElement: HTMLVideoElement): Promise<boolean> => {
    if (!mediaPipeLoaded || !faceDetectionRef.current) return false;

    return new Promise(resolve => {
      if (!faceDetectionRef.current) {
        resolve(false);
        return;
      }

      faceDetectionRef.current.onResults(results => {
        resolve(results.detections && results.detections.length > 0);
      });

      faceDetectionRef.current.send({ image: videoElement });
    });
  };

  return { mediaPipeLoaded, detectFaceMediaPipe };
}
