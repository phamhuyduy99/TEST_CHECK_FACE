import React from 'react';

const ChallengeDisplay = ({ currentChallenge, progress }) => {
  if (!currentChallenge) {
    return progress?.completed === progress?.total && progress?.total > 0 ? (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎉</span>
          <span className="font-bold">Hoàn thành tất cả thử thách!</span>
        </div>
      </div>
    ) : null;
  }

  const timeRemaining = Math.ceil(currentChallenge.timeRemaining / 1000);
  const isUrgent = timeRemaining <= 2;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className={`bg-gradient-to-r ${isUrgent ? 'from-red-500 to-red-600' : 'from-blue-500 to-purple-600'} text-white px-8 py-4 rounded-2xl shadow-2xl transition-all duration-300 ${isUrgent ? 'animate-pulse scale-110' : ''}`}>
        <div className="flex flex-col items-center gap-2">
          <div className="text-sm font-semibold opacity-90">
            Thử thách {progress?.completed + 1}/{progress?.total}
          </div>
          <div className="text-2xl font-bold">
            {currentChallenge.instruction}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-48 h-2 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-1000"
                style={{ width: `${(currentChallenge.timeRemaining / currentChallenge.duration) * 100}%` }}
              />
            </div>
            <span className={`text-lg font-mono font-bold ${isUrgent ? 'text-yellow-300' : ''}`}>
              {timeRemaining}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDisplay;
