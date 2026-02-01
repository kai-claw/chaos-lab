import { Scene } from './components/Scene';
import { Controls } from './components/Controls';
import { InfoPanel } from './components/InfoPanel';
import { QuickStart } from './components/QuickStart';
import './App.css';

function App() {
  return (
    <div className="app">
      <Scene />
      <InfoPanel />
      <Controls />
      <QuickStart />
      
      {/* Title overlay */}
      <div className="title-overlay">
        <h1>Chaos Lab</h1>
        <p>Interactive Chaos Theory Visualizer</p>
      </div>
      
      {/* Instructions overlay */}
      <div className="instructions">
        <p>
          <strong>Mouse:</strong> Left drag to rotate • Scroll to zoom • Right drag to pan<br />
          <strong>Touch:</strong> Drag to rotate • Pinch to zoom • Two fingers to pan
        </p>
      </div>
    </div>
  );
}

export default App;