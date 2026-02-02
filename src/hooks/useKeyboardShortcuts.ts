import { useEffect } from 'react';
import { useStore, type ChaosSystem } from '../store/useStore';
import { useScreenshot } from './useScreenshot';
import { getShareUrl } from './useUrlState';

const THEME_ORDER = ['classic', 'neon', 'blueprint', 'terminal'] as const;
const SYSTEM_ORDER: ChaosSystem[] = ['lorenz', 'rossler', 'doublePendulum'];

/**
 * Global keyboard shortcuts for the app.
 * Space: play/pause, R: reset, 1/2/3: switch system,
 * S: toggle side-by-side, T: toggle theme, H/?: help overlay,
 * P: screenshot, L: share link
 */
export function useKeyboardShortcuts(
  onToggleHelp: () => void,
) {
  const takeScreenshot = useScreenshot();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Don't capture if modifier keys (Ctrl/Alt/Meta) are pressed (allow browser shortcuts)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const store = useStore.getState();

      switch (e.key) {
        case ' ':
          e.preventDefault();
          store.setIsPlaying(!store.isPlaying);
          break;

        case 'r':
        case 'R':
          store.resetSimulation();
          break;

        case '1':
          store.setCurrentSystem(SYSTEM_ORDER[0]);
          store.setCurrentPreset(null);
          break;

        case '2':
          store.setCurrentSystem(SYSTEM_ORDER[1]);
          store.setCurrentPreset(null);
          break;

        case '3':
          store.setCurrentSystem(SYSTEM_ORDER[2]);
          store.setCurrentPreset(null);
          break;

        case 's':
        case 'S':
          store.setSideBySideMode(!store.sideBySideMode);
          if (!store.sideBySideMode) store.resetSimulation();
          break;

        case 't':
        case 'T': {
          const idx = THEME_ORDER.indexOf(store.colorTheme as typeof THEME_ORDER[number]);
          const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
          store.setColorTheme(next);
          break;
        }

        case 'h':
        case 'H':
        case '?':
          onToggleHelp();
          break;

        case 'p':
        case 'P':
          takeScreenshot();
          break;

        case 'l':
        case 'L':
          try {
            navigator.clipboard.writeText(getShareUrl());
          } catch {
            // Fallback: prompt with URL
            window.prompt('Share this URL:', getShareUrl());
          }
          break;

        case 'c':
        case 'C':
          store.setCinematicCamera(!store.cinematicCamera);
          break;

        case 'a':
        case 'A':
          store.setChaosAutopilot(!store.chaosAutopilot);
          break;

        case 'm':
        case 'M':
          store.setAudioEnabled(!store.audioEnabled);
          break;

        case 'b':
        case 'B':
          store.setBloomEnabled(!store.bloomEnabled);
          break;

        case 'g':
        case 'G':
          store.setParticleSwarm(!store.particleSwarm);
          break;

        case 'x':
        case 'X':
          store.perturbSystem();
          break;

        case 'Escape':
          // Close any open overlay
          if (store.storyMode) { store.setStoryMode(false); store.setCinematicCamera(false); }
          else if (store.showBifurcation) store.setShowBifurcation(false);
          else if (store.showPoincare) store.setShowPoincare(false);
          else if (store.showParameterSpace) store.setShowParameterSpace(false);
          else if (store.cinematicCamera) store.setCinematicCamera(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleHelp, takeScreenshot]);
}
