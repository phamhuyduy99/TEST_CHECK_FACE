export interface LivenessResult {
  isReal: boolean;
  confidence: number;
}

export interface FaceDetection {
  keypoints?: Array<{ x: number; y: number; z?: number; name?: string }>;
  box?: { xMin: number; yMin: number; xMax: number; yMax: number; width: number; height: number };
}

declare class LivenessService {
  isLoaded: boolean;
  faceMeshModel: any;
  loadModels(): Promise<void>;
  detectFace(video: HTMLVideoElement): Promise<FaceDetection | null>;
  checkLiveness(video: HTMLVideoElement): Promise<LivenessResult>;
  clearCache(): void;
}

declare const livenessService: LivenessService;
export default livenessService;
