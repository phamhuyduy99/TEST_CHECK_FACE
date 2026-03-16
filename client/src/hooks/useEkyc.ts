import { useState } from 'react';
import * as api from '../services/apiService';

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
    errors?: string[]; // mảng lỗi từ VNPT API
    error?: string;
  };
  cardLiveness?: {
    liveness: 'success' | 'failure';
    liveness_msg: string;
    face_swapping: boolean;
    fake_liveness: boolean;
    errors?: string[];
    error?: string;
  };
  faceLiveness?: {
    isReal: boolean;
    liveness: 'success' | 'failure';
    liveness_msg: string;
    is_eye_open: string;
    errors?: string[];
    error?: string;
  };
  mask?: { masked: 'yes' | 'no'; errors?: string[]; error?: string };
  compare?: {
    result: string;
    msg: 'MATCH' | 'NOMATCH';
    prob: number;
    errors?: string[];
    error?: string;
  };
  hashes?: { front: string; back: string; face: string };
}

export default function useEkyc() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EkycResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runEkyc = async (front: File, back: File, face: File, source: 'camera' | 'upload' = 'camera') => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      setResult(await api.runEkyc(front, back, face, source));
    } catch (err) {
      console.error('[eKYC] ❌ Lỗi:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  const runFaceLiveness = async (face: File) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      setResult(await api.runFaceLiveness(face));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  return { loading, result, error, runEkyc, runFaceLiveness, setResult };
}
