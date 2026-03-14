import type { EkycResult } from '../hooks/useEkyc';

interface Props { result: EkycResult }

const Badge = ({ ok, label }: { ok: boolean; label: string }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
    {ok ? '✅' : '❌'} {label}
  </span>
);

const Row = ({ label, value }: { label: string; value?: string | number }) =>
  value && value !== '-' ? (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 w-36 shrink-0">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  ) : null;

export default function EkycResultView({ result }: Props) {
  const { ocr, cardLiveness, faceLiveness, mask, compare } = result;

  return (
    <div className="space-y-4">

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        {cardLiveness && !cardLiveness.error && (
          <Badge ok={cardLiveness.liveness === 'success'} label={cardLiveness.liveness_msg} />
        )}
        {faceLiveness && !faceLiveness.error && (
          <Badge ok={faceLiveness.isReal} label={faceLiveness.liveness_msg} />
        )}
        {mask && !mask.error && (
          <Badge ok={mask.masked === 'no'} label={mask.masked === 'no' ? 'Không che mặt' : 'Đang che mặt'} />
        )}
        {compare && !compare.error && (
          <Badge ok={compare.msg === 'MATCH'} label={compare.result} />
        )}
        {faceLiveness && !faceLiveness.error && (
          <Badge ok={faceLiveness.is_eye_open === 'yes'} label={faceLiveness.is_eye_open === 'yes' ? 'Mắt mở' : 'Mắt nhắm'} />
        )}
      </div>

      {/* OCR thông tin giấy tờ */}
      {ocr && !ocr.error && ocr.msg === 'OK' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <h3 className="font-semibold text-gray-700 mb-3">📄 Thông tin giấy tờ</h3>
          <Row label="Loại giấy tờ" value={ocr.card_type} />
          <Row label="Số ID" value={ocr.id} />
          <Row label="Họ tên" value={ocr.name} />
          <Row label="Ngày sinh" value={ocr.birth_day} />
          <Row label="Giới tính" value={ocr.gender} />
          <Row label="Quốc tịch" value={ocr.nationality} />
          <Row label="Quê quán" value={ocr.origin_location} />
          <Row label="Thường trú" value={ocr.recent_location} />
          <Row label="Ngày cấp" value={ocr.issue_date} />
          <Row label="Nơi cấp" value={ocr.issue_place} />
          <Row label="Hết hạn" value={ocr.valid_date} />
          {ocr.tampering && (
            <div className="pt-2">
              <Badge ok={ocr.tampering.is_legal === 'yes'} label={ocr.tampering.is_legal === 'yes' ? 'Số ID hợp lệ' : 'Số ID không hợp lệ'} />
            </div>
          )}
          {ocr.id_fake_warning === 'yes' && (
            <p className="text-xs text-red-500 mt-1">⚠️ Cảnh báo: Số ID có thể giả</p>
          )}
        </div>
      )}

      {/* Lỗi */}
      {ocr?.error && <p className="text-sm text-red-500">OCR lỗi: {ocr.error}</p>}
      {faceLiveness?.error && <p className="text-sm text-red-500">Liveness lỗi: {faceLiveness.error}</p>}
      {compare?.error && <p className="text-sm text-red-500">Compare lỗi: {compare.error}</p>}
    </div>
  );
}
