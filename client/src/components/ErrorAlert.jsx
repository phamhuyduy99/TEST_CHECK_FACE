export default function ErrorAlert({ error, onClose }) {
  if (!error) return null;

  return (
    <div className="mb-4 p-3 sm:p-4 bg-red-50 border-2 border-red-300 rounded-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-base sm:text-lg font-bold text-red-800 mb-2">
            ❌ {error.title}
          </h3>
          <p className="text-sm sm:text-base text-red-700 mb-2">{error.message}</p>
          {error.details && (
            <ul className="list-disc list-inside text-xs sm:text-sm text-red-600 space-y-1">
              {Array.isArray(error.details) ? (
                error.details.map((detail, idx) => <li key={idx}>{detail}</li>)
              ) : (
                <li>{error.details}</li>
              )}
            </ul>
          )}
          <button
            onClick={onClose}
            className="mt-3 text-xs sm:text-sm bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-red-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
