import React, { useRef, useEffect, useCallback } from 'react';
import { useStore, THEMES } from '../store/useStore';
import './BifurcationDiagram.css';

const RHO_MIN = 0;
const RHO_MAX = 200;
const RHO_STEPS = 600;
const Z_MAX = 300;
const TRANSIENT = 5000;
const SAMPLE = 3000;
const DT = 0.005;

export const BifurcationDiagram: React.FC = () => {
  const { showBifurcation, setShowBifurcation, lorenzParams, setLorenzParams, colorTheme, resetSimulation, setCurrentSystem } = useStore();
  const theme = THEMES[colorTheme];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const computedRef = useRef(false);
  const animFrameRef = useRef(0);

  const computeDiagram = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Dark background
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let r = 0; r <= RHO_MAX; r += 20) {
      const x = (r / RHO_MAX) * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let z = 0; z <= Z_MAX; z += 50) {
      const y = H - (z / Z_MAX) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    let rhoIdx = 0;
    const sigma = 10;
    const beta = 8 / 3;

    const batchSize = 15;

    function computeBatch() {
      for (let b = 0; b < batchSize && rhoIdx < RHO_STEPS; b++, rhoIdx++) {
        const rho = RHO_MIN + (rhoIdx / RHO_STEPS) * (RHO_MAX - RHO_MIN);
        let x = 1, y = 1, z = 1;

        // Transient
        for (let i = 0; i < TRANSIENT; i++) {
          const dx = sigma * (y - x);
          const dy = x * (rho - z) - y;
          const dz = x * y - beta * z;
          x += dx * DT; y += dy * DT; z += dz * DT;
          // Stability check
          if (Math.abs(x) > 1e6) { x = 1; y = 1; z = 1; break; }
        }

        // Collect z maxima
        let prevZ = z;
        let prevDz = 0;
        for (let i = 0; i < SAMPLE; i++) {
          const dx = sigma * (y - x);
          const dy = x * (rho - z) - y;
          const dz = x * y - beta * z;
          x += dx * DT; y += dy * DT; z += dz * DT;
          if (Math.abs(x) > 1e6) break;

          const currDz = z - prevZ;
          if (prevDz > 0 && currDz <= 0 && z > 0 && z < Z_MAX) {
            const px = (rho / RHO_MAX) * W;
            const py = H - (z / Z_MAX) * H;
            ctx.fillStyle = 'rgba(100, 180, 255, 0.35)';
            ctx.fillRect(px, py, 1.5, 1.5);
          }
          prevDz = currDz;
          prevZ = z;
        }
      }

      if (rhoIdx < RHO_STEPS) {
        animFrameRef.current = requestAnimationFrame(computeBatch);
      } else {
        computedRef.current = true;
        drawAxisLabels(ctx, W, H);
      }
    }

    computeBatch();
  }, []);

  const drawAxisLabels = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';

    // X axis labels (ρ values)
    for (let r = 0; r <= RHO_MAX; r += 40) {
      const x = (r / RHO_MAX) * W;
      ctx.fillText(`${r}`, x, H - 4);
    }

    // Y axis labels (z values)
    ctx.textAlign = 'left';
    for (let z = 50; z <= Z_MAX; z += 50) {
      const y = H - (z / Z_MAX) * H;
      ctx.fillText(`${z}`, 4, y + 4);
    }

    // Axis titles
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ρ (rho)', W / 2, H - 16);
    ctx.save();
    ctx.translate(16, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('z maxima', 0, 0);
    ctx.restore();
  };

  // Draw cursor overlay showing current ρ
  const drawOverlay = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Current ρ line
    const x = (lorenzParams.rho / RHO_MAX) * W;
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = x > W / 2 ? 'right' : 'left';
    const labelX = x > W / 2 ? x - 6 : x + 6;
    ctx.fillText(`ρ = ${lorenzParams.rho.toFixed(1)}`, labelX, 16);
  }, [lorenzParams.rho]);

  useEffect(() => {
    if (showBifurcation) {
      computedRef.current = false;
      computeDiagram();
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [showBifurcation, computeDiagram]);

  useEffect(() => {
    if (showBifurcation) drawOverlay();
  }, [showBifurcation, drawOverlay]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const rho = (x / rect.width) * RHO_MAX;
    const clampedRho = Math.max(0.1, Math.min(RHO_MAX, rho));
    setCurrentSystem('lorenz');
    setLorenzParams({ rho: Math.round(clampedRho * 10) / 10 });
    resetSimulation();
  };

  if (!showBifurcation) return null;

  return (
    <div
      className="bifurcation-overlay"
      style={{
        '--panel-bg': theme.panelBg,
        '--panel-border': theme.panelBorder,
        '--text': theme.text,
        '--accent': theme.accent,
      } as React.CSSProperties}
    >
      <div className="bifurcation-header">
        <h3>📊 Lorenz Bifurcation Diagram</h3>
        <button className="bifurcation-close" onClick={() => setShowBifurcation(false)}>✕</button>
      </div>
      <div className="bifurcation-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={600}
          height={380}
          className="bifurcation-canvas"
        />
        <canvas
          ref={overlayRef}
          width={600}
          height={380}
          className="bifurcation-canvas-overlay"
          onClick={handleClick}
          title="Click to set ρ value"
        />
      </div>
      <p className="bifurcation-hint">
        Click anywhere on the diagram to jump to that ρ value. The vertical line shows the current ρ.
      </p>
    </div>
  );
};
