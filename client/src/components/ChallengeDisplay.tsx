import React from 'react';

interface ChallengeDisplayProps {
  challenge: {
    type: string;
    instruction: string;
    duration: number;
  } | null;
  progress: number;
  challengeCount?: number;
  totalChallenges?: number;
}

const ChallengeDisplay = React.memo(function ChallengeDisplay({
  challenge,
  progress,
  challengeCount = 0,
  totalChallenges = 5,
}: ChallengeDisplayProps) {
  if (!challenge) return null;

  return (
    <div className="absolute top-4 left-4 right-4 z-[100] pointer-events-none">
      <div
        className={`p-4 rounded-lg shadow-2xl transition-all ${
          progress >= 100 ? 'bg-green-500 text-white scale-105' : 'bg-blue-500 text-white animate-pulse'
        }`}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="text-2xl font-bold">{challenge.instruction}</div>
          <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
            {challengeCount}/{totalChallenges}
          </div>
        </div>

        <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              progress >= 100 ? 'bg-green-200' : 'bg-white'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {progress >= 100 && (
          <div className="mt-2 text-xl font-bold animate-bounce">✅ Hoàn thành! 🎉</div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these values change
  return (
    prevProps.challenge?.type === nextProps.challenge?.type &&
    prevProps.challenge?.instruction === nextProps.challenge?.instruction &&
    Math.floor(prevProps.progress / 5) === Math.floor(nextProps.progress / 5) && // Update every 5%
    prevProps.challengeCount === nextProps.challengeCount
  );
});

export default ChallengeDisplay;
