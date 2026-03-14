import { useState } from 'react';
import StepSelectDoc from '../components/ekyc/StepSelectDoc';
import GuideModal from '../components/ekyc/GuideModal';
import StepCapture from '../components/ekyc/StepCapture';
import StepResult from '../components/ekyc/StepResult';
import useEkyc from '../hooks/useEkyc';

type Screen = 'select' | 'guide' | 'front' | 'back' | 'face' | 'processing' | 'result';

export default function EkycFlowPage() {
  const [screen, setScreen] = useState<Screen>('select');
  const [_docType, setDocType] = useState(-1);
  const [docLabel, setDocLabel] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [files, setFiles] = useState<{ front?: File; back?: File; face?: File }>({});
  const { result, runEkyc, setResult } = useEkyc();

  const handleSelectDoc = (type: number, label: string) => {
    setDocType(type);
    setDocLabel(label);
    setShowGuide(true);
  };

  const handleStartCapture = () => {
    setShowGuide(false);
    setScreen('front');
  };

  const handleFront = (file: File) => {
    setFiles(p => ({ ...p, front: file }));
    setScreen('back');
  };

  const handleBack = (file: File) => {
    setFiles(p => ({ ...p, back: file }));
    setScreen('face');
  };

  const handleFace = async (file: File) => {
    const updated = { ...files, face: file };
    setFiles(updated);
    setScreen('processing');
    await runEkyc(updated.front!, updated.back!, file);
    setScreen('result');
  };

  const handleReset = () => {
    setScreen('select');
    setFiles({});
    setResult(null);
    setShowGuide(false);
  };


  return (
    <div
      className="min-h-screen text-white relative"
      style={{ background: 'linear-gradient(135deg, #0d1f2d 0%, #0a2a3a 50%, #0d1f2d 100%)' }}
    >
      {/* Dot pattern background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #00d4a0 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Language selector */}
      <div className="absolute top-4 right-4 z-10">
        <select className="bg-white text-gray-800 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer">
          <option>Vietnam</option>
          <option>English</option>
        </select>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {screen === 'select' && (
          <StepSelectDoc onSelect={handleSelectDoc} />
        )}

        {screen === 'front' && (
          <StepCapture
            title="Chụp mặt trước"
            step={1}
            onNext={handleFront}
            onGuide={() => setShowGuide(true)}
            facingMode="environment"
          />
        )}

        {screen === 'back' && (
          <StepCapture
            title="Chụp mặt sau"
            step={2}
            onNext={handleBack}
            onGuide={() => setShowGuide(true)}
            facingMode="environment"
          />
        )}

        {screen === 'face' && (
          <StepCapture
            title="Chụp khuôn mặt"
            step={3}
            onNext={handleFace}
            facingMode="user"
          />
        )}

        {screen === 'processing' && (
          <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <svg className="animate-spin w-12 h-12 text-[#00d4a0]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-white font-semibold text-lg">Đang xử lý...</p>
            <p className="text-gray-400 text-sm">VNPT AI đang phân tích giấy tờ của bạn</p>
          </div>
        )}

        {screen === 'result' && result && (
          <StepResult result={result} onReset={handleReset} />
        )}
      </div>

      {/* Guide modal */}
      {showGuide && (
        <GuideModal
          docLabel={docLabel}
          onStart={handleStartCapture}
          onClose={() => {
            setShowGuide(false);
            if (screen === 'select') setScreen('select');
          }}
        />
      )}
    </div>
  );
}
