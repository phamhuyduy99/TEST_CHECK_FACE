// Challenge Manager - Quản lý các thử thách ngẫu nhiên
export type ChallengeType =
  | 'blink'
  | 'smile'
  | 'turnLeft'
  | 'turnRight'
  | 'lookUp'
  | 'lookDown'
  | 'mouthOpen'
  | 'nodHead'
  | 'shakeHead';

export interface Challenge {
  id: string;
  type: ChallengeType;
  instruction: string;
  icon: string;
  duration: number; // ms
  threshold: number;
}

export type SecurityLevel = 'low' | 'medium' | 'high';

class ChallengeManager {
  private challenges: Challenge[] = [];
  private currentIndex: number = 0;
  private level: SecurityLevel = 'medium';

  private readonly challengePool: Record<ChallengeType, Challenge> = {
    blink: {
      id: 'blink',
      type: 'blink',
      instruction: 'Chớp mắt 2 lần',
      icon: '😉',
      duration: 3000,
      threshold: 2,
    },
    smile: {
      id: 'smile',
      type: 'smile',
      instruction: 'Cười tươi',
      icon: '😊',
      duration: 2000,
      threshold: 0.4,
    },
    turnLeft: {
      id: 'turnLeft',
      type: 'turnLeft',
      instruction: 'Quay mặt sang TRÁI',
      icon: '👈',
      duration: 2000,
      threshold: -20,
    },
    turnRight: {
      id: 'turnRight',
      type: 'turnRight',
      instruction: 'Quay mặt sang PHẢI',
      icon: '👉',
      duration: 2000,
      threshold: 20,
    },
    lookUp: {
      id: 'lookUp',
      type: 'lookUp',
      instruction: 'Nhìn LÊN',
      icon: '👆',
      duration: 2000,
      threshold: -15,
    },
    lookDown: {
      id: 'lookDown',
      type: 'lookDown',
      instruction: 'Nhìn XUỐNG',
      icon: '👇',
      duration: 2000,
      threshold: 15,
    },
    mouthOpen: {
      id: 'mouthOpen',
      type: 'mouthOpen',
      instruction: 'Mở miệng rộng',
      icon: '😮',
      duration: 2000,
      threshold: 0.6,
    },
    nodHead: {
      id: 'nodHead',
      type: 'nodHead',
      instruction: 'Gật đầu',
      icon: '🙂',
      duration: 3000,
      threshold: 15,
    },
    shakeHead: {
      id: 'shakeHead',
      type: 'shakeHead',
      instruction: 'Lắc đầu',
      icon: '🙃',
      duration: 3000,
      threshold: 15,
    },
  };

  setLevel(level: SecurityLevel) {
    this.level = level;
  }

  generateChallenges(): Challenge[] {
    const pools: Record<SecurityLevel, ChallengeType[]> = {
      low: ['blink', 'smile'],
      medium: ['blink', 'smile', 'turnLeft', 'turnRight'],
      high: ['blink', 'smile', 'turnLeft', 'turnRight', 'lookUp', 'mouthOpen'],
    };

    const counts: Record<SecurityLevel, number> = {
      low: 1,
      medium: 2,
      high: 3,
    };

    const pool = pools[this.level];
    const count = counts[this.level];

    // Shuffle và chọn ngẫu nhiên
    const shuffled = this.shuffleArray([...pool]);
    const selected = shuffled.slice(0, count);

    this.challenges = selected.map(type => this.challengePool[type]);
    this.currentIndex = 0;

    return this.challenges;
  }

  getCurrentChallenge(): Challenge | null {
    if (this.currentIndex >= this.challenges.length) {
      return null;
    }
    return this.challenges[this.currentIndex];
  }

  nextChallenge(): boolean {
    this.currentIndex++;
    return this.currentIndex < this.challenges.length;
  }

  getAllChallenges(): Challenge[] {
    return this.challenges;
  }

  getProgress(): { current: number; total: number; percentage: number } {
    return {
      current: this.currentIndex,
      total: this.challenges.length,
      percentage: (this.currentIndex / this.challenges.length) * 100,
    };
  }

  reset() {
    this.challenges = [];
    this.currentIndex = 0;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const challengeManager = new ChallengeManager();
export default challengeManager;
