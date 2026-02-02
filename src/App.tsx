import { useEffect, useState, useCallback } from 'react';
import { Scene } from './components/Scene';
import { Controls } from './components/Controls';
import { InfoPanel } from './components/InfoPanel';
import { QuickStart } from './components/QuickStart';
import { DivergenceMeter } from './components/DivergenceMeter';
import { LyapunovIndicator } from './components/LyapunovIndicator';
import { BifurcationDiagram } from './components/BifurcationDiagram';
import { HelpOverlay } from './components/HelpOverlay';
import { PoincareSection } from './components/PoincareSection';
import { ParameterSpace } from './components/ParameterSpace';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUrlState } from './hooks/useUrlState';
import { useStore, THEMES } from './store/useStore';
import './App.css';

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

  const toggleHelp = useCallback(() => setShowHelp((v) => !v), []);

  useReducedMotion();
  useKeyboardShortcuts(toggleHelp);
  useUrlState();

  const systemName =
    currentSystem === 'lorenz' ? 'Lorenz Attractor' :
    currentSystem === 'rossler' ? 'Rössler Attractor' :
    'Double Pendulum';

  return (
    <div className="app" style={{ '--bg': theme.bg, '--text': theme.text, '--accent': theme.accent } as React.CSSProperties}>
      {/* Skip link for keyboard users */}
      <a href="#controls-region" className="skip-link">
        Skip to controls
      </a>

      {/* Screen reader live region for system changes */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Now viewing: {systemName}
      </div>

      <main>
        <Scene />
      </main>

      <InfoPanel />
      <div id="controls-region">
        <Controls />
      </div>
      <DivergenceMeter />
      <LyapunovIndicator />
      <BifurcationDiagram />
      <PoincareSection />
      <ParameterSpace />
      <HelpOverlay isVisible={showHelp} onClose={toggleHelp} />
      <QuickStart />

      {/* Title overlay */}
      <div className="title-overlay" aria-hidden="true">
        <h1>Chaos Lab</h1>
        <p>Interactive Chaos Theory Visualizer</p>
      </div>

      {/* Instructions overlay */}
      <div className="instructions" aria-hidden="true">
        <p>
          <strong>Mouse:</strong> Drag to rotate · Scroll to zoom · Right-drag to pan<br />
          <strong>Touch:</strong> Drag to rotate · Pinch to zoom
        </p>
      </div>
    </div>
  );
}

export default App;
