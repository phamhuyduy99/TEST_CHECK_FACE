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
  const [spoofingDetected, setSpoofingDetected] = useState(false);
  const [spoofingReason, setSpoofingReason] = useState('');
  const [justCompleted, setJustCompleted] = useState<{type: string; passed: boolean} | null>(null);

  useEffect(() => {
    challengeLivenessService.loadModels();
  }, []);

  const startChallenge = useCallback(() => {
    const totalChallenges = 5;
    const currentCount = challengeLivenessService.challengeHistory.length;

    if (currentCount < totalChallenges) {
      const newChallenge = challengeLivenessService.generateChallenge();
      setChallenge(newChallenge);
      setProgress(0);
      setCompleted(false);
    } else {
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

        // PHÁT HIỆN GIAN LẬN
        if (result.spoofingDetected) {
          setSpoofingDetected(true);
          setSpoofingReason(result.spoofingReason || 'Phát hiện gian lận');
          setChallenge(null);
          setCompleted(true);
          setFinalScore(0);
          return;
        }

        if (result.completed || result.timeout) {
          const totalChallenges = 5;
          const currentCount = challengeLivenessService.challengeHistory.length;
          const lastCh = challengeLivenessService.challengeHistory[currentCount - 1];
          
          setJustCompleted({ type: lastCh.type, passed: lastCh.score >= 1.0 });

          setTimeout(() => {
            if (currentCount < totalChallenges) {
              setTimeout(() => {
                setChallenge(null);
                setJustCompleted(null);
                setTimeout(() => startChallenge(), 500);
              }, 2000);
            } else {
              setTimeout(() => {
                setChallenge(null);
                setJustCompleted(null);
                setCompleted(true);
                const score = challengeLivenessService.getFinalScore();
                setFinalScore(score);
              }, 2000);
            }
          }, 100);
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
    setSpoofingDetected(false);
    setSpoofingReason('');
    setJustCompleted(null);
  }, []);

  return {
    challenge,
    progress,
    completed,
    finalScore,
    faceLandmarks,
    spoofingDetected,
    spoofingReason,
    justCompleted,
    startChallenge,
    reset,
  };
};
