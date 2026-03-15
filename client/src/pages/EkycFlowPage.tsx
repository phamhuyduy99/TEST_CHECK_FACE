import { useState } from 'react';
import StepSelectDoc from '../components/ekyc/StepSelectDoc';
import GuideModal from '../components/ekyc/GuideModal';
import FaceGuideModal from '../components/ekyc/FaceGuideModal';
import StepCapture from '../components/ekyc/StepCapture';
import StepFaceCapture from '../components/ekyc/StepFaceCapture';
import StepResult from '../components/ekyc/StepResult';
import useEkyc from '../hooks/useEkyc';
import { useT } from '../i18n';

type Screen = 'select' | 'guide' | 'front' | 'back' | 'face' | 'processing' | 'result';

export default function EkycFlowPage() {
  const [screen, setScreen] = useState<Screen>('select');
  const [_docType, setDocType] = useState(-1);
  const [docLabel, setDocLabel] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [showFaceGuide, setShowFaceGuide] = useState(false);
  const [faceReady, setFaceReady] = useState(false);
  const [files, setFiles] = useState<{ front?: File; back?: File; face?: File }>({});
  const { result, error, runEkyc, setResult } = useEkyc();
  const { lang, setLang, t } = useT();

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
    setShowFaceGuide(true);
    setFaceReady(false);
    setScreen('face');
  };

  const handleFace = async (file: File) => {
    const updated = { ...files, face: file };
    setFiles(updated);
    setScreen('processing');
    await runEkyc(updated.front!, updated.back!, file);
    setScreen('result');
  };

  const handleRetryFromError = () => {
    setScreen('face');
    setResult(null);
  };

  const handleReset = () => {
    setScreen('select');
    setFiles({});
    setResult(null);
    setShowGuide(false);
    setShowFaceGuide(false);
    setFaceReady(false);
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
      <div className="absolute top-4 right-4 z-20 flex rounded-lg overflow-hidden border border-white/20">
        <button
          onClick={() => setLang('vi')}
          className={`px-3 py-2 text-sm font-medium transition ${
            lang === 'vi' ? 'bg-[#00d4a0] text-[#0d1f2d]' : 'bg-white/10 text-white'
          }`}
        >
          VI
        </button>
        <button
          onClick={() => setLang('en')}
          className={`px-3 py-2 text-sm font-medium transition ${
            lang === 'en' ? 'bg-[#00d4a0] text-[#0d1f2d]' : 'bg-white/10 text-white'
          }`}
        >
          EN
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {screen === 'select' && <StepSelectDoc onSelect={handleSelectDoc} />}

        {screen === 'front' && (
          <StepCapture
            title={t.captureFront}
            step={1}
            onNext={handleFront}
            onGuide={() => setShowGuide(true)}
            facingMode="environment"
          />
        )}

        {screen === 'back' && (
          <StepCapture
            title={t.captureBack}
            step={2}
            onNext={handleBack}
            onGuide={() => setShowGuide(true)}
            facingMode="environment"
          />
        )}

        {screen === 'face' && faceReady && (
          <StepFaceCapture
            onNext={handleFace}
            onGuide={() => setShowFaceGuide(true)}
            step={3}
            totalSteps={4}
          />
        )}

        {screen === 'processing' && (
          <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <svg className="animate-spin w-12 h-12 text-[#00d4a0]" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-white font-semibold text-lg">{t.processing}</p>
            <p className="text-gray-400 text-sm">{t.processingDesc}</p>
          </div>
        )}

        {screen === 'result' && result && (
          <StepResult result={result} files={files} onReset={handleReset} />
        )}

        {screen === 'result' && !result && (
          <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-xl mb-2">{t.errorTitle}</p>
              <p className="text-red-400 text-sm max-w-sm">{error || t.errorDefault}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRetryFromError}
                className="px-6 py-2.5 rounded-lg font-semibold text-sm"
                style={{ background: '#00d4a0', color: '#0d1f2d' }}
              >
                {t.retry}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-lg font-semibold text-sm border border-white/30 text-white"
              >
                {t.home}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Face guide modal */}
      {showFaceGuide && (
        <FaceGuideModal
          onConfirm={() => {
            setShowFaceGuide(false);
            setFaceReady(true);
          }}
          onClose={() => {
            setShowFaceGuide(false);
            setScreen('back');
          }}
        />
      )}

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
