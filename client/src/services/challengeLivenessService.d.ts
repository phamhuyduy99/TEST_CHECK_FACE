declare class ChallengeLivenessService {
  faceMeshModel: unknown;
  isLoaded: boolean;
  currentChallenge: {
    type: string;
    instruction: string;
    duration: number;
    startTime: number;
    completed: boolean;
    score: number;
  } | null;
  challengeHistory: Array<{
    type: string;
    instruction: string;
    duration: number;
    startTime: number;
    completed: boolean;
    score: number;
  }>;
  baselineLandmarks: unknown;

  loadModels(): Promise<void>;
  generateChallenge(): {
    type: string;
    instruction: string;
    duration: number;
    startTime: number;
    completed: boolean;
    score: number;
  };
  verifyChallenge(
    videoElement: HTMLVideoElement
  ): Promise<{ progress: number; completed: boolean; score?: number } | null>;
  getFinalScore(): number;
  reset(): void;
}

declare const challengeLivenessService: ChallengeLivenessService;
export default challengeLivenessService;
