declare class LivenessService {
  livenessSession: unknown;
  isLoaded: boolean;
  offscreenCanvas: HTMLCanvasElement | null;
  lastResult: { isReal: boolean; confidence: number };
  resultCache: Map<string, { result: { isReal: boolean; confidence: number }; timestamp: number }>;

  loadModels(): Promise<void>;
  resizeCanvas(sourceCanvas: HTMLCanvasElement, targetWidth?: number): HTMLCanvasElement;
  scaleBbox(
    bbox: { x: number; y: number; width: number; height: number },
    originalWidth: number,
    targetWidth: number
  ): { x: number; y: number; width: number; height: number };
  checkLiveness(
    canvas: HTMLCanvasElement,
    faceBbox: { x: number; y: number; width: number; height: number } | null,
    originalWidth: number
  ): Promise<{ isReal: boolean; confidence: number }>;
  clearCache(): void;
}

declare const livenessService: LivenessService;
export default livenessService;
