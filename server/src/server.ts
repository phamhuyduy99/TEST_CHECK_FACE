import 'dotenv/config';
import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import { config } from './config';
import { invalidateToken } from './services/tokenService';
import {
  uploadFile,
  checkCardLiveness,
  ocrId,
  checkFaceLiveness,
  checkMask,
  compareFace,
} from './services/vnptAiService';

const app = express();

app.use(cors({ origin: config.cors.origin, methods: ['GET', 'POST'], credentials: true }));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ─── POST /api/ekyc ───────────────────────────────────────────────────────────
// Form-data: front (File), back (File), face (File)
// Luồng: upload 3 ảnh → OCR → liveness card → liveness face → mask → compare
app.post(
  '/api/ekyc',
  upload.fields([
    { name: 'front', maxCount: 1 },
    { name: 'back', maxCount: 1 },
    { name: 'face', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    const reqId = Math.random().toString(36).slice(2, 8).toUpperCase();
    const t0 = Date.now();
    console.log(`\n[${reqId}] ▶ POST /api/ekyc`);
    try {
      const files = req.files as Record<string, Express.Multer.File[]>;

      if (!files?.front || !files?.back || !files?.face) {
        return res.status(400).json({ error: 'Cần gửi đủ 3 ảnh: front, back, face' });
      }

      console.log(`[${reqId}] 📸 Ảnh nhận được:`);
      console.log(`[${reqId}]    front: ${(files.front[0].size/1024).toFixed(0)}KB  ${files.front[0].mimetype}`);
      console.log(`[${reqId}]    back:  ${(files.back[0].size/1024).toFixed(0)}KB  ${files.back[0].mimetype}`);
      console.log(`[${reqId}]    face:  ${(files.face[0].size/1024).toFixed(0)}KB  ${files.face[0].mimetype}`);

      const overrideToken = req.headers['x-vnpt-token'] as string | undefined;
      // x-source: 'upload' khi user chọn file từ máy, 'camera' khi chụp trực tiếp
      const source = (req.headers['x-source'] as string) || 'camera';
      const isUpload = source === 'upload';
      console.log(`[${reqId}] 📷 Nguồn ảnh: ${source} (isUpload=${isUpload})`);

      console.log(`[${reqId}] 📤 Uploading 3 ảnh lên VNPT...`);
      const t1 = Date.now();
      const [frontRes, backRes, faceRes] = await Promise.allSettled([
        uploadFile(files.front[0].buffer, 'front', 'Mặt trước giấy tờ', overrideToken, isUpload),
        uploadFile(files.back[0].buffer, 'back', 'Mặt sau giấy tờ', overrideToken, isUpload),
        uploadFile(files.face[0].buffer, 'face', 'Ảnh chân dung', overrideToken, false),
      ]);
      console.log(`[${reqId}] ✅ Upload xong (${Date.now()-t1}ms)`);

      if (frontRes.status === 'rejected' || backRes.status === 'rejected' || faceRes.status === 'rejected') {
        const uploadErr =
          (frontRes.status === 'rejected' ? `front: ${frontRes.reason?.message}` : '') ||
          (backRes.status  === 'rejected' ? `back: ${backRes.reason?.message}`   : '') ||
          (faceRes.status  === 'rejected' ? `face: ${faceRes.reason?.message}`   : '');
        console.error(`[${reqId}] ❌ Upload thất bại: ${uploadErr}`);
        return res.status(502).json({ error: `Upload ảnh thất bại: ${uploadErr}` });
      }

      const frontUpload = (frontRes as PromiseFulfilledResult<Awaited<ReturnType<typeof uploadFile>>>).value;
      const backUpload  = (backRes  as PromiseFulfilledResult<Awaited<ReturnType<typeof uploadFile>>>).value;
      const faceUpload  = (faceRes  as PromiseFulfilledResult<Awaited<ReturnType<typeof uploadFile>>>).value;
      console.log(`[${reqId}]    front hash: ${frontUpload.hash.slice(-20)}`);
      console.log(`[${reqId}]    back  hash: ${backUpload.hash.slice(-20)}`);
      console.log(`[${reqId}]    face  hash: ${faceUpload.hash.slice(-20)}`);

      console.log(`[${reqId}] 🔍 Gọi 5 API VNPT song song...`);
      const t2 = Date.now();
      const [ocr, cardLiveness, faceLiveness, mask, compare] = await Promise.allSettled([
        ocrId(frontUpload.hash, backUpload.hash, -1, overrideToken),
        checkCardLiveness(frontUpload.hash, overrideToken),
        checkFaceLiveness(faceUpload.hash, overrideToken),
        checkMask(faceUpload.hash, undefined, undefined, overrideToken),
        compareFace(frontUpload.hash, faceUpload.hash, overrideToken),
      ]);
      console.log(`[${reqId}] ⏱  VNPT APIs: ${Date.now()-t2}ms`);
      console.log(`[${reqId}]    ocr:          ${ocr.status}          ${ ocr.status==='fulfilled' ? ocr.value.msg : (ocr as PromiseRejectedResult).reason?.response?.data?.errors?.[0] ?? 'err'}`);
      console.log(`[${reqId}]    cardLiveness: ${cardLiveness.status} ${ cardLiveness.status==='fulfilled' ? cardLiveness.value.liveness : (cardLiveness as PromiseRejectedResult).reason?.response?.data?.errors?.[0] ?? 'err'}`);
      console.log(`[${reqId}]    faceLiveness: ${faceLiveness.status} ${ faceLiveness.status==='fulfilled' ? faceLiveness.value.liveness : 'err'}`);
      console.log(`[${reqId}]    mask:         ${mask.status}         ${ mask.status==='fulfilled' ? mask.value.masked : (mask as PromiseRejectedResult).reason?.response?.data?.errors?.[0] ?? 'err'}`);
      console.log(`[${reqId}]    compare:      ${compare.status}      ${ compare.status==='fulfilled' ? `${compare.value.msg} ${compare.value.prob?.toFixed(1)}%` : (compare as PromiseRejectedResult).reason?.response?.data?.errors?.[0] ?? 'err'}`);

      // Helper: extract errors[] từ axios rejected reason
      // VNPT trả về errors[] trong response.data khi HTTP 4xx
      const extractErr = (reason: unknown) => {
        const r = reason as { response?: { data?: { errors?: string[]; message?: string } }; message?: string };
        const data = r?.response?.data;
        const errors: string[] = data?.errors?.length
          ? data.errors
          : [data?.message ?? r?.message ?? 'Lỗi không xác định'];
        return { errors, error: errors[0] };
      };

      const result = {
        ocr:          ocr.status          === 'fulfilled' ? ocr.value          : extractErr((ocr as PromiseRejectedResult).reason),
        cardLiveness: cardLiveness.status === 'fulfilled' ? cardLiveness.value : extractErr((cardLiveness as PromiseRejectedResult).reason),
        faceLiveness: faceLiveness.status === 'fulfilled' ? faceLiveness.value : { isReal: false, ...extractErr((faceLiveness as PromiseRejectedResult).reason) },
        mask:         mask.status         === 'fulfilled' ? mask.value         : extractErr((mask as PromiseRejectedResult).reason),
        compare:      compare.status      === 'fulfilled' ? compare.value      : extractErr((compare as PromiseRejectedResult).reason),
        hashes: {
          front: frontUpload.hash,
          back:  backUpload.hash,
          face:  faceUpload.hash,
        },
      };

      console.log(`[${reqId}] ✅ eKYC hoàn tất — tổng ${Date.now()-t0}ms`);
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ eKYC error:`, msg);
      const statusCode = (err as { response?: { status?: number } })?.response?.status;
      if (statusCode === 401) invalidateToken();
      res.status(statusCode === 401 ? 401 : 500).json({ error: msg });
    }
  }
);

// ─── POST /api/ekyc/face ──────────────────────────────────────────────────────
// Chỉ check liveness mặt (không cần giấy tờ)
app.post('/api/ekyc/face', upload.single('face'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Cần gửi ảnh face' });

    const uploaded = await uploadFile(req.file.buffer, 'face');
    const [liveness, mask] = await Promise.allSettled([
      checkFaceLiveness(uploaded.hash),
      checkMask(uploaded.hash),
    ]);

    res.json({
      hash: uploaded.hash,
      liveness: liveness.status === 'fulfilled' ? liveness.value : { isReal: false },
      mask:     mask.status     === 'fulfilled' ? mask.value     : null,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ─── GET /api/ping ───────────────────────────────────────────────────────────
app.get('/api/ping', (_req, res) => res.json({ ok: true }));

// ─── GET /api/token ──────────────────────────────────────────────────────────
// Trả về access token hiện tại (tự refresh nếu hết hạn)
app.get('/api/token', async (_req, res) => {
  try {
    const { getAccessToken } = await import('./services/tokenService');
    const token = await getAccessToken();
    res.json({ access_token: token });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Lỗi lấy token' });
  }
});

// ─── GET /api/health ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    vnpt: {
      tokenId: process.env.VNPT_TOKEN_ID ? '✅ configured' : '❌ missing',
      username: process.env.VNPT_USERNAME ? '✅ configured' : '❌ missing',
    },
  });
});

app.listen(config.port, '0.0.0.0', () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const lanIps: string[] = [];
  for (const iface of Object.values(nets) as any[]) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) lanIps.push(addr.address);
    }
  }
  console.log(`🚀 Server: http://localhost:${config.port}`);
  lanIps.forEach(ip => console.log(`📱 LAN:    http://${ip}:${config.port}`));
  console.log(`📋 Endpoints:`);
  console.log(`   POST /api/ekyc        → OCR + liveness + compare (front, back, face)`);
  console.log(`   POST /api/ekyc/face   → Chỉ check liveness mặt (face)`);
  console.log(`   GET  /api/health      → Kiểm tra cấu hình`);
});
