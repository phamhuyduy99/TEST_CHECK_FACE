import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface EkycResult {
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
    expire_warning: string;
    tampering?: { is_legal: string; warning: string[] };
    error?: string;
  };
  cardLiveness?: {
    liveness: 'success' | 'failure';
    liveness_msg: string;
    face_swapping: boolean;
    fake_liveness: boolean;
    error?: string;
  };
  faceLiveness?: {
    isReal: boolean;
    liveness: 'success' | 'failure';
    liveness_msg: string;
    is_eye_open: string;
    error?: string;
  };
  mask?: { masked: 'yes' | 'no'; error?: string };
  compare?: {
    result: string;
    msg: 'MATCH' | 'NOMATCH';
    prob: number;
    error?: string;
  };
  hashes?: { front: string; back: string; face: string };
}

export default function useEkyc() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EkycResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runEkyc = async (front: File, back: File, face: File) => {
    setLoading(true);
    setResult(null);
    setError(null);

    const form = new FormData();
    form.append('front', front);
    form.append('back', back);
    form.append('face', face);

    try {
      const res = await fetch(`${API_URL}/api/ekyc`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi server');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  const runFaceLiveness = async (face: File) => {
    setLoading(true);
    setResult(null);
    setError(null);

    const form = new FormData();
    form.append('face', face);

    try {
      const res = await fetch(`${API_URL}/api/ekyc/face`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi server');
      setResult({ faceLiveness: data.liveness, mask: data.mask });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  return { loading, result, error, runEkyc, runFaceLiveness, setResult };
}
