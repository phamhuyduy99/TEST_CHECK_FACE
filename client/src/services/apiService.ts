import axios from 'axios';
import type { EkycResult } from '../hooks/useEkyc';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('vnpt_access_token');
  if (token) config.headers['x-vnpt-token'] = token;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('vnpt-token-expired'));
      throw new Error('Token hết hạn. Vui lòng cập nhật Access Token.');
    }
    throw new Error(err.response?.data?.error || 'Lỗi server');
  }
);

export async function getToken(): Promise<string> {
  const { data } = await api.get<{ access_token: string }>('/api/token');
  return data.access_token;
}

export async function ping(): Promise<void> {
  await api.get('/api/ping').catch(() => {});
}

export async function runEkyc(
  front: File,
  back: File,
  face: File,
  source: 'camera' | 'upload' = 'camera'
): Promise<EkycResult> {
  const form = new FormData();
  form.append('front', front);
  form.append('back', back);
  form.append('face', face);

  console.log(`[apiService] 🚀 POST /api/ekyc  source=${source}`);
  console.log(
    `[apiService] 📸 front=${(front.size / 1024).toFixed(0)}KB  back=${(back.size / 1024).toFixed(0)}KB  face=${(face.size / 1024).toFixed(0)}KB`
  );

  const t0 = Date.now();
  const { data } = await api.post<EkycResult>('/api/ekyc', form, {
    headers: { 'x-source': source },
  });
  console.log(`[apiService] ⏱  (${Date.now() - t0}ms)`);
  console.log('[apiService] ✅ ekyc:', {
    ocr: data.ocr?.msg,
    cardLiveness: data.cardLiveness?.liveness,
    faceLiveness: data.faceLiveness?.liveness,
    mask: data.mask?.masked,
    compare: data.compare?.msg,
  });
  return data;
}

export async function runFaceLiveness(
  face: File
): Promise<Pick<EkycResult, 'faceLiveness' | 'mask'>> {
  const form = new FormData();
  form.append('face', face);

  const { data } = await api.post<{ liveness: EkycResult['faceLiveness']; mask: EkycResult['mask'] }>(
    '/api/ekyc/face',
    form
  );
  return { faceLiveness: data.liveness, mask: data.mask };
}
