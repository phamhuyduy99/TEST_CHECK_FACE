import 'dotenv/config';
import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import { config } from './config';
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
    try {
      const files = req.files as Record<string, Express.Multer.File[]>;

      if (!files?.front || !files?.back || !files?.face) {
        return res.status(400).json({ error: 'Cần gửi đủ 3 ảnh: front, back, face' });
      }

      console.log('📤 Uploading 3 ảnh lên VNPT...');
      const [frontUpload, backUpload, faceUpload] = await Promise.all([
        uploadFile(files.front[0].buffer, 'front', 'Mặt trước giấy tờ'),
        uploadFile(files.back[0].buffer, 'back', 'Mặt sau giấy tờ'),
        uploadFile(files.face[0].buffer, 'face', 'Ảnh chân dung'),
      ]);

      console.log('🔍 Gọi các API VNPT song song...');
      const [ocr, cardLiveness, faceLiveness, mask, compare] = await Promise.allSettled([
        ocrId(frontUpload.hash, backUpload.hash),
        checkCardLiveness(frontUpload.hash),
        checkFaceLiveness(faceUpload.hash),
        checkMask(faceUpload.hash),
        compareFace(frontUpload.hash, faceUpload.hash),
      ]);

      const result = {
        ocr:          ocr.status          === 'fulfilled' ? ocr.value          : { error: (ocr as PromiseRejectedResult).reason?.message },
        cardLiveness: cardLiveness.status === 'fulfilled' ? cardLiveness.value : { error: (cardLiveness as PromiseRejectedResult).reason?.message },
        faceLiveness: faceLiveness.status === 'fulfilled' ? faceLiveness.value : { isReal: false, error: (faceLiveness as PromiseRejectedResult).reason?.message },
        mask:         mask.status         === 'fulfilled' ? mask.value         : { error: (mask as PromiseRejectedResult).reason?.message },
        compare:      compare.status      === 'fulfilled' ? compare.value      : { error: (compare as PromiseRejectedResult).reason?.message },
        hashes: {
          front: frontUpload.hash,
          back:  backUpload.hash,
          face:  faceUpload.hash,
        },
      };

      console.log('✅ eKYC hoàn tất');
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ eKYC error:', msg);
      res.status(500).json({ error: msg });
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

// ─── GET /api/health ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    vnpt: {
      tokenId: process.env.VNPT_TOKEN_ID ? '✅ configured' : '❌ missing',
      accessToken: process.env.VNPT_ACCESS_TOKEN ? '✅ configured' : '❌ missing',
    },
  });
});

app.listen(config.port, () => {
  console.log(`🚀 Server: http://localhost:${config.port}`);
  console.log(`📋 Endpoints:`);
  console.log(`   POST /api/ekyc        → OCR + liveness + compare (front, back, face)`);
  console.log(`   POST /api/ekyc/face   → Chỉ check liveness mặt (face)`);
  console.log(`   GET  /api/health      → Kiểm tra cấu hình`);
});
