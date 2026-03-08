import { useState, useEffect, useCallback, RefObject } from 'react';
import challengeLivenessService from '../services/challengeLivenessService';

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

  useEffect(() => {
    challengeLivenessService.loadModels();
  }, []);

  const startChallenge = useCallback(() => {
    const newChallenge = challengeLivenessService.generateChallenge();
    setChallenge(newChallenge);
    setProgress(0);
    setCompleted(false);
  }, []);

  useEffect(() => {
    if (!enabled || !challenge || !videoRef.current) return;

    const interval = setInterval(async () => {
      if (!videoRef.current) return;
      const result = await challengeLivenessService.verifyChallenge(videoRef.current);
      
      if (result) {
        setProgress(result.progress);
        
        if (result.completed) {
          setCompleted(true);
          setTimeout(() => {
            const score = challengeLivenessService.getFinalScore();
            setFinalScore(score);
          }, 500);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [enabled, challenge, videoRef]);

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
    startChallenge,
    reset,
  };
};
