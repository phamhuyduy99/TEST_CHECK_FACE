import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

const BASE_URL = 'https://api.idg.vnpt.vn';
const TOKEN_ID = process.env.VNPT_TOKEN_ID!;
const TOKEN_KEY = process.env.VNPT_TOKEN_KEY!;
const ACCESS_TOKEN = process.env.VNPT_ACCESS_TOKEN!;

// client_session format: WEB_browser_web_Device_1.0.0_<id>_<timestamp>
const genSession = () =>
  `WEB_browser_web_Device_1.0.0_${TOKEN_ID}_${Date.now()}`;

const genToken = () => Math.random().toString(36).substring(2, 12);

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Token-id': TOKEN_ID,
    'Token-key': TOKEN_KEY,
    'mac-address': 'TEST1',
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadResult {
  hash: string;
  fileName: string;
  fileType: string;
  uploadedDate: string;
}

export interface ClassifyResult {
  type: number;   // 0,1=CMT cũ; 2,3=CMND mới; 5=hộ chiếu; 4=khác
  name: string;
}

export interface CardLivenessResult {
  liveness: 'success' | 'failure';
  liveness_msg: string;
  face_swapping: boolean;
  fake_liveness: boolean;
}

export interface OcrResult {
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
  type_id: number;
  back_type_id?: number;
  id_fake_warning: string;
  expire_warning: string;
  back_expire_warning?: string;
  msg_back?: string;
  tampering?: { is_legal: string; warning: string[] };
}

export interface FaceCompareResult {
  result: string;
  msg: 'MATCH' | 'NOMATCH';
  prob: number;
}

export interface FaceLivenessResult {
  isReal: boolean;
  liveness: 'success' | 'failure';
  liveness_msg: string;
  is_eye_open: string;
  error?: string;
}

export interface MaskResult {
  masked: 'yes' | 'no';
}

export interface FaceAddResult {
  result: string;
  msg: string;
  customer_information: CustomerInfo;
}

export interface FaceVerifyResult {
  result: string;
  msg: 'MATCH' | 'NOMATCH';
  prob: number;
  id_card: string;
  id_type: string;
}

export interface FaceSearchResult {
  result: string;
  msg: string;
  customer_information: CustomerInfo;
  face_probability: number;
}

export interface FaceSearchKResult {
  result: string;
  msg: string;
  customer_informations: Array<{ customer_information: CustomerInfo; face_probability: number }>;
}

export interface CustomerInfo {
  card_id?: string;
  passport_id?: string;
  driver_license_id?: string;
  military_id?: string;
  police_id?: string;
  other_id?: string;
  fullname?: string;
  dob?: string;
  gender?: string;
  address?: string;
  hometown?: string;
  nationality?: string;
  ipfs?: string;
  title?: string;
  other_type?: string;
  extra_info?: Record<string, string>;
  customer_id?: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const unwrap = <T>(data: { message: string; object: T }): T => data.object;

const handleErr = (label: string, err: unknown) => {
  const e = err as { response?: { data?: unknown }; message?: string };
  console.error(`❌ VNPT [${label}]:`, e?.response?.data ?? e?.message);
  throw err;
};

// ─── 1. Upload ảnh ────────────────────────────────────────────────────────────

export const uploadFile = async (
  buffer: Buffer,
  title = 'image',
  description = ''
): Promise<UploadResult> => {
  try {
    const form = new FormData();
    form.append('file', buffer, { filename: `${title}.jpg`, contentType: 'image/jpeg' });
    form.append('title', title);
    form.append('description', description);

    const res = await axios.post(`${BASE_URL}/file-service/v1/addFile`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Token-id': TOKEN_ID,
        'Token-key': TOKEN_KEY,
      },
      timeout: 20000,
    });
    return unwrap<UploadResult>(res.data);
  } catch (err) {
    return handleErr('uploadFile', err);
  }
};

// ─── 2. Kiểm tra loại giấy tờ ────────────────────────────────────────────────

export const classifyId = async (imgHash: string): Promise<ClassifyResult> => {
  try {
    const res = await client.post('/ai/v1/classify/id', {
      img_card: imgHash,
      client_session: genSession(),
      token: genToken(),
    });
    return unwrap<ClassifyResult>(res.data);
  } catch (err) {
    return handleErr('classifyId', err);
  }
};

// ─── 3. Kiểm tra giấy tờ thật giả ───────────────────────────────────────────

export const checkCardLiveness = async (imgHash: string): Promise<CardLivenessResult> => {
  try {
    const res = await client.post('/ai/v1/card/liveness', {
      img: imgHash,
      client_session: genSession(),
    });
    return unwrap<CardLivenessResult>(res.data);
  } catch (err) {
    return handleErr('checkCardLiveness', err);
  }
};

// ─── 4. OCR mặt trước ────────────────────────────────────────────────────────

export const ocrFront = async (imgFrontHash: string, type = -1): Promise<OcrResult> => {
  try {
    const res = await client.post('/ai/v1/ocr/id/front', {
      img_front: imgFrontHash,
      client_session: genSession(),
      type,
      validate_postcode: true,
      token: genToken(),
    });
    return unwrap<OcrResult>(res.data);
  } catch (err) {
    return handleErr('ocrFront', err);
  }
};

// ─── 5. OCR mặt sau ──────────────────────────────────────────────────────────

export const ocrBack = async (imgBackHash: string, type = -1): Promise<OcrResult> => {
  try {
    const res = await client.post('/ai/v1/ocr/id/back', {
      img_back: imgBackHash,
      client_session: genSession(),
      type,
      token: genToken(),
    });
    return unwrap<OcrResult>(res.data);
  } catch (err) {
    return handleErr('ocrBack', err);
  }
};

// ─── 6. OCR cả 2 mặt ─────────────────────────────────────────────────────────

export const ocrId = async (
  imgFrontHash: string,
  imgBackHash: string,
  type = -1
): Promise<OcrResult> => {
  try {
    const res = await client.post('/ai/v1/ocr/id', {
      img_front: imgFrontHash,
      img_back: imgBackHash,
      client_session: genSession(),
      type,
      crop_param: '0.14,0.3',
      validate_postcode: true,
      token: genToken(),
    });
    return unwrap<OcrResult>(res.data);
  } catch (err) {
    return handleErr('ocrId', err);
  }
};

// ─── 7. So sánh khuôn mặt ────────────────────────────────────────────────────

export const compareFace = async (
  imgFrontHash: string,
  imgFaceHash: string
): Promise<FaceCompareResult> => {
  try {
    const res = await client.post('/ai/v1/face/compare', {
      img_front: imgFrontHash,
      img_face: imgFaceHash,
      client_session: genSession(),
      token: genToken(),
    });
    return unwrap<FaceCompareResult>(res.data);
  } catch (err) {
    return handleErr('compareFace', err);
  }
};

// ─── 8. Kiểm tra mặt thật (liveness) ─────────────────────────────────────────

export const checkFaceLiveness = async (imgHash: string): Promise<FaceLivenessResult> => {
  try {
    const res = await client.post('/ai/v1/face/liveness', {
      img: imgHash,
      client_session: genSession(),
      token: genToken(),
    });
    const obj = unwrap<{ liveness: string; liveness_msg: string; is_eye_open: string }>(res.data);
    return {
      isReal: obj.liveness === 'success',
      liveness: obj.liveness as 'success' | 'failure',
      liveness_msg: obj.liveness_msg,
      is_eye_open: obj.is_eye_open,
    };
  } catch (err) {
    const e = err as { response?: { data?: unknown }; message?: string };
    console.error('❌ VNPT [checkFaceLiveness]:', e?.response?.data ?? e?.message);
    return { isReal: false, liveness: 'failure', liveness_msg: 'Lỗi kết nối', is_eye_open: 'no', error: e?.message };
  }
};

// ─── 9. Kiểm tra che mặt ─────────────────────────────────────────────────────

export const checkMask = async (
  imgHash: string,
  faceBbox?: string,
  faceLmark?: string
): Promise<MaskResult> => {
  try {
    const res = await client.post('/ai/v1/face/mask', {
      img: imgHash,
      face_bbox: faceBbox ?? '',
      face_lmark: faceLmark ?? '',
      client_session: genSession(),
    });
    return unwrap<MaskResult>(res.data);
  } catch (err) {
    return handleErr('checkMask', err);
  }
};

// ─── 10. Thêm khuôn mặt vào hệ thống ─────────────────────────────────────────

export const addFace = async (
  ipfsHash: string,
  customerInfo: CustomerInfo,
  unit: string
): Promise<FaceAddResult> => {
  try {
    const res = await client.post('/face-service/face/add', {
      bbox: null,
      landmark: null,
      customer_information: { ...customerInfo, ipfs: ipfsHash },
      unit,
    });
    return unwrap<FaceAddResult>(res.data);
  } catch (err) {
    return handleErr('addFace', err);
  }
};

// ─── 11. Xác thực khuôn mặt ──────────────────────────────────────────────────

export const verifyFace = async (
  imgHash: string,
  idCard: string,
  idType: 'CARD_ID' | 'PASSPORT_ID' | 'DRIVER_LICENSE_ID' | 'MILITARY_ID' | 'POLICE_ID',
  unit: string
): Promise<FaceVerifyResult> => {
  try {
    const res = await client.post('/face-service/face/verify', {
      img: imgHash,
      id_card: idCard,
      id_type: idType,
      unit,
    });
    return unwrap<FaceVerifyResult>(res.data);
  } catch (err) {
    return handleErr('verifyFace', err);
  }
};

// ─── 12. Tìm kiếm 1 khuôn mặt giống nhất ────────────────────────────────────

export const searchFace = async (imgHash: string, unit: string): Promise<FaceSearchResult> => {
  try {
    const res = await client.post('/face-service/face/search', { img: imgHash, unit });
    return unwrap<FaceSearchResult>(res.data);
  } catch (err) {
    return handleErr('searchFace', err);
  }
};

// ─── 13. Tìm kiếm tập khuôn mặt gần giống nhất ───────────────────────────────

export const searchFaceK = async (
  imgHash: string,
  unit: string,
  k: number,
  threshold: number
): Promise<FaceSearchKResult> => {
  try {
    const res = await client.post('/face-service/face/search-k', { img: imgHash, unit, k, threshold });
    return unwrap<FaceSearchKResult>(res.data);
  } catch (err) {
    return handleErr('searchFaceK', err);
  }
};

// ─── Convenience: upload buffer rồi check liveness (dùng trong server.ts) ────

export const checkLivenessVnpt = async (imageBuffer: Buffer) => {
  try {
    const uploaded = await uploadFile(imageBuffer, 'face');
    return await checkFaceLiveness(uploaded.hash);
  } catch {
    return { isReal: false, liveness: 'failure' as const, liveness_msg: 'Lỗi VNPT', is_eye_open: 'no', error: 'upload_failed' };
  }
};
