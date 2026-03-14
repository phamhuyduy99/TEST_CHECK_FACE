import { lazy, Suspense } from 'react';

const EkycPage = lazy(() => import('./pages/EkycPage'));

function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Đang tải...</p>
          </div>
        </div>
      }
    >
      <EkycPage />
    </Suspense>
  );
}

export default App;
