import { useState } from 'react';

interface Props {
  onClose: () => void;
  onSave: (token: string) => void;
}

export default function TokenModal({ onClose, onSave }: Props) {
  const [token, setToken] = useState(() => localStorage.getItem('vnpt_access_token') ?? '');

  const handleSave = () => {
    const t = token.trim();
    if (!t) return;
    localStorage.setItem('vnpt_access_token', t);
    onSave(t);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0d2535] rounded-2xl p-6 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">Cập nhật Access Token</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Token hết hạn sau 8 tiếng. Lấy token mới tại{' '}
          <a
            href="https://ekyc.vnpt.vn"
            target="_blank"
            rel="noreferrer"
            className="text-[#00d4a0] underline"
          >
            ekyc.vnpt.vn
          </a>{' '}
          → Quản lý Token.
        </p>

        <textarea
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Dán access token vào đây..."
          rows={5}
          className="w-full bg-[#0a1a24] border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono resize-none focus:outline-none focus:border-[#00d4a0]/50 placeholder-gray-600"
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition"
          >
            Huỷ
          </button>
          <button
            onClick={handleSave}
            disabled={!token.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[#00d4a0] text-[#0d1f2d] text-sm font-bold hover:bg-[#00bf8f] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Lưu & Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
