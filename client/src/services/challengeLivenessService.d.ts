export interface ChallengeResult {
  progress: number;
  completed: boolean;
  timeout?: boolean;
  score: number;
  landmarks?: any;
}

export interface Challenge {
  type: string;
  instruction: string;
  duration: number;
  startTime: number;
  completed: boolean;
  score: number;
}

declare class ChallengeLivenessService {
  faceMeshModel: any;
  isLoaded: boolean;
  currentChallenge: Challenge | null;
  challengeHistory: Challenge[];
  selectedChallenges: Challenge[];

  loadModels(): Promise<void>;
  initializeChallenges(): void;
  generateChallenge(): Challenge | null;
  verifyChallenge(videoElement: HTMLVideoElement): Promise<ChallengeResult | null>;
  getFinalScore(): number;
  reset(): void;
}

declare const challengeLivenessService: ChallengeLivenessService;
export default challengeLivenessService;
