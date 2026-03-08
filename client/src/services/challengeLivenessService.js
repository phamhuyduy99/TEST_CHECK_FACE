import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

class ChallengeLivenessService {
  constructor() {
    this.faceMeshModel = null;
    this.isLoaded = false;
    this.currentChallenge = null;
    this.challengeHistory = [];
    this.baselineLandmarks = null;
  }

  async loadModels() {
    if (this.isLoaded) return;
    try {
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

  // Generate random challenge
  generateChallenge() {
    const challenges = [
      { type: 'BLINK', instruction: '👁️ Chớp mắt 2 lần', duration: 3000 },
      { type: 'SMILE', instruction: '😊 Cười', duration: 2000 },
      { type: 'TURN_LEFT', instruction: '⬅️ Quay đầu sang trái', duration: 2000 },
      { type: 'TURN_RIGHT', instruction: '➡️ Quay đầu sang phải', duration: 2000 },
      { type: 'NOD', instruction: '⬇️ Gật đầu', duration: 2000 },
    ];
    
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
    this.currentChallenge = {
      ...challenge,
      startTime: Date.now(),
      completed: false,
      score: 0,
    };
    
    return this.currentChallenge;
  }

  // Verify challenge response
  async verifyChallenge(videoElement) {
    if (!this.faceMeshModel || !this.currentChallenge) return null;

    try {
      const faces = await this.faceMeshModel.estimateFaces(videoElement, { flipHorizontal: false });
      if (!faces || faces.length === 0) return null;

      const face = faces[0];
      const landmarks = face.keypoints;

      if (!this.baselineLandmarks) {
        this.baselineLandmarks = landmarks;
        return { progress: 0, completed: false };
      }

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
      }

      if (result && result.completed) {
        this.currentChallenge.completed = true;
        this.currentChallenge.score = result.score;
        this.challengeHistory.push({ ...this.currentChallenge });
        this.baselineLandmarks = null;
      }

      return result;
    } catch (err) {
      console.error('Challenge verification error:', err);
      return null;
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

    const progress = Math.min(100, (ratio / 3) * 100);
    const completed = ratio > 2.5;

    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  verifyTurnLeft(landmarks) {
    const noseTip = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    const faceWidth = Math.abs(leftCheek.x - rightCheek.x);
    const noseOffset = noseTip.x - (leftCheek.x + rightCheek.x) / 2;
    const turnRatio = Math.abs(noseOffset) / faceWidth;

    const progress = Math.min(100, (turnRatio / 0.15) * 100);
    const completed = noseOffset < -faceWidth * 0.1;

    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  verifyTurnRight(landmarks) {
    const noseTip = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    const faceWidth = Math.abs(leftCheek.x - rightCheek.x);
    const noseOffset = noseTip.x - (leftCheek.x + rightCheek.x) / 2;
    const turnRatio = Math.abs(noseOffset) / faceWidth;

    const progress = Math.min(100, (turnRatio / 0.15) * 100);
    const completed = noseOffset > faceWidth * 0.1;

    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  verifyNod(landmarks) {
    const noseTip = landmarks[1];
    
    if (!this.nodState) {
      this.nodState = { baselineY: noseTip.y, maxDiff: 0 };
    }

    const diff = Math.abs(noseTip.y - this.nodState.baselineY);
    this.nodState.maxDiff = Math.max(this.nodState.maxDiff, diff);

    const progress = Math.min(100, (this.nodState.maxDiff / 20) * 100);
    const completed = this.nodState.maxDiff > 15;

    if (completed) this.nodState = null;

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
  }
}

export default new ChallengeLivenessService();
