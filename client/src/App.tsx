import { lazy, Suspense, useEffect, useState } from 'react';
import { LangProvider } from './i18n';
import { useExternalScripts } from './hooks/useExternalScripts';

const EkycFlowPage = lazy(() => import('./pages/EkycFlowPage'));

function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState('Đang khởi động...');

  useEffect(() => {
    const steps = [
      { to: 30, label: 'Đang tải tài nguyên...', delay: 0 },
      { to: 60, label: 'Đang khởi tạo ứng dụng...', delay: 400 },
      { to: 85, label: 'Chuẩn bị giao diện...', delay: 900 },
      { to: 95, label: 'Sắp xong...', delay: 1400 },
    ];
    steps.forEach(({ to, label, delay }) => {
      setTimeout(() => {
        setProgress(to);
        setLabel(label);
      }, delay);
    });
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8"
      style={{ background: 'linear-gradient(135deg, #0d1f2d 0%, #0a2a3a 50%, #0d1f2d 100%)' }}
    >
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #00d4a0 1px, transparent 1px)', backgroundSize: '30px 30px' }}
      />
      {/* Logo / Icon */}
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-xs px-6">
        <div className="w-16 h-16 rounded-2xl bg-[#00d4a0]/20 border border-[#00d4a0]/40 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#00d4a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-lg">eKYC Of Intrust Demo</p>
          <p className="text-gray-400 text-sm mt-1">{label}</p>
        </div>
        {/* Progress bar */}
        <div className="w-full">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Đang tải</span>
            <span style={{ color: '#00d4a0' }}>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #00d4a0, #00bf8f)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { hasError, failedScripts } = useExternalScripts();

  return (
    <LangProvider>
      <Suspense fallback={<LoadingScreen />}>
        <EkycFlowPage />
      </Suspense>
      {hasError && (
        <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3 bg-red-900/90 border border-red-500/40 rounded-xl px-4 py-3 text-sm">
          <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span className="text-red-300 flex-1">Không tải được: {failedScripts.join(', ')}</span>
          <button onClick={() => window.location.reload()} className="text-[#00d4a0] font-bold shrink-0">Thử lại</button>
        </div>
      )}
    </LangProvider>
  );
}

export default App;
