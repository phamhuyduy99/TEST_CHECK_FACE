import { useState, useEffect } from 'react';
import type { EkycResult } from '../../hooks/useEkyc';
import { useT } from '../../i18n';

interface Props {
  result: EkycResult;
  files?: { front?: File; back?: File; face?: File };
  onReset: () => void;
}

const StatusBadge = ({ ok, label }: { ok: boolean; label: string }) => (
  <div
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${ok ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
  >
    <span>{ok ? '✅' : '❌'}</span>
    <span>{label}</span>
  </div>
);

const ValRow = ({ label, value, ok }: { label: string; value: string; ok?: boolean }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
    <span className="text-gray-300">{label}</span>
    <span
      className={
        ok === undefined
          ? 'text-white font-medium'
          : ok
            ? 'text-[#00d4a0] font-medium'
            : 'text-red-400 font-medium'
      }
    >
      {value}
    </span>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <div className="flex gap-3 py-2 border-b border-white/5 text-sm">
      <span className="text-gray-400 w-32 shrink-0">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  ) : null;

function useObjectUrl(file?: File) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

export default function StepResult({ result, files, onReset }: Props) {
  const { t } = useT();
  const [tab, setTab] = useState<'personal' | 'validation'>('personal');
  const { ocr, faceLiveness, cardLiveness, compare, mask } = result;

  const frontUrl = useObjectUrl(files?.front);
  const backUrl = useObjectUrl(files?.back);
  const faceUrl = useObjectUrl(files?.face);

  const isSuccess =
    faceLiveness?.isReal && cardLiveness?.liveness === 'success' && compare?.msg === 'MATCH';
  const isValid = (v?: string) => v === 'yes' || v === 'success' || v === 'OK';

  return (
    <div className="flex flex-col items-center min-h-screen px-4 pt-6 pb-10">
      <div className="w-full max-w-lg space-y-4">
        {/* Header */}
        <div
          className={`rounded-2xl p-4 text-center border ${isSuccess ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}
        >
          <div className="text-3xl mb-1">{isSuccess ? '✅' : '⚠️'}</div>
          <p className="text-white font-bold text-lg">
            {isSuccess ? t.verifySuccess : t.verifyDone}
          </p>
        </div>

        {/* Status badges */}
        <div className="grid grid-cols-2 gap-2">
          {cardLiveness && !cardLiveness.error && (
            <StatusBadge
              ok={cardLiveness.liveness === 'success'}
              label={cardLiveness.liveness === 'success' ? t.cardReal : t.cardFake}
            />
          )}
          {faceLiveness && !faceLiveness.error && (
            <StatusBadge ok={faceLiveness.isReal} label={faceLiveness.liveness_msg} />
          )}
          {mask && !mask.error && (
            <StatusBadge
              ok={mask.masked === 'no'}
              label={mask.masked === 'no' ? t.noMask : t.masked}
            />
          )}
          {compare && !compare.error && (
            <StatusBadge
              ok={compare.msg === 'MATCH'}
              label={`${t.faceMatch} ${compare.prob?.toFixed(1)}%`}
            />
          )}
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          <button
            onClick={() => setTab('personal')}
            className={`flex-1 py-2.5 text-sm font-semibold transition ${tab === 'personal' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t.tabPersonalInfo}
          </button>
          <button
            onClick={() => setTab('validation')}
            className={`flex-1 py-2.5 text-sm font-semibold transition ${tab === 'validation' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t.tabValidation}
          </button>
        </div>

        {/* Tab: Thông tin cá nhân */}
        {tab === 'personal' && (
          <div className="bg-[#0d2535] rounded-2xl p-4">
            <InfoRow label={t.cardType} value={ocr?.msg === 'OK' ? ocr.card_type : undefined} />
            {ocr?.msg !== 'OK' && (
              <div className="py-2 text-sm text-red-400 font-medium">{t.idInvalid}</div>
            )}
            {ocr?.msg === 'OK' && (
              <>
                <InfoRow label={t.idNum} value={ocr.id} />
                <InfoRow label={t.name} value={ocr.name} />
                <InfoRow label={t.birthday} value={ocr.birth_day} />
                <InfoRow label={t.origin} value={ocr.origin_location} />
                <InfoRow label={t.gender} value={ocr.gender} />
                <InfoRow label={t.issueDate} value={ocr.issue_date} />
                <InfoRow label={t.expiry} value={ocr.valid_date} />
                <InfoRow label={t.address} value={ocr.issue_place} />
              </>
            )}
            {compare && !compare.error && (
              <div className="flex gap-3 py-2 text-sm">
                <span className="text-gray-400 w-32 shrink-0">{t.faceMatchScore}</span>
                <span
                  className={`font-bold ${compare.msg === 'MATCH' ? 'text-[#00d4a0]' : 'text-red-400'}`}
                >
                  {compare.prob?.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab: Xác thực */}
        {tab === 'validation' && (
          <div className="bg-[#0d2535] rounded-2xl p-4">
            <ValRow label={t.valDocType} value={ocr?.card_type ?? '–'} ok={!!ocr?.card_type} />
            <ValRow
              label={t.valFrontBack}
              value={ocr?.msg === 'OK' ? t.valHomologous : t.valInvalid}
              ok={ocr?.msg === 'OK'}
            />
            <ValRow
              label={t.valBlurry}
              value={cardLiveness?.liveness === 'success' ? t.valNo : t.valYes}
              ok={cardLiveness?.liveness === 'success'}
            />
            <ValRow
              label={t.valIdQuality}
              value={ocr?.msg === 'OK' ? t.valGood : t.valInvalid}
              ok={ocr?.msg === 'OK'}
            />
            <ValRow
              label={t.valImgQuality}
              value={ocr?.msg === 'OK' ? t.valGood : t.valInvalid}
              ok={ocr?.msg === 'OK'}
            />
            <ValRow
              label={t.valExpiry}
              value={ocr?.expire_warning ? t.valExpired : t.valNotExpired}
              ok={!ocr?.expire_warning}
            />
            <ValRow
              label={t.valDirectCapture}
              value={faceLiveness?.isReal ? t.valValid : t.valInvalid}
              ok={faceLiveness?.isReal}
            />
            <ValRow
              label={t.valWatermark}
              value={ocr?.tampering?.is_legal === 'yes' ? t.valValid : t.valInvalid}
              ok={ocr?.tampering?.is_legal === 'yes'}
            />
            <ValRow
              label={t.valFaceSwap}
              value={cardLiveness?.face_swapping ? t.valYes : t.valNo}
              ok={!cardLiveness?.face_swapping}
            />
            <ValRow
              label={t.valEyeOpen}
              value={isValid(faceLiveness?.is_eye_open) ? t.valYes : t.valNo}
              ok={isValid(faceLiveness?.is_eye_open)}
            />
            <ValRow
              label={t.valMask}
              value={mask?.masked === 'yes' ? t.valYes : t.valNo}
              ok={mask?.masked !== 'yes'}
            />
            <ValRow
              label={t.valFaceCompare}
              value={compare?.msg === 'MATCH' ? t.valValid : t.valInvalid}
              ok={compare?.msg === 'MATCH'}
            />
          </div>
        )}

        {/* Errors */}
        {(() => {
          const allErrors: { label: string; msg: string }[] = [];
          const push = (label: string, obj?: { error?: string; errors?: string[] } | null) => {
            if (!obj) return;
            if (obj.error) allErrors.push({ label, msg: obj.error });
            obj.errors?.forEach(e => allErrors.push({ label, msg: e }));
          };
          push('OCR', ocr);
          push('Card Liveness', cardLiveness);
          push('Face Liveness', faceLiveness);
          push('Mask', mask);
          push('Face Compare', compare);
          if (!allErrors.length) return null;
          return (
            <div className="space-y-2">
              {allErrors.map((e, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                >
                  <span className="text-red-400 text-xs font-bold shrink-0 mt-0.5">{e.label}</span>
                  <span className="text-red-300 text-xs">{e.msg}</span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Captured images */}
        <div className="space-y-3">
          {frontUrl && (
            <img src={frontUrl} className="w-full rounded-xl object-cover" alt="front" />
          )}
          {backUrl && <img src={backUrl} className="w-full rounded-xl object-cover" alt="back" />}
          {faceUrl && <img src={faceUrl} className="w-full rounded-xl object-cover" alt="face" />}
        </div>

        <button
          onClick={onReset}
          className="w-full py-3 rounded-xl bg-[#00d4a0] hover:bg-[#00bf8f] text-white font-bold text-sm tracking-widest transition"
        >
          {t.retryBtn}
        </button>
      </div>
    </div>
  );
}
