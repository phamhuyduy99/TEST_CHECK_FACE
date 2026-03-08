import React, { useEffect, useState } from 'react';
import { Challenge } from '../services/challengeManager';
import { ValidationResult } from '../services/challengeValidator';

interface ChallengeUIProps {
  challenge: Challenge | null;
  validation: ValidationResult | null;
  allChallenges: Challenge[];
  currentIndex: number;
  onComplete?: () => void;
}

const ChallengeUI: React.FC<ChallengeUIProps> = ({
  challenge,
  validation,
  allChallenges,
  currentIndex,
  onComplete,
}) => {
  const [countdown, setCountdown] = useState(3);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!challenge) return;

    // Countdown 3s trước khi bắt đầu
    setIsReady(false);
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [challenge]);

  useEffect(() => {
    if (validation?.success && onComplete) {
      setTimeout(onComplete, 500);
    }
  }, [validation?.success, onComplete]);

  if (!challenge) {
    return null;
  }

  const getStatusColor = () => {
    if (!validation) return 'bg-gray-500';
    if (validation.success) return 'bg-green-500';
    if (validation.confidence > 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = () => {
    if (!validation) return '⏳';
    if (validation.success) return '✅';
    if (validation.confidence > 0.5) return '⚠️';
    return '❌';
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-96">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border-2 border-gray-200">
        {/* Header */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">🎯 Xác thực khuôn mặt</h3>
          <p className="text-sm text-gray-600 mt-1">
            Thử thách {currentIndex + 1}/{allChallenges.length}
          </p>
        </div>

        {/* Countdown hoặc Challenge */}
        {!isReady ? (
          <div className="text-center py-8">
            <div className="text-6xl font-bold text-blue-600 animate-pulse">{countdown}</div>
            <p className="text-gray-600 mt-4">Chuẩn bị...</p>
          </div>
        ) : (
          <>
            {/* Challenge Instruction */}
            <div className="text-center mb-4">
              <div className="text-6xl mb-3 animate-bounce">{challenge.icon}</div>
              <p className="text-2xl font-bold text-gray-800">{challenge.instruction}</p>
            </div>

            {/* Validation Message */}
            {validation && (
              <div
                className={`text-center py-2 px-4 rounded-lg ${getStatusColor()} text-white font-semibold mb-4`}
              >
                {getStatusIcon()} {validation.message}
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Tiến độ</span>
                <span>{Math.round(validation?.progress || 0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getStatusColor()}`}
                  style={{ width: `${validation?.progress || 0}%` }}
                />
              </div>
            </div>

            {/* Confidence Meter */}
            {validation && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Độ chính xác</span>
                  <span>{Math.round(validation.confidence * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
                    style={{ width: `${validation.confidence * 100}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Challenge List */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-2">
            {allChallenges.map((c, index) => (
              <div
                key={c.id}
                className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                  index === currentIndex
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : index < currentIndex
                      ? 'bg-green-100'
                      : 'bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{c.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{c.instruction}</span>
                </div>
                <span className="text-lg">
                  {index < currentIndex ? '✅' : index === currentIndex ? '🔄' : '⏳'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeUI;
