import { useEffect, useState } from 'react';
import challengeLivenessService from '../services/challengeLivenessServiceFaceAPI';

export default function useFaceDetection() {
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    challengeLivenessService.loadModels().then(() => {
      setModelsLoaded(true);
    });
  }, []);

  const detectFace = async (video: HTMLVideoElement) => {
    if (!video || video.readyState !== 4 || video.videoWidth === 0) {
      return null;
    }
    try {
      const detection = await (
        await import('face-api.js')
      ).detectSingleFace(
        video,
        new (await import('face-api.js')).TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5,
        })
      );
      return detection;
    } catch (err) {
      console.error('Face detection error:', err);
      return null;
    }
  };

  return { modelsLoaded, detectFace };
}
