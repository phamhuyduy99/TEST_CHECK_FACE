// Action Detector - Phát hiện các hành động khuôn mặt
import * as faceapi from 'face-api.js';

export interface ActionResult {
  detected: boolean;
  confidence: number;
  value?: number;
}

export interface FaceOrientation {
  yaw: number; // -90 (trái) đến +90 (phải)
  pitch: number; // -90 (xuống) đến +90 (lên)
  roll: number; // -90 đến +90
}

class ActionDetector {
  private blinkHistory: { time: number; blink: boolean }[] = [];
  private lastBlinkTime: number = 0;
  private blinkCount: number = 0;
  private readonly BLINK_THRESHOLD = 0.2;
  private readonly BLINK_MIN_INTERVAL = 200; // ms

  // Detect Eye Blink using Eye Aspect Ratio (EAR)
  detectBlink(landmarks: faceapi.FaceLandmarks68): ActionResult {
    const leftEye = this.getEyeLandmarks(landmarks, 'left');
    const rightEye = this.getEyeLandmarks(landmarks, 'right');

    const leftEAR = this.calculateEAR(leftEye);
    const rightEAR = this.calculateEAR(rightEye);
    const avgEAR = (leftEAR + rightEAR) / 2;

    const now = Date.now();
    const isBlink = avgEAR < this.BLINK_THRESHOLD;

    // Đếm blink
    if (isBlink && now - this.lastBlinkTime > this.BLINK_MIN_INTERVAL) {
      this.blinkCount++;
      this.lastBlinkTime = now;
    }

    // Lưu history
    this.blinkHistory.push({ time: now, blink: isBlink });
    this.blinkHistory = this.blinkHistory.filter(h => now - h.time < 5000);

    return {
      detected: isBlink,
      confidence: 1 - avgEAR / this.BLINK_THRESHOLD,
      value: this.blinkCount,
    };
  }

  // Calculate Eye Aspect Ratio
  private calculateEAR(eyePoints: faceapi.Point[]): number {
    // EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
    const vertical1 = this.distance(eyePoints[1], eyePoints[5]);
    const vertical2 = this.distance(eyePoints[2], eyePoints[4]);
    const horizontal = this.distance(eyePoints[0], eyePoints[3]);

    return (vertical1 + vertical2) / (2 * horizontal);
  }

  // Get eye landmarks
  private getEyeLandmarks(
    landmarks: faceapi.FaceLandmarks68,
    eye: 'left' | 'right'
  ): faceapi.Point[] {
    const positions = landmarks.positions;
    if (eye === 'left') {
      return [36, 37, 38, 39, 40, 41].map(i => positions[i]);
    } else {
      return [42, 43, 44, 45, 46, 47].map(i => positions[i]);
    }
  }

  // Detect Smile
  detectSmile(landmarks: faceapi.FaceLandmarks68): ActionResult {
    const positions = landmarks.positions;
    const leftMouth = positions[48];
    const rightMouth = positions[54];
    const topMouth = positions[51];
    const bottomMouth = positions[57];

    const mouthWidth = this.distance(leftMouth, rightMouth);
    const mouthHeight = this.distance(topMouth, bottomMouth);
    const faceWidth = this.distance(positions[0], positions[16]);

    // Smile score dựa trên tỷ lệ miệng
    const widthRatio = mouthWidth / faceWidth;
    const aspectRatio = mouthWidth / mouthHeight;

    const smileScore = widthRatio * aspectRatio * 0.5;

    return {
      detected: smileScore > 0.4,
      confidence: Math.min(1, smileScore / 0.4),
      value: smileScore,
    };
  }

  // Detect Mouth Open
  detectMouthOpen(landmarks: faceapi.FaceLandmarks68): ActionResult {
    const positions = landmarks.positions;
    const topMouth = positions[51];
    const bottomMouth = positions[57];
    const leftMouth = positions[48];
    const rightMouth = positions[54];

    const mouthHeight = this.distance(topMouth, bottomMouth);
    const mouthWidth = this.distance(leftMouth, rightMouth);

    // Mouth Aspect Ratio (MAR)
    const mar = mouthHeight / mouthWidth;

    return {
      detected: mar > 0.6,
      confidence: Math.min(1, mar / 0.6),
      value: mar,
    };
  }

  // Detect Face Orientation (Yaw, Pitch, Roll)
  detectFaceOrientation(landmarks: faceapi.FaceLandmarks68): FaceOrientation {
    const positions = landmarks.positions;

    // Key points
    const noseTip = positions[33];
    const noseBridge = positions[27];
    const leftEye = positions[36];
    const rightEye = positions[45];

    // Calculate Yaw (quay trái/phải)
    const eyeMidpoint = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2,
    };
    const faceWidth = this.distance(leftEye, rightEye);
    const noseOffset = noseTip.x - eyeMidpoint.x;
    const yaw = (noseOffset / faceWidth) * 90; // -90 đến +90

    // Calculate Pitch (nhìn lên/xuống)
    const eyeToNose = noseTip.y - eyeMidpoint.y;
    const faceHeight = this.distance(noseBridge, noseTip);
    const pitch = (eyeToNose / faceHeight) * 45; // -45 đến +45

    // Calculate Roll (nghiêng đầu)
    const eyeAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
    const roll = (eyeAngle * 180) / Math.PI;

    return { yaw, pitch, roll };
  }

  // Detect Turn Left
  detectTurnLeft(landmarks: faceapi.FaceLandmarks68): ActionResult {
    const { yaw } = this.detectFaceOrientation(landmarks);
    return {
      detected: yaw < -20,
      confidence: Math.min(1, Math.abs(yaw) / 20),
      value: yaw,
    };
  }

  // Detect Turn Right
  detectTurnRight(landmarks: faceapi.FaceLandmarks68): ActionResult {
    const { yaw } = this.detectFaceOrientation(landmarks);
    return {
      detected: yaw > 20,
      confidence: Math.min(1, Math.abs(yaw) / 20),
      value: yaw,
    };
  }

  // Detect Look Up
  detectLookUp(landmarks: faceapi.FaceLandmarks68): ActionResult {
    const { pitch } = this.detectFaceOrientation(landmarks);
    return {
      detected: pitch < -15,
      confidence: Math.min(1, Math.abs(pitch) / 15),
      value: pitch,
    };
  }

  // Detect Look Down
  detectLookDown(landmarks: faceapi.FaceLandmarks68): ActionResult {
    const { pitch } = this.detectFaceOrientation(landmarks);
    return {
      detected: pitch > 15,
      confidence: Math.min(1, Math.abs(pitch) / 15),
      value: pitch,
    };
  }

  // Detect Head Nod (gật đầu)
  detectNodHead(
    landmarks: faceapi.FaceLandmarks68,
    history: faceapi.FaceLandmarks68[]
  ): ActionResult {
    if (history.length < 10) {
      return { detected: false, confidence: 0 };
    }

    const positions = landmarks.positions;
    const noseTip = positions[33];

    // Tính vertical movement
    const movements = history.slice(-10).map((_h, i) => {
      if (i === 0) return 0;
      const prevNose = history[i - 1].positions[33];
      return noseTip.y - prevNose.y;
    });

    const totalMovement = movements.reduce((sum, m) => sum + Math.abs(m), 0);
    const avgMovement = totalMovement / movements.length;

    return {
      detected: avgMovement > 15,
      confidence: Math.min(1, avgMovement / 15),
      value: avgMovement,
    };
  }

  // Detect Head Shake (lắc đầu)
  detectShakeHead(
    landmarks: faceapi.FaceLandmarks68,
    history: faceapi.FaceLandmarks68[]
  ): ActionResult {
    if (history.length < 10) {
      return { detected: false, confidence: 0 };
    }

    const positions = landmarks.positions;
    const noseTip = positions[33];

    // Tính horizontal movement
    const movements = history.slice(-10).map((_h, i) => {
      if (i === 0) return 0;
      const prevNose = history[i - 1].positions[33];
      return noseTip.x - prevNose.x;
    });

    const totalMovement = movements.reduce((sum, m) => sum + Math.abs(m), 0);
    const avgMovement = totalMovement / movements.length;

    return {
      detected: avgMovement > 15,
      confidence: Math.min(1, avgMovement / 15),
      value: avgMovement,
    };
  }

  // Helper: Calculate distance between two points
  private distance(p1: faceapi.Point, p2: faceapi.Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  // Reset blink counter
  resetBlinkCount() {
    this.blinkCount = 0;
    this.blinkHistory = [];
  }

  getBlinkCount(): number {
    return this.blinkCount;
  }
}

export const actionDetector = new ActionDetector();
export default actionDetector;
