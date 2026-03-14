import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    FaceVNPTBrowserSDK: { init: () => Promise<void> };
    ekycsdk: {
      init: (config: object, callback: (res: VnptEkycResult) => void, afterFlow?: (data: VnptEkycResult) => void) => void;
      viewResult: (typeDocument: number, data: VnptEkycResult) => void;
    };
  }
}

export interface VnptEkycResult {
  type_document: number;
  liveness_face?: {
    liveness: 'success' | 'failure';
    liveness_msg: string;
    is_eye_open: string;
    blur_face?: string;
  };
  liveness_card_front?: {
    liveness: 'success' | 'failure';
    liveness_msg: string;
    face_swapping: boolean;
    fake_liveness: boolean;
  };
  liveness_card_back?: {
    liveness: 'success' | 'failure';
    liveness_msg: string;
  };
  ocr?: {
    msg: string;
    id: string;
    name: string;
    birth_day: string;
    gender: string;
    nationality: string;
    origin_location: string;
    recent_location: string;
    issue_date: string;
    issue_place: string;
    valid_date: string;
    card_type: string;
    id_fake_warning: string;
    tampering?: { is_legal: string; warning: string[] };
  };
  compare?: {
    result: string;
    msg: 'MATCH' | 'NOMATCH';
    prob: number;
  };
  masked?: { masked: string };
  hash_img?: { img_front: string; img_back: string; img_face: string };
  base64_face_img?: string;
  base64_doc_img?: string;
}

interface VnptEkycProps {
  onResult?: (result: VnptEkycResult) => void;
  flowType?: 'FACE' | 'DOCUMENT';
}

const SDK_JS_URL = 'https://ekyc-web.icenter.ai/lib/ekyc-web-sdk-2.1.0.js';
const SDK_CSS_URL = 'https://ekyc-web.icenter.ai/lib/ekyc-web-sdk-2.1.0.css';

const INIT_CONFIG = {
  BACKEND_URL: '',
  TOKEN_KEY: 'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIFJQXuzmgY7kYE5/sPIzzlycObztMNCc7SHXj9F3HpM3sKph28N6H5CBprnvzCBcyBWfDU678Ikyoep63nOBqkCAwEAAQ==',
  TOKEN_ID: '3771f04f-3161-0794-e063-63199f0a9b41',
  AUTHORIZION: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cmFuc2FjdGlvbl9pZCI6IjEzOGZkOGYyLWQ4MTQtNGM4Mi1iOTM3LWM5ZTJjYTVmM2I4NyIsInN1YiI6IjM3NzFlZTA3LTU0YjYtMDE2Yi1lMDYzLTYzMTk5ZjBhOTI5ZiIsImF1ZCI6WyJyZXN0c2VydmljZSJdLCJ1c2VyX25hbWUiOiJ0aGFuZ2R0QGdtYWlsLmNvbSIsInNjb3BlIjpbInJlYWQiXSwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3QiLCJuYW1lIjoidGhhbmdkdEBnbWFpbC5jb20iLCJleHAiOjE3NzM0OTEzOTUsInV1aWRfYWNjb3VudCI6IjM3NzFlZTA3LTU0YjYtMDE2Yi1lMDYzLTYzMTk5ZjBhOTI5ZiIsImF1dGhvcml0aWVzIjpbIlVTRVIiXSwianRpIjoiMDMwOTUzNjEtY2RiYS00ZjkzLWEzZDktNDYxYWIyNzBlMGRjIiwiY2xpZW50X2lkIjoiOF9ob3VyIn0.fpGvMHhTfgkULo5T2VwPhjugKyHICjvgVbtmvuEI2yY3ANUAN8N9N_FuaX-kz3fij7XiY9VxKmA0aIS5g-_1p50l6HrpJ7jeuRUThDGiSMN8vULSr_xtK1LclzqJzjpqy8ULCbi0YcHWY5zyCU_Y3liSHFeseiqAU0GO1osRYDdrhrWFZwB1HCWbVJYEbSKhUqTB9-few6uii4pwdiu_kqISodFyc_BUUQWWMr5QsdVIT09xrxeF44S1Unw6srzPLZtVLyr-PV_ldkLZBNHKQ2bUYCmbAx1TKZxZ6LYmx3Aw3-SyJ45mNflaEh3yWPSC6k8D274jcHfd4TbV5fTxsw',
  PARRENT_ID: 'ekyc_sdk_intergrated',
  SHOW_RESULT: true,
  SHOW_HELP: true,
  SHOW_TRADEMARK: false,
  CHECK_LIVENESS_FACE: true,
  CHECK_LIVENESS_CARD: true,
  CHECK_MASKED_FACE: true,
  COMPARE_FACE: true,
  LANGUAGE: 'vi',
  LIST_ITEM: [-1, 5, 6, 7, 9],
  TYPE_DOCUMENT: 99,
  USE_WEBCAM: true,
  USE_UPLOAD: false,
  ADVANCE_LIVENESS_FACE: true,
};

export default function VnptEkyc({ onResult, flowType = 'FACE' }: VnptEkycProps) {
  const sdkLoaded = useRef(false);

  useEffect(() => {
    if (sdkLoaded.current) return;
    sdkLoaded.current = true;

    // Inject CSS
    if (!document.getElementById('vnpt_ekyc_styles')) {
      const link = document.createElement('link');
      link.id = 'vnpt_ekyc_styles';
      link.rel = 'stylesheet';
      link.href = SDK_CSS_URL;
      document.head.appendChild(link);
    }

    // Inject JS
    if (!document.getElementById('vnpt_ekyc_sdk')) {
      const script = document.createElement('script');
      script.id = 'vnpt_ekyc_sdk';
      script.src = SDK_JS_URL;
      script.async = true;
      document.head.appendChild(script);

      script.onload = async () => {
        await window.FaceVNPTBrowserSDK?.init();
        const config = { ...INIT_CONFIG, FLOW_TYPE: flowType };
        window.ekycsdk.init(config, (res: VnptEkycResult) => {
          window.ekycsdk.viewResult(res.type_document, res);
          onResult?.(res);
        });
      };
    } else {
      // SDK already loaded, just re-init
      const config = { ...INIT_CONFIG, FLOW_TYPE: flowType };
      window.ekycsdk?.init(config, (res: VnptEkycResult) => {
        window.ekycsdk.viewResult(res.type_document, res);
        onResult?.(res);
      });
    }

    return () => {
      // Cleanup SDK element on unmount
      const el = document.getElementById('vnpt_ekyc');
      el?.parentNode?.removeChild(el);
    };
  }, [flowType, onResult]);

  return <div id="ekyc_sdk_intergrated" />;
}
