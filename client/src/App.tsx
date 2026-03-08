import { lazy, Suspense } from 'react';

const Camera = lazy(() => import('./Camera'));
const FaceMeshTest = lazy(() => import('./FaceMeshTest'));

function App() {
  const isTest = window.location.search.includes('test');

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-xl font-bold text-gray-700">Đang tải...</p>
          </div>
        </div>
      }
    >
      {isTest ? <FaceMeshTest /> : <Camera />}
    </Suspense>
  );
}

export default App;
