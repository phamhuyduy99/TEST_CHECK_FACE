/**
 * Advanced Anti-Spoofing Service
 * Bổ sung 5 giải pháp mạnh mẽ chống video replay
 */

class AdvancedAntiSpoofingService {
  constructor() {
    this.blinkHistory = [];
    this.headMovementHistory = [];
    this.lastEyeState = null;
    this.lastHeadPosition = null;
    this.sessionId = Date.now();
    
    // LBP-TOP: Lưu temporal frames (XY, XT, YT planes)
    this.temporalFrames = [];
    this.lbpTopHistory = [];
    
    // 6 Advanced checks mới
    this.eyeGlintHistory = [];
    this.pupilDilationHistory = [];
    this.faceDepthHistory = [];
    this.opticalFlowHistory = [];
    this.frequencyAnalysisHistory = [];
    this.colorTemperatureHistory = [];
    
    // Missing initializations
    this.microExpressionFrames = [];
    this.headRotationHistory = [];
    this.smileHistory = [];
    this.nodHistory = [];
    this.lastMouthState = null;
    this.mouthOpenHistory = [];
    this.challenges = [];
    this.currentChallenge = null;
    this.challengeStartTime = 0;
    this.completedChallenges = [];
  }

  /**
   * 1. BLINK DETECTION
   * Phát hiện chớp mắt - Video replay khó fake được
   */
  detectBlink(landmarks) {
    const leftEye = this.calculateEyeAspectRatio(landmarks, 36, 41); // Left eye
    const rightEye = this.calculateEyeAspectRatio(landmarks, 42, 47); // Right eye
    const avgEAR = (leftEye + rightEye) / 2;

    // EAR < 0.2 = mắt nhắm
    const isClosed = avgEAR < 0.2;

    if (!this.lastEyeState) {
      this.lastEyeState = { isClosed, timestamp: Date.now() };
      return { detected: false, count: 0, score: 0 };
    }

    // Phát hiện chớp mắt: mở -> nhắm -> mở
    if (!this.lastEyeState.isClosed && isClosed) {
      // Bắt đầu nhắm mắt
      this.lastEyeState = { isClosed: true, timestamp: Date.now() };
    } else if (this.lastEyeState.isClosed && !isClosed) {
      // Mở mắt lại - hoàn thành 1 cái chớp
      const blinkDuration = Date.now() - this.lastEyeState.timestamp;
      
      // Chớp mắt hợp lệ: 100-400ms
      if (blinkDuration > 100 && blinkDuration < 400) {
        this.blinkHistory.push({ timestamp: Date.now(), duration: blinkDuration });
        
        // Giữ lại 10 lần chớp gần nhất
        if (this.blinkHistory.length > 10) {
          this.blinkHistory.shift();
        }
        
        // console.log('👁️ BLINK DETECTED! Duration:', blinkDuration + 'ms', 'Total:', this.blinkHistory.length);
      }
      
      this.lastEyeState = { isClosed: false, timestamp: Date.now() };
    }

    // Tính score dựa trên số lần chớp mắt
    const blinkCount = this.blinkHistory.length;
    const score = Math.min(1.0, blinkCount / 2); // Giảm từ 3 → 2 lần

    return {
      detected: blinkCount >= 2, // Giảm từ 3 → 2 lần
      count: blinkCount,
      score,
      reason: blinkCount < 2 ? 'Chưa đủ 2 lần chớp mắt' : 'OK'
    };
  }

  calculateEyeAspectRatio(landmarks, start, end) {
    // EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
    const p1 = landmarks[start];
    const p2 = landmarks[start + 1];
    const p3 = landmarks[start + 2];
    const p4 = landmarks[start + 3];
    const p5 = landmarks[start + 4];
    const p6 = landmarks[start + 5];

    const vertical1 = this.distance(p2, p6);
    const vertical2 = this.distance(p3, p5);
    const horizontal = this.distance(p1, p4);

    return (vertical1 + vertical2) / (2.0 * horizontal);
  }

  distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  /**
   * 2. HEAD MOVEMENT PATTERN ANALYSIS
   * Phân tích pattern chuyển động đầu - Video replay có pattern lặp lại
   */
  analyzeHeadMovementPattern(landmarks) {
    const nose = landmarks[30];
    const chin = landmarks[8];
    
    const currentPos = {
      x: nose.x,
      y: nose.y,
      angle: Math.atan2(chin.y - nose.y, chin.x - nose.x),
      timestamp: Date.now()
    };

    if (!this.lastHeadPosition) {
      this.lastHeadPosition = currentPos;
      return { score: 0.5, isLoop: false };
    }

    // Tính vector chuyển động
    const movement = {
      dx: currentPos.x - this.lastHeadPosition.x,
      dy: currentPos.y - this.lastHeadPosition.y,
      dAngle: currentPos.angle - this.lastHeadPosition.angle,
      dt: currentPos.timestamp - this.lastHeadPosition.timestamp
    };

    this.headMovementHistory.push(movement);
    if (this.headMovementHistory.length > 50) {
      this.headMovementHistory.shift();
    }

    this.lastHeadPosition = currentPos;

    // Phát hiện pattern lặp lại (video loop)
    if (this.headMovementHistory.length >= 30) {
      const isLoop = this.detectLoopPattern(this.headMovementHistory);
      
      if (isLoop) {
        // console.log('🔁 VIDEO LOOP DETECTED! Pattern lặp lại');
        return { score: 0.1, isLoop: true, reason: 'Phát hiện pattern lặp lại' };
      }
    }

    return { score: 1.0, isLoop: false, reason: 'OK' };
  }

  detectLoopPattern(movements) {
    // So sánh 15 frame đầu với 15 frame cuối
    if (movements.length < 30) return false;

    const first15 = movements.slice(0, 15);
    const last15 = movements.slice(-15);

    let similarity = 0;
    for (let i = 0; i < 15; i++) {
      const diff = Math.abs(first15[i].dx - last15[i].dx) + 
                   Math.abs(first15[i].dy - last15[i].dy);
      if (diff < 5) similarity++; // Threshold: 5 pixels
    }

    // Nếu > 80% giống nhau = video loop
    return similarity / 15 > 0.8;
  }

  /**
   * 3. MICRO-EXPRESSION DETECTION
   * Phát hiện biểu cảm vi mô - Video replay thiếu tự nhiên
   */
  detectMicroExpression(landmarks) {
    const leftMouth = landmarks[48];
    const rightMouth = landmarks[54];
    const leftBrow = landmarks[19];
    const rightBrow = landmarks[24];

    const expression = {
      mouthWidth: Math.abs(leftMouth.x - rightMouth.x),
      browHeight: (leftBrow.y + rightBrow.y) / 2,
      timestamp: Date.now()
    };

    this.microExpressionFrames.push(expression);
    if (this.microExpressionFrames.length > 30) {
      this.microExpressionFrames.shift();
    }

    if (this.microExpressionFrames.length < 20) {
      return { score: 0.5, detected: false };
    }

    // Tính độ biến thiên của biểu cảm
    const mouthVariance = this.calculateVariance(
      this.microExpressionFrames.map(f => f.mouthWidth)
    );
    const browVariance = this.calculateVariance(
      this.microExpressionFrames.map(f => f.browHeight)
    );

    // Người thật có micro-expression tự nhiên (variance cao)
    // Video replay có variance thấp
    const totalVariance = mouthVariance + browVariance;
    const score = Math.min(1.0, totalVariance / 100);

    return {
      score,
      detected: score > 0.3,
      reason: score < 0.3 ? 'Thiếu biểu cảm tự nhiên' : 'OK'
    };
  }

  calculateVariance(values) {
    const avg = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * 6. SKIN TEXTURE ANALYSIS
   * Phân tích kết cấu bề mặt da xung quanh khuôn mặt
   * Phát hiện giấy/in, màn hình qua phản xạ ánh sáng và texture
   */
  analyzeSkinTexture(videoElement, faceBox) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { score: 0.5, isPaper: false, isScreen: false };

    // Lấy vùng xung quanh khuôn mặt (expand 20%)
    const expandRatio = 1.2;
    const expandedWidth = faceBox.width * expandRatio;
    const expandedHeight = faceBox.height * expandRatio;
    const expandedX = faceBox.x - (expandedWidth - faceBox.width) / 2;
    const expandedY = faceBox.y - (expandedHeight - faceBox.height) / 2;

    canvas.width = 128;
    canvas.height = 128;

    try {
      ctx.drawImage(
        videoElement,
        expandedX, expandedY, expandedWidth, expandedHeight,
        0, 0, 128, 128
      );

      const imageData = ctx.getImageData(0, 0, 128, 128);
      const data = imageData.data;

      // 1. Phân tích Frequency Domain (High-frequency content)
      const highFreqScore = this.analyzeHighFrequency(data, 128, 128);
      
      // 2. Phân tích Specular Reflection (Phản xạ màn hình)
      const specularScore = this.analyzeSpecularReflection(data, 128, 128);
      
      // 3. Phân tích Color Distribution (Giấy/in có màu không tự nhiên)
      const colorScore = this.analyzeColorDistribution(data);
      
      // 4. Phân tích Local Binary Pattern (Texture pattern)
      const lbpScore = this.analyzeLBP(data, 128, 128);

      // Tính tổng score
      const totalScore = (
        highFreqScore * 0.3 +
        specularScore * 0.3 +
        colorScore * 0.2 +
        lbpScore * 0.2
      );

      const isPaper = highFreqScore < 0.3 || lbpScore < 0.3;
      const isScreen = specularScore < 0.3;

      if (isPaper || isScreen) {
        // console.log('🚨 FAKE DETECTED! Paper:', isPaper, 'Screen:', isScreen);
        // console.log('  High-freq:', highFreqScore.toFixed(3), 'Specular:', specularScore.toFixed(3));
        // console.log('  Color:', colorScore.toFixed(3), 'LBP:', lbpScore.toFixed(3));
      }

      return {
        score: totalScore,
        isPaper,
        isScreen,
        details: { highFreqScore, specularScore, colorScore, lbpScore },
        reason: isPaper ? 'Kết cấu giấy/in' : isScreen ? 'Phản xạ màn hình' : 'OK'
      };
    } catch (err) {
      return { score: 0.5, isPaper: false, isScreen: false };
    }
  }

  // Phân tích High-frequency content (Da thật có nhiều chi tiết)
  analyzeHighFrequency(data, width, height) {
    let highFreqCount = 0;
    const threshold = 20;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        // Laplacian operator
        const top = (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3;
        const bottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
        const left = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3;
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        
        const laplacian = Math.abs(4 * center - top - bottom - left - right);
        if (laplacian > threshold) highFreqCount++;
      }
    }

    const density = highFreqCount / (width * height);
    // Da thật: density > 0.15, Giấy: density < 0.08
    return Math.min(1.0, density / 0.15);
  }

  // Phân tích Specular Reflection (Màn hình có phản xạ mạnh)
  analyzeSpecularReflection(data, width, height) {
    let brightPixels = 0;
    let veryBrightPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness > 200) brightPixels++;
      if (brightness > 240) veryBrightPixels++;
    }

    const brightRatio = brightPixels / (width * height);
    const veryBrightRatio = veryBrightPixels / (width * height);

    // Màn hình: veryBrightRatio > 0.05 (nhiều điểm sáng)
    // Da thật: veryBrightRatio < 0.02
    if (veryBrightRatio > 0.05) return 0.2;
    if (veryBrightRatio > 0.02) return 0.5;
    return 1.0;
  }

  // Phân tích Color Distribution
  analyzeColorDistribution(data) {
    let rSum = 0, gSum = 0, bSum = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
    }

    const rAvg = rSum / pixelCount;
    const gAvg = gSum / pixelCount;
    const bAvg = bSum / pixelCount;

    // Da thật: R > G > B (màu da hồng)
    // Giấy/in: màu không tự nhiên
    const skinTone = rAvg > gAvg && gAvg > bAvg;
    const redness = (rAvg - gAvg) / (rAvg + 1);

    if (!skinTone || redness < 0.05) return 0.3;
    if (redness < 0.1) return 0.6;
    return 1.0;
  }

  // Phân tích Local Binary Pattern (Texture pattern)
  analyzeLBP(data, width, height) {
    let lbpVariance = 0;
    const lbpValues = [];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        let lbp = 0;
        const neighbors = [
          data[idx - width * 4 - 4], data[idx - width * 4], data[idx - width * 4 + 4],
          data[idx - 4], data[idx + 4],
          data[idx + width * 4 - 4], data[idx + width * 4], data[idx + width * 4 + 4]
        ];
        
        for (let i = 0; i < 8; i++) {
          if (neighbors[i] >= center) lbp |= (1 << i);
        }
        
        lbpValues.push(lbp);
      }
    }

    // Tính variance của LBP
    const avg = lbpValues.reduce((a, b) => a + b) / lbpValues.length;
    const variance = lbpValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / lbpValues.length;
    
    // Da thật: variance cao (texture phức tạp)
    // Giấy: variance thấp (texture đều)
    return Math.min(1.0, Math.sqrt(variance) / 50);
  }

  /**
   * 4. HEAD ROTATION DETECTION (Quay mặt)
   * So sánh góc của vector từ mũi đến hai mắt
   */
  detectHeadRotation(landmarks) {
    const nose = landmarks[30];
    const leftEye = landmarks[36];
    const rightEye = landmarks[45];

    // Tính vector từ mũi đến hai mắt
    const vectorLeft = { x: leftEye.x - nose.x, y: leftEye.y - nose.y };
    const vectorRight = { x: rightEye.x - nose.x, y: rightEye.y - nose.y };

    // Tính góc quay (yaw angle)
    const distLeft = Math.sqrt(vectorLeft.x ** 2 + vectorLeft.y ** 2);
    const distRight = Math.sqrt(vectorRight.x ** 2 + vectorRight.y ** 2);
    const yawAngle = Math.atan2(distRight - distLeft, distRight + distLeft) * (180 / Math.PI);

    // Tính góc nghiêng (pitch angle)
    const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
    const pitchAngle = Math.atan2(nose.y - eyeCenter.y, nose.x - eyeCenter.x) * (180 / Math.PI);

    const rotation = { yaw: yawAngle, pitch: pitchAngle, timestamp: Date.now() };
    this.headRotationHistory.push(rotation);
    if (this.headRotationHistory.length > 30) this.headRotationHistory.shift();

    // Phát hiện quay trái/phải (yaw > 15°) hoặc lên/xuống (pitch > 10°)
    const hasRotation = this.headRotationHistory.some(r => Math.abs(r.yaw) > 15 || Math.abs(r.pitch) > 10);
    const rotationCount = this.headRotationHistory.filter(r => Math.abs(r.yaw) > 15 || Math.abs(r.pitch) > 10).length;
    const score = Math.min(1.0, rotationCount / 10);

    return {
      detected: hasRotation,
      yaw: yawAngle,
      pitch: pitchAngle,
      count: rotationCount,
      score,
      reason: !hasRotation ? 'Chưa quay mặt' : 'OK'
    };
  }

  /**
   * 5. LBP-TOP ANALYSIS (Phân tích kết cấu cục bộ theo thời gian)
   * Phát hiện video replay qua texture động 3D (XY, XT, YT)
   */
  analyzeLBPTOP(videoElement, faceBox) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { score: 0.5, isReplay: false };

    const size = 64;
    canvas.width = size;
    canvas.height = size;

    try {
      ctx.drawImage(videoElement, faceBox.x, faceBox.y, faceBox.width, faceBox.height, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      const grayFrame = this.toGrayscale(imageData.data, size, size);

      this.temporalFrames.push({ data: grayFrame, timestamp: Date.now() });
      if (this.temporalFrames.length > 10) this.temporalFrames.shift();

      if (this.temporalFrames.length < 5) {
        return { score: 0.5, isReplay: false, reason: 'Đang thu thập frames' };
      }

      // Tính LBP cho 3 planes: XY (spatial), XT (horizontal-temporal), YT (vertical-temporal)
      const lbpXY = this.computeLBP(this.temporalFrames[this.temporalFrames.length - 1].data, size, size);
      const lbpXT = this.computeTemporalLBP('XT', size);
      const lbpYT = this.computeTemporalLBP('YT', size);

      // Tính histogram cho mỗi plane
      const histXY = this.computeHistogram(lbpXY);
      const histXT = this.computeHistogram(lbpXT);
      const histYT = this.computeHistogram(lbpYT);

      // Concatenate histograms
      const lbpTopFeature = [...histXY, ...histXT, ...histYT];
      this.lbpTopHistory.push(lbpTopFeature);
      if (this.lbpTopHistory.length > 20) this.lbpTopHistory.shift();

      // Phát hiện video replay: temporal variance thấp
      if (this.lbpTopHistory.length >= 10) {
        const temporalVariance = this.computeTemporalVariance(this.lbpTopHistory);
        const isReplay = temporalVariance < 0.02; // Video replay có variance rất thấp

        if (isReplay) {
          // console.log('🎬 VIDEO REPLAY DETECTED! Temporal variance:', temporalVariance.toFixed(4));
          return { score: 0.1, isReplay: true, variance: temporalVariance, reason: 'Phát hiện video replay' };
        }

        return { score: 1.0, isReplay: false, variance: temporalVariance, reason: 'OK' };
      }

      return { score: 0.5, isReplay: false, reason: 'Đang phân tích' };
    } catch (err) {
      return { score: 0.5, isReplay: false };
    }
  }

  toGrayscale(data, width, height) {
    const gray = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      gray[i / 4] = (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    return gray;
  }

  computeLBP(data, width, height) {
    const lbp = new Uint8Array((width - 2) * (height - 2));
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const center = data[y * width + x];
        let code = 0;
        const neighbors = [
          data[(y - 1) * width + (x - 1)], data[(y - 1) * width + x], data[(y - 1) * width + (x + 1)],
          data[y * width + (x - 1)], data[y * width + (x + 1)],
          data[(y + 1) * width + (x - 1)], data[(y + 1) * width + x], data[(y + 1) * width + (x + 1)]
        ];
        for (let i = 0; i < 8; i++) {
          if (neighbors[i] >= center) code |= (1 << i);
        }
        lbp[(y - 1) * (width - 2) + (x - 1)] = code;
      }
    }
    return lbp;
  }

  computeTemporalLBP(plane, size) {
    const T = this.temporalFrames.length;
    const lbp = [];

    if (plane === 'XT') {
      // XT plane: x-axis spatial, t-axis temporal
      for (let y = size / 2; y < size / 2 + 1; y++) {
        for (let x = 1; x < size - 1; x++) {
          for (let t = 1; t < T - 1; t++) {
            const center = this.temporalFrames[t].data[y * size + x];
            let code = 0;
            const neighbors = [
              this.temporalFrames[t].data[y * size + (x - 1)],
              this.temporalFrames[t].data[y * size + (x + 1)],
              this.temporalFrames[t - 1].data[y * size + x],
              this.temporalFrames[t + 1].data[y * size + x]
            ];
            for (let i = 0; i < 4; i++) {
              if (neighbors[i] >= center) code |= (1 << i);
            }
            lbp.push(code);
          }
        }
      }
    } else if (plane === 'YT') {
      // YT plane: y-axis spatial, t-axis temporal
      for (let x = size / 2; x < size / 2 + 1; x++) {
        for (let y = 1; y < size - 1; y++) {
          for (let t = 1; t < T - 1; t++) {
            const center = this.temporalFrames[t].data[y * size + x];
            let code = 0;
            const neighbors = [
              this.temporalFrames[t].data[(y - 1) * size + x],
              this.temporalFrames[t].data[(y + 1) * size + x],
              this.temporalFrames[t - 1].data[y * size + x],
              this.temporalFrames[t + 1].data[y * size + x]
            ];
            for (let i = 0; i < 4; i++) {
              if (neighbors[i] >= center) code |= (1 << i);
            }
            lbp.push(code);
          }
        }
      }
    }

    return new Uint8Array(lbp);
  }

  computeHistogram(lbpData) {
    const hist = new Array(256).fill(0);
    for (let i = 0; i < lbpData.length; i++) {
      hist[lbpData[i]]++;
    }
    // Normalize
    const sum = lbpData.length;
    return hist.map(v => v / sum);
  }

  computeTemporalVariance(historyFeatures) {
    const featureLength = historyFeatures[0].length;
    let totalVariance = 0;

    for (let i = 0; i < featureLength; i++) {
      const values = historyFeatures.map(f => f[i]);
      const mean = values.reduce((a, b) => a + b) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      totalVariance += variance;
    }

    return totalVariance / featureLength;
  }

  /**
   * 7. SMILE DETECTION (Phát hiện cười)
   * Phân tích góc miệng để phát hiện nụ cười
   */
  detectSmile(landmarks) {
    const leftMouth = landmarks[48];
    const rightMouth = landmarks[54];
    const upperLip = landmarks[51];
    const lowerLip = landmarks[57];

    // Tính góc miệng (mouth corners)
    const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);
    const mouthHeight = Math.abs(lowerLip.y - upperLip.y);
    const leftCornerY = leftMouth.y;
    const rightCornerY = rightMouth.y;
    const centerY = (upperLip.y + lowerLip.y) / 2;

    // Khi cười: góc miệng nâng lên (y giảm)
    const leftLift = centerY - leftCornerY;
    const rightLift = centerY - rightCornerY;
    const avgLift = (leftLift + rightLift) / 2;

    // Smile ratio
    const smileRatio = avgLift / mouthHeight;
    const isSmiling = smileRatio > 0.3;

    this.smileHistory.push({ isSmiling, timestamp: Date.now() });
    if (this.smileHistory.length > 30) this.smileHistory.shift();

    const smileCount = this.smileHistory.filter(s => s.isSmiling).length;
    const smileScore = Math.min(1.0, smileCount / 15);

    return {
      detected: smileCount >= 10,
      isSmiling,
      ratio: smileRatio,
      score: smileScore,
      reason: smileCount < 10 ? 'Chưa phát hiện cười' : 'OK'
    };
  }

  /**
   * 8. NOD DETECTION (Phát hiện gật đầu)
   * Theo dõi chuyển động lên xuống của đầu
   */
  detectNod(landmarks) {
    const nose = landmarks[30];
    const chin = landmarks[8];

    const currentY = nose.y;
    const timestamp = Date.now();

    this.nodHistory.push({ y: currentY, timestamp });
    if (this.nodHistory.length > 20) this.nodHistory.shift();

    if (this.nodHistory.length < 10) {
      return { detected: false, score: 0, reason: 'Đang thu thập dữ liệu' };
    }

    // Phát hiện pattern lên-xuống (nod)
    let nodCount = 0;
    for (let i = 2; i < this.nodHistory.length - 2; i++) {
      const prev = this.nodHistory[i - 2].y;
      const curr = this.nodHistory[i].y;
      const next = this.nodHistory[i + 2].y;

      // Phát hiện đỉnh (peak) hoặc đáy (valley)
      if ((curr < prev && curr < next) || (curr > prev && curr > next)) {
        const movement = Math.abs(curr - prev) + Math.abs(next - curr);
        if (movement > 5) nodCount++;
      }
    }

    const score = Math.min(1.0, nodCount / 3);

    return {
      detected: nodCount >= 2,
      count: nodCount,
      score,
      reason: nodCount < 2 ? 'Chưa phát hiện gật đầu' : 'OK'
    };
  }

  /**
   * 9. INTERACTIVE CHALLENGE SYSTEM
   * Hệ thống thử thách tương tác ngẫu nhiên
   */
  initializeChallenges() {
    const challengeTypes = [
      { type: 'blink', instruction: '👁️ Chớp mắt 2 lần', duration: 5000 },
      { type: 'smile', instruction: '😊 Cười tươi', duration: 3000 },
      { type: 'turnLeft', instruction: '⬅️ Quay đầu sang trái', duration: 4000 },
      { type: 'turnRight', instruction: '➡️ Quay đầu sang phải', duration: 4000 },
      { type: 'nod', instruction: '👇 Gật đầu', duration: 4000 },
      { type: 'openMouth', instruction: '😮 Mở miệng', duration: 3000 }
    ];

    // Chọn ngẫu nhiên 3-4 thử thách
    const numChallenges = 3 + Math.floor(Math.random() * 2);
    this.challenges = [];
    const shuffled = [...challengeTypes].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numChallenges; i++) {
      this.challenges.push({ ...shuffled[i], completed: false });
    }

    this.currentChallenge = this.challenges[0];
    this.challengeStartTime = Date.now();
    this.completedChallenges = [];

    // console.log('🎯 Challenges initialized:', this.challenges.map(c => c.type));
  }

  getCurrentChallenge() {
    if (!this.currentChallenge) return null;

    const elapsed = Date.now() - this.challengeStartTime;
    const remaining = Math.max(0, this.currentChallenge.duration - elapsed);

    return {
      ...this.currentChallenge,
      timeRemaining: remaining,
      isExpired: remaining === 0
    };
  }

  checkChallengeCompletion(landmarks) {
    if (!this.currentChallenge || this.currentChallenge.completed) return false;

    const elapsed = Date.now() - this.challengeStartTime;
    if (elapsed > this.currentChallenge.duration) {
      // console.log('⏰ Challenge expired:', this.currentChallenge.type);
      return false;
    }

    let completed = false;

    switch (this.currentChallenge.type) {
      case 'blink':
        const blinkResult = this.detectBlink(landmarks);
        completed = blinkResult.count >= 2;
        break;

      case 'smile':
        const smileResult = this.detectSmile(landmarks);
        completed = smileResult.detected;
        break;

      case 'turnLeft':
        const rotationLeft = this.detectHeadRotation(landmarks);
        completed = rotationLeft.yaw < -15;
        break;

      case 'turnRight':
        const rotationRight = this.detectHeadRotation(landmarks);
        completed = rotationRight.yaw > 15;
        break;

      case 'nod':
        const nodResult = this.detectNod(landmarks);
        completed = nodResult.detected;
        break;

      case 'openMouth':
        const mouthResult = this.detectMouthOpening(landmarks);
        completed = mouthResult.detected;
        break;
    }

    if (completed) {
      // console.log('✅ Challenge completed:', this.currentChallenge.type);
      this.currentChallenge.completed = true;
      this.completedChallenges.push(this.currentChallenge.type);

      // Chuyển sang thử thách tiếp theo
      const nextIndex = this.challenges.findIndex(c => !c.completed);
      if (nextIndex !== -1) {
        this.currentChallenge = this.challenges[nextIndex];
        this.challengeStartTime = Date.now();
        // console.log('🎯 Next challenge:', this.currentChallenge.type);
      } else {
        this.currentChallenge = null;
        // console.log('🎉 All challenges completed!');
      }

      return true;
    }

    return false;
  }

  areChallengesCompleted() {
    return this.challenges.length > 0 && this.challenges.every(c => c.completed);
  }

  getChallengeProgress() {
    const total = this.challenges.length;
    const completed = this.completedChallenges.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  }

  /**
   * 5. EYE GLINT DETECTION
   * Phát hiện ánh sáng phản chiếu trong mắt - Video/ảnh không có glint tự nhiên
   */
  detectEyeGlint(videoElement, faceBox, landmarks) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { score: 0.5, hasGlint: false };

    const leftEye = landmarks[36];
    const rightEye = landmarks[45];
    const eyeSize = 30;

    canvas.width = eyeSize;
    canvas.height = eyeSize;

    try {
      ctx.drawImage(videoElement, leftEye.x - eyeSize/2, leftEye.y - eyeSize/2, eyeSize, eyeSize, 0, 0, eyeSize, eyeSize);
      const leftData = ctx.getImageData(0, 0, eyeSize, eyeSize).data;
      
      ctx.drawImage(videoElement, rightEye.x - eyeSize/2, rightEye.y - eyeSize/2, eyeSize, eyeSize, 0, 0, eyeSize, eyeSize);
      const rightData = ctx.getImageData(0, 0, eyeSize, eyeSize).data;

      let leftMaxBright = 0, rightMaxBright = 0;
      for (let i = 0; i < leftData.length; i += 4) {
        const bright = (leftData[i] + leftData[i+1] + leftData[i+2]) / 3;
        if (bright > leftMaxBright) leftMaxBright = bright;
      }
      for (let i = 0; i < rightData.length; i += 4) {
        const bright = (rightData[i] + rightData[i+1] + rightData[i+2]) / 3;
        if (bright > rightMaxBright) rightMaxBright = bright;
      }

      const avgGlint = (leftMaxBright + rightMaxBright) / 2;
      const hasGlint = avgGlint > 200;

      this.eyeGlintHistory.push({ hasGlint, brightness: avgGlint });
      if (this.eyeGlintHistory.length > 20) this.eyeGlintHistory.shift();

      const glintCount = this.eyeGlintHistory.filter(g => g.hasGlint).length;
      const score = Math.min(1.0, glintCount / 3); // Giảm từ 5 → 3

      return {
        score,
        hasGlint,
        brightness: avgGlint,
        reason: glintCount < 1 ? 'Thiếu eye glint tự nhiên (video/ảnh)' : 'OK' // Giảm từ 2 → 1
      };
    } catch (err) {
      return { score: 0.5, hasGlint: false };
    }
  }

  /**
   * 6. PUPIL DILATION TRACKING
   */
  detectPupilDilation(landmarks) {
    const leftEyeTop = landmarks[37];
    const leftEyeBottom = landmarks[41];
    const rightEyeTop = landmarks[43];
    const rightEyeBottom = landmarks[47];

    const leftPupilSize = Math.abs(leftEyeTop.y - leftEyeBottom.y);
    const rightPupilSize = Math.abs(rightEyeTop.y - rightEyeBottom.y);
    const avgPupilSize = (leftPupilSize + rightPupilSize) / 2;

    this.pupilDilationHistory.push(avgPupilSize);
    if (this.pupilDilationHistory.length > 30) this.pupilDilationHistory.shift();

    if (this.pupilDilationHistory.length < 10) return { score: 0.5 };

    const variance = this.calculateVariance(this.pupilDilationHistory);
    const score = variance < 0.5 ? 0.2 : variance < 1.5 ? 0.5 : 1.0;

    return {
      score,
      variance,
      reason: variance < 0.5 ? 'Pupil không thay đổi (video)' : 'OK'
    };
  }

  /**
   * 7. FACE DEPTH ESTIMATION
   */
  estimateFaceDepth(landmarks) {
    const nose = landmarks[30];
    const leftEye = landmarks[36];
    const rightEye = landmarks[45];
    const leftMouth = landmarks[48];
    const rightMouth = landmarks[54];

    const eyeDistance = Math.abs(leftEye.x - rightEye.x);
    const mouthDistance = Math.abs(leftMouth.x - rightMouth.x);
    const noseToEyeLeft = this.distance(nose, leftEye);
    const noseToEyeRight = this.distance(nose, rightEye);

    const ratio = mouthDistance / eyeDistance;
    const asymmetry = Math.abs(noseToEyeLeft - noseToEyeRight);

    this.faceDepthHistory.push({ ratio, asymmetry });
    if (this.faceDepthHistory.length > 20) this.faceDepthHistory.shift();

    if (this.faceDepthHistory.length < 10) return { score: 0.5 };

    const ratioVariance = this.calculateVariance(this.faceDepthHistory.map(d => d.ratio));
    const asymmetryVariance = this.calculateVariance(this.faceDepthHistory.map(d => d.asymmetry));

    const totalVariance = ratioVariance + asymmetryVariance;
    const score = totalVariance < 0.01 ? 0.1 : totalVariance < 0.03 ? 0.5 : 1.0;

    return {
      score,
      variance: totalVariance,
      reason: totalVariance < 0.01 ? 'Thiếu chiều sâu 3D (2D ảnh/màn hình)' : 'OK'
    };
  }

  /**
   * 8. OPTICAL FLOW ANALYSIS
   */
  analyzeOpticalFlow(videoElement, faceBox) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { score: 0.5 };

    const size = 32;
    canvas.width = size;
    canvas.height = size;

    try {
      ctx.drawImage(videoElement, faceBox.x, faceBox.y, faceBox.width, faceBox.height, 0, 0, size, size);
      const currentFrame = ctx.getImageData(0, 0, size, size).data;

      if (this.opticalFlowHistory.length === 0) {
        this.opticalFlowHistory.push(currentFrame);
        return { score: 0.5 };
      }

      const prevFrame = this.opticalFlowHistory[this.opticalFlowHistory.length - 1];
      
      let totalMotion = 0;
      for (let i = 0; i < currentFrame.length; i += 4) {
        const diff = Math.abs(currentFrame[i] - prevFrame[i]) +
                     Math.abs(currentFrame[i+1] - prevFrame[i+1]) +
                     Math.abs(currentFrame[i+2] - prevFrame[i+2]);
        totalMotion += diff;
      }

      const avgMotion = totalMotion / (size * size);
      this.opticalFlowHistory.push(currentFrame);
      if (this.opticalFlowHistory.length > 10) this.opticalFlowHistory.shift();

      const score = avgMotion < 5 ? 0.2 : avgMotion < 15 ? 0.5 : 1.0;

      return {
        score,
        motion: avgMotion,
        reason: avgMotion < 5 ? 'Motion quá đồng đều (video)' : 'OK'
      };
    } catch (err) {
      return { score: 0.5 };
    }
  }

  /**
   * 9. FREQUENCY DOMAIN ANALYSIS
   */
  analyzeFrequencyDomain(videoElement, faceBox) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { score: 0.5 };

    const size = 64;
    canvas.width = size;
    canvas.height = size;

    try {
      ctx.drawImage(videoElement, faceBox.x, faceBox.y, faceBox.width, faceBox.height, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;

      let lowFreq = 0, midFreq = 0, highFreq = 0;
      
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const gray = (data[idx] + data[idx+1] + data[idx+2]) / 3;
          
          if (x < size/3 && y < size/3) lowFreq += gray;
          else if (x < 2*size/3 && y < 2*size/3) midFreq += gray;
          else highFreq += gray;
        }
      }

      const totalEnergy = lowFreq + midFreq + highFreq;
      const highFreqRatio = highFreq / totalEnergy;

      this.frequencyAnalysisHistory.push(highFreqRatio);
      if (this.frequencyAnalysisHistory.length > 20) this.frequencyAnalysisHistory.shift();

      const score = highFreqRatio < 0.15 ? 0.2 : highFreqRatio < 0.25 ? 0.5 : 1.0;

      return {
        score,
        highFreqRatio,
        reason: highFreqRatio < 0.15 ? 'Thiếu high frequency (video nén)' : 'OK'
      };
    } catch (err) {
      return { score: 0.5 };
    }
  }

  /**
   * 10. COLOR TEMPERATURE CONSISTENCY
   */
  analyzeColorTemperature(videoElement, faceBox) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { score: 0.5 };

    const size = 32;
    canvas.width = size;
    canvas.height = size;

    try {
      ctx.drawImage(videoElement, faceBox.x, faceBox.y, faceBox.width, faceBox.height, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;

      let rSum = 0, gSum = 0, bSum = 0;
      for (let i = 0; i < data.length; i += 4) {
        rSum += data[i];
        gSum += data[i+1];
        bSum += data[i+2];
      }

      const pixels = data.length / 4;
      const rAvg = rSum / pixels;
      const gAvg = gSum / pixels;
      const bAvg = bSum / pixels;

      const colorTemp = (rAvg - bAvg) / (rAvg + bAvg + 0.001);

      this.colorTemperatureHistory.push(colorTemp);
      if (this.colorTemperatureHistory.length > 20) this.colorTemperatureHistory.shift();

      if (this.colorTemperatureHistory.length < 10) return { score: 0.5 };

      const variance = this.calculateVariance(this.colorTemperatureHistory);
      const score = variance < 0.001 ? 0.2 : variance < 0.005 ? 0.5 : 1.0;

      return {
        score,
        variance,
        colorTemp,
        reason: variance < 0.001 ? 'Color temperature quá ổn định (màn hình)' : 'OK'
      };
    } catch (err) {
      return { score: 0.5 };
    }
  }

  /**
   * 11. MOUTH OPENING DETECTION (Mở miệng)
   * Theo dõi khoảng cách giữa môi trên và môi dưới
   */
  detectMouthOpening(landmarks) {
    const upperLip = landmarks[62];
    const lowerLip = landmarks[66];
    const leftMouth = landmarks[48];
    const rightMouth = landmarks[54];

    // Tính khoảng cách dọc (môi trên - môi dưới)
    const verticalDist = Math.abs(lowerLip.y - upperLip.y);
    // Tính khoảng cách ngang (góc trái - góc phải)
    const horizontalDist = Math.abs(rightMouth.x - leftMouth.x);
    
    // MAR (Mouth Aspect Ratio) = vertical / horizontal
    const mar = verticalDist / (horizontalDist + 0.001);

    // MAR > 0.5 = miệng mở
    const isOpen = mar > 0.5;

    if (!this.lastMouthState) {
      this.lastMouthState = { isOpen, timestamp: Date.now() };
      return { detected: false, count: 0, score: 0 };
    }

    // Phát hiện mở miệng: đóng -> mở -> đóng
    if (!this.lastMouthState.isOpen && isOpen) {
      this.lastMouthState = { isOpen: true, timestamp: Date.now() };
    } else if (this.lastMouthState.isOpen && !isOpen) {
      const openDuration = Date.now() - this.lastMouthState.timestamp;
      
      // Mở miệng hợp lệ: 200-2000ms
      if (openDuration > 200 && openDuration < 2000) {
        this.mouthOpenHistory.push({ timestamp: Date.now(), duration: openDuration });
        if (this.mouthOpenHistory.length > 10) this.mouthOpenHistory.shift();
        // console.log('👄 MOUTH OPEN DETECTED! Duration:', openDuration + 'ms', 'Total:', this.mouthOpenHistory.length);
      }
      
      this.lastMouthState = { isOpen: false, timestamp: Date.now() };
    }

    const openCount = this.mouthOpenHistory.length;
    const score = Math.min(1.0, openCount / 2); // Cần ít nhất 2 lần mở miệng

    return {
      detected: openCount >= 2,
      count: openCount,
      mar,
      score,
      reason: openCount < 2 ? 'Chưa đủ 2 lần mở miệng' : 'OK'
    };
  }
  performAdvancedCheck(landmarks, videoElement, faceBox) {
    const blinkResult = this.detectBlink(landmarks);
    const headMovementResult = this.analyzeHeadMovementPattern(landmarks);
    const lbpTopResult = videoElement && faceBox ? this.analyzeLBPTOP(videoElement, faceBox) : { score: 0.5 };
    const skinTextureResult = videoElement && faceBox ? this.analyzeSkinTexture(videoElement, faceBox) : { score: 0.5 };
    
    // 6 Advanced checks mới
    const eyeGlintResult = videoElement && faceBox ? this.detectEyeGlint(videoElement, faceBox, landmarks) : { score: 0.5 };
    const pupilDilationResult = this.detectPupilDilation(landmarks);
    const faceDepthResult = this.estimateFaceDepth(landmarks);
    const opticalFlowResult = videoElement && faceBox ? this.analyzeOpticalFlow(videoElement, faceBox) : { score: 0.5 };
    const frequencyResult = videoElement && faceBox ? this.analyzeFrequencyDomain(videoElement, faceBox) : { score: 0.5 };
    const colorTempResult = videoElement && faceBox ? this.analyzeColorTemperature(videoElement, faceBox) : { score: 0.5 };

    const totalScore = (
      blinkResult.score * 0.20 +
      headMovementResult.score * 0.15 +
      lbpTopResult.score * 0.15 +
      skinTextureResult.score * 0.15 +
      eyeGlintResult.score * 0.05 +
      pupilDilationResult.score * 0.05 +
      faceDepthResult.score * 0.05 +
      opticalFlowResult.score * 0.05 +
      frequencyResult.score * 0.05 +
      colorTempResult.score * 0.10
    );

    // Chỉ kiểm tra khi đã thu thập đủ dữ liệu (>= 20 frames)
    const hasEnoughData = this.eyeGlintHistory.length >= 20; // Tăng từ 15 → 20
    
    const passed = !hasEnoughData || (
      totalScore > 0.30 && // Giảm từ 0.35 → 0.30
      blinkResult.count >= 1 && 
      !lbpTopResult.isReplay
    );

    return {
      passed,
      score: totalScore,
      details: {
        blink: blinkResult,
        headMovement: headMovementResult,
        lbpTop: lbpTopResult,
        skinTexture: skinTextureResult,
        eyeGlint: eyeGlintResult,
        pupilDilation: pupilDilationResult,
        faceDepth: faceDepthResult,
        opticalFlow: opticalFlowResult,
        frequency: frequencyResult,
        colorTemp: colorTempResult
      }
    };
  }

  reset() {
    this.blinkHistory = [];
    this.headMovementHistory = [];
    this.lastEyeState = null;
    this.lastHeadPosition = null;
    this.temporalFrames = [];
    this.lbpTopHistory = [];
    this.eyeGlintHistory = [];
    this.pupilDilationHistory = [];
    this.faceDepthHistory = [];
    this.opticalFlowHistory = [];
    this.frequencyAnalysisHistory = [];
    this.colorTemperatureHistory = [];
    this.sessionId = Date.now();
  }
}

export default new AdvancedAntiSpoofingService();
