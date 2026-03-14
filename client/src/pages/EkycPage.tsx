import { useRef, useState } from 'react';
import useEkyc from '../hooks/useEkyc';
import EkycResultView from '../components/EkycResultView';
import WebcamCapture from '../components/WebcamCapture';

type Mode = 'full' | 'face';
type InputMode = 'upload' | 'camera';

interface FileState {
  front: File | null;
  back: File | null;
  face: File | null;
}

// ─── Upload input ─────────────────────────────────────────────────────────────
const FileInput = ({
  label, icon, file, onChange,
}: {
  label: string;
  icon: string;
  file: File | null;
  onChange: (f: File) => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => ref.current?.click()}
      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition min-h-[120px]"
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-xs sm:text-sm font-medium text-gray-600 text-center">{label}</span>
      {file ? (
        <>
          <span className="text-xs text-green-600 font-semibold">✅ Đã chọn</span>
          <span className="text-xs text-gray-400 truncate max-w-full px-2">{file.name}</span>
        </>
      ) : (
        <span className="text-xs text-gray-400">Nhấn để chọn ảnh</span>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
      />
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function EkycPage() {
  const [mode, setMode] = useState<Mode>('full');
  const [inputMode, setInputMode] = useState<InputMode>('camera');
  const [files, setFiles] = useState<FileState>({ front: null, back: null, face: null });
  const { loading, result, error, runEkyc, runFaceLiveness, setResult } = useEkyc();

  const setFile = (key: keyof FileState) => (f: File) => {
    setFiles(prev => ({ ...prev, [key]: f }));
    setResult(null);
  };

  const reset = () => {
    setFiles({ front: null, back: null, face: null });
    setResult(null);
  };

  const canSubmitFull = !!(files.front && files.back && files.face);
  const canSubmitFace = !!files.face;
  const canSubmit = mode === 'full' ? canSubmitFull : canSubmitFace;

  const handleSubmit = () => {
    if (mode === 'full' && canSubmitFull) runEkyc(files.front!, files.back!, files.face!);
    else if (mode === 'face' && canSubmitFace) runFaceLiveness(files.face!);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-start sm:items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-white">
          <h1 className="text-xl sm:text-2xl font-bold">🪪 VNPT eKYC</h1>
          <p className="text-indigo-200 text-xs sm:text-sm mt-0.5">Xác thực danh tính bằng AI</p>
        </div>

        <div className="p-4 sm:p-6 space-y-5">

          {/* Mode: full / face */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm">
            {([['full', '📄 Giấy tờ + Mặt'], ['face', '😊 Chỉ Liveness']] as [Mode, string][]).map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); reset(); }}
                className={`flex-1 py-2.5 font-medium transition ${mode === m ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Input mode: camera / upload */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 shrink-0">Nhập ảnh qua:</span>
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              {([['camera', '📷 Camera'], ['upload', '📁 Upload']] as [InputMode, string][]).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => { setInputMode(m); reset(); }}
                  className={`px-3 py-1.5 font-medium transition ${inputMode === m ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          {inputMode === 'camera' ? (
            <div className={`grid gap-3 ${mode === 'full' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 max-w-xs mx-auto w-full'}`}>
              {mode === 'full' && (
                <>
                  <WebcamCapture label="Mặt trước" icon="🪪" captured={files.front} onCapture={setFile('front')} />
                  <WebcamCapture label="Mặt sau"   icon="🔄" captured={files.back}  onCapture={setFile('back')}  />
                </>
              )}
              <WebcamCapture label="Chân dung" icon="🤳" captured={files.face} onCapture={setFile('face')} />
            </div>
          ) : (
            <div className={`grid gap-3 ${mode === 'full' ? 'grid-cols-3' : 'grid-cols-1 max-w-xs mx-auto w-full'}`}>
              {mode === 'full' && (
                <>
                  <FileInput label="Mặt trước" icon="🪪" file={files.front} onChange={setFile('front')} />
                  <FileInput label="Mặt sau"   icon="🔄" file={files.back}  onChange={setFile('back')}  />
                </>
              )}
              <FileInput label="Ảnh chân dung" icon="🤳" file={files.face} onChange={setFile('face')} />
            </div>
          )}

          {/* Progress indicator */}
          {mode === 'full' && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              {(['front', 'back', 'face'] as (keyof FileState)[]).map((k, i) => (
                <span key={k} className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${files[k] ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {files[k] ? '✓' : i + 1}
                  </span>
                  <span>{['Mặt trước', 'Mặt sau', 'Chân dung'][i]}</span>
                  {i < 2 && <span className="text-gray-300">→</span>}
                </span>
              ))}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className="w-full py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Đang xử lý VNPT AI...
              </>
            ) : (
              '🚀 Xác thực ngay'
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 flex gap-2">
              <span>❌</span>
              <span>{error}</span>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-700">📊 Kết quả xác thực</h2>
                <button onClick={reset} className="text-xs text-indigo-600 hover:underline">
                  Làm lại
                </button>
              </div>
              <EkycResultView result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
