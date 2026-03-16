import type { EkycResult } from '../hooks/useEkyc';

const API_URL = import.meta.env.VITE_API_URL || '';
console.log(`[apiService] API_URL = ${API_URL}`);

function getHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const savedToken = localStorage.getItem('vnpt_access_token');
  if (savedToken) headers['x-vnpt-token'] = savedToken;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('vnpt-token-expired'));
    throw new Error('Token hết hạn. Vui lòng cập nhật Access Token.');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Lỗi server');
  return data as T;
}

export async function ping(): Promise<void> {
  await fetch(`${API_URL}/api/ping`).catch(() => {});
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
  const res = await fetch(`${API_URL}/api/ekyc`, {
    method: 'POST',
    body: form,
    headers: getHeaders({ 'x-source': source }),
  });
  console.log(`[apiService] ⏱  HTTP ${res.status} (${Date.now() - t0}ms)`);

  const data = await handleResponse<EkycResult>(res);
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

  const res = await fetch(`${API_URL}/api/ekyc/face`, {
    method: 'POST',
    body: form,
    headers: getHeaders(),
  });
  const data = await handleResponse<{ liveness: EkycResult['faceLiveness']; mask: EkycResult['mask'] }>(res);
  return { faceLiveness: data.liveness, mask: data.mask };
}
