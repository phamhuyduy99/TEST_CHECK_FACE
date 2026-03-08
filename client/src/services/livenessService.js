import * as faceplugin from 'faceplugin-face-recognition-js';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

class LivenessService {
  constructor() {
    this.livenessSession = null;
    this.isLoaded = false;
    this.offscreenCanvas = null;
    this.lastResult = { isReal: false, confidence: 0 };
    this.resultCache = new Map();
    this.faceMeshModel = null;
    this.previousLandmarks = null;
    this.blinkCount = 0;
    this.lastBlinkTime = 0;
  }

  async loadModels() {
    if (this.isLoaded) return;
    try {
      console.log('🔄 Loading TensorFlow.js FaceMesh...');
      this.faceMeshModel = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1,
        }
      );
      console.log('✅ FaceMesh loaded successfully');
    } catch (err) {
      console.warn('⚠️ FaceMesh load failed, using heuristic only:', err);
    }
    this.offscreenCanvas = document.createElement('canvas');
    this.isLoaded = true;
  }

  // Resize canvas để giảm tải xử lý (640x480 thay vì 1280x720)
  resizeCanvas(sourceCanvas, targetWidth = 640) {
    if (!this.offscreenCanvas) return sourceCanvas;

    const aspectRatio = sourceCanvas.height / sourceCanvas.width;
    const targetHeight = Math.floor(targetWidth * aspectRatio);

    this.offscreenCanvas.width = targetWidth;
    this.offscreenCanvas.height = targetHeight;

    const ctx = this.offscreenCanvas.getContext('2d', {
      alpha: false,
      willReadFrequently: true,
    });

    if (ctx) {
      ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
    }

    return this.offscreenCanvas;
  }

  // Scale bbox theo tỉ lệ resize
  scaleBbox(bbox, originalWidth, targetWidth) {
    const scale = targetWidth / originalWidth;
    return {
      x: Math.floor(bbox.x * scale),
      y: Math.floor(bbox.y * scale),
      width: Math.floor(bbox.width * scale),
      height: Math.floor(bbox.height * scale),
    };
  }

  // Kiểm tra liveness - Chỉ dùng heuristic (không dùng FaceMesh để tránh conflict)
  async checkLiveness(canvas, faceBbox, originalWidth) {
    if (!this.isLoaded) await this.loadModels();
    if (!faceBbox) return this.lastResult;

    return this.heuristicLiveness(canvas, faceBbox);
  }

  // Detect motion between frames - Anti-static image
  detectMotion(landmarks) {
    if (!this.previousLandmarks) {
      this.previousLandmarks = landmarks;
      return 0.5;
    }

    let totalMovement = 0;
    const samplePoints = [33, 133, 362, 263, 1, 61, 291];

    samplePoints.forEach(idx => {
      if (landmarks[idx] && this.previousLandmarks[idx]) {
        const dx = landmarks[idx].x - this.previousLandmarks[idx].x;
        const dy = landmarks[idx].y - this.previousLandmarks[idx].y;
        totalMovement += Math.sqrt(dx * dx + dy * dy);
      }
    });

    this.previousLandmarks = landmarks;

    const avgMovement = totalMovement / samplePoints.length;
    
    // Anti-static: Real person has 2-10px natural movement
    if (avgMovement < 0.5) return 0.0; // Static image/print
    if (avgMovement > 20) return 0.3; // Too much movement (suspicious)
    
    return Math.min(1.0, avgMovement / 5);
  }

  // Detect eye blink
  detectBlink(landmarks) {
    const leftEyeTop = landmarks[159];
    const leftEyeBottom = landmarks[145];
    const rightEyeTop = landmarks[386];
    const rightEyeBottom = landmarks[374];

    if (!leftEyeTop || !leftEyeBottom || !rightEyeTop || !rightEyeBottom) {
      return 0.5;
    }

    const leftEyeHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
    const rightEyeHeight = Math.abs(rightEyeTop.y - rightEyeBottom.y);
    const avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2;

    const now = Date.now();
    if (avgEyeHeight < 3 && now - this.lastBlinkTime > 300) {
      this.blinkCount++;
      this.lastBlinkTime = now;
      console.log('👁️ Blink detected! Count:', this.blinkCount);
    }

    return Math.min(1.0, this.blinkCount / 3);
  }

  // Detect 3D depth (real face has depth)
  detect3DDepth(landmarks) {
    const noseTip = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    if (!noseTip || !leftCheek || !rightCheek) return 0.5;

    const faceWidth = Math.abs(leftCheek.x - rightCheek.x);
    const noseProtrusion = Math.abs(noseTip.z || 0);

    const depthRatio = noseProtrusion / (faceWidth + 1);
    return Math.min(1.0, depthRatio * 10);
  }

  // Fallback: heuristic-based liveness detection with LBP-like texture analysis
  heuristicLiveness(canvas, faceBbox) {
    try {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(faceBbox.x, faceBbox.y, faceBbox.width, faceBbox.height);
      const data = imageData.data;

      let brightness = 0;
      let variance = 0;
      const pixelCount = data.length / 4;

      // Calculate brightness
      for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        brightness += gray;
      }
      brightness /= pixelCount;

      // Calculate variance (texture complexity)
      for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        variance += Math.pow(gray - brightness, 2);
      }
      variance /= pixelCount;

      // Real face: high variance (>1500), natural brightness (50-200)
      // Print/screen: low variance (<800), uniform brightness
      const isReal = variance > 1500 && brightness > 50 && brightness < 200;
      const confidence = Math.min(0.95, variance / 2000);

      return { isReal, confidence };
    } catch (err) {
      return { isReal: false, confidence: 0.0 };
    }
  }

  clearCache() {
    this.resultCache.clear();
    this.previousLandmarks = null;
    this.blinkCount = 0;
  }
}

export default new LivenessService();
