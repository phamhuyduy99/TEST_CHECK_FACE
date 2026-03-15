import { useT } from '../../i18n';

interface Props {
  current: number;
  total?: number;
}

export default function StepProgress({ current, total = 4 }: Props) {
  const { t } = useT();
  return (
    <div className="flex flex-col items-center gap-1 mb-6">
      <p className="text-sm text-gray-300">
        {t.stepLabel}{' '}
        <span className="text-white font-semibold">
          {current}/{total}
        </span>
      </p>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i < current ? 'w-10 bg-[#00d4a0]' : 'w-10 bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
