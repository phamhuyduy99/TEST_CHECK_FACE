interface Challenge {
  type: string;
  instruction: string;
  duration: number;
  startTime: number;
  completed: boolean;
  score: number;
}

interface VerifyResult {
  progress: number;
  completed: boolean;
  timeout: boolean;
  score: number;
  landmarks?: any;
}

declare class ChallengeLivenessService {
  isLoaded: boolean;
  currentChallenge: Challenge | null;
  challengeHistory: Challenge[];
  selectedChallenges: Challenge[];
  blinkState: any;
  nodState: any;

  loadModels(): Promise<void>;
  initializeChallenges(): void;
  generateChallenge(): Challenge | null;
  verifyChallenge(videoElement: HTMLVideoElement): Promise<VerifyResult | null>;
  verifyBlink(landmarks: any[]): { progress: number; completed: boolean; score: number };
  verifySmile(landmarks: any[]): { progress: number; completed: boolean; score: number };
  verifyTurnLeft(landmarks: any[]): { progress: number; completed: boolean; score: number };
  verifyTurnRight(landmarks: any[]): { progress: number; completed: boolean; score: number };
  verifyNod(landmarks: any[]): { progress: number; completed: boolean; score: number };
  verifyOpenMouth(landmarks: any[]): { progress: number; completed: boolean; score: number };
  getFinalScore(): number;
  reset(): void;
}

declare const challengeLivenessService: ChallengeLivenessService;
export default challengeLivenessService;
