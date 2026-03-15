import { useEffect, useState } from 'react';

type ScriptState = 'loading' | 'ready' | 'error';

const SCRIPTS = [
  'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.7.4/lottie.min.js',
  'https://ekyc-web.icenter.ai/lib/VNPTBrowserSDKApp.js',
  'https://ekyc-web.icenter.ai/lib/jsQR.js',
];

// Track state globally so multiple components share the same status
const stateMap = new Map<string, ScriptState>();

function getScriptEl(src: string) {
  return document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
}

export function useExternalScripts() {
  const [states, setStates] = useState<Map<string, ScriptState>>(() => {
    const m = new Map<string, ScriptState>();
    SCRIPTS.forEach(src => {
      const el = getScriptEl(src);
      // Script already loaded (defer scripts may already be done by mount time)
      const cached = stateMap.get(src);
      if (cached) {
        m.set(src, cached);
      } else if (el && (el as any).readyState === 'complete') {
        m.set(src, 'ready');
      } else {
        m.set(src, 'loading');
      }
    });
    return m;
  });

  useEffect(() => {
    const cleanups: (() => void)[] = [];

    SCRIPTS.forEach(src => {
      if (stateMap.get(src) === 'ready') return;

      const el = getScriptEl(src);
      if (!el) return; // script tag not in DOM (shouldn't happen)

      const onLoad = () => {
        stateMap.set(src, 'ready');
        setStates(prev => new Map(prev).set(src, 'ready'));
      };
      const onError = () => {
        stateMap.set(src, 'error');
        setStates(prev => new Map(prev).set(src, 'error'));
        console.warn(`[useExternalScripts] Failed to load: ${src}`);
      };

      // Already loaded before we attached listeners
      if (el.dataset.loaded === 'true') {
        onLoad();
        return;
      }

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
  const failedScripts = SCRIPTS.filter(src => states.get(src) === 'error')
    .map(src => src.split('/').pop() ?? src);

  return { allReady, hasError, failedScripts, states };
}
