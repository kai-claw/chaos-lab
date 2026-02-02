import { useEffect, useRef } from 'react';
import { useStore, type ChaosSystem, type ColorTheme } from '../store/useStore';

/**
 * Encodes the current app state into a URL hash for sharing.
 * Decodes on load to restore a shared configuration.
 *
 * Format: #sys=lorenz&sigma=10&rho=28&beta=2.667&theme=classic&sbs=0&speed=1&trail=1000
 */

const VALID_SYSTEMS = new Set<ChaosSystem>(['lorenz', 'rossler', 'doublePendulum']);
const VALID_THEMES = new Set<ColorTheme>(['classic', 'neon', 'blueprint', 'terminal']);

function encodeState(): string {
  const s = useStore.getState();
  const p = new URLSearchParams();
  p.set('sys', s.currentSystem);
  p.set('theme', s.colorTheme);
  p.set('speed', s.speed.toFixed(1));
  p.set('trail', String(s.trailLength));
  p.set('sbs', s.sideBySideMode ? '1' : '0');
  if (s.sideBySideMode) p.set('offset', s.initialOffset.toExponential(1));
  if (s.bloomEnabled) p.set('bloom', s.bloomIntensity.toFixed(1));
  if (s.audioEnabled) p.set('audio', '1');

  switch (s.currentSystem) {
    case 'lorenz':
      p.set('sigma', s.lorenzParams.sigma.toFixed(2));
      p.set('rho', s.lorenzParams.rho.toFixed(2));
      p.set('beta', s.lorenzParams.beta.toFixed(3));
      break;
    case 'rossler':
      p.set('a', s.rosslerParams.a.toFixed(3));
      p.set('b', s.rosslerParams.b.toFixed(3));
      p.set('c', s.rosslerParams.c.toFixed(2));
      break;
    case 'doublePendulum':
      p.set('m1', s.doublePendulumParams.mass1.toFixed(2));
      p.set('m2', s.doublePendulumParams.mass2.toFixed(2));
      p.set('l1', s.doublePendulumParams.length1.toFixed(2));
      p.set('l2', s.doublePendulumParams.length2.toFixed(2));
      p.set('g', s.doublePendulumParams.gravity.toFixed(2));
      p.set('damp', s.doublePendulumParams.damping.toFixed(3));
      break;
  }

  return '#' + p.toString();
}

function decodeHash(hash: string): boolean {
  if (!hash || hash.length < 2) return false;
  try {
    const p = new URLSearchParams(hash.slice(1));
    const store = useStore.getState();

    const sys = p.get('sys') as ChaosSystem | null;
    if (sys && VALID_SYSTEMS.has(sys)) store.setCurrentSystem(sys);
    else return false;

    const theme = p.get('theme') as ColorTheme | null;
    if (theme && VALID_THEMES.has(theme)) store.setColorTheme(theme);

    const speed = parseFloat(p.get('speed') || '');
    if (speed > 0 && speed <= 5) store.setSpeed(speed);

    const trail = parseInt(p.get('trail') || '');
    if (trail >= 100 && trail <= 5000) store.setTrailLength(trail);

    const sbs = p.get('sbs');
    if (sbs === '1') {
      store.setSideBySideMode(true);
      const offset = parseFloat(p.get('offset') || '');
      if (offset > 0 && offset < 1) store.setInitialOffset(offset);
    }

    const bloom = parseFloat(p.get('bloom') || '');
    if (bloom > 0 && bloom <= 4) {
      store.setBloomEnabled(true);
      store.setBloomIntensity(bloom);
    } else if (p.has('bloom') && p.get('bloom') === '0') {
      store.setBloomEnabled(false);
    }

    if (p.get('audio') === '1') {
      store.setAudioEnabled(true);
    }

    switch (sys) {
      case 'lorenz': {
        const sigma = parseFloat(p.get('sigma') || '');
        const rho = parseFloat(p.get('rho') || '');
        const beta = parseFloat(p.get('beta') || '');
        if (sigma > 0) store.setLorenzParams({ sigma });
        if (rho > 0) store.setLorenzParams({ rho });
        if (beta > 0) store.setLorenzParams({ beta });
        break;
      }
      case 'rossler': {
        const a = parseFloat(p.get('a') || '');
        const b = parseFloat(p.get('b') || '');
        const c = parseFloat(p.get('c') || '');
        if (a > 0) store.setRosslerParams({ a });
        if (b > 0) store.setRosslerParams({ b });
        if (c > 0) store.setRosslerParams({ c });
        break;
      }
      case 'doublePendulum': {
        const m1 = parseFloat(p.get('m1') || '');
        const m2 = parseFloat(p.get('m2') || '');
        const l1 = parseFloat(p.get('l1') || '');
        const l2 = parseFloat(p.get('l2') || '');
        const g = parseFloat(p.get('g') || '');
        const damp = parseFloat(p.get('damp') || '');
        if (m1 > 0) store.setDoublePendulumParams({ mass1: m1 });
        if (m2 > 0) store.setDoublePendulumParams({ mass2: m2 });
        if (l1 > 0) store.setDoublePendulumParams({ length1: l1 });
        if (l2 > 0) store.setDoublePendulumParams({ length2: l2 });
        if (g > 0) store.setDoublePendulumParams({ gravity: g });
        if (damp >= 0) store.setDoublePendulumParams({ damping: damp });
        break;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export function getShareUrl(): string {
  const base = window.location.origin + window.location.pathname;
  return base + encodeState();
}

export function useUrlState() {
  const hasInitialized = useRef(false);

  // Decode hash on mount (once)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    if (window.location.hash) {
      decodeHash(window.location.hash);
    }
  }, []);

  // Update hash on state changes (debounced)
  const {
    currentSystem, colorTheme, speed, trailLength, sideBySideMode, initialOffset,
    lorenzParams, rosslerParams, doublePendulumParams,
    bloomEnabled, bloomIntensity, audioEnabled,
  } = useStore();

  useEffect(() => {
    const id = setTimeout(() => {
      window.history.replaceState(null, '', encodeState());
    }, 500);
    return () => clearTimeout(id);
  }, [
    currentSystem, colorTheme, speed, trailLength, sideBySideMode, initialOffset,
    lorenzParams, rosslerParams, doublePendulumParams,
    bloomEnabled, bloomIntensity, audioEnabled,
  ]);
}
