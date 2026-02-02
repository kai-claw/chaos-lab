import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { Scene } from './components/Scene';
import { Controls } from './components/Controls';
import { InfoPanel } from './components/InfoPanel';
import { QuickStart } from './components/QuickStart';
import { DivergenceMeter } from './components/DivergenceMeter';
import { LyapunovIndicator } from './components/LyapunovIndicator';
import { HelpOverlay } from './components/HelpOverlay';
import { StoryMode } from './components/StoryMode';
import { ChaosSynth } from './components/ChaosSynth';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUrlState } from './hooks/useUrlState';
import { useStore, THEMES } from './store/useStore';
import './App.css';

// Lazy-load heavy analysis panels (only rendered when toggled on)
const BifurcationDiagram = lazy(() => import('./components/BifurcationDiagram').then(m => ({ default: m.BifurcationDiagram })));
const PoincareSection = lazy(() => import('./components/PoincareSection').then(m => ({ default: m.PoincareSection })));
const ParameterSpace = lazy(() => import('./components/ParameterSpace').then(m => ({ default: m.ParameterSpace })));

/**
 * Detects prefers-reduced-motion and pauses simulation automatically.
 */
function useReducedMotion() {
  const setIsPlaying = useStore((s) => s.setIsPlaying);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setIsPlaying(false);
    }
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setIsPlaying(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [setIsPlaying]);
}

function App() {
  const { colorTheme, currentSystem } = useStore();
  const theme = THEMES[colorTheme];
  const [showHelp, setShowHelp] = useState(false);
  const [entered, setEntered] = useState(false);
  const [titleVisible, setTitleVisible] = useState(true);
  const [uiReady, setUiReady] = useState(false);
  const prevSystemRef = useRef(currentSystem);
  const [systemTransition, setSystemTransition] = useState(false);

  const toggleHelp = useCallback(() => setShowHelp((v) => !v), []);

  useReducedMotion();
  useKeyboardShortcuts(toggleHelp);
  useUrlState();

  // Cinematic entrance sequence
  useEffect(() => {
    // Scene fades in
    const t1 = setTimeout(() => setEntered(true), 100);
    // UI elements appear after scene
    const t2 = setTimeout(() => setUiReady(true), 1200);
    // Title gracefully fades after settling
    const t3 = setTimeout(() => setTitleVisible(false), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // System transition crossfade
  useEffect(() => {
    if (prevSystemRef.current !== currentSystem) {
      setSystemTransition(true);
      const t = setTimeout(() => setSystemTransition(false), 600);
      prevSystemRef.current = currentSystem;
      return () => clearTimeout(t);
    }
  }, [currentSystem]);

  const systemName =
    currentSystem === 'lorenz' ? 'Lorenz Attractor' :
    currentSystem === 'rossler' ? 'Rössler Attractor' :
    'Double Pendulum';

  return (
    <div
      className={`app ${entered ? 'entered' : 'entering'} ${systemTransition ? 'system-transitioning' : ''}`}
      style={{ '--bg': theme.bg, '--text': theme.text, '--accent': theme.accent } as React.CSSProperties}
    >
      {/* Skip link for keyboard users */}
      <a href="#controls-region" className="skip-link">
        Skip to controls
      </a>

      {/* Screen reader live region for system changes */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Now viewing: {systemName}
      </div>

      <main className={systemTransition ? 'scene-crossfade' : ''}>
        <Scene />
      </main>

      <div className={`ui-layer ${uiReady ? 'visible' : ''}`}>
        <InfoPanel />
        <div id="controls-region">
          <Controls />
        </div>
        <DivergenceMeter />
        <LyapunovIndicator />
        <Suspense fallback={null}>
          <BifurcationDiagram />
          <PoincareSection />
          <ParameterSpace />
        </Suspense>
      </div>

      <HelpOverlay isVisible={showHelp} onClose={toggleHelp} />
      <StoryMode />
      <QuickStart />
      <ChaosSynth />

      {/* Title overlay — fades after entrance, returns on hover */}
      <div
        className={`title-overlay ${titleVisible ? 'visible' : 'faded'}`}
        aria-hidden="true"
        onMouseEnter={() => setTitleVisible(true)}
        onMouseLeave={() => setTitleVisible(false)}
      >
        <h1>Chaos Lab</h1>
        <p>Interactive Chaos Theory Visualizer</p>
      </div>

      {/* Instructions overlay — warmer language */}
      <div className={`instructions ${uiReady ? 'visible' : ''}`} aria-hidden="true">
        <p>
          Drag to explore · Scroll to dive deeper · Right-drag to drift
        </p>
      </div>
    </div>
  );
}

export default App;
