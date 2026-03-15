import { useEffect, useState } from 'react';

type ScriptState = 'loading' | 'ready' | 'error';

const SCRIPTS = [
  'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.7.4/lottie.min.js',
  // VNPT SDK scripts - bỏ comment khi dùng /sdk route
  // 'https://ekyc-web.icenter.ai/lib/VNPTBrowserSDKApp.js',
  // 'https://ekyc-web.icenter.ai/lib/jsQR.js',
];

const stateMap = new Map<string, ScriptState>();

function getOrCreateScript(src: string): HTMLScriptElement {
  let el = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (!el) {
    el = document.createElement('script');
    el.src = src;
    if (src.includes('VNPTBrowserSDKApp')) el.id = 'oval_custom';
    document.head.appendChild(el);
  }
  return el;
}

export function useExternalScripts() {
  const [states, setStates] = useState<Map<string, ScriptState>>(() => {
    const m = new Map<string, ScriptState>();
    SCRIPTS.forEach(src => {
      const cached = stateMap.get(src);
      m.set(src, cached ?? 'loading');
    });
    return m;
  });

  useEffect(() => {
    const cleanups: (() => void)[] = [];

    SCRIPTS.forEach(src => {
      if (stateMap.get(src) === 'ready') return;

      const el = getOrCreateScript(src);

      const onLoad = () => {
        stateMap.set(src, 'ready');
        setStates(prev => new Map(prev).set(src, 'ready'));
      };
      const onError = () => {
        stateMap.set(src, 'error');
        setStates(prev => new Map(prev).set(src, 'error'));
        console.warn(`[useExternalScripts] Failed to load: ${src}`);
      };

      // Already fired before listener attached
      if (el.dataset.loaded === 'true') { onLoad(); return; }

      el.addEventListener('load', onLoad);
      el.addEventListener('error', onError);
      cleanups.push(() => {
        el.removeEventListener('load', onLoad);
        el.removeEventListener('error', onError);
      });
    });

    return () => cleanups.forEach(fn => fn());
  }, []);

  const allReady = SCRIPTS.every(src => states.get(src) === 'ready');
  const hasError = SCRIPTS.some(src => states.get(src) === 'error');
  const failedScripts = SCRIPTS.filter(src => states.get(src) === 'error').map(
    src => src.split('/').pop() ?? src
  );

  return { allReady, hasError, failedScripts, states };
}
