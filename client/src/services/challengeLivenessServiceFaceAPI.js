import * as faceapi from 'face-api.js';
import antiSpoofingService from './antiSpoofingService';
import advancedAntiSpoofing from './advancedAntiSpoofing';

class ChallengeLivenessService {
  constructor() {
    this.isLoaded = false;
    this.currentChallenge = null;
    this.challengeHistory = [];
    this.selectedChallenges = [];
    this.antiSpoofingScore = 1.0;
    this.antiSpoofingFailed = false;
  }

  async loadModels() {
    if (this.isLoaded) return;
    try {
      // console.log('🔄 Loading face-api.js models...');
      const MODEL_URL = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      this.isLoaded = true;
      // console.log('✅ face-api.js loaded');
    } catch (err) {
      console.error('❌ face-api.js load failed:', err);
    }
  }

  initializeChallenges() {
    const allChallenges = [
      { type: 'EYEBROW_RAISE', instruction: '🤨 Nhấc lông mày 4 lần', duration: 6000, minResponseTime: 500, maxResponseTime: 6000 },
      { type: 'SMILE', instruction: '😊 Cười', duration: 2500, minResponseTime: 200, maxResponseTime: 2500 },
      { type: 'TURN_LEFT', instruction: '⬅️ Quay đầu sang PHẢI (trên màn hình là trái)', duration: 2500, minResponseTime: 200, maxResponseTime: 2500 },
      { type: 'TURN_RIGHT', instruction: '➡️ Quay đầu sang TRÁI (trên màn hình là phải)', duration: 2500, minResponseTime: 200, maxResponseTime: 2500 },
      { type: 'NOD', instruction: '⬇️ Gật đầu', duration: 2500, minResponseTime: 200, maxResponseTime: 2500 },
      { type: 'OPEN_MOUTH', instruction: '😮 Há miệng', duration: 2000, minResponseTime: 200, maxResponseTime: 2000 },
    ];
    
    // Shuffle ngẫu nhiên thứ tự challenges
    const shuffled = allChallenges.sort(() => Math.random() - 0.5);
    this.selectedChallenges = shuffled.slice(0, 5);
    
    // Thêm random timing cho mỗi challenge (500-1500ms)
    this.selectedChallenges = this.selectedChallenges.map(c => ({
      ...c,
      randomDelay: Math.floor(Math.random() * 1000) + 500 // 500-1500ms
    }));
    
    // console.log('🎲 Random challenge sequence:', this.selectedChallenges.map(c => c.type));
  }

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
      firstActionTime: null,
      completed: false,
      score: 0,
    };
    
    // console.log('🎯 Challenge #' + (index + 1) + ':', challenge.type, '| Instruction:', challenge.instruction);
    
    return this.currentChallenge;
  }

  async verifyChallenge(videoElement) {
    if (!this.currentChallenge) {
      // console.log('⚠️ No current challenge');
      return null;
    }

    // console.log('🔍 Verifying challenge:', this.currentChallenge.type);

    const elapsed = Date.now() - this.currentChallenge.startTime;
    const timeout = elapsed >= 8000; // 8s để đủ thời gian cho EYEBROW_RAISE (6s)
    
    if (!this.isLoaded) {
      return { progress: 0, completed: false, timeout: false, score: 0 };
    }

    if (!videoElement || videoElement.readyState !== 4 || videoElement.videoWidth === 0) {
      return { progress: 0, completed: false, timeout: false, score: 0 };
    }

    try {
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceLandmarks();
      
      if (!detection) {
        if (timeout) {
          this.currentChallenge.completed = true;
          this.currentChallenge.score = 0.0;
          this.challengeHistory.push({ ...this.currentChallenge });
          this.currentChallenge = null;
          return { progress: 100, completed: true, timeout: true, score: 0 };
        }
        return { progress: 0, completed: false, timeout: false, score: 0 };
      }

      const landmarks = detection.landmarks.positions;
      
      // ANTI-SPOOFING: Phát hiện gian lận → THOÁT NGUỒN
      // Chỉ check sau 5s (150 frames) để camera ổn định và user có thời gian
      if (this.frameCount === undefined) this.frameCount = 0;
      this.frameCount++;
      
      if (this.frameCount > 20 && this.frameCount % 5 === 0) {
        // console.log('\n🔍 [FRAME', this.frameCount, '] Running anti-spoof checks...');
        
        const antiSpoofResult = antiSpoofingService.performAntiSpoofingCheck(videoElement, detection);
        const advancedResult = advancedAntiSpoofing.performAdvancedCheck(landmarks, videoElement, detection.detection.box);
        
        this.antiSpoofingScore = (antiSpoofResult.score + advancedResult.score) / 2;
        
        // console.log('🛡️ Basic Anti-Spoof:', {
        //   passed: antiSpoofResult.passed,
        //   score: antiSpoofResult.score.toFixed(3),
        //   failedChecks: antiSpoofResult.failedChecks + '/20'
        // });
        
        // console.log('🔬 Advanced Anti-Spoof:', {
        //   passed: advancedResult.passed,
        //   score: advancedResult.score.toFixed(3),
        //   blinks: advancedResult.details.blink.count,
        //   lbpTopReplay: advancedResult.details.lbpTop.isReplay
        // });
        
        // console.log('🎯 Combined Score:', this.antiSpoofingScore.toFixed(3));
        
        if (!antiSpoofResult.passed || !advancedResult.passed) {
          this.antiSpoofingFailed = true;
          const failReason = [
            ...antiSpoofResult.details.filter(d => !d.passed).map(d => d.reason),
            ...Object.entries(advancedResult.details)
              .filter(([k, v]) => v.score < 0.5)
              .map(([k, v]) => v.reason || k)
          ].join(', ');
          
          console.error('\n🚨🚨🚨 SPOOFING DETECTED! 🚨🚨🚨');
          console.error('Reason:', failReason);
          console.error('Basic passed:', antiSpoofResult.passed);
          console.error('Advanced passed:', advancedResult.passed);
          
          if (this.currentChallenge) {
            this.currentChallenge.completed = true;
            this.currentChallenge.score = 0.0;
            this.currentChallenge.antiSpoofFailed = true;
            this.challengeHistory.push({ ...this.currentChallenge });
            this.currentChallenge = null;
          }
          
          return { 
            progress: 100, 
            completed: true, 
            timeout: false, 
            score: 0, 
            spoofingDetected: true,
            spoofingReason: failReason,
            antiSpoofDetails: antiSpoofResult.details,
            advancedDetails: advancedResult.details
          };
        }
      }
      
      let result = null;
      switch (this.currentChallenge.type) {
        case 'EYEBROW_RAISE':
          result = this.verifyEyebrowRaise(landmarks);
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
        default:
          result = { progress: 0, completed: false, score: 0 };
      }

      if (result.completed && !this.currentChallenge.completed) {
        // Kiểm tra response time (dùng firstActionTime nếu có, không thì dùng startTime)
        const actionTime = this.currentChallenge.firstActionTime || this.currentChallenge.startTime;
        const responseTime = Date.now() - actionTime;
        
        const minTime = this.currentChallenge.minResponseTime || 500;
        const maxTime = this.currentChallenge.maxResponseTime || 5000;
        
        // console.log('⏱️ Response time:', responseTime + 'ms', '(valid:', minTime + '-' + maxTime + 'ms)');
        
        // TẮT CHECK REPLAY - Chỉ check timeout
        // if (responseTime < minTime) {
        //   console.log('⚠️ VIDEO REPLAY DETECTED: Response quá nhanh! (' + responseTime + 'ms < ' + minTime + 'ms)');
        //   this.currentChallenge.completed = true;
        //   this.currentChallenge.score = 0.0;
        //   this.currentChallenge.replayDetected = true;
        //   this.currentChallenge.replayReason = `Hành động quá nhanh (${responseTime}ms)`;
        //   this.challengeHistory.push({ ...this.currentChallenge });
        //   this.currentChallenge = null;
        //   this.resetStates();
        //   return { progress: 100, completed: true, timeout: false, score: 0, replayDetected: true, replayReason: `Hành động quá nhanh (${responseTime}ms)` };
        // }
        
        if (responseTime > maxTime) {
          // console.log('⚠️ TIMEOUT: Response quá chậm!');
          this.currentChallenge.completed = true;
          this.currentChallenge.score = 0.0;
          this.challengeHistory.push({ ...this.currentChallenge });
          this.currentChallenge = null;
          this.resetStates();
          return { progress: 100, completed: true, timeout: true, score: 0 };
        }
        
        // Pass
        this.currentChallenge.completed = true;
        this.currentChallenge.score = 1.0;
        this.currentChallenge.responseTime = responseTime;
        this.challengeHistory.push({ ...this.currentChallenge });
        this.currentChallenge = null;
        this.resetStates();
        return { progress: 100, completed: true, timeout: false, score: 1.0, landmarks: detection };
      }

      if (timeout && !this.currentChallenge.completed) {
        this.currentChallenge.completed = true;
        this.currentChallenge.score = 0.0;
        this.challengeHistory.push({ ...this.currentChallenge });
        this.currentChallenge = null;
        this.resetStates();
        return { progress: 100, completed: true, timeout: true, score: 0 };
      }

      return { progress: result.progress, completed: false, timeout: false, score: 0, landmarks: detection };
    } catch (err) {
      console.error('Verify error:', err);
      return { progress: 0, completed: false, timeout: false, score: 0, landmarks: null };
    }
  }

  verifyEyebrowRaise(landmarks) {
    const leftBrowTop = landmarks[19];
    const rightBrowTop = landmarks[24];
    const leftEyeTop = landmarks[37];
    const rightEyeTop = landmarks[43];
    
    const leftBrowY = leftBrowTop.y;
    const rightBrowY = rightBrowTop.y;
    const avgBrowY = (leftBrowY + rightBrowY) / 2;
    
    const leftEyeY = leftEyeTop.y;
    const rightEyeY = rightEyeTop.y;
    const avgEyeY = (leftEyeY + rightEyeY) / 2;
    
    const browToEyeDistance = avgEyeY - avgBrowY;

    if (!this.eyebrowState) {
      this.eyebrowState = { 
        count: 0,
        wasRaised: false,
        lastRaise: 0,
        baselineDistance: browToEyeDistance,
        maxDistance: browToEyeDistance
      };
      // console.log('🤨 Eyebrow init - Distance:', browToEyeDistance.toFixed(1));
      return { progress: 0, completed: false, score: 0 };
    }

    this.eyebrowState.maxDistance = Math.max(this.eyebrowState.maxDistance, browToEyeDistance);
    const now = Date.now();
    
    if (browToEyeDistance > this.eyebrowState.baselineDistance * 1.15 && !this.eyebrowState.wasRaised && now - this.eyebrowState.lastRaise > 300) {
      this.eyebrowState.wasRaised = true;
      // Track first action time ONCE
      if (!this.currentChallenge.firstActionTime) {
        this.currentChallenge.firstActionTime = now;
      }
    }
    else if (browToEyeDistance < this.eyebrowState.baselineDistance * 1.05 && this.eyebrowState.wasRaised) {
      this.eyebrowState.count++;
      this.eyebrowState.lastRaise = now;
      this.eyebrowState.wasRaised = false;
    }

    const progress = Math.min(100, (this.eyebrowState.count / 4) * 100);
    const completed = this.eyebrowState.count >= 4;

    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  verifySmile(landmarks) {
    const leftMouth = landmarks[48];
    const rightMouth = landmarks[54];
    const topLip = landmarks[51];
    const bottomLip = landmarks[57];
    const noseTip = landmarks[30];

    const mouthWidth = Math.abs(leftMouth.x - rightMouth.x);
    const mouthHeight = Math.abs(topLip.y - bottomLip.y);
    
    const leftCornerY = leftMouth.y;
    const rightCornerY = rightMouth.y;
    const avgCornerY = (leftCornerY + rightCornerY) / 2;
    const cornerLift = noseTip.y - avgCornerY;

    if (!this.smileState) {
      this.smileState = { 
        baselineWidth: mouthWidth,
        baselineCornerLift: cornerLift,
        maxWidth: mouthWidth,
        maxCornerLift: cornerLift
      };
      return { progress: 0, completed: false, score: 0 };
    }

    this.smileState.maxWidth = Math.max(this.smileState.maxWidth, mouthWidth);
    this.smileState.maxCornerLift = Math.max(this.smileState.maxCornerLift, cornerLift);

    const widthIncrease = mouthWidth - this.smileState.baselineWidth;
    const liftIncrease = cornerLift - this.smileState.baselineCornerLift;

    const progress = Math.max(0, Math.min(100, ((widthIncrease / 15) + (liftIncrease / 10)) * 50));
    // Track first action time khi bắt đầu cười
    if ((widthIncrease > 5 || liftIncrease > 3) && !this.currentChallenge.firstActionTime) {
      this.currentChallenge.firstActionTime = Date.now();
    }

    // Giảm ngưỡng: chỉ cần 1 trong 2 điều kiện (width HOẶC lift)
    const completed = widthIncrease > 8 || liftIncrease > 4;

    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  verifyTurnLeft(landmarks) {
    const noseTip = landmarks[30];
    const leftEye = landmarks[36];
    const rightEye = landmarks[45];
    const leftMouth = landmarks[48];
    const rightMouth = landmarks[54];

    if (!this.turnLeftState) {
      const eyeDistance = Math.abs(leftEye.x - rightEye.x);
      this.turnLeftState = { 
        baselineNoseX: noseTip.x, 
        baselineEyeDist: eyeDistance, 
        minOffset: 0, 
        hasMovedLeft: false,
        frameCount: 0
      };
      // console.log('⬅️⬅️⬅️ TURN LEFT INIT ⬅️⬅️⬅️');
      // console.log('  Baseline Nose X:', noseTip.x.toFixed(1));
      // console.log('  Eye Distance:', eyeDistance.toFixed(1));
      // console.log('  Left Eye X:', leftEye.x.toFixed(1));
      // console.log('  Right Eye X:', rightEye.x.toFixed(1));
      // console.log('  Need: Offset < -25%');
      return { progress: 0, completed: false, score: 0 };
    }

    this.turnLeftState.frameCount++;
    const eyeDistance = Math.abs(leftEye.x - rightEye.x);
    const noseOffset = noseTip.x - this.turnLeftState.baselineNoseX;
    const offsetPercent = (noseOffset / eyeDistance) * 100;

    // console.log('⬅️ TURN LEFT [Frame ' + this.turnLeftState.frameCount + ']');
    // console.log('  Current Nose X:', noseTip.x.toFixed(1));
    // console.log('  Baseline Nose X:', this.turnLeftState.baselineNoseX.toFixed(1));
    // console.log('  Nose Offset (pixels):', noseOffset.toFixed(1));
    // console.log('  Eye Distance:', eyeDistance.toFixed(1));
    // console.log('  Offset Percent:', offsetPercent.toFixed(1) + '%');
    // console.log('  Min Offset Recorded:', this.turnLeftState.minOffset.toFixed(1) + '%');
    // console.log('  Has Moved Left:', this.turnLeftState.hasMovedLeft);
    // console.log('  Progress:', Math.min(100, (Math.abs(this.turnLeftState.minOffset) / 25) * 100).toFixed(1) + '%');
    // console.log('  Need: < -25% to pass');

    if (offsetPercent < 0) {
      // Track first action time ONCE khi bắt đầu quay
      if (!this.currentChallenge.firstActionTime) {
        this.currentChallenge.firstActionTime = Date.now();
      }
      this.turnLeftState.minOffset = Math.min(this.turnLeftState.minOffset, offsetPercent);
      this.turnLeftState.hasMovedLeft = true;
      // console.log('  ✅ Moving LEFT! New Min:', this.turnLeftState.minOffset.toFixed(1) + '%');
    } else {
      // console.log('  ⚠️ Not moving left (offset >= 0)');
    }

    const progress = Math.min(100, (Math.abs(this.turnLeftState.minOffset) / 25) * 100);
    const completed = this.turnLeftState.hasMovedLeft && this.turnLeftState.minOffset < -25;

    // if (completed) {
    //   console.log('✅✅✅ TURN LEFT PASS! Final Offset:', this.turnLeftState.minOffset.toFixed(1) + '%');
    // }

    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  verifyTurnRight(landmarks) {
    const noseTip = landmarks[30];
    const leftEye = landmarks[36];
    const rightEye = landmarks[45];
    const leftMouth = landmarks[48];
    const rightMouth = landmarks[54];

    if (!this.turnRightState) {
      const eyeDistance = Math.abs(leftEye.x - rightEye.x);
      this.turnRightState = { 
        baselineNoseX: noseTip.x, 
        baselineEyeDist: eyeDistance, 
        maxOffset: 0, 
        hasMovedRight: false,
        frameCount: 0
      };
      // console.log('➡️➡️➡️ TURN RIGHT INIT ➡️➡️➡️');
      // console.log('  Baseline Nose X:', noseTip.x.toFixed(1));
      // console.log('  Eye Distance:', eyeDistance.toFixed(1));
      // console.log('  Left Eye X:', leftEye.x.toFixed(1));
      // console.log('  Right Eye X:', rightEye.x.toFixed(1));
      // console.log('  Need: Offset > 25%');
      return { progress: 0, completed: false, score: 0 };
    }

    this.turnRightState.frameCount++;
    const eyeDistance = Math.abs(leftEye.x - rightEye.x);
    const noseOffset = noseTip.x - this.turnRightState.baselineNoseX;
    const offsetPercent = (noseOffset / eyeDistance) * 100;

    // console.log('➡️ TURN RIGHT [Frame ' + this.turnRightState.frameCount + ']');
    // console.log('  Current Nose X:', noseTip.x.toFixed(1));
    // console.log('  Baseline Nose X:', this.turnRightState.baselineNoseX.toFixed(1));
    // console.log('  Nose Offset (pixels):', noseOffset.toFixed(1));
    // console.log('  Eye Distance:', eyeDistance.toFixed(1));
    // console.log('  Offset Percent:', offsetPercent.toFixed(1) + '%');
    // console.log('  Max Offset Recorded:', this.turnRightState.maxOffset.toFixed(1) + '%');
    // console.log('  Has Moved Right:', this.turnRightState.hasMovedRight);
    // console.log('  Progress:', Math.min(100, (Math.abs(this.turnRightState.maxOffset) / 25) * 100).toFixed(1) + '%');
    // console.log('  Need: > 25% to pass');

    if (offsetPercent > 0) {
      // Track first action time ONCE khi bắt đầu quay
      if (!this.currentChallenge.firstActionTime) {
        this.currentChallenge.firstActionTime = Date.now();
      }
      this.turnRightState.maxOffset = Math.max(this.turnRightState.maxOffset, offsetPercent);
      this.turnRightState.hasMovedRight = true;
      // console.log('  ✅ Moving RIGHT! New Max:', this.turnRightState.maxOffset.toFixed(1) + '%');
    } else {
      // console.log('  ⚠️ Not moving right (offset <= 0)');
    }

    const progress = Math.min(100, (Math.abs(this.turnRightState.maxOffset) / 25) * 100);
    const completed = this.turnRightState.hasMovedRight && this.turnRightState.maxOffset > 25;

    // if (completed) {
    //   console.log('✅✅✅ TURN RIGHT PASS! Final Offset:', this.turnRightState.maxOffset.toFixed(1) + '%');
    // }

    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  verifyNod(landmarks) {
    const noseTip = landmarks[30];
    const chin = landmarks[8];
    
    if (!this.nodState) {
      this.nodState = { 
        baselineNoseY: noseTip.y,
        baselineChinY: chin.y,
        minNoseY: noseTip.y,
        maxNoseY: noseTip.y,
        direction: null
      };
      // console.log('⬇️ Nod init - Nose Y:', noseTip.y.toFixed(1));
      return { progress: 0, completed: false, score: 0 };
    }

    this.nodState.minNoseY = Math.min(this.nodState.minNoseY, noseTip.y);
    this.nodState.maxNoseY = Math.max(this.nodState.maxNoseY, noseTip.y);
    
    const noseMovement = noseTip.y - this.nodState.baselineNoseY;
    const totalMovement = this.nodState.maxNoseY - this.nodState.minNoseY;

    // Track first action time when user starts moving
    if (Math.abs(noseMovement) > 5 && !this.currentChallenge.firstActionTime) {
      this.currentChallenge.firstActionTime = Date.now();
    }

    if (noseMovement > 10) {
      this.nodState.direction = 'DOWN';
    }
    else if (noseMovement < -10) this.nodState.direction = 'UP';

    // console.log('⬇️ Nod - Movement:', noseMovement.toFixed(1), 'Total:', totalMovement.toFixed(1), 'Dir:', this.nodState.direction, 'Need: >20');

    const progress = Math.min(100, (totalMovement / 20) * 100);
    const completed = this.nodState.direction === 'DOWN' && totalMovement > 20;

    if (completed) {
    // console.log('✅✅✅ NOD PASS! Movement:', totalMovement.toFixed(1));
    }

    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  verifyOpenMouth(landmarks) {
    const topLip = landmarks[51];
    const bottomLip = landmarks[57];
    const leftMouth = landmarks[48];
    const rightMouth = landmarks[54];
    
    const mouthHeight = Math.abs(topLip.y - bottomLip.y);
    const mouthWidth = Math.abs(leftMouth.x - rightMouth.x);
    const ratio = mouthHeight / (mouthWidth + 0.001);
    
    const progress = Math.min(100, (ratio / 0.5) * 100);
    const completed = ratio > 0.5;
    
    // Track first action time
    if (ratio > 0.3 && !this.currentChallenge.firstActionTime) {
      this.currentChallenge.firstActionTime = Date.now();
    }
    
    return { progress, completed, score: completed ? 1.0 : 0 };
  }

  getFinalScore() {
    if (this.challengeHistory.length === 0) return 0;
    const totalScore = this.challengeHistory.reduce((sum, c) => sum + c.score, 0);
    return totalScore / this.challengeHistory.length;
  }

  resetStates() {
    this.eyebrowState = null;
    this.nodState = null;
    this.smileState = null;
    this.turnLeftState = null;
    this.turnRightState = null;
  }

  reset() {
    this.currentChallenge = null;
    this.challengeHistory = [];
    this.resetStates();
    this.selectedChallenges = [];
    this.antiSpoofingScore = 1.0;
    this.antiSpoofingFailed = false;
    antiSpoofingService.reset();
    advancedAntiSpoofing.reset();
  }
}

export default new ChallengeLivenessService();

