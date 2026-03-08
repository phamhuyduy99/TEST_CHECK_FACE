/**
 * Response Time Analyzer
 * Phát hiện video replay qua phân tích thời gian phản hồi
 */

interface ResponseTimeResult {
  isNatural: boolean;
  responseTime: number;
  reason?: string;
}

class ResponseTimeAnalyzer {
  private challengeStartTimes: Map<string, number> = new Map();

  /**
   * Bắt đầu đo thời gian challenge
   */
  startChallenge(challengeId: string): void {
    this.challengeStartTimes.set(challengeId, performance.now());
  }

  /**
   * Kết thúc và phân tích thời gian phản hồi
   */
  analyzeResponseTime(challengeId: string): ResponseTimeResult {
    const startTime = this.challengeStartTimes.get(challengeId);
    if (!startTime) {
      return {
        isNatural: false,
        responseTime: 0,
        reason: 'No start time recorded',
      };
    }

    const responseTime = performance.now() - startTime;
    this.challengeStartTimes.delete(challengeId);

    // Video replay: < 500ms (phản ứng tức thì)
    if (responseTime < 500) {
      return {
        isNatural: false,
        responseTime,
        reason: 'Quá nhanh - Video replay',
      };
    }

    // Video chậm/không phản hồi: > 8000ms
    if (responseTime > 8000) {
      return {
        isNatural: false,
        responseTime,
        reason: 'Quá chậm - Timeout',
      };
    }

    // Người thật: 800ms - 8000ms
    return {
      isNatural: true,
      responseTime,
    };
  }

  /**
   * Reset tất cả
   */
  reset(): void {
    this.challengeStartTimes.clear();
  }
}

export default new ResponseTimeAnalyzer();
