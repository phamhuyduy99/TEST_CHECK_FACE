import { useState, useEffect, useCallback, RefObject } from 'react';
import challengeLivenessService from '../services/challengeLivenessServiceFaceAPI';

interface Challenge {
  type: string;
  instruction: string;
  duration: number;
  startTime: number;
  completed: boolean;
  score: number;
}

export const useChallengeLiveness = (
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean
) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [faceLandmarks, setFaceLandmarks] = useState<any>(null);

  useEffect(() => {
    challengeLivenessService.loadModels();
  }, []);

  const startChallenge = useCallback(() => {
    const totalChallenges = 5; // 5 thử thách
    const currentCount = challengeLivenessService.challengeHistory.length;

    if (currentCount < totalChallenges) {
      const newChallenge = challengeLivenessService.generateChallenge();
      setChallenge(newChallenge);
      setProgress(0);
      setCompleted(false);
    } else {
      // Hoàn thành tất cả
      setCompleted(true);
      const score = challengeLivenessService.getFinalScore();
      setFinalScore(score);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !challenge || !videoRef.current) return;

    const interval = setInterval(async () => {
      if (!videoRef.current) return;
      const result = await challengeLivenessService.verifyChallenge(videoRef.current);

      if (result) {
        setProgress(result.progress);
        if (result.landmarks) {
          setFaceLandmarks(result.landmarks);
        }

        if (result.completed || result.timeout) {
          const totalChallenges = 5;
          const currentCount = challengeLivenessService.challengeHistory.length;

          // Hiển thị thông báo 1.5s trước khi chuyển
          setTimeout(() => {
            if (currentCount < totalChallenges) {
              // Chuyển sang thử thách tiếp theo
              setChallenge(null);
              setTimeout(() => startChallenge(), 300);
            } else {
              // Hoàn thành tất cả
              setChallenge(null);
              setCompleted(true);
              const score = challengeLivenessService.getFinalScore();
              setFinalScore(score);
            }
          }, 1500);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [enabled, challenge, videoRef, startChallenge]);

  const reset = useCallback(() => {
    challengeLivenessService.reset();
    setChallenge(null);
    setProgress(0);
    setCompleted(false);
    setFinalScore(0);
  }, []);

  return {
    challenge,
    progress,
    completed,
    finalScore,
    faceLandmarks,
    startChallenge,
    reset,
  };
};
