// Challenge Validator - Xác thực các thử thách
import * as faceapi from 'face-api.js';
import { Challenge, ChallengeType } from './challengeManager';
import actionDetector, { ActionResult } from './actionDetector';

export interface ValidationResult {
  success: boolean;
  confidence: number;
  message: string;
  progress: number; // 0-100%
}

class ChallengeValidator {
  private startTime: number = 0;
  private validationHistory: ActionResult[] = [];
  private stableFrames: number = 0;
  private readonly STABLE_THRESHOLD = 3; // Cần 3 frames ổn định
  private readonly MIN_DURATION = 500; // ms - thời gian tối thiểu giữ hành động

  startValidation() {
    this.startTime = Date.now();
    this.validationHistory = [];
    this.stableFrames = 0;
  }

  validate(
    challenge: Challenge,
    landmarks: faceapi.FaceLandmarks68,
    landmarkHistory: faceapi.FaceLandmarks68[]
  ): ValidationResult {
    const elapsed = Date.now() - this.startTime;
    const timeProgress = Math.min(100, (elapsed / challenge.duration) * 100);

    // Timeout
    if (elapsed > challenge.duration) {
      return {
        success: false,
        confidence: 0,
        message: 'Hết thời gian!',
        progress: 100,
      };
    }

    // Validate theo loại challenge
    let result: ActionResult;
    switch (challenge.type) {
      case 'blink':
        result = this.validateBlink(challenge);
        break;
      case 'smile':
        result = actionDetector.detectSmile(landmarks);
        break;
      case 'turnLeft':
        result = actionDetector.detectTurnLeft(landmarks);
        break;
      case 'turnRight':
        result = actionDetector.detectTurnRight(landmarks);
        break;
      case 'lookUp':
        result = actionDetector.detectLookUp(landmarks);
        break;
      case 'lookDown':
        result = actionDetector.detectLookDown(landmarks);
        break;
      case 'mouthOpen':
        result = actionDetector.detectMouthOpen(landmarks);
        break;
      case 'nodHead':
        result = actionDetector.detectNodHead(landmarks, landmarkHistory);
        break;
      case 'shakeHead':
        result = actionDetector.detectShakeHead(landmarks, landmarkHistory);
        break;
      default:
        return {
          success: false,
          confidence: 0,
          message: 'Challenge không hợp lệ',
          progress: 0,
        };
    }

    // Lưu history
    this.validationHistory.push(result);

    // Kiểm tra stable frames
    if (result.detected) {
      this.stableFrames++;
    } else {
      this.stableFrames = 0;
    }

    // Tính progress
    const actionProgress = result.confidence * 100;
    const progress = Math.max(timeProgress, actionProgress);

    // Success nếu đạt yêu cầu và giữ đủ lâu
    const isStable = this.stableFrames >= this.STABLE_THRESHOLD;
    const hasMinDuration = elapsed >= this.MIN_DURATION;
    const success = result.detected && isStable && hasMinDuration;

    return {
      success,
      confidence: result.confidence,
      message: this.getMessage(challenge.type, result, success),
      progress,
    };
  }

  private validateBlink(challenge: Challenge): ActionResult {
    const blinkCount = actionDetector.getBlinkCount();
    const required = challenge.threshold;

    return {
      detected: blinkCount >= required,
      confidence: Math.min(1, blinkCount / required),
      value: blinkCount,
    };
  }

  private getMessage(type: ChallengeType, result: ActionResult, success: boolean): string {
    if (success) {
      return '✅ Hoàn thành!';
    }

    const messages: Record<ChallengeType, string> = {
      blink: `Chớp mắt ${result.value || 0}/${2} lần`,
      smile: result.detected ? 'Cười tươi hơn nữa!' : 'Hãy cười!',
      turnLeft: result.detected ? 'Giữ nguyên...' : 'Quay mặt sang trái',
      turnRight: result.detected ? 'Giữ nguyên...' : 'Quay mặt sang phải',
      lookUp: result.detected ? 'Giữ nguyên...' : 'Nhìn lên trên',
      lookDown: result.detected ? 'Giữ nguyên...' : 'Nhìn xuống dưới',
      mouthOpen: result.detected ? 'Giữ nguyên...' : 'Mở miệng rộng',
      nodHead: result.detected ? 'Tiếp tục...' : 'Gật đầu',
      shakeHead: result.detected ? 'Tiếp tục...' : 'Lắc đầu',
    };

    return messages[type] || 'Đang kiểm tra...';
  }

  reset() {
    this.startTime = 0;
    this.validationHistory = [];
    this.stableFrames = 0;
    actionDetector.resetBlinkCount();
  }

  getValidationHistory(): ActionResult[] {
    return this.validationHistory;
  }
}

export const challengeValidator = new ChallengeValidator();
export default challengeValidator;
