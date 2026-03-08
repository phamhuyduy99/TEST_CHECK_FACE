/**
 * CHALLENGE TYPES ENUM
 * Định nghĩa các loại thử thách liveness detection
 */

export enum ChallengeType {
  BLINK = 'BLINK', // ✅ CÓ THỂ DETECT - Eye Aspect Ratio (EAR)
  SMILE = 'SMILE', // ✅ CÓ THỂ DETECT - Mouth width/height ratio
  TURN_LEFT = 'TURN_LEFT', // ✅ CÓ THỂ DETECT - Nose position relative to face center
  TURN_RIGHT = 'TURN_RIGHT', // ✅ CÓ THỂ DETECT - Nose position relative to face center
  NOD = 'NOD', // ✅ CÓ THỂ DETECT - Nose Y position change
  OPEN_MOUTH = 'OPEN_MOUTH', // ✅ CÓ THỂ DETECT - Mouth height
  TILT_LEFT = 'TILT_LEFT', // ✅ CÓ THỂ DETECT - Eye angle
  TILT_RIGHT = 'TILT_RIGHT', // ✅ CÓ THỂ DETECT - Eye angle
  CLOSE_EYES = 'CLOSE_EYES', // ✅ CÓ THỂ DETECT - Eye Aspect Ratio = 0
}

/**
 * FACEMESH LANDMARKS REFERENCE
 * TensorFlow.js FaceMesh cung cấp 468 landmarks
 *
 * Key landmarks for detection:
 * - Eyes: 159, 145 (left top/bottom), 386, 374 (right top/bottom)
 * - Mouth: 61, 291 (corners), 13, 14 (top/bottom lips), 0, 17 (center)
 * - Nose: 1 (tip), 168 (bridge)
 * - Face outline: 234 (left), 454 (right)
 */

export interface ChallengeConfig {
  type: ChallengeType;
  instruction: string;
  duration: number;
  canDetect: boolean;
  landmarks: number[];
  detectionMethod: string;
}

export const CHALLENGE_CONFIGS: Record<ChallengeType, ChallengeConfig> = {
  [ChallengeType.BLINK]: {
    type: ChallengeType.BLINK,
    instruction: '👁️ Chớp mắt 2 lần',
    duration: 3000,
    canDetect: true,
    landmarks: [159, 145, 386, 374],
    detectionMethod: 'Eye Aspect Ratio (EAR) < 0.2',
  },

  [ChallengeType.SMILE]: {
    type: ChallengeType.SMILE,
    instruction: '😊 Cười',
    duration: 2000,
    canDetect: true,
    landmarks: [61, 291, 13, 14],
    detectionMethod: 'Mouth width/height ratio > 2.5',
  },

  [ChallengeType.TURN_LEFT]: {
    type: ChallengeType.TURN_LEFT,
    instruction: '⬅️ Quay đầu sang trái',
    duration: 2000,
    canDetect: true,
    landmarks: [1, 234, 454],
    detectionMethod: 'Nose offset < -10% of face width',
  },

  [ChallengeType.TURN_RIGHT]: {
    type: ChallengeType.TURN_RIGHT,
    instruction: '➡️ Quay đầu sang phải',
    duration: 2000,
    canDetect: true,
    landmarks: [1, 234, 454],
    detectionMethod: 'Nose offset > 10% of face width',
  },

  [ChallengeType.NOD]: {
    type: ChallengeType.NOD,
    instruction: '⬇️ Gật đầu',
    duration: 2000,
    canDetect: true,
    landmarks: [1, 168],
    detectionMethod: 'Nose Y position change > 15px',
  },

  [ChallengeType.OPEN_MOUTH]: {
    type: ChallengeType.OPEN_MOUTH,
    instruction: '😮 Há miệng',
    duration: 2000,
    canDetect: true,
    landmarks: [13, 14, 0, 17],
    detectionMethod: 'Mouth height > 20px',
  },

  [ChallengeType.TILT_LEFT]: {
    type: ChallengeType.TILT_LEFT,
    instruction: '⬅️ Nghiêng đầu trái',
    duration: 2000,
    canDetect: true,
    landmarks: [159, 386],
    detectionMethod: 'Eye angle > 15 degrees',
  },

  [ChallengeType.TILT_RIGHT]: {
    type: ChallengeType.TILT_RIGHT,
    instruction: '➡️ Nghiêng đầu phải',
    duration: 2000,
    canDetect: true,
    landmarks: [159, 386],
    detectionMethod: 'Eye angle < -15 degrees',
  },

  [ChallengeType.CLOSE_EYES]: {
    type: ChallengeType.CLOSE_EYES,
    instruction: '😑 Nhắm mắt',
    duration: 2000,
    canDetect: true,
    landmarks: [159, 145, 386, 374],
    detectionMethod: 'Eye Aspect Ratio (EAR) ≈ 0',
  },
};

/**
 * KẾT LUẬN:
 *
 * ✅ CÓ THỂ DETECT CHÍNH XÁC (9/9):
 * - Chớp mắt, Cười, Quay đầu trái/phải, Gật đầu, Há miệng, Nghiêng đầu, Nhắm mắt
 *
 * 📊 TensorFlow.js FaceMesh cung cấp:
 * - 468 facial landmarks
 * - Real-time tracking (30-60 FPS)
 * - 3D coordinates (x, y, z)
 * - Hoạt động tốt trên browser
 *
 * 💡 HIỆN TẠI: Đang dùng mock detection (random 5-8s)
 * 🔧 CẦN LÀM: Implement logic verify thật cho từng challenge type
 */
