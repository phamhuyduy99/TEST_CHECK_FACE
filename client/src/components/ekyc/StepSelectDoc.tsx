import { useT } from '../../i18n';

interface Props {
  onSelect: (type: number, label: string) => void;
}

export default function StepSelectDoc({ onSelect }: Props) {
  const { t } = useT();

  const DOC_TYPES = [
    { type: -1, label: t.doc0, icon: (<svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="11" r="2.5" /><path strokeLinecap="round" d="M13 10h4M13 13h3" /></svg>) },
    { type: 5,  label: t.doc1, icon: (<svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white" stroke="currentColor" strokeWidth={1.5}><rect x="4" y="2" width="16" height="20" rx="2" /><circle cx="12" cy="10" r="3" /><path strokeLinecap="round" d="M7 17h10M7 14h10" /></svg>) },
    { type: 6,  label: t.doc2, icon: (<svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="7" cy="12" r="2" /><path strokeLinecap="round" d="M12 9h6M12 12h5M12 15h4" /></svg>) },
    { type: 99, label: t.doc3, icon: (<svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" d="M9 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V9l-7-7zM9 2v7h7" /><path strokeLinecap="round" d="M8 13h8M8 17h5" /></svg>) },
  ];
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-xl font-bold text-white mb-1">{t.selectTitle}</h1>
      <p className="text-sm text-gray-400 mb-10">{t.selectSub}</p>

      <div className="w-full max-w-md space-y-3">
        {DOC_TYPES.map((doc) => (
          <button
            key={doc.type}
            onClick={() => onSelect(doc.type, doc.label)}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-[#0d2535] hover:bg-[#0d2f42] border border-transparent hover:border-[#00d4a0]/30 transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#00d4a0] flex items-center justify-center shrink-0">
              {doc.icon}
            </div>
            <span className="flex-1 text-left text-white font-medium">{doc.label}</span>
            <svg className="w-5 h-5 text-gray-500 group-hover:text-[#00d4a0] transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
