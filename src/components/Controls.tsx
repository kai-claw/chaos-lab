import React, { useState, useEffect } from 'react';
import { useStore, PRESETS, THEMES, type ChaosSystem, type ColorTheme } from '../store/useStore';
import './Controls.css';

const THEME_LABELS: Record<ColorTheme, string> = {
  classic: '🌌 Classic',
  neon: '💜 Neon',
  blueprint: '📐 Blueprint',
  terminal: '💻 Terminal',
};

const SYSTEM_LABELS: Record<ChaosSystem, string> = {
  lorenz: '🦋 Lorenz',
  rossler: '🌀 Rössler',
  doublePendulum: '⚡ Pendulum',
};

export const Controls: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const {
    currentSystem, setCurrentSystem,
    isPlaying, setIsPlaying,
    speed, setSpeed,
    trailLength, setTrailLength,
    sideBySideMode, setSideBySideMode,
    initialOffset, setInitialOffset,
    autoRotate, setAutoRotate,
    currentPreset, setCurrentPreset,
    colorTheme, setColorTheme,
    lorenzParams, setLorenzParams,
    rosslerParams, setRosslerParams,
    doublePendulumParams, setDoublePendulumParams,
    resetSimulation,
    showLyapunov, setShowLyapunov,
    showBifurcation, setShowBifurcation,
    showPoincare, setShowPoincare,
    showParameterSpace, setShowParameterSpace,
  } = useStore();

  const theme = THEMES[colorTheme];

  const handlePresetChange = (presetName: string) => {
    const preset = PRESETS[currentSystem].find(p => p.name === presetName);
    if (!preset) return;
    switch (currentSystem) {
      case 'lorenz': setLorenzParams(preset.params); break;
      case 'rossler': setRosslerParams(preset.params); break;
      case 'doublePendulum': setDoublePendulumParams(preset.params); break;
    }
    setCurrentPreset(presetName);
  };

  const handleSystemChange = (sys: ChaosSystem) => {
    setCurrentSystem(sys);
    setCurrentPreset(null);
  };

  const formatOffset = (v: number) => {
    if (v >= 0.01) return v.toFixed(3);
    return v.toExponential(1);
  };

  const renderSystemControls = () => {
    switch (currentSystem) {
      case 'lorenz':
        return (
          <div className="parameter-group" role="group" aria-label="Lorenz system parameters">
            <h4>Lorenz Parameters</h4>
            <div className="slider-group">
              <label htmlFor="sigma-slider">σ (sigma): {lorenzParams.sigma.toFixed(2)}</label>
              <input id="sigma-slider" type="range" min="0.1" max="30" step="0.1" value={lorenzParams.sigma}
                aria-valuemin={0.1} aria-valuemax={30} aria-valuenow={lorenzParams.sigma}
                aria-label={`Sigma: ${lorenzParams.sigma.toFixed(2)}`}
                onChange={(e) => setLorenzParams({ sigma: parseFloat(e.target.value) })} />
            </div>
            <div className="slider-group">
              <label htmlFor="rho-slider">ρ (rho): {lorenzParams.rho.toFixed(2)}</label>
              <input id="rho-slider" type="range" min="0.1" max="50" step="0.1" value={lorenzParams.rho}
                aria-valuemin={0.1} aria-valuemax={50} aria-valuenow={lorenzParams.rho}
                aria-label={`Rho: ${lorenzParams.rho.toFixed(2)}`}
                onChange={(e) => setLorenzParams({ rho: parseFloat(e.target.value) })} />
            </div>
            <div className="slider-group">
              <label htmlFor="beta-slider">β (beta): {lorenzParams.beta.toFixed(3)}</label>
              <input id="beta-slider" type="range" min="0.1" max="10" step="0.01" value={lorenzParams.beta}
                aria-valuemin={0.1} aria-valuemax={10} aria-valuenow={lorenzParams.beta}
                aria-label={`Beta: ${lorenzParams.beta.toFixed(3)}`}
                onChange={(e) => setLorenzParams({ beta: parseFloat(e.target.value) })} />
            </div>
          </div>
        );
      case 'rossler':
        return (
          <div className="parameter-group" role="group" aria-label="Rössler system parameters">
            <h4>Rössler Parameters</h4>
            <div className="slider-group">
              <label htmlFor="a-slider">a: {rosslerParams.a.toFixed(3)}</label>
              <input id="a-slider" type="range" min="0.01" max="1.0" step="0.01" value={rosslerParams.a}
                aria-label={`Parameter a: ${rosslerParams.a.toFixed(3)}`}
                onChange={(e) => setRosslerParams({ a: parseFloat(e.target.value) })} />
            </div>
            <div className="slider-group">
              <label htmlFor="b-slider">b: {rosslerParams.b.toFixed(3)}</label>
              <input id="b-slider" type="range" min="0.01" max="1.0" step="0.01" value={rosslerParams.b}
                aria-label={`Parameter b: ${rosslerParams.b.toFixed(3)}`}
                onChange={(e) => setRosslerParams({ b: parseFloat(e.target.value) })} />
            </div>
            <div className="slider-group">
              <label htmlFor="c-slider">c: {rosslerParams.c.toFixed(2)}</label>
              <input id="c-slider" type="range" min="1.0" max="20.0" step="0.1" value={rosslerParams.c}
                aria-label={`Parameter c: ${rosslerParams.c.toFixed(2)}`}
                onChange={(e) => setRosslerParams({ c: parseFloat(e.target.value) })} />
            </div>
          </div>
        );
      case 'doublePendulum':
        return (
          <div className="parameter-group" role="group" aria-label="Double pendulum parameters">
            <h4>Pendulum Parameters</h4>
            <div className="slider-group">
              <label htmlFor="mass1-slider">Mass 1: {doublePendulumParams.mass1.toFixed(2)}</label>
              <input id="mass1-slider" type="range" min="0.1" max="5.0" step="0.1" value={doublePendulumParams.mass1}
                aria-label={`Mass 1: ${doublePendulumParams.mass1.toFixed(2)}`}
                onChange={(e) => setDoublePendulumParams({ mass1: parseFloat(e.target.value) })} />
            </div>
            <div className="slider-group">
              <label htmlFor="mass2-slider">Mass 2: {doublePendulumParams.mass2.toFixed(2)}</label>
              <input id="mass2-slider" type="range" min="0.1" max="5.0" step="0.1" value={doublePendulumParams.mass2}
                aria-label={`Mass 2: ${doublePendulumParams.mass2.toFixed(2)}`}
                onChange={(e) => setDoublePendulumParams({ mass2: parseFloat(e.target.value) })} />
            </div>
            <div className="slider-group">
              <label htmlFor="len1-slider">Length 1: {doublePendulumParams.length1.toFixed(2)}</label>
              <input id="len1-slider" type="range" min="0.2" max="2.0" step="0.1" value={doublePendulumParams.length1}
                aria-label={`Length 1: ${doublePendulumParams.length1.toFixed(2)}`}
                onChange={(e) => setDoublePendulumParams({ length1: parseFloat(e.target.value) })} />
            </div>
            <div className="slider-group">
              <label htmlFor="len2-slider">Length 2: {doublePendulumParams.length2.toFixed(2)}</label>
              <input id="len2-slider" type="range" min="0.2" max="2.0" step="0.1" value={doublePendulumParams.length2}
                aria-label={`Length 2: ${doublePendulumParams.length2.toFixed(2)}`}
                onChange={(e) => setDoublePendulumParams({ length2: parseFloat(e.target.value) })} />
            </div>
            <div className="slider-group">
              <label htmlFor="gravity-slider">Gravity: {doublePendulumParams.gravity.toFixed(2)}</label>
              <input id="gravity-slider" type="range" min="1.0" max="20.0" step="0.1" value={doublePendulumParams.gravity}
                aria-label={`Gravity: ${doublePendulumParams.gravity.toFixed(2)}`}
                onChange={(e) => setDoublePendulumParams({ gravity: parseFloat(e.target.value) })} />
            </div>
            <div className="slider-group">
              <label htmlFor="damping-slider">Damping: {doublePendulumParams.damping.toFixed(3)}</label>
              <input id="damping-slider" type="range" min="0.0" max="0.2" step="0.005" value={doublePendulumParams.damping}
                aria-label={`Damping: ${doublePendulumParams.damping.toFixed(3)}`}
                onChange={(e) => setDoublePendulumParams({ damping: parseFloat(e.target.value) })} />
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <aside
      className={`controls ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}
      role="region"
      aria-label="Simulation controls"
      style={{
        '--panel-bg': theme.panelBg,
        '--panel-border': theme.panelBorder,
        '--text-color': theme.text,
        '--text-muted': theme.textMuted,
        '--accent': theme.accent,
        '--accent2': theme.accent2,
        '--heading': theme.heading,
        '--param-color': theme.paramColor,
      } as React.CSSProperties}
    >
      <button
        className="controls-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Show controls' : 'Hide controls'}
        aria-expanded={!isCollapsed}
      >
        {isCollapsed ? '⚙️' : '✕'}
      </button>

      {!isCollapsed && (
        <>
          {/* System Selector */}
          <div className="control-section">
            <h3 id="system-heading">Chaos System</h3>
            <div className="system-tabs" role="tablist" aria-labelledby="system-heading">
              {(['lorenz', 'rossler', 'doublePendulum'] as ChaosSystem[]).map((sys) => (
                <button
                  key={sys}
                  role="tab"
                  aria-selected={currentSystem === sys}
                  aria-label={`Select ${sys === 'doublePendulum' ? 'Double Pendulum' : sys} system`}
                  className={`system-tab ${currentSystem === sys ? 'active' : ''}`}
                  onClick={() => handleSystemChange(sys)}
                >
                  {SYSTEM_LABELS[sys]}
                </button>
              ))}
            </div>
          </div>

          {/* Simulation */}
          <div className="control-section">
            <h3>Simulation</h3>
            <div className="button-group">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`play-button ${isPlaying ? 'playing' : 'paused'}`}
                aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button onClick={resetSimulation} className="reset-button" aria-label="Reset simulation">
                🔄 Reset
              </button>
            </div>
            <div className="slider-group">
              <label htmlFor="speed-slider">Speed: {speed.toFixed(1)}x</label>
              <input id="speed-slider" type="range" min="0.1" max="5.0" step="0.1" value={speed}
                aria-label={`Simulation speed: ${speed.toFixed(1)}x`}
                onChange={(e) => setSpeed(parseFloat(e.target.value))} />
            </div>
            <div className="slider-group">
              <label htmlFor="trail-slider">
                Trail: {trailLength}
                {trailLength > 3000 && <span className="warn"> ⚠️ High</span>}
              </label>
              <input id="trail-slider" type="range" min="100" max="5000" step="100" value={trailLength}
                aria-label={`Trail length: ${trailLength} points`}
                onChange={(e) => setTrailLength(parseInt(e.target.value))} />
            </div>
          </div>

          {/* Butterfly Effect */}
          <div className="control-section butterfly-section">
            <h3>🦋 Butterfly Effect</h3>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={sideBySideMode}
                  aria-label="Enable butterfly mode: show two systems with tiny initial difference"
                  onChange={(e) => {
                    setSideBySideMode(e.target.checked);
                    if (e.target.checked) resetSimulation();
                  }}
                />
                Enable Butterfly Mode
              </label>
            </div>
            {sideBySideMode && (
              <div className="slider-group offset-slider">
                <label htmlFor="offset-slider">
                  Initial Offset: <span className="offset-value">{formatOffset(initialOffset)}</span>
                </label>
                <input id="offset-slider" type="range" min="-6" max="-0.5" step="0.1"
                  value={Math.log10(initialOffset)}
                  aria-label={`Initial offset between systems: ${formatOffset(initialOffset)}`}
                  onChange={(e) => {
                    setInitialOffset(Math.pow(10, parseFloat(e.target.value)));
                    resetSimulation();
                  }} />
                <div className="offset-labels" aria-hidden="true">
                  <span>Tiny</span>
                  <span>Large</span>
                </div>
              </div>
            )}
          </div>

          {/* View Options */}
          <div className="control-section">
            <h3>View</h3>
            {currentSystem !== 'doublePendulum' && (
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    aria-label="Auto-rotate camera around the attractor"
                    onChange={(e) => setAutoRotate(e.target.checked)}
                  />
                  Auto Rotate
                </label>
              </div>
            )}
          </div>

          {/* Theme */}
          <div className="control-section">
            <h3 id="theme-heading">Theme</h3>
            <div className="theme-grid" role="radiogroup" aria-labelledby="theme-heading">
              {(Object.keys(THEMES) as ColorTheme[]).map((t) => (
                <button key={t}
                  role="radio"
                  aria-checked={colorTheme === t}
                  aria-label={`${t} theme`}
                  className={`theme-btn ${colorTheme === t ? 'active' : ''}`}
                  onClick={() => setColorTheme(t)}
                  style={{
                    '--tbg': THEMES[t].bg,
                    '--taccent': THEMES[t].accent,
                  } as React.CSSProperties}
                >
                  {THEME_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div className="control-section">
            <h3>Presets</h3>
            <div className="preset-chips" role="group" aria-label="Parameter presets">
              {PRESETS[currentSystem].map((preset) => (
                <button key={preset.name}
                  className={`preset-chip ${currentPreset === preset.name ? 'active' : ''}`}
                  onClick={() => handlePresetChange(preset.name)}
                  aria-label={`${preset.name}: ${preset.description}`}
                  aria-pressed={currentPreset === preset.name}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* System params */}
          {renderSystemControls()}
        </>
      )}
    </aside>
  );
};
