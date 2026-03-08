/**
 * Anti-Spoofing Service (JavaScript version)
 * Phát hiện: ảnh in, video replay, màn hình, deepfake
 */

class AntiSpoofingService {
  constructor() {
    this.faceSizeHistory = [];
    this.brightnessHistory = [];
    this.frameTimeHistory = [];
    this.lastFrameTime = 0;
    this.sessionStartTime = 0;
    this.frameCount = 0;
    this.MAX_HISTORY = 30;
  }

  /**
   * Kiểm tra tổng hợp anti-spoofing
   */
  performAntiSpoofingCheck(videoElement, detection) {
    this.frameCount++;
    
    // Chỉ bắt đầu check sau 60 frames (2 giây) để camera ổn định
    if (this.frameCount < 60) {
      return {
        passed: true,
        score: 1.0,
        details: [],
        failedChecks: 0
      };
    }
    
    const faceBox = detection.detection.box;
    const details = [];

    // 1. Face Size Consistency
    const faceSizeScore = this.checkFaceSizeConsistency(faceBox);
    details.push({
      name: 'Face Size Consistency',
      score: faceSizeScore,
      passed: faceSizeScore > 0.25,
      reason: faceSizeScore <= 0.3 ? 'Face size quá ổn định (video/ảnh)' : 'OK'
    });

    // 2. Brightness Variation
    const brightnessScore = this.checkBrightnessVariation(videoElement, faceBox);
    details.push({
      name: 'Brightness Variation',
      score: brightnessScore,
      passed: brightnessScore > 0.25,
      reason: brightnessScore <= 0.3 ? 'Brightness đồng đều (màn hình)' : 'OK'
    });

    // 3. Frame Rate Consistency
    const frameRateScore = this.checkFrameRateConsistency();
    details.push({
      name: 'Frame Rate Consistency',
      score: frameRateScore,
      passed: frameRateScore > 0.25,
      reason: frameRateScore <= 0.3 ? 'Frame rate quá đều (video replay)' : 'OK'
    });

    // 4. Texture Analysis
    const textureScore = this.checkTextureQuality(videoElement, faceBox);
    details.push({
      name: 'Texture Quality',
      score: textureScore,
      passed: textureScore > 0.25,
      reason: textureScore <= 0.3 ? 'Texture phẳng (ảnh in/màn hình)' : 'OK'
    });

    // 5. Session Duration
    const durationScore = this.checkSessionDuration();
    details.push({
      name: 'Session Duration',
      score: durationScore,
      passed: durationScore > 0.5,
      reason: durationScore <= 0.5 ? 'Session quá ngắn' : 'OK'
    });

    // Tính confidence tổng hợp
    const totalScore =
      faceSizeScore * 0.25 +
      brightnessScore * 0.25 +
      frameRateScore * 0.25 +
      textureScore * 0.25;

    const failedChecks = details.filter(d => !d.passed).length;
    const passed = totalScore > 0.35 && failedChecks < 4; // Rất dễ: cho phép 3 checks fail

    return {
      passed,
      score: totalScore,
      details,
      failedChecks
    };
  }

  /**
   * 1. Face Size Consistency Check
   */
  checkFaceSizeConsistency(faceBox) {
    const faceArea = faceBox.width * faceBox.height;
    this.faceSizeHistory.push(faceArea);

    if (this.faceSizeHistory.length > this.MAX_HISTORY) {
      this.faceSizeHistory.shift();
    }

    if (this.faceSizeHistory.length < 10) return 0.5;

    const avg = this.faceSizeHistory.reduce((a, b) => a + b) / this.faceSizeHistory.length;
    const variance = this.faceSizeHistory.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / this.faceSizeHistory.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avg;

    // Video/ảnh: CV < 0.02 (rất ổn định)
    // Người thật: CV > 0.04 (di chuyển tự nhiên)
    if (cv < 0.02) return 0.2;
    if (cv < 0.04) return 0.5;
    return Math.min(1.0, cv * 15);
  }

  /**
   * 2. Brightness Variation Check
   */
  checkBrightnessVariation(videoElement, faceBox) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0.5;

    canvas.width = 160;
    canvas.height = 120;

    try {
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
      const brightnessValues = [];

      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        brightnessValues.push(brightness);
        sumBrightness += brightness;
      }

      const avgBrightness = sumBrightness / brightnessValues.length;
      const variance = brightnessValues.reduce((sum, val) => sum + Math.pow(val - avgBrightness, 2), 0) / brightnessValues.length;
      const stdDev = Math.sqrt(variance);

      this.brightnessHistory.push(stdDev);
      if (this.brightnessHistory.length > this.MAX_HISTORY) {
        this.brightnessHistory.shift();
      }

      // Màn hình: stdDev < 1.0
      // Da thật: stdDev > 2.5
      if (stdDev < 1.0) return 0.2;
      if (stdDev < 2.5) return 0.5;
      return Math.min(1.0, stdDev / 4);
    } catch (err) {
      return 0.5;
    }
  }

  /**
   * 3. Frame Rate Consistency Check
   */
  checkFrameRateConsistency() {
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
    const variance = this.frameTimeHistory.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / this.frameTimeHistory.length;
    const stdDev = Math.sqrt(variance);

    // Video: stdDev < 2ms
    // Webcam: stdDev > 8ms
    if (stdDev < 2) return 0.2;
    if (stdDev < 8) return 0.5;
    return Math.min(1.0, stdDev / 15);
  }

  /**
   * 4. Texture Analysis (Edge Density)
   */
  checkTextureQuality(videoElement, faceBox) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0.5;

    canvas.width = 64;
    canvas.height = 64;

    try {
      ctx.drawImage(
        videoElement,
        faceBox.x,
        faceBox.y,
        faceBox.width,
        faceBox.height,
        0,
        0,
        64,
        64
      );

      const imageData = ctx.getImageData(0, 0, 64, 64);
      const data = imageData.data;

      let edgeCount = 0;
      const width = 64;
      const height = 64;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;

          const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
          const bottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;

          const gradientX = Math.abs(right - center);
          const gradientY = Math.abs(bottom - center);
          const gradient = Math.sqrt(gradientX * gradientX + gradientY * gradientY);

          if (gradient > 15) edgeCount++;
        }
      }

      const edgeDensity = edgeCount / (width * height);

      // Màn hình/giấy: density < 0.04
      // Da thật: density > 0.07
      if (edgeDensity < 0.04) return 0.2;
      if (edgeDensity < 0.07) return 0.5;
      return Math.min(1.0, edgeDensity * 12);
    } catch (err) {
      return 0.5;
    }
  }

  /**
   * 5. Session Duration Check
   */
  checkSessionDuration() {
    if (this.sessionStartTime === 0) {
      this.sessionStartTime = performance.now();
      return 0.5;
    }

    const duration = (performance.now() - this.sessionStartTime) / 1000; // seconds

    // Video loop ngắn: < 5s
    if (duration < 5 && this.frameCount > 50) return 0.2;
    if (duration < 3) return 0.5;
    return 1.0;
  }

  /**
   * Reset tất cả
   */
  reset() {
    this.faceSizeHistory = [];
    this.brightnessHistory = [];
    this.frameTimeHistory = [];
    this.lastFrameTime = 0;
    this.sessionStartTime = 0;
    this.frameCount = 0;
  }
}

export default new AntiSpoofingService();
