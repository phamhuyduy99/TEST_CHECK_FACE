import { useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function useFaceDetection() {
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log('✅ Face-api models loaded');
      } catch (err) {
        console.error('❌ Error loading face-api models:', err);
      }
    };

    loadModels();
  }, []);

  const detectFace = async (
    imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ) => {
    if (!modelsLoaded) return null;

    try {
      const detection = await faceapi
        .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        return {
          ...detection,
          confidence: detection.detection.score,
          landmarks: detection.landmarks.positions.length,
        };
      }
      return null;
    } catch (err) {
      console.error('Error detecting face:', err);
      return null;
    }
  };

  const compareFaces = (descriptor1: Float32Array, descriptor2: Float32Array) => {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    const similarity = 1 - distance;
    return { distance, similarity, match: similarity > 0.6 };
  };

  return { modelsLoaded, detectFace, compareFaces };
}
