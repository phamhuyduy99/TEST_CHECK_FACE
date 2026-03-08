interface ChallengeDisplayProps {
  challenge: {
    type: string;
    instruction: string;
    duration: number;
  } | null;
  progress: number;
  completed: boolean;
}

export default function ChallengeDisplay({ challenge, progress, completed }: ChallengeDisplayProps) {
  if (!challenge) return null;

  return (
    <div className="absolute top-4 left-4 right-4 z-10">
      <div
        className={`p-4 rounded-lg shadow-2xl transition-all ${
          completed
            ? 'bg-green-500 text-white scale-105'
            : 'bg-blue-500 text-white animate-pulse'
        }`}
      >
        <div className="text-2xl font-bold mb-2">{challenge.instruction}</div>
        
        <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {completed && (
          <div className="mt-2 text-lg font-bold animate-bounce">
            ✅ Hoàn thành!
          </div>
        )}
      </div>
    </div>
  );
}
