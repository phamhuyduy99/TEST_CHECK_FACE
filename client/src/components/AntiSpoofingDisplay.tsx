import React from 'react';

interface AntiSpoofingDisplayProps {
  score: number;
  details?: Array<{
    name: string;
    score: number;
    passed: boolean;
    reason: string;
  }>;
  show: boolean;
}

const AntiSpoofingDisplay: React.FC<AntiSpoofingDisplayProps> = ({ score, details, show }) => {
  if (!show) return null;

  const getScoreColor = (score: number) => {
    if (score > 0.7) return 'text-green-500';
    if (score > 0.4) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreIcon = (score: number) => {
    if (score > 0.7) return '✅';
    if (score > 0.4) return '⚠️';
    return '❌';
  };

  return (
    <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-sm max-w-xs">
      <div className="font-bold mb-2 flex items-center gap-2">
        <span>🛡️ Anti-Spoofing</span>
        <span className={getScoreColor(score)}>
          {getScoreIcon(score)} {(score * 100).toFixed(0)}%
        </span>
      </div>

      {details && details.length > 0 && (
        <div className="space-y-1 text-xs">
          {details.map((detail, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2">
              <span className="truncate">{detail.name}</span>
              <span className={detail.passed ? 'text-green-400' : 'text-red-400'}>
                {detail.passed ? '✓' : '✗'} {(detail.score * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AntiSpoofingDisplay;
