import React from 'react';
import { useStore, PRESETS, type ChaosSystem } from '../store/useStore';
import './Controls.css';

export const Controls: React.FC = () => {
  const {
    currentSystem,
    setCurrentSystem,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    trailLength,
    setTrailLength,
    sideBySideMode,
    setSideBySideMode,
    autoRotate,
    setAutoRotate,
    currentPreset,
    setCurrentPreset,
    lorenzParams,
    setLorenzParams,
    rosslerParams,
    setRosslerParams,
    doublePendulumParams,
    setDoublePendulumParams,
    resetSimulation,
  } = useStore();

  const handlePresetChange = (presetName: string) => {
    const preset = PRESETS[currentSystem].find(p => p.name === presetName);
    if (!preset) return;

    switch (currentSystem) {
      case 'lorenz':
        setLorenzParams(preset.params);
        break;
      case 'rossler':
        setRosslerParams(preset.params);
        break;
      case 'doublePendulum':
        setDoublePendulumParams(preset.params);
        break;
    }
    setCurrentPreset(presetName);
  };

  const renderSystemControls = () => {
    switch (currentSystem) {
      case 'lorenz':
        return (
          <div className="parameter-group">
            <h4>Lorenz Parameters</h4>
            <div className="slider-group">
              <label>σ (sigma): {lorenzParams.sigma.toFixed(2)}</label>
              <input
                type="range"
                min="0.1"
                max="30"
                step="0.1"
                value={lorenzParams.sigma}
                onChange={(e) => setLorenzParams({ sigma: parseFloat(e.target.value) })}
              />
            </div>
            <div className="slider-group">
              <label>ρ (rho): {lorenzParams.rho.toFixed(2)}</label>
              <input
                type="range"
                min="0.1"
                max="50"
                step="0.1"
                value={lorenzParams.rho}
                onChange={(e) => setLorenzParams({ rho: parseFloat(e.target.value) })}
              />
            </div>
            <div className="slider-group">
              <label>β (beta): {lorenzParams.beta.toFixed(3)}</label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.01"
                value={lorenzParams.beta}
                onChange={(e) => setLorenzParams({ beta: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        );

      case 'rossler':
        return (
          <div className="parameter-group">
            <h4>Rössler Parameters</h4>
            <div className="slider-group">
              <label>a: {rosslerParams.a.toFixed(3)}</label>
              <input
                type="range"
                min="0.01"
                max="1.0"
                step="0.01"
                value={rosslerParams.a}
                onChange={(e) => setRosslerParams({ a: parseFloat(e.target.value) })}
              />
            </div>
            <div className="slider-group">
              <label>b: {rosslerParams.b.toFixed(3)}</label>
              <input
                type="range"
                min="0.01"
                max="1.0"
                step="0.01"
                value={rosslerParams.b}
                onChange={(e) => setRosslerParams({ b: parseFloat(e.target.value) })}
              />
            </div>
            <div className="slider-group">
              <label>c: {rosslerParams.c.toFixed(2)}</label>
              <input
                type="range"
                min="1.0"
                max="20.0"
                step="0.1"
                value={rosslerParams.c}
                onChange={(e) => setRosslerParams({ c: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        );

      case 'doublePendulum':
        return (
          <div className="parameter-group">
            <h4>Double Pendulum Parameters</h4>
            <div className="slider-group">
              <label>Mass 1: {doublePendulumParams.mass1.toFixed(2)}</label>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={doublePendulumParams.mass1}
                onChange={(e) => setDoublePendulumParams({ mass1: parseFloat(e.target.value) })}
              />
            </div>
            <div className="slider-group">
              <label>Mass 2: {doublePendulumParams.mass2.toFixed(2)}</label>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={doublePendulumParams.mass2}
                onChange={(e) => setDoublePendulumParams({ mass2: parseFloat(e.target.value) })}
              />
            </div>
            <div className="slider-group">
              <label>Length 1: {doublePendulumParams.length1.toFixed(2)}</label>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={doublePendulumParams.length1}
                onChange={(e) => setDoublePendulumParams({ length1: parseFloat(e.target.value) })}
              />
            </div>
            <div className="slider-group">
              <label>Length 2: {doublePendulumParams.length2.toFixed(2)}</label>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={doublePendulumParams.length2}
                onChange={(e) => setDoublePendulumParams({ length2: parseFloat(e.target.value) })}
              />
            </div>
            <div className="slider-group">
              <label>Gravity: {doublePendulumParams.gravity.toFixed(2)}</label>
              <input
                type="range"
                min="1.0"
                max="20.0"
                step="0.1"
                value={doublePendulumParams.gravity}
                onChange={(e) => setDoublePendulumParams({ gravity: parseFloat(e.target.value) })}
              />
            </div>
            <div className="slider-group">
              <label>Damping: {doublePendulumParams.damping.toFixed(3)}</label>
              <input
                type="range"
                min="0.0"
                max="0.2"
                step="0.005"
                value={doublePendulumParams.damping}
                onChange={(e) => setDoublePendulumParams({ damping: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="controls">
      <div className="control-section">
        <h3>Chaos System</h3>
        <select 
          value={currentSystem} 
          onChange={(e) => setCurrentSystem(e.target.value as ChaosSystem)}
          className="system-select"
        >
          <option value="lorenz">Lorenz Attractor</option>
          <option value="rossler">Rössler Attractor</option>
          <option value="doublePendulum">Double Pendulum</option>
        </select>
      </div>

      <div className="control-section">
        <h3>Simulation</h3>
        <div className="button-group">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`play-button ${isPlaying ? 'playing' : 'paused'}`}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button onClick={resetSimulation} className="reset-button">
            🔄 Reset
          </button>
        </div>
        
        <div className="slider-group">
          <label>Speed: {speed.toFixed(1)}x</label>
          <input
            type="range"
            min="0.1"
            max="5.0"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
        </div>
        
        <div className="slider-group">
          <label>Trail Length: {trailLength}</label>
          <input
            type="range"
            min="100"
            max="5000"
            step="100"
            value={trailLength}
            onChange={(e) => setTrailLength(parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="control-section">
        <h3>View Options</h3>
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={sideBySideMode}
              onChange={(e) => setSideBySideMode(e.target.checked)}
            />
            Side-by-Side Mode
          </label>
        </div>
        
        {currentSystem !== 'doublePendulum' && (
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={autoRotate}
                onChange={(e) => setAutoRotate(e.target.checked)}
              />
              Auto Rotate Camera
            </label>
          </div>
        )}
      </div>

      <div className="control-section">
        <h3>Presets</h3>
        <select
          value={currentPreset || ''}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="preset-select"
        >
          <option value="">Select Preset</option>
          {PRESETS[currentSystem].map((preset) => (
            <option key={preset.name} value={preset.name}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>

      {renderSystemControls()}
    </div>
  );
};