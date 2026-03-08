/**
 * Anti-Spoofing Service
 * Phát hiện giả mạo: ảnh in, video replay, màn hình, deepfake
 */

interface AntiSpoofResult {
  isReal: boolean;
  confidence: number;
  details: {
    faceSizeConsistency: number;
    brightnessVariation: number;
    frameRateConsistency: number;
    textureQuality: number;
  };
  warnings: string[];
}

class AntiSpoofingService {
  private faceSizeHistory: number[] = [];
  private brightnessHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  private lastFrameTime: number = 0;
  private readonly MAX_HISTORY = 30;

  /**
   * Kiểm tra tổng hợp anti-spoofing
   */
  async checkAntiSpoofing(
    videoElement: HTMLVideoElement,
    faceBox: { x: number; y: number; width: number; height: number }
  ): Promise<AntiSpoofResult> {
    const warnings: string[] = [];

    // 1. Face Size Consistency
    const faceSizeScore = this.checkFaceSizeConsistency(faceBox);
    if (faceSizeScore < 0.5) warnings.push('Face size quá ổn định (video/ảnh)');

    // 2. Brightness Variation
    const brightnessScore = await this.checkBrightnessVariation(videoElement, faceBox);
    if (brightnessScore < 0.5) warnings.push('Brightness đồng đều (màn hình)');

    // 3. Frame Rate Consistency
    const frameRateScore = this.checkFrameRateConsistency();
    if (frameRateScore < 0.5) warnings.push('Frame rate quá đều (video replay)');

    // 4. Texture Analysis
    const textureScore = await this.checkTextureQuality(videoElement, faceBox);
    if (textureScore < 0.5) warnings.push('Texture phẳng (ảnh in/màn hình)');

    // Tính confidence tổng hợp
    const confidence =
      faceSizeScore * 0.25 + brightnessScore * 0.25 + frameRateScore * 0.25 + textureScore * 0.25;

    return {
      isReal: confidence > 0.6 && warnings.length < 2,
      confidence,
      details: {
        faceSizeConsistency: faceSizeScore,
        brightnessVariation: brightnessScore,
        frameRateConsistency: frameRateScore,
        textureQuality: textureScore,
      },
      warnings,
    };
  }

  /**
   * 1. Face Size Consistency Check
   * Phát hiện video/ảnh di chuyển (face size không đổi)
   */
  private checkFaceSizeConsistency(faceBox: { width: number; height: number }): number {
    const faceArea = faceBox.width * faceBox.height;
    this.faceSizeHistory.push(faceArea);

    if (this.faceSizeHistory.length > this.MAX_HISTORY) {
      this.faceSizeHistory.shift();
    }

    if (this.faceSizeHistory.length < 10) return 0.5;

    const avg = this.faceSizeHistory.reduce((a, b) => a + b) / this.faceSizeHistory.length;
    const variance =
      this.faceSizeHistory.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
      this.faceSizeHistory.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avg; // Coefficient of Variation

    // Video/ảnh: CV < 0.03 (rất ổn định)
    // Người thật: CV > 0.05 (di chuyển tự nhiên)
    if (cv < 0.03) return 0.2; // Suspicious
    if (cv < 0.05) return 0.5; // Borderline
    return Math.min(1.0, cv * 10); // Good
  }

  /**
   * 2. Brightness Variation Check
   * Phát hiện màn hình (brightness đồng đều)
   */
  private async checkBrightnessVariation(
    videoElement: HTMLVideoElement,
    faceBox: { x: number; y: number; width: number; height: number }
  ): Promise<number> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0.5;

    // Sample 160x120 region
    canvas.width = 160;
    canvas.height = 120;

    ctx.drawImage(
      videoElement,
      faceBox.x,
      faceBox.y,
      faceBox.width,
      faceBox.height,
      0,
      0,
      160,
      120
    );

    const imageData = ctx.getImageData(0, 0, 160, 120);
    const data = imageData.data;

    let sumBrightness = 0;
    const brightnessValues: number[] = [];

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      brightnessValues.push(brightness);
      sumBrightness += brightness;
    }

    const avgBrightness = sumBrightness / brightnessValues.length;
    const variance =
      brightnessValues.reduce((sum, val) => sum + Math.pow(val - avgBrightness, 2), 0) /
      brightnessValues.length;
    const stdDev = Math.sqrt(variance);

    this.brightnessHistory.push(stdDev);
    if (this.brightnessHistory.length > this.MAX_HISTORY) {
      this.brightnessHistory.shift();
    }

    // Màn hình: stdDev < 1.5 (ánh sáng đều)
    // Da thật: stdDev > 3 (micro-variations)
    if (stdDev < 1.5) return 0.2; // Screen detected
    if (stdDev < 3) return 0.5; // Borderline
    return Math.min(1.0, stdDev / 5);
  }

  /**
   * 3. Frame Rate Consistency Check
   * Phát hiện video pre-recorded (frame rate hoàn hảo)
   */
  private checkFrameRateConsistency(): number {
    const now = performance.now();

    if (this.lastFrameTime > 0) {
      const delta = now - this.lastFrameTime;
      this.frameTimeHistory.push(delta);

      if (this.frameTimeHistory.length > this.MAX_HISTORY) {
        this.frameTimeHistory.shift();
      }
    }

    this.lastFrameTime = now;

    if (this.frameTimeHistory.length < 10) return 0.5;

    const avg = this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length;
    const variance =
      this.frameTimeHistory.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
      this.frameTimeHistory.length;
    const stdDev = Math.sqrt(variance);

    // Video: stdDev < 3ms (frame rate hoàn hảo)
    // Webcam: stdDev > 10ms (có jitter tự nhiên)
    if (stdDev < 3) return 0.2; // Video replay
    if (stdDev < 10) return 0.5; // Borderline
    return Math.min(1.0, stdDev / 20);
  }

  /**
   * 4. Texture Analysis (Edge Density)
   * Phát hiện ảnh in/màn hình (bề mặt phẳng)
   */
  private async checkTextureQuality(
    videoElement: HTMLVideoElement,
    faceBox: { x: number; y: number; width: number; height: number }
  ): Promise<number> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0.5;

    // Sample 64x64 region
    canvas.width = 64;
    canvas.height = 64;

    ctx.drawImage(videoElement, faceBox.x, faceBox.y, faceBox.width, faceBox.height, 0, 0, 64, 64);

    const imageData = ctx.getImageData(0, 0, 64, 64);
    const data = imageData.data;

    // Simple edge detection (Sobel-like)
    let edgeCount = 0;
    const width = 64;
    const height = 64;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        // Grayscale
        const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        const bottom =
          (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;

        const gradientX = Math.abs(right - center);
        const gradientY = Math.abs(bottom - center);
        const gradient = Math.sqrt(gradientX * gradientX + gradientY * gradientY);

        if (gradient > 15) edgeCount++;
      }
    }

    const edgeDensity = edgeCount / (width * height);

    // Màn hình/giấy: density < 0.05 (mịn)
    // Da thật: density > 0.08 (có texture, lỗ chân lông)
    if (edgeDensity < 0.05) return 0.2; // Flat surface
    if (edgeDensity < 0.08) return 0.5; // Borderline
    return Math.min(1.0, edgeDensity * 10);
  }

  /**
   * Reset history (khi bắt đầu session mới)
   */
  reset(): void {
    this.faceSizeHistory = [];
    this.brightnessHistory = [];
    this.frameTimeHistory = [];
    this.lastFrameTime = 0;
  }
}

export default new AntiSpoofingService();
