import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';

class ChallengeLivenessService {
  constructor() {
    this.faceMeshModel = null;
    this.isLoaded = false;
    this.currentChallenge = null;
    this.challengeHistory = [];
    this.baselineLandmarks = null;
    this.selectedChallenges = [];
  }

  async loadModels() {
    if (this.isLoaded) return;
    try {
      console.log('🔄 Setting up TensorFlow backend...');
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('✅ TensorFlow backend:', tf.getBackend());
      
      console.log('🔄 Loading FaceMesh...');
      this.faceMeshModel = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        { runtime: 'tfjs', refineLandmarks: true, maxFaces: 1 }
      );
      this.isLoaded = true;
      console.log('✅ Challenge Liveness loaded');
    } catch (err) {
      console.error('❌ Challenge Liveness failed:', err);
    }
  }

  // Generate random 5 challenges from pool
  initializeChallenges() {
    const allChallenges = [
      { type: 'BLINK', instruction: '👁️ Chớp mắt 2 lần', duration: 3000 },
      { type: 'SMILE', instruction: '😊 Cười', duration: 2000 },
      { type: 'TURN_LEFT', instruction: '⬅️ Quay đầu sang trái', duration: 2000 },
      { type: 'TURN_RIGHT', instruction: '➡️ Quay đầu sang phải', duration: 2000 },
      { type: 'NOD', instruction: '⬇️ Gật đầu', duration: 2000 },
      { type: 'OPEN_MOUTH', instruction: '😮 Há miệng', duration: 2000 },
      { type: 'TILT_LEFT', instruction: '⬅️ Nghiêng đầu trái', duration: 2000 },
      { type: 'TILT_RIGHT', instruction: '➡️ Nghiêng đầu phải', duration: 2000 },
      { type: 'RAISE_EYEBROWS', instruction: '🤨 Nhấc lông mày', duration: 2000 },
      { type: 'CLOSE_EYES', instruction: '😑 Nhắm mắt', duration: 2000 },
    ];
    
    // Shuffle and pick 5
    const shuffled = allChallenges.sort(() => Math.random() - 0.5);
    this.selectedChallenges = shuffled.slice(0, 5);
  }

  // Generate next challenge from selected list
  generateChallenge() {
    if (this.selectedChallenges.length === 0) {
      this.initializeChallenges();
    }
    
    const index = this.challengeHistory.length;
    if (index >= this.selectedChallenges.length) return null;
    
    const challenge = this.selectedChallenges[index];
    this.currentChallenge = {
      ...challenge,
      startTime: Date.now(),
      completed: false,
      score: 0,
    };
    
    return this.currentChallenge;
  }

  // Verify challenge response - PHẢI DETECT FACE THẬT
  async verifyChallenge(videoElement) {
    if (!this.currentChallenge) return null;

    const elapsed = Date.now() - this.currentChallenge.startTime;
    const timeout = elapsed >= 20000;
    
    // KIỂM TRA FACE CÓ TỒN TẠI KHÔNG
    if (!this.faceMeshModel) {
      return { progress: 0, completed: false, timeout: false, score: 0 };
    }

    try {
      const faces = await this.faceMeshModel.estimateFaces(videoElement, { flipHorizontal: false });
      
      // KHÔNG CÓ FACE = FAIL NGAY
      if (!faces || faces.length === 0) {
        if (timeout) {
          this.currentChallenge.completed = true;
          this.currentChallenge.score = 0.0;
          this.challengeHistory.push({ ...this.currentChallenge });
          this.currentChallenge = null;
          return { progress: 100, completed: true, timeout: true, score: 0 };
        }
        return { progress: 0, completed: false, timeout: false, score: 0 };
      }

      const landmarks = faces[0].keypoints;
      
      // VERIFY THEO TỪNG LOẠI CHALLENGE
      let result = null;
      switch (this.currentChallenge.type) {
        case 'BLINK':
          result = this.verifyBlink(landmarks);
          break;
        case 'SMILE':
          result = this.verifySmile(landmarks);
          break;
        case 'TURN_LEFT':
          result = this.verifyTurnLeft(landmarks);
          break;
        case 'TURN_RIGHT':
          result = this.verifyTurnRight(landmarks);
          break;
        case 'NOD':
          result = this.verifyNod(landmarks);
          break;
        case 'OPEN_MOUTH':
          result = this.verifyOpenMouth(landmarks);
          break;
        case 'TILT_LEFT':
          result = this.verifyTiltLeft(landmarks);
          break;
        case 'TILT_RIGHT':
          result = this.verifyTiltRight(landmarks);
          break;
        case 'CLOSE_EYES':
          result = this.verifyCloseEyes(landmarks);
          break;
        default:
          result = { progress: 0, completed: false, score: 0 };
      }

      if (result.completed && !this.currentChallenge.completed) {
        this.currentChallenge.completed = true;
        this.currentChallenge.score = 1.0;
        this.challengeHistory.push({ ...this.currentChallenge });
        this.currentChallenge = null;
        return { progress: 100, completed: true, timeout: false, score: 1.0 };
      }

      if (timeout && !this.currentChallenge.completed) {
        this.currentChallenge.completed = true;
        this.currentChallenge.score = 0.0;
        this.challengeHistory.push({ ...this.currentChallenge });
        this.currentChallenge = null;
        return { progress: 100, completed: true, timeout: true, score: 0 };
      }

      return { progress: result.progress, completed: false, timeout: false, score: 0, landmarks: faces[0] };
    } catch (err) {
      console.error('Verify error:', err);
      return { progress: 0, completed: false, timeout: false, score: 0, landmarks: null };
    }
  }

  verifyBlink(landmarks) {
    const leftEyeTop = landmarks[159];
    const leftEyeBottom = landmarks[145];
    const rightEyeTop = landmarks[386];
    const rightEyeBottom = landmarks[374];

    const leftHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
    const rightHeight = Math.abs(rightEyeTop.y - rightEyeBottom.y);
    const avgHeight = (leftHeight + rightHeight) / 2;

    if (!this.blinkState) {
      this.blinkState = { count: 0, lastBlink: 0, wasOpen: true };
    }

    const now = Date.now();
    if (avgHeight < 3 && this.blinkState.wasOpen && now - this.blinkState.lastBlink > 200) {
      this.blinkState.count++;
      this.blinkState.lastBlink = now;
      this.blinkState.wasOpen = false;
    } else if (avgHeight > 5) {
      this.blinkState.wasOpen = true;
    }

    const progress = Math.min(100, (this.blinkState.count / 2) * 100);
    const completed = this.blinkState.count >= 2;

    if (completed) this.blinkState = null;

    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  verifySmile(landmarks) {
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];
    const topLip = landmarks[13];
    const bottomLip = landmarks[14];

    const mouthWidth = Math.abs(leftMouth.x - rightMouth.x);
    const mouthHeight = Math.abs(topLip.y - bottomLip.y);
    const ratio = mouthWidth / (mouthHeight + 1);

    const progress = Math.min(100, (ratio / 2.0) * 100);
    const completed = ratio > 1.8;

    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  verifyTurnLeft(landmarks) {
    const noseTip = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    const faceWidth = Math.abs(leftCheek.x - rightCheek.x);
    const noseOffset = noseTip.x - (leftCheek.x + rightCheek.x) / 2;
    const turnRatio = Math.abs(noseOffset) / faceWidth;

    const progress = Math.min(100, (turnRatio / 0.1) * 100);
    const completed = noseOffset < -faceWidth * 0.05;

    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  verifyTurnRight(landmarks) {
    const noseTip = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    const faceWidth = Math.abs(leftCheek.x - rightCheek.x);
    const noseOffset = noseTip.x - (leftCheek.x + rightCheek.x) / 2;
    const turnRatio = Math.abs(noseOffset) / faceWidth;

    const progress = Math.min(100, (turnRatio / 0.1) * 100);
    const completed = noseOffset > faceWidth * 0.05;

    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  verifyNod(landmarks) {
    const noseTip = landmarks[1];
    
    if (!this.nodState) {
      this.nodState = { baselineY: noseTip.y, maxDiff: 0 };
    }

    const diff = Math.abs(noseTip.y - this.nodState.baselineY);
    this.nodState.maxDiff = Math.max(this.nodState.maxDiff, diff);

    const progress = Math.min(100, (this.nodState.maxDiff / 10) * 100);
    const completed = this.nodState.maxDiff > 8;

    if (completed) this.nodState = null;

    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  verifyOpenMouth(landmarks) {
    const topLip = landmarks[13];
    const bottomLip = landmarks[14];
    const mouthHeight = Math.abs(topLip.y - bottomLip.y);
    
    const progress = Math.min(100, (mouthHeight / 15) * 100);
    const completed = mouthHeight > 12;
    
    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  verifyTiltLeft(landmarks) {
    const leftEye = landmarks[159];
    const rightEye = landmarks[386];
    const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
    
    const progress = Math.min(100, Math.abs(angle) / 15 * 100);
    const completed = angle > 10;
    
    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  verifyTiltRight(landmarks) {
    const leftEye = landmarks[159];
    const rightEye = landmarks[386];
    const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
    
    const progress = Math.min(100, Math.abs(angle) / 15 * 100);
    const completed = angle < -10;
    
    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  verifyCloseEyes(landmarks) {
    const leftEyeTop = landmarks[159];
    const leftEyeBottom = landmarks[145];
    const rightEyeTop = landmarks[386];
    const rightEyeBottom = landmarks[374];

    const leftHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
    const rightHeight = Math.abs(rightEyeTop.y - rightEyeBottom.y);
    const avgHeight = (leftHeight + rightHeight) / 2;

    const progress = avgHeight < 3 ? 100 : Math.max(0, 100 - (avgHeight / 5) * 100);
    const completed = avgHeight < 2;

    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  // Calculate final liveness score
  getFinalScore() {
    if (this.challengeHistory.length === 0) return 0;
    
    const totalScore = this.challengeHistory.reduce((sum, c) => sum + c.score, 0);
    return totalScore / this.challengeHistory.length;
  }

  reset() {
    this.currentChallenge = null;
    this.challengeHistory = [];
    this.baselineLandmarks = null;
    this.blinkState = null;
    this.nodState = null;
    this.selectedChallenges = [];
  }
}

export default new ChallengeLivenessService();
