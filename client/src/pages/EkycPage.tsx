import { useRef, useState } from 'react';
import useEkyc from '../hooks/useEkyc';
import EkycResultView from '../components/EkycResultView';

type Mode = 'full' | 'face';

interface FileState {
  front: File | null;
  back: File | null;
  face: File | null;
}

const FileInput = ({
  label, icon, file, onChange,
}: {
  label: string; icon: string; file: File | null; onChange: (f: File) => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => ref.current?.click()}
      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition"
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-sm font-medium text-gray-600">{label}</span>
      {file ? (
        <span className="text-xs text-green-600 font-semibold">✅ {file.name}</span>
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

export default function EkycPage() {
  const [mode, setMode] = useState<Mode>('full');
  const [files, setFiles] = useState<FileState>({ front: null, back: null, face: null });
  const { loading, result, error, runEkyc, runFaceLiveness, setResult } = useEkyc();

  const setFile = (key: keyof FileState) => (f: File) => {
    setFiles(prev => ({ ...prev, [key]: f }));
    setResult(null);
  };

  const canSubmitFull = !!(files.front && files.back && files.face);
  const canSubmitFace = !!files.face;

  const handleSubmit = () => {
    if (mode === 'full' && canSubmitFull) {
      runEkyc(files.front!, files.back!, files.face!);
    } else if (mode === 'face' && canSubmitFace) {
      runFaceLiveness(files.face!);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-indigo-700">🪪 VNPT eKYC</h1>
          <p className="text-sm text-gray-500 mt-1">Xác thực danh tính bằng AI - Powered by VNPT</p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button
            onClick={() => { setMode('full'); setResult(null); }}
            className={`flex-1 py-2 text-sm font-medium transition ${mode === 'full' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            📄 Giấy tờ + Khuôn mặt
          </button>
          <button
            onClick={() => { setMode('face'); setResult(null); }}
            className={`flex-1 py-2 text-sm font-medium transition ${mode === 'face' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            😊 Chỉ Liveness mặt
          </button>
        </div>

        {/* File inputs */}
        <div className={`grid gap-3 ${mode === 'full' ? 'grid-cols-3' : 'grid-cols-1'}`}>
          {mode === 'full' && (
            <>
              <FileInput label="Mặt trước" icon="🪪" file={files.front} onChange={setFile('front')} />
              <FileInput label="Mặt sau"   icon="🔄" file={files.back}  onChange={setFile('back')}  />
            </>
          )}
          <FileInput label="Ảnh chân dung" icon="🤳" file={files.face} onChange={setFile('face')} />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || (mode === 'full' ? !canSubmitFull : !canSubmitFace)}
          className="w-full py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="animate-spin">⏳</span> Đang xử lý...</>
          ) : (
            '🚀 Xác thực ngay'
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            ❌ {error}
          </div>
        )}

        {/* Result */}
        {result && <EkycResultView result={result} />}
      </div>
    </div>
  );
}
