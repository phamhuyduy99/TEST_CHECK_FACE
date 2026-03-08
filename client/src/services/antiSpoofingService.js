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
    
    // Thêm tracking cho các check mới
    this.colorHistogramHistory = [];
    this.facePositionHistory = [];
    this.pixelNoiseHistory = [];
    this.compressionArtifactScore = 0;
    this.blinkHistory = [];
    this.eyeAspectRatioHistory = [];
    this.faceAngleHistory = [];
    this.skinToneHistory = [];
    this.sharpnessHistory = [];
    this.contrastHistory = [];
    this.saturationHistory = [];
    this.chromaticAberrationScore = 0;
    this.depthCueScore = 0;
    this.temporalConsistencyScore = 0;
  }

  /**
   * Kiểm tra tổng hợp anti-spoofing
   */
  performAntiSpoofingCheck(videoElement, detection) {
    this.frameCount++;
    
    // Check ngay lập tức: sau 20 frames (0.7 giây)
    if (this.frameCount < 20) {
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
      passed: faceSizeScore > 0.15,
      reason: faceSizeScore <= 0.15 ? 'Face size quá ổn định (video/ảnh)' : 'OK'
    });

    // 2. Brightness Variation
    const brightnessScore = this.checkBrightnessVariation(videoElement, faceBox);
    details.push({
      name: 'Brightness Variation',
      score: brightnessScore,
      passed: brightnessScore > 0.15,
      reason: brightnessScore <= 0.15 ? 'Brightness đồng đều (màn hình)' : 'OK'
    });

    // 3. Frame Rate Consistency
    const frameRateScore = this.checkFrameRateConsistency();
    details.push({
      name: 'Frame Rate Consistency',
      score: frameRateScore,
      passed: frameRateScore > 0.15,
      reason: frameRateScore <= 0.15 ? 'Frame rate quá đều (video replay)' : 'OK'
    });

    // 4. Texture Analysis
    const textureScore = this.checkTextureQuality(videoElement, faceBox);
    details.push({
      name: 'Texture Quality',
      score: textureScore,
      passed: textureScore > 0.15,
      reason: textureScore <= 0.15 ? 'Texture phẳng (ảnh in/màn hình)' : 'OK'
    });

    // 5. Moiré Pattern Detection (vân sóng khi quay màn hình)
    const moireScore = this.checkMoirePattern(videoElement, faceBox);
    details.push({
      name: 'Moiré Pattern',
      score: moireScore,
      passed: moireScore > 0.5,
      reason: moireScore <= 0.5 ? 'Phát hiện vân sóng màn hình' : 'OK'
    });

    // 6. Screen Reflection (phản chiếu màn hình)
    const reflectionScore = this.checkScreenReflection(videoElement, faceBox);
    details.push({
      name: 'Screen Reflection',
      score: reflectionScore,
      passed: reflectionScore > 0.5,
      reason: reflectionScore <= 0.5 ? 'Phát hiện phản chiếu màn hình' : 'OK'
    });

    // 7. Color Histogram Analysis (phát hiện video/ảnh có color grading)
    const colorHistScore = this.checkColorHistogram(videoElement, faceBox);
    details.push({
      name: 'Color Histogram',
      score: colorHistScore,
      passed: colorHistScore > 0.5,
      reason: colorHistScore <= 0.5 ? 'Color histogram bất thường (video đã edit)' : 'OK'
    });

    // 8. Face Position Stability (phát hiện video cố định)
    const positionScore = this.checkFacePositionStability(faceBox);
    details.push({
      name: 'Face Position Stability',
      score: positionScore,
      passed: positionScore > 0.5,
      reason: positionScore <= 0.5 ? 'Vị trí khuôn mặt quá cố định (video/ảnh)' : 'OK'
    });

    // 9. Pixel Noise Analysis (phát hiện video nén/ảnh)
    const noiseScore = this.checkPixelNoise(videoElement, faceBox);
    details.push({
      name: 'Pixel Noise',
      score: noiseScore,
      passed: noiseScore > 0.5,
      reason: noiseScore <= 0.5 ? 'Thiếu noise tự nhiên (video nén/ảnh)' : 'OK'
    });

    // 10. Compression Artifacts (phát hiện video đã nén)
    const compressionScore = this.checkCompressionArtifacts(videoElement, faceBox);
    details.push({
      name: 'Compression Artifacts',
      score: compressionScore,
      passed: compressionScore > 0.5,
      reason: compressionScore <= 0.5 ? 'Phát hiện compression artifacts (video đã lưu)' : 'OK'
    });

    // 11. Blink Detection (phát hiện video không nháy mắt)
    const blinkScore = this.checkBlinkPattern(detection.landmarks);
    details.push({
      name: 'Blink Pattern',
      score: blinkScore,
      passed: blinkScore > 0.5,
      reason: blinkScore <= 0.5 ? 'Không phát hiện nháy mắt tự nhiên' : 'OK'
    });

    // 12. Face Angle Variation (phát hiện video cố định góc)
    const angleScore = this.checkFaceAngleVariation(detection.landmarks);
    details.push({
      name: 'Face Angle Variation',
      score: angleScore,
      passed: angleScore > 0.5,
      reason: angleScore <= 0.5 ? 'Góc khuôn mặt không thay đổi (video/ảnh)' : 'OK'
    });

    // 13. Skin Tone Consistency (phát hiện màu da bất thường)
    const skinToneScore = this.checkSkinToneConsistency(videoElement, faceBox);
    details.push({
      name: 'Skin Tone Consistency',
      score: skinToneScore,
      passed: skinToneScore > 0.5,
      reason: skinToneScore <= 0.5 ? 'Màu da bất thường (filter/edit)' : 'OK'
    });

    // 14. Sharpness Analysis (phát hiện ảnh quá sắc nét)
    const sharpnessScore = this.checkSharpness(videoElement, faceBox);
    details.push({
      name: 'Sharpness',
      score: sharpnessScore,
      passed: sharpnessScore > 0.5,
      reason: sharpnessScore <= 0.5 ? 'Ảnh quá sắc nét (sharpening filter)' : 'OK'
    });

    // 15. Contrast Analysis (phát hiện contrast bất thường)
    const contrastScore = this.checkContrast(videoElement, faceBox);
    details.push({
      name: 'Contrast',
      score: contrastScore,
      passed: contrastScore > 0.5,
      reason: contrastScore <= 0.5 ? 'Contrast bất thường (edit)' : 'OK'
    });

    // 16. Saturation Analysis (phát hiện màu sắc bất thường)
    const saturationScore = this.checkSaturation(videoElement, faceBox);
    details.push({
      name: 'Saturation',
      score: saturationScore,
      passed: saturationScore > 0.5,
      reason: saturationScore <= 0.5 ? 'Saturation bất thường (filter)' : 'OK'
    });

    // 17. Chromatic Aberration (phát hiện lỗi quang học màn hình)
    const chromaticScore = this.checkChromaticAberration(videoElement, faceBox);
    details.push({
      name: 'Chromatic Aberration',
      score: chromaticScore,
      passed: chromaticScore > 0.5,
      reason: chromaticScore <= 0.5 ? 'Phát hiện lỗi quang học màn hình' : 'OK'
    });

    // 18. Depth Cues (phát hiện thiếu chiều sâu 3D)
    const depthScore = this.checkDepthCues(videoElement, faceBox);
    details.push({
      name: 'Depth Cues',
      score: depthScore,
      passed: depthScore > 0.5,
      reason: depthScore <= 0.5 ? 'Thiếu chiều sâu 3D (2D image/screen)' : 'OK'
    });

    // 19. Temporal Consistency (phát hiện video loop)
    const temporalScore = this.checkTemporalConsistency(videoElement, faceBox);
    details.push({
      name: 'Temporal Consistency',
      score: temporalScore,
      passed: temporalScore > 0.5,
      reason: temporalScore <= 0.5 ? 'Phát hiện video loop/repeat' : 'OK'
    });

    // 20. Eye Gaze Direction (phát hiện mắt không nhìn camera)
    const gazeScore = this.checkEyeGazeDirection(detection.landmarks);
    details.push({
      name: 'Eye Gaze Direction',
      score: gazeScore,
      passed: gazeScore > 0.5,
      reason: gazeScore <= 0.5 ? 'Mắt không nhìn thẳng camera (video ghi sẵn)' : 'OK'
    });

    // Tính confidence tổng hợp
    const totalScore =
      faceSizeScore * 0.08 +
      brightnessScore * 0.08 +
      frameRateScore * 0.08 +
      textureScore * 0.08 +
      moireScore * 0.10 +
      reflectionScore * 0.10 +
      colorHistScore * 0.05 +
      positionScore * 0.05 +
      noiseScore * 0.03 +
      compressionScore * 0.03 +
      blinkScore * 0.06 +
      angleScore * 0.05 +
      skinToneScore * 0.04 +
      sharpnessScore * 0.03 +
      contrastScore * 0.03 +
      saturationScore * 0.03 +
      chromaticScore * 0.04 +
      depthScore * 0.04 +
      temporalScore * 0.04 +
      gazeScore * 0.03;

    const failedChecks = details.filter(d => !d.passed).length;
    const passed = totalScore > 0.6 && failedChecks < 8;

    if (this.frameCount % 10 === 0) {
      // console.log('\n🛡️ BASIC ANTI-SPOOF [Frame ' + this.frameCount + ']:');
      // console.log('  Score:', totalScore.toFixed(3), '/ 1.0 (need > 0.6)');
      // console.log('  Failed:', failedChecks, '/ 20 (max 7)');
      // console.log('  Result:', passed ? '✅ PASS' : '❌ FAIL');
      
      const topFails = details.filter(d => !d.passed).slice(0, 5);
      if (topFails.length > 0) {
        // console.log('  Top fails:');
        // topFails.forEach(d => console.log('    ❌', d.name, '-', d.reason));
      }
    }

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

    if (this.faceSizeHistory.length < 5) return 1.0; // Pass ban đầu

    const avg = this.faceSizeHistory.reduce((a, b) => a + b) / this.faceSizeHistory.length;
    const variance = this.faceSizeHistory.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / this.faceSizeHistory.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avg;

    // Video/ảnh: CV < 0.02 (rất ổn định)
    // Người thật: CV > 0.04 (di chuyển tự nhiên)
    if (cv < 0.015) return 0.0;   // Chắc chắn là video/ảnh
    if (cv < 0.03) return 0.3;    // Nghi ngờ
    return 1.0;
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

      // console.log('  💡 Brightness: stdDev=' + stdDev.toFixed(2) + ', avg=' + avgBrightness.toFixed(1));

      // Màn hình: stdDev < 1.0
      // Da thật: stdDev > 2.5
      if (stdDev < 1.0) return 0.1;  // Chắc chắn là màn hình
      if (stdDev < 2.5) return 0.4;  // Nghi ngờ nhẹ
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

    if (this.frameTimeHistory.length < 5) return 1.0; // Pass ban đầu

    const avg = this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length;
    const variance = this.frameTimeHistory.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / this.frameTimeHistory.length;
    const stdDev = Math.sqrt(variance);

    // Video: stdDev < 3ms (rất đều)
    // Webcam: stdDev > 10ms (không đều)
    if (stdDev < 3) return 0.0;   // Chắc chắn là video replay
    if (stdDev < 8) return 0.3;   // Nghi ngờ
    return 1.0;
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

      // console.log('  🖼️ Texture: edgeCount=' + edgeCount + ', density=' + edgeDensity.toFixed(4));

      // Màn hình/giấy: density < 0.04
      // Da thật: density > 0.07
      if (edgeDensity < 0.04) return 0.1;  // Chắc chắn là màn hình/giấy
      if (edgeDensity < 0.07) return 0.4;  // Nghi ngờ nhẹ
      return Math.min(1.0, edgeDensity * 12);
    } catch (err) {
      return 0.5;
    }
  }

  /**
   * 5. Moiré Pattern Detection (vân sóng khi quay màn hình)
   */
  checkMoirePattern(videoElement, faceBox) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0.5;

    canvas.width = 128;
    canvas.height = 128;

    try {
      ctx.drawImage(
        videoElement,
        faceBox.x,
        faceBox.y,
        faceBox.width,
        faceBox.height,
        0,
        0,
        128,
        128
      );

      const imageData = ctx.getImageData(0, 0, 128, 128);
      const data = imageData.data;

      // Phân tích tần số cao (high frequency patterns)
      let highFreqCount = 0;
      const width = 128;
      const height = 128;

      for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
          const idx = (y * width + x) * 4;
          const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          
          // Lấy 4 điểm xung quanh
          const top = (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3;
          const bottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
          const left = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3;
          const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
          
          // Tính Laplacian (phát hiện vân sóng)
          const laplacian = Math.abs(4 * center - top - bottom - left - right);
          
          if (laplacian > 30) highFreqCount++;
        }
      }

      const moireDensity = highFreqCount / (width * height);

      // Màn hình có vân sóng: density > 0.15
      // Da thật: density < 0.08
      if (moireDensity > 0.15) return 0.1;  // Chắc chắn là màn hình
      if (moireDensity > 0.08) return 0.4;  // Nghi ngờ
      return 1.0;
    } catch (err) {
      return 0.5;
    }
  }

  /**
   * 6. Screen Reflection Detection (phản chiếu màn hình)
   */
  checkScreenReflection(videoElement, faceBox) {
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

      // Phát hiện vùng sáng bất thường (reflection)
      let brightPixelCount = 0;
      let totalBrightness = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        
        totalBrightness += brightness;
        
        // Phát hiện pixel quá sáng (reflection)
        if (brightness > 220 && Math.abs(r - g) < 10 && Math.abs(g - b) < 10) {
          brightPixelCount++;
        }
      }

      const avgBrightness = totalBrightness / (data.length / 4);
      const reflectionRatio = brightPixelCount / (data.length / 4);

      // Màn hình có reflection: ratio > 0.05
      // Da thật: ratio < 0.02
      if (reflectionRatio > 0.05) return 0.1;  // Chắc chắn có reflection
      if (reflectionRatio > 0.02) return 0.4;  // Nghi ngờ
      return 1.0;
    } catch (err) {
      return 0.5;
    }
  }

  /**
   * 7. Color Histogram Analysis (phát hiện video/ảnh đã edit)
   */
  checkColorHistogram(videoElement, faceBox) {
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

      // Tính histogram cho R, G, B
      const histR = new Array(256).fill(0);
      const histG = new Array(256).fill(0);
      const histB = new Array(256).fill(0);

      for (let i = 0; i < data.length; i += 4) {
        histR[data[i]]++;
        histG[data[i + 1]]++;
        histB[data[i + 2]]++;
      }

      // Tính entropy (nhiều loạn) của histogram
      const calcEntropy = (hist) => {
        const total = hist.reduce((a, b) => a + b, 0);
        let entropy = 0;
        for (let count of hist) {
          if (count > 0) {
            const p = count / total;
            entropy -= p * Math.log2(p);
          }
        }
        return entropy;
      };

      const entropyR = calcEntropy(histR);
      const entropyG = calcEntropy(histG);
      const entropyB = calcEntropy(histB);
      const avgEntropy = (entropyR + entropyG + entropyB) / 3;

      this.colorHistogramHistory.push(avgEntropy);
      if (this.colorHistogramHistory.length > this.MAX_HISTORY) {
        this.colorHistogramHistory.shift();
      }

      // Video/ảnh đã edit: entropy < 6.0 (color grading, filter)
      // Webcam thật: entropy > 6.5 (nhiều loạn tự nhiên)
      if (avgEntropy < 6.0) return 0.2;
      if (avgEntropy < 6.5) return 0.5;
      return 1.0;
    } catch (err) {
      return 0.5;
    }
  }

  /**
   * 8. Face Position Stability (phát hiện video cố định)
   */
  checkFacePositionStability(faceBox) {
    const centerX = faceBox.x + faceBox.width / 2;
    const centerY = faceBox.y + faceBox.height / 2;

    this.facePositionHistory.push({ x: centerX, y: centerY });
    if (this.facePositionHistory.length > this.MAX_HISTORY) {
      this.facePositionHistory.shift();
    }

    if (this.facePositionHistory.length < 5) return 1.0; // Pass ban đầu

    const avgX = this.facePositionHistory.reduce((sum, p) => sum + p.x, 0) / this.facePositionHistory.length;
    const avgY = this.facePositionHistory.reduce((sum, p) => sum + p.y, 0) / this.facePositionHistory.length;

    const varianceX = this.facePositionHistory.reduce((sum, p) => sum + Math.pow(p.x - avgX, 2), 0) / this.facePositionHistory.length;
    const varianceY = this.facePositionHistory.reduce((sum, p) => sum + Math.pow(p.y - avgY, 2), 0) / this.facePositionHistory.length;

    const totalVariance = Math.sqrt(varianceX + varianceY);

    // Video/ảnh cố định: variance < 8px
    // Người thật: variance > 20px (di chuyển tự nhiên)
    if (totalVariance < 8) return 0.0;  // Chắc chắn video/ảnh
    if (totalVariance < 20) return 0.3; // Nghi ngờ
    return 1.0;
  }

  /**
   * 9. Pixel Noise Analysis (phát hiện video nén/ảnh)
   */
  checkPixelNoise(videoElement, faceBox) {
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

      // Tính high-frequency noise (nhiễu tự nhiên của camera)
      let noiseSum = 0;
      const width = 64;

      for (let i = 4; i < data.length - 4; i += 4) {
        const current = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const prev = (data[i - 4] + data[i - 3] + data[i - 2]) / 3;
        const diff = Math.abs(current - prev);
        if (diff > 0 && diff < 10) noiseSum += diff; // Chỉ đếm noise nhỏ
      }

      const avgNoise = noiseSum / (data.length / 4);

      this.pixelNoiseHistory.push(avgNoise);
      if (this.pixelNoiseHistory.length > this.MAX_HISTORY) {
        this.pixelNoiseHistory.shift();
      }

      // Video nén/ảnh: noise < 0.5 (mịn, không có noise)
      // Webcam thật: noise > 1.5 (có sensor noise)
      if (avgNoise < 0.5) return 0.2;
      if (avgNoise < 1.5) return 0.5;
      return 1.0;
    } catch (err) {
      return 0.5;
    }
  }

  /**
   * 10. Compression Artifacts (phát hiện video đã nén)
   */
  checkCompressionArtifacts(videoElement, faceBox) {
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

      // Phát hiện blocking artifacts (8x8 blocks của JPEG/H.264)
      let blockingScore = 0;
      const width = 64;

      // Kiểm tra biên 8x8 blocks
      for (let y = 8; y < 64; y += 8) {
        for (let x = 0; x < 64; x++) {
          const idx = (y * width + x) * 4;
          const idxAbove = ((y - 1) * width + x) * 4;

          const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const above = (data[idxAbove] + data[idxAbove + 1] + data[idxAbove + 2]) / 3;
          const diff = Math.abs(current - above);

          if (diff > 10) blockingScore++; // Phát hiện biên block
        }
      }

      const blockingDensity = blockingScore / 64;

      // Video đã nén: blocking > 0.3
      // Webcam thật: blocking < 0.15
      if (blockingDensity > 0.3) return 0.2;
      if (blockingDensity > 0.15) return 0.5;
      return 1.0;
    } catch (err) {
      return 0.5;
    }
  }

  /**
   * 11. Blink Detection (phát hiện nháy mắt)
   */
  checkBlinkPattern(landmarks) {
    if (!landmarks || !landmarks.positions) return 0.5;

    const positions = landmarks.positions;
    const leftEyeTop = positions[37];
    const leftEyeBottom = positions[41];
    const rightEyeTop = positions[43];
    const rightEyeBottom = positions[47];

    const leftEyeHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
    const rightEyeHeight = Math.abs(rightEyeTop.y - rightEyeBottom.y);
    const avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2;

    this.eyeAspectRatioHistory.push(avgEyeHeight);
    if (this.eyeAspectRatioHistory.length > this.MAX_HISTORY) {
      this.eyeAspectRatioHistory.shift();
    }

    if (this.eyeAspectRatioHistory.length < 20) return 0.5;

    // Phát hiện nháy mắt (eye height giảm đột ngột)
    let blinkCount = 0;
    for (let i = 1; i < this.eyeAspectRatioHistory.length; i++) {
      const prev = this.eyeAspectRatioHistory[i - 1];
      const curr = this.eyeAspectRatioHistory[i];
      if (prev > 5 && curr < 3) blinkCount++; // Mắt đóng
    }

    // Video/ảnh: không nháy mắt (0 blinks)
    // Người thật: nháy 1-3 lần trong 30 frames
    if (blinkCount === 0) return 0.3;
    if (blinkCount > 5) return 0.4; // Nháy quá nhiều cũng nghi ngờ
    return 1.0;
  }

  /**
   * 12. Face Angle Variation (phát hiện góc khuôn mặt)
   */
  checkFaceAngleVariation(landmarks) {
    if (!landmarks || !landmarks.positions) return 0.5;

    const positions = landmarks.positions;
    const nose = positions[30];
    const leftEye = positions[36];
    const rightEye = positions[45];

    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const angle = Math.atan2(nose.y - leftEye.y, nose.x - eyeCenterX) * (180 / Math.PI);

    this.faceAngleHistory.push(angle);
    if (this.faceAngleHistory.length > this.MAX_HISTORY) {
      this.faceAngleHistory.shift();
    }

    if (this.faceAngleHistory.length < 10) return 0.5;

    const variance = this.faceAngleHistory.reduce((sum, a) => {
      const avg = this.faceAngleHistory.reduce((s, v) => s + v, 0) / this.faceAngleHistory.length;
      return sum + Math.pow(a - avg, 2);
    }, 0) / this.faceAngleHistory.length;

    // Video/ảnh: variance < 5 (góc cố định)
    // Người thật: variance > 15 (góc thay đổi)
    if (variance < 5) return 0.2;
    if (variance < 15) return 0.5;
    return 1.0;
  }

  /**
   * 13. Skin Tone Consistency (màu da)
   */
  checkSkinToneConsistency(videoElement, faceBox) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0.5;

    canvas.width = 32;
    canvas.height = 32;

    try {
      ctx.drawImage(videoElement, faceBox.x, faceBox.y, faceBox.width, faceBox.height, 0, 0, 32, 32);
      const imageData = ctx.getImageData(0, 0, 32, 32);
      const data = imageData.data;

      let rSum = 0, gSum = 0, bSum = 0;
      for (let i = 0; i < data.length; i += 4) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
      }

      const pixels = data.length / 4;
      const avgR = rSum / pixels;
      const avgG = gSum / pixels;
      const avgB = bSum / pixels;

      this.skinToneHistory.push({ r: avgR, g: avgG, b: avgB });
      if (this.skinToneHistory.length > this.MAX_HISTORY) {
        this.skinToneHistory.shift();
      }

      if (this.skinToneHistory.length < 10) return 0.5;

      // Kiểm tra màu da tự nhiên: R > G > B
      const isNaturalSkin = avgR > avgG && avgG > avgB && avgR > 95 && avgR < 255;
      if (!isNaturalSkin) return 0.3;

      return 1.0;
    } catch (err) {
      return 0.5;
    }
  }

  /**
   * 14. Sharpness Analysis
   */
  checkSharpness(videoElement, faceBox) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0.5;

    canvas.width = 64;
    canvas.height = 64;

    try {
      ctx.drawImage(videoElement, faceBox.x, faceBox.y, faceBox.width, faceBox.height, 0, 0, 64, 64);
      const imageData = ctx.getImageData(0, 0, 64, 64);
      const data = imageData.data;

      let sharpnessSum = 0;
      const width = 64;

      for (let y = 1; y < 63; y++) {
        for (let x = 1; x < 63; x++) {
          const idx = (y * width + x) * 4;
          const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
          const bottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;

          const gradX = Math.abs(right - center);
          const gradY = Math.abs(bottom - center);
          sharpnessSum += Math.sqrt(gradX * gradX + gradY * gradY);
        }
      }

      const avgSharpness = sharpnessSum / (62 * 62);

      this.sharpnessHistory.push(avgSharpness);
      if (this.sharpnessHistory.length > this.MAX_HISTORY) {
        this.sharpnessHistory.shift();
      }

      // Ảnh quá sắc: sharpness > 25
      // Webcam thật: sharpness 10-20
      if (avgSharpness > 25) return 0.3;
      if (avgSharpness < 8) return 0.4;
      return 1.0;
    } catch (err) {
      return 0.5;
    }
  }

  /**
   * 15. Contrast Analysis
   */
  checkContrast(videoElement, faceBox) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0.5;

    canvas.width = 32;
    canvas.height = 32;

    try {
      ctx.drawImage(videoElement, faceBox.x, faceBox.y, faceBox.width, faceBox.height, 0, 0, 32, 32);
      const imageData = ctx.getImageData(0, 0, 32, 32);
      const data = imageData.data;

      let min = 255, max = 0;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness < min) min = brightness;
        if (brightness > max) max = brightness;
      }

      const contrast = max - min;

      this.contrastHistory.push(contrast);
      if (this.contrastHistory.length > this.MAX_HISTORY) {
        this.contrastHistory.shift();
      }

      // Contrast quá cao: > 200 (edit)
      // Webcam thật: 80-180
      if (contrast > 200) return 0.3;
      if (contrast < 60) return 0.4;
      return 1.0;
    } catch (err) {
      return 0.5;
    }
  }

  /**
   * 16. Saturation Analysis
   */
  checkSaturation(videoElement, faceBox) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0.5;

    canvas.width = 32;
    canvas.height = 32;

    try {
      ctx.drawImage(videoElement, faceBox.x, faceBox.y, faceBox.width, faceBox.height, 0, 0, 32, 32);
      const imageData = ctx.getImageData(0, 0, 32, 32);
      const data = imageData.data;

      let satSum = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;
        satSum += sat;
      }

      const avgSat = satSum / (data.length / 4);

      this.saturationHistory.push(avgSat);
      if (this.saturationHistory.length > this.MAX_HISTORY) {
        this.saturationHistory.shift();
      }

      // Saturation quá cao: > 0.6 (filter)
      // Webcam thật: 0.2-0.5
      if (avgSat > 0.6) return 0.3;
      if (avgSat < 0.15) return 0.4;
      return 1.0;
    } catch (err) {
      return 0.5;
    }
  }

  /**
   * 17. Chromatic Aberration (lỗi quang học màn hình)
   */
  checkChromaticAberration(videoElement, faceBox) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0.5;

    canvas.width = 64;
    canvas.height = 64;

    try {
      ctx.drawImage(videoElement, faceBox.x, faceBox.y, faceBox.width, faceBox.height, 0, 0, 64, 64);
      const imageData = ctx.getImageData(0, 0, 64, 64);
      const data = imageData.data;

      let aberrationCount = 0;
      for (let i = 0; i < data.length - 4; i += 4) {
        const rDiff = Math.abs(data[i] - data[i + 4]);
        const gDiff = Math.abs(data[i + 1] - data[i + 5]);
        const bDiff = Math.abs(data[i + 2] - data[i + 6]);

        // Phát hiện color fringing
        if (Math.abs(rDiff - gDiff) > 20 || Math.abs(gDiff - bDiff) > 20) {
          aberrationCount++;
        }
      }

      const aberrationRatio = aberrationCount / (data.length / 4);

      // Màn hình: aberration > 0.1
      // Webcam thật: aberration < 0.05
      if (aberrationRatio > 0.1) return 0.3;
      if (aberrationRatio > 0.05) return 0.5;
      return 1.0;
    } catch (err) {
      return 0.5;
    }
  }

  /**
   * 18. Depth Cues (chiều sâu 3D)
   */
  checkDepthCues(videoElement, faceBox) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0.5;

    canvas.width = 64;
    canvas.height = 64;

    try {
      ctx.drawImage(videoElement, faceBox.x, faceBox.y, faceBox.width, faceBox.height, 0, 0, 64, 64);
      const imageData = ctx.getImageData(0, 0, 64, 64);
      const data = imageData.data;

      // Tính gradient theo chiều dọc (depth cue)
      let depthGradient = 0;
      const width = 64;

      for (let y = 0; y < 32; y++) {
        let topBrightness = 0, bottomBrightness = 0;
        for (let x = 0; x < 64; x++) {
          const topIdx = (y * width + x) * 4;
          const bottomIdx = ((63 - y) * width + x) * 4;
          topBrightness += (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3;
          bottomBrightness += (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;
        }
        depthGradient += Math.abs(topBrightness - bottomBrightness);
      }

      depthGradient /= 32;

      // 2D image/screen: gradient < 100
      // 3D face: gradient > 200
      if (depthGradient < 100) return 0.3;
      if (depthGradient < 200) return 0.5;
      return 1.0;
    } catch (err) {
      return 0.5;
    }
  }

  /**
   * 19. Temporal Consistency (phát hiện video loop)
   */
  checkTemporalConsistency(videoElement, faceBox) {
    // Đơn giản: kiểm tra xem có pattern lặp lại không
    if (this.frameCount < 60) return 0.5;

    // Nếu tất cả các metrics khác quá ổn định → nghi ngờ loop
    const allStable = 
      this.faceSizeHistory.length > 20 &&
      this.brightnessHistory.length > 20 &&
      this.frameTimeHistory.length > 20;

    if (!allStable) return 0.5;

    // Tính variance tổng hợp
    const calcCV = (arr) => {
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      const variance = arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length;
      return Math.sqrt(variance) / avg;
    };

    const sizeCV = calcCV(this.faceSizeHistory.slice(-20));
    const brightCV = calcCV(this.brightnessHistory.slice(-20));

    // Video loop: tất cả CV < 0.02
    if (sizeCV < 0.02 && brightCV < 0.02) return 0.2;
    return 1.0;
  }

  /**
   * 20. Eye Gaze Direction (hướng nhìn)
   */
  checkEyeGazeDirection(landmarks) {
    if (!landmarks || !landmarks.positions) return 0.5;

    const positions = landmarks.positions;
    const leftEye = positions[36];
    const rightEye = positions[45];
    const nose = positions[30];

    // Tính hướng nhìn dựa vào vị trí mắt và mũi
    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const gazeOffset = Math.abs(nose.x - eyeCenterX);

    // Video ghi sẵn: mắt không nhìn thẳng (offset > 20)
    // Người thật: nhìn camera (offset < 15)
    if (gazeOffset > 20) return 0.4;
    if (gazeOffset > 15) return 0.6;
    return 1.0;
  }

  /**
   * 11. Session Duration Check
   */
  checkSessionDuration() {
    if (this.sessionStartTime === 0) {
      this.sessionStartTime = performance.now();
      return 0.5;
    }

    const duration = (performance.now() - this.sessionStartTime) / 1000; // seconds

    // console.log('  ⏰ Duration: ' + duration.toFixed(1) + 's, frameCount=' + this.frameCount);

    // Video loop ngắn: < 6s
    if (duration < 6 && this.frameCount > 80) return 0.1;  // Chắc chắn là video loop
    if (duration < 4) return 0.4;  // Nghi ngờ nhẹ
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
    this.colorHistogramHistory = [];
    this.facePositionHistory = [];
    this.pixelNoiseHistory = [];
    this.compressionArtifactScore = 0;
    this.blinkHistory = [];
    this.eyeAspectRatioHistory = [];
    this.faceAngleHistory = [];
    this.skinToneHistory = [];
    this.sharpnessHistory = [];
    this.contrastHistory = [];
    this.saturationHistory = [];
    this.chromaticAberrationScore = 0;
    this.depthCueScore = 0;
    this.temporalConsistencyScore = 0;
  }
}

export default new AntiSpoofingService();
