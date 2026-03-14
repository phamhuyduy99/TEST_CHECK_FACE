import type { EkycResult } from '../../hooks/useEkyc';

interface Props {
  result: EkycResult;
  onReset: () => void;
}

const StatusBadge = ({ ok, label }: { ok: boolean; label: string }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${ok ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
    <span>{ok ? '✅' : '❌'}</span>
    <span>{label}</span>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value?: string }) =>
  value && value !== '-' ? (
    <div className="flex gap-3 py-2 border-b border-white/5 text-sm">
      <span className="text-gray-400 w-32 shrink-0">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  ) : null;

export default function StepResult({ result, onReset }: Props) {
  const { ocr, faceLiveness, cardLiveness, compare, mask } = result;
  const isSuccess =
    faceLiveness?.isReal &&
    cardLiveness?.liveness === 'success' &&
    compare?.msg === 'MATCH';

  return (
    <div className="flex flex-col items-center min-h-screen px-4 pt-10 pb-10">
      <div className="w-full max-w-lg space-y-5">

        {/* Overall status */}
        <div className={`rounded-2xl p-5 text-center border ${isSuccess ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
          <div className="text-4xl mb-2">{isSuccess ? '✅' : '⚠️'}</div>
          <p className="text-white font-bold text-lg">
            {isSuccess ? 'Xác thực thành công' : 'Xác thực hoàn tất'}
          </p>
        </div>

        {/* Status badges */}
        <div className="grid grid-cols-2 gap-2">
          {cardLiveness && !cardLiveness.error && (
            <StatusBadge ok={cardLiveness.liveness === 'success'} label={cardLiveness.liveness_msg} />
          )}
          {faceLiveness && !faceLiveness.error && (
            <StatusBadge ok={faceLiveness.isReal} label={faceLiveness.liveness_msg} />
          )}
          {mask && !mask.error && (
            <StatusBadge ok={mask.masked === 'no'} label={mask.masked === 'no' ? 'Không che mặt' : 'Đang che mặt'} />
          )}
          {compare && !compare.error && (
            <StatusBadge ok={compare.msg === 'MATCH'} label={`Khớp mặt ${compare.prob?.toFixed(1)}%`} />
          )}
        </div>

        {/* OCR info */}
        {ocr && !ocr.error && ocr.msg === 'OK' && (
          <div className="bg-[#0d2535] rounded-2xl p-5">
            <h3 className="text-[#00d4a0] font-semibold mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Thông tin giấy tờ
            </h3>
            <InfoRow label="Loại giấy tờ" value={ocr.card_type} />
            <InfoRow label="Số ID" value={ocr.id} />
            <InfoRow label="Họ tên" value={ocr.name} />
            <InfoRow label="Ngày sinh" value={ocr.birth_day} />
            <InfoRow label="Giới tính" value={ocr.gender} />
            <InfoRow label="Quốc tịch" value={ocr.nationality} />
            <InfoRow label="Quê quán" value={ocr.origin_location} />
            <InfoRow label="Thường trú" value={ocr.recent_location} />
            <InfoRow label="Ngày cấp" value={ocr.issue_date} />
            <InfoRow label="Nơi cấp" value={ocr.issue_place} />
            <InfoRow label="Hết hạn" value={ocr.valid_date} />
            {ocr.tampering && (
              <div className="mt-3">
                <StatusBadge
                  ok={ocr.tampering.is_legal === 'yes'}
                  label={ocr.tampering.is_legal === 'yes' ? 'Số ID hợp lệ' : 'Số ID không hợp lệ'}
                />
              </div>
            )}
          </div>
        )}

        {/* Errors */}
        {[ocr?.error, faceLiveness?.error, compare?.error].filter(Boolean).map((e, i) => (
          <p key={i} className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{e}</p>
        ))}

        <button
          onClick={onReset}
          className="w-full py-3 rounded-xl bg-[#00d4a0] hover:bg-[#00bf8f] text-white font-bold text-sm tracking-widest transition"
        >
          XÁC THỰC LẠI
        </button>
      </div>
    </div>
  );
}
