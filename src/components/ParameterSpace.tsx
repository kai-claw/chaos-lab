import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useStore, THEMES } from '../store/useStore';
import './ParameterSpace.css';

const CANVAS_W = 500;
const CANVAS_H = 400;

/**
 * Parameter Space Explorer — visualizes the Lyapunov exponent across a 2D slice
 * of parameter space, showing where chaos lives.
 * For Lorenz: σ vs ρ. For Rössler: a vs c.
 */
export const ParameterSpace: React.FC = () => {
  const {
    showParameterSpace, setShowParameterSpace, colorTheme, currentSystem,
    setLorenzParams, setRosslerParams, resetSimulation, setCurrentSystem,
  } = useStore();
  const theme = THEMES[colorTheme];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const computedRef = useRef(false);
  const animFrameRef = useRef(0);
  const [computing, setComputing] = useState(false);
  const [progress, setProgress] = useState(0);
  const lorenzParams = useStore((s) => s.lorenzParams);
  const rosslerParams = useStore((s) => s.rosslerParams);

  // Define parameter ranges per system (reads live state, not stale snapshot)
  const getConfig = useCallback(() => {
    if (currentSystem === 'lorenz') {
      return {
        xLabel: 'σ (sigma)',
        yLabel: 'ρ (rho)',
        xMin: 1, xMax: 30,
        yMin: 1, yMax: 50,
        xSteps: 120,
        ySteps: 100,
        title: 'Lorenz Parameter Space (Lyapunov)',
        currentX: lorenzParams.sigma,
        currentY: lorenzParams.rho,
      };
    } else if (currentSystem === 'rossler') {
      return {
        xLabel: 'a',
        yLabel: 'c',
        xMin: 0.05, xMax: 0.5,
        yMin: 1, yMax: 20,
        xSteps: 100,
        ySteps: 100,
        title: 'Rössler Parameter Space (Lyapunov)',
        currentX: rosslerParams.a,
        currentY: rosslerParams.c,
      };
    }
    return null;
  }, [currentSystem, lorenzParams, rosslerParams]);

  const computeMap = useCallback(() => {
    const canvas = canvasRef.current;
    const config = getConfig();
    if (!canvas || !config) return;
    const maybeCtx = canvas.getContext('2d');
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, W, H);

    const { xMin, xMax, yMin, yMax, xSteps, ySteps } = config;
    setComputing(true);

    let yi = 0;
    const batchSize = 5;
    const TRANSIENT = 500;
    const MEASURE = 300;
    const DT = 0.01;

    function computeBatch() {
      for (let b = 0; b < batchSize && yi < ySteps; b++, yi++) {
        const yVal = yMin + (yi / ySteps) * (yMax - yMin);

        for (let xi = 0; xi < xSteps; xi++) {
          const xVal = xMin + (xi / xSteps) * (xMax - xMin);

          // Compute Lyapunov for this parameter pair
          let x = 1, y = 1, z = 1;
          // Perturbation vector
          let px = 1, py = 0, pz = 0;
          let lyapSum = 0;
          let lyapSteps = 0;

          // Transient
          for (let i = 0; i < TRANSIENT; i++) {
            let dx: number, dy: number, dz: number;
            if (currentSystem === 'lorenz') {
              dx = xVal * (y - x);
              dy = x * (yVal - z) - y;
              dz = x * y - (8 / 3) * z;
            } else {
              dx = -y - z;
              dy = x + xVal * y;
              dz = 0.2 + z * (x - yVal);
            }
            x += dx * DT; y += dy * DT; z += dz * DT;
            if (Math.abs(x) > 1e6) { x = 1; y = 1; z = 1; break; }
          }

          // Measure
          for (let i = 0; i < MEASURE; i++) {
            let dx: number, dy: number, dz: number;
            let jx: number, jy: number, jz: number;

            if (currentSystem === 'lorenz') {
              dx = xVal * (y - x);
              dy = x * (yVal - z) - y;
              dz = x * y - (8 / 3) * z;
              // Jacobian * perturbation
              jx = xVal * (py - px);
              jy = (yVal - z) * px - py - x * pz;
              jz = y * px + x * py - (8 / 3) * pz;
            } else {
              dx = -y - z;
              dy = x + xVal * y;
              dz = 0.2 + z * (x - yVal);
              jx = -py - pz;
              jy = px + xVal * py;
              jz = z * px + (x - yVal) * pz;
            }

            x += dx * DT; y += dy * DT; z += dz * DT;
            px += jx * DT; py += jy * DT; pz += jz * DT;

            if (Math.abs(x) > 1e6) break;

            // Renormalize every 10 steps
            if (i % 10 === 9) {
              const norm = Math.sqrt(px * px + py * py + pz * pz);
              if (norm > 0 && isFinite(norm)) {
                lyapSum += Math.log(norm);
                lyapSteps++;
                px /= norm; py /= norm; pz /= norm;
              }
            }
          }

          const lambda = lyapSteps > 0 ? lyapSum / (lyapSteps * 10 * DT) : 0;

          // Map λ to color
          let r: number, g: number, b2: number;
          if (lambda > 0.1) {
            // Chaotic — red to yellow
            const t = Math.min(1, lambda / 3);
            r = 180 + 75 * t;
            g = 30 + 180 * t;
            b2 = 20;
          } else if (lambda > -0.05) {
            // Edge of chaos — yellow-green
            r = 180;
            g = 200;
            b2 = 40;
          } else {
            // Stable — blue to dark
            const t = Math.min(1, Math.abs(lambda) / 5);
            r = 10;
            g = 30 + 100 * (1 - t);
            b2 = 80 + 150 * (1 - t);
          }

          const pixX = Math.floor((xi / xSteps) * W);
          const pixY = Math.floor(H - ((yi + 1) / ySteps) * H);
          const pixW = Math.ceil(W / xSteps) + 1;
          const pixH = Math.ceil(H / ySteps) + 1;

          ctx.fillStyle = `rgb(${r},${g},${b2})`;
          ctx.fillRect(pixX, pixY, pixW, pixH);
        }
      }

      setProgress(Math.round((yi / ySteps) * 100));

      if (yi < ySteps) {
        animFrameRef.current = requestAnimationFrame(computeBatch);
      } else {
        computedRef.current = true;
        setComputing(false);
        drawLabels(ctx, W, H, config);
      }
    }

    computeBatch();
  }, [currentSystem, getConfig]);

  const drawLabels = (ctx: CanvasRenderingContext2D, W: number, H: number, config: any) => {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';

    for (let i = 0; i <= 5; i++) {
      const val = config.xMin + (i / 5) * (config.xMax - config.xMin);
      ctx.fillText(val.toFixed(1), (i / 5) * W, H - 4);
    }
    ctx.textAlign = 'left';
    for (let i = 0; i <= 5; i++) {
      const val = config.yMin + (i / 5) * (config.yMax - config.yMin);
      ctx.fillText(val.toFixed(1), 4, H - (i / 5) * H + 4);
    }

    // Legend
    const legendY = 14;
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgb(255, 210, 20)'; ctx.fillRect(W - 130, legendY, 10, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText('Chaotic (λ > 0)', W - 116, legendY + 9);
    ctx.fillStyle = 'rgb(10, 130, 230)'; ctx.fillRect(W - 130, legendY + 16, 10, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText('Stable (λ < 0)', W - 116, legendY + 25);
  };

  const drawOverlay = useCallback(() => {
    const canvas = overlayRef.current;
    const config = getConfig();
    if (!canvas || !config) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const x = ((config.currentX - config.xMin) / (config.xMax - config.xMin)) * canvas.width;
    const y = canvas.height - ((config.currentY - config.yMin) / (config.yMax - config.yMin)) * canvas.height;

    // Crosshair
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    ctx.setLineDash([]);

    // Circle at current position
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = x > canvas.width / 2 ? 'right' : 'left';
    const labelX = x > canvas.width / 2 ? x - 10 : x + 10;
    ctx.fillText(
      `${config.xLabel.split(' ')[0]}=${config.currentX.toFixed(1)}, ${config.yLabel.split(' ')[0]}=${config.currentY.toFixed(1)}`,
      labelX, y - 10
    );
  }, [getConfig]);

  useEffect(() => {
    if (showParameterSpace && !computedRef.current) {
      computeMap();
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [showParameterSpace, computeMap]);

  useEffect(() => {
    if (showParameterSpace) drawOverlay();
  }, [showParameterSpace, drawOverlay]);

  // Reset computation when system changes
  useEffect(() => {
    computedRef.current = false;
    if (showParameterSpace) {
      computeMap();
    }
  }, [currentSystem]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayRef.current;
    const config = getConfig();
    if (!canvas || !config) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const xVal = config.xMin + (cx / rect.width) * (config.xMax - config.xMin);
    const yVal = config.yMin + (1 - cy / rect.height) * (config.yMax - config.yMin);

    if (currentSystem === 'lorenz') {
      setCurrentSystem('lorenz');
      setLorenzParams({ sigma: Math.round(xVal * 10) / 10, rho: Math.round(yVal * 10) / 10 });
    } else if (currentSystem === 'rossler') {
      setCurrentSystem('rossler');
      setRosslerParams({ a: Math.round(xVal * 100) / 100, c: Math.round(yVal * 10) / 10 });
    }
    resetSimulation();
  };

  if (!showParameterSpace) return null;

  const config = getConfig();
  if (!config) {
    return (
      <div
        className="paramspace-overlay"
        style={{ '--panel-bg': theme.panelBg, '--panel-border': theme.panelBorder, '--text': theme.text, '--accent': theme.accent } as React.CSSProperties}
      >
        <div className="paramspace-header">
          <h3>🗺️ Parameter Space</h3>
          <button className="paramspace-close" onClick={() => setShowParameterSpace(false)}>✕</button>
        </div>
        <p className="paramspace-hint">Parameter space exploration is available for Lorenz and Rössler systems.</p>
      </div>
    );
  }

  return (
    <div
      className="paramspace-overlay"
      role="dialog"
      aria-label={config.title}
      aria-modal="false"
      onKeyDown={(e) => { if (e.key === 'Escape') setShowParameterSpace(false); }}
      style={{ '--panel-bg': theme.panelBg, '--panel-border': theme.panelBorder, '--text': theme.text, '--accent': theme.accent } as React.CSSProperties}
    >
      <div className="paramspace-header">
        <h3>🗺️ {config.title}</h3>
        <button className="paramspace-close" onClick={() => setShowParameterSpace(false)} aria-label="Close parameter space explorer">✕</button>
      </div>
      <div className="paramspace-canvas-wrap">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="paramspace-canvas" />
        <canvas ref={overlayRef} width={CANVAS_W} height={CANVAS_H} className="paramspace-canvas-overlay" onClick={handleClick} title="Click to set parameters" />
        {computing && (
          <div className="paramspace-progress">
            <div className="paramspace-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <p className="paramspace-hint">
        Click anywhere to jump to those parameters. Red/yellow = chaotic, blue = stable.
        {currentSystem === 'lorenz' && ` X: σ (${config.xMin}–${config.xMax}), Y: ρ (${config.yMin}–${config.yMax}), β fixed at 8/3.`}
        {currentSystem === 'rossler' && ` X: a (${config.xMin}–${config.xMax}), Y: c (${config.yMin}–${config.yMax}), b fixed at 0.2.`}
      </p>
    </div>
  );
};
