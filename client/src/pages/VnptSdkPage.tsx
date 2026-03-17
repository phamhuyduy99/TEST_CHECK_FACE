import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import { getToken } from '../services/apiService';

declare const ekycsdk: {
  init: (config: object, cb: (res: unknown) => void) => void;
  viewResult: (typeDoc: number, res: unknown) => void;
};

const SDK_JS  = '/ekyc-web-sdk-2.1.0.js';
const SDK_CSS = '/ekyc-web-sdk-2.1.0.css';

function loadAsset(tag: 'script' | 'link', id: string, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) { resolve(); return; }
    if (tag === 'script') {
      const el = document.createElement('script');
      el.id = id; el.src = src; el.async = true;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error(`Failed: ${src}`));
      document.head.appendChild(el);
    } else {
      const el = document.createElement('link');
      el.id = id; el.rel = 'stylesheet'; el.href = src;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error(`Failed: ${src}`));
      document.head.appendChild(el);
    }
  });
}

export default function VnptSdkPage() {
  const navigate = useNavigate();
  const { lang } = useT();
  const initialized = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Load SDK file từ public/ trước, sau đó init
    (async () => {
      try {
        await Promise.all([
          loadAsset('script', 'vnpt_ekyc_sdk', SDK_JS),
          loadAsset('link', 'vnpt_ekyc_styles', SDK_CSS),
        ]);
      } catch {
        setError('Không tìm thấy file SDK. Đặt ekyc-web-sdk-2.1.0.js vào thư mục client/public/');
        return;
      }

      const access_token = await getToken();

      ekycsdk.init(
        {
          BACKEND_URL: 'https://api.idg.vnpt.vn',
          TOKEN_KEY: import.meta.env.VITE_VNPT_TOKEN_KEY ?? '',
          TOKEN_ID: import.meta.env.VITE_VNPT_TOKEN_ID ?? '',
          AUTHORIZION: access_token ?? '',
          PARRENT_ID: 'ekyc_sdk_intergrated',
          FLOW_TYPE: 'DOCUMENT',
          SHOW_RESULT: true,
          SHOW_HELP: true,
          SHOW_TRADEMARK: false,
          CHECK_LIVENESS_CARD: true,
          CHECK_LIVENESS_FACE: true,
          CHECK_MASKED_FACE: true,
          COMPARE_FACE: true,
          LANGUAGE: lang,
          LIST_ITEM: [-1, 5, 6, 7, 9],
          TYPE_DOCUMENT: 99,
          USE_WEBCAM: true,
          USE_UPLOAD: false,
          ADVANCE_LIVENESS_FACE: false,
        },
        res => {
          console.log('[VnptSdk] result:', res);
          ekycsdk.viewResult((res as { type_document: number }).type_document, res);
        }
      );
    })();

    return () => {
      document.getElementById('vnpt_ekyc')?.remove();
    };
  }, []);

  return (
    <div
      className="min-h-screen text-white relative"
      style={{ background: 'linear-gradient(135deg, #0d1f2d 0%, #0a2a3a 50%, #0d1f2d 100%)' }}
    >
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-white transition"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {lang === 'vi' ? 'Quay lại' : 'Back'}
      </button>

      {error ? (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : (
        <div id="ekyc_sdk_intergrated" className="relative z-10 pt-14" />
      )}
    </div>
  );
}
