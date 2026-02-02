import { Scene } from './components/Scene';
import { Controls } from './components/Controls';
import { InfoPanel } from './components/InfoPanel';
import { QuickStart } from './components/QuickStart';
import { DivergenceMeter } from './components/DivergenceMeter';
import { useStore, THEMES } from './store/useStore';
import './App.css';

function App() {
  const { colorTheme } = useStore();
  const theme = THEMES[colorTheme];

  return (
    <div className="app" style={{ '--bg': theme.bg, '--text': theme.text, '--accent': theme.accent } as React.CSSProperties}>
      <Scene />
      <InfoPanel />
      <Controls />
      <DivergenceMeter />
      <QuickStart />
      
      {/* Title overlay */}
      <div className="title-overlay">
        <h1>Chaos Lab</h1>
        <p>Interactive Chaos Theory Visualizer</p>
      </div>
      
      {/* Instructions overlay */}
      <div className="instructions">
        <p>
          <strong>Mouse:</strong> Drag to rotate · Scroll to zoom · Right-drag to pan<br />
          <strong>Touch:</strong> Drag to rotate · Pinch to zoom
        </p>
      </div>
    </div>
  );
}

export default App;
