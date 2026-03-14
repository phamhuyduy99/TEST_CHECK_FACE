import { lazy, Suspense } from 'react';

const EkycFlowPage = lazy(() => import('./pages/EkycFlowPage'));

function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1f2d' }}>
          <svg className="animate-spin w-10 h-10 text-[#00d4a0]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      }
    >
      <EkycFlowPage />
    </Suspense>
  );
}

export default App;
