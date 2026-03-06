import { useState, useEffect } from 'react';

const INSTRUCTIONS = [
  { text: '👈 Quay mặt sang TRÁI', duration: 1500 },
  { text: '👉 Quay mặt sang PHẢI', duration: 1500 },
  { text: '😊 MỈM CƯỜI', duration: 1000 },
  { text: '😉 CHỚP MẮT', duration: 1000 },
];

const TOTAL_DURATION = INSTRUCTIONS.reduce((sum, inst) => sum + inst.duration, 0);

interface LivenessGuideProps {
  isRecording: boolean;
  onComplete: () => void;
}

export default function LivenessGuide({ isRecording, onComplete }: LivenessGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Math.ceil(TOTAL_DURATION / 1000));

  // Reset state khi không recording
  useEffect(() => {
    if (!isRecording) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentStep(0);
      setTimeLeft(Math.ceil(TOTAL_DURATION / 1000));
    }
  }, [isRecording]);

  // Timer cho recording
  useEffect(() => {
    if (!isRecording) return;

    let stepTimer: ReturnType<typeof setTimeout>;
    const countdownTimer: ReturnType<typeof setInterval> = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Chuyển bước hướng dẫn
    const scheduleNextStep = (stepIndex: number) => {
      if (stepIndex >= INSTRUCTIONS.length) return;

      stepTimer = setTimeout(() => {
        setCurrentStep(stepIndex + 1);
        scheduleNextStep(stepIndex + 1);
      }, INSTRUCTIONS[stepIndex].duration);
    };

    scheduleNextStep(0);

    return () => {
      clearTimeout(stepTimer);
      clearInterval(countdownTimer);
    };
  }, [isRecording, onComplete]);

  if (!isRecording) return null;

  const currentInstruction = INSTRUCTIONS[currentStep] || INSTRUCTIONS[INSTRUCTIONS.length - 1];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-50">
      {/* Hướng dẫn động tác */}
      <div className="bg-black bg-opacity-70 text-white px-6 py-4 rounded-2xl mb-4 animate-pulse">
        <p className="text-2xl sm:text-4xl font-bold text-center">{currentInstruction.text}</p>
      </div>

      {/* Đếm ngược */}
      <div className="bg-red-600 text-white px-4 py-2 rounded-full">
        <p className="text-xl sm:text-2xl font-bold">⏱️ {timeLeft}s</p>
      </div>
    </div>
  );
}
