import { useState, useCallback } from 'react';

export const useAutoCapture = () => {
  const [realPersonDetectedCount, setRealPersonDetectedCount] = useState<number>(0);
  const [autoCaptureDone, setAutoCaptureDone] = useState<boolean>(false);

  const handleAutoCapture = useCallback(
    (
      isReal: boolean,
      confidence: number,
      image1: Blob | null,
      image2: Blob | null,
      captureImage: (imageNumber: number) => void,
      setMessage: (msg: string) => void
    ) => {
      if (isReal && confidence > 0.7 && !autoCaptureDone) {
        setRealPersonDetectedCount(prev => {
          const newCount = prev + 1;

          // Chụp ảnh 1 sau 2 lần phát hiện người thật
          if (newCount === 2 && !image1) {
            captureImage(1);
            setMessage('✅ Tự động chụp ảnh 1!');
          }

          // Chụp ảnh 2 sau 4 lần phát hiện người thật
          if (newCount === 4 && image1 && !image2) {
            captureImage(2);
            setMessage('✅ Tự động chụp ảnh 2! Hoàn tất!');
            setAutoCaptureDone(true);
          }

          return newCount;
        });
      }
    },
    [autoCaptureDone]
  );

  const reset = useCallback(() => {
    setRealPersonDetectedCount(0);
    setAutoCaptureDone(false);
  }, []);

  return {
    realPersonDetectedCount,
    autoCaptureDone,
    handleAutoCapture,
    reset,
  };
};
