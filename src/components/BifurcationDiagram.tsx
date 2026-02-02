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
const BATCH_SIZE = 15;
const GRID_RHO_STEP = 20;
const GRID_Z_STEP = 50;
const LABEL_RHO_STEP = 40;
const DOT_COLOR = 'rgba(100, 180, 255, 0.35)';
const DOT_SIZE = 1.5;

export const BifurcationDiagram: React.FC = () => {
  const { showBifurcation, setShowBifurcation, lorenzParams, setLorenzParams, colorTheme, resetSimulation, setCurrentSystem } = useStore();
  const theme = THEMES[colorTheme];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);

  const computeDiagram = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let r = 0; r <= RHO_MAX; r += GRID_RHO_STEP) {
      const x = (r / RHO_MAX) * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let z = 0; z <= Z_MAX; z += GRID_Z_STEP) {
      const y = H - (z / Z_MAX) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    let rhoIdx = 0;
    const sigma = 10;
    const beta = 8 / 3;

    function computeBatch() {
      for (let b = 0; b < BATCH_SIZE && rhoIdx < RHO_STEPS; b++, rhoIdx++) {
        const rho = RHO_MIN + (rhoIdx / RHO_STEPS) * (RHO_MAX - RHO_MIN);
        let x = 1, y = 1, z = 1;

        // Transient
        for (let i = 0; i < TRANSIENT; i++) {
          const dx = sigma * (y - x);
          const dy = x * (rho - z) - y;
          const dz = x * y - beta * z;
          x += dx * DT; y += dy * DT; z += dz * DT;
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
            ctx.fillStyle = DOT_COLOR;
            ctx.fillRect(px, py, DOT_SIZE, DOT_SIZE);
          }
          prevDz = currDz;
          prevZ = z;
        }
      }

      if (rhoIdx < RHO_STEPS) {
        animFrameRef.current = requestAnimationFrame(computeBatch);
      } else {
        drawAxisLabels(ctx, W, H);
      }
    }

    computeBatch();
  }, []);

  const drawAxisLabels = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';

    for (let r = 0; r <= RHO_MAX; r += LABEL_RHO_STEP) {
      const x = (r / RHO_MAX) * W;
      ctx.fillText(`${r}`, x, H - 4);
    }

    ctx.textAlign = 'left';
    for (let z = GRID_Z_STEP; z <= Z_MAX; z += GRID_Z_STEP) {
      const y = H - (z / Z_MAX) * H;
      ctx.fillText(`${z}`, 4, y + 4);
    }

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

  const drawOverlay = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const x = (lorenzParams.rho / RHO_MAX) * W;
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = x > W / 2 ? 'right' : 'left';
    const labelX = x > W / 2 ? x - 6 : x + 6;
    ctx.fillText(`ρ = ${lorenzParams.rho.toFixed(1)}`, labelX, 16);
  }, [lorenzParams.rho]);

  useEffect(() => {
    if (showBifurcation) {
      computeDiagram();
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }
    };
  }, [showBifurcation, computeDiagram]);

  useEffect(() => {
    if (showBifurcation) drawOverlay();
  }, [showBifurcation, drawOverlay]);

  const rhoFromEvent = (e: { clientX: number }) => {
    const canvas = overlayRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const rho = (x / rect.width) * RHO_MAX;
    return Math.max(0.1, Math.min(RHO_MAX, Math.round(rho * 10) / 10));
  };

  const jumpToRho = (rho: number) => {
    setCurrentSystem('lorenz');
    setLorenzParams({ rho });
    resetSimulation();
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rho = rhoFromEvent(e);
    if (rho !== null) jumpToRho(rho);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowBifurcation(false);
    } else if (e.key === 'ArrowLeft') {
      jumpToRho(Math.max(0.1, lorenzParams.rho - 1));
    } else if (e.key === 'ArrowRight') {
      jumpToRho(Math.min(RHO_MAX, lorenzParams.rho + 1));
    }
  };

  if (!showBifurcation) return null;

  return (
    <div
      className="bifurcation-overlay"
      role="dialog"
      aria-label="Lorenz bifurcation diagram"
      aria-modal="false"
      onKeyDown={handleKeyDown}
      style={{
        '--panel-bg': theme.panelBg,
        '--panel-border': theme.panelBorder,
        '--text': theme.text,
        '--accent': theme.accent,
      } as React.CSSProperties}
    >
      <div className="bifurcation-header">
        <h3>📊 Lorenz Bifurcation Diagram</h3>
        <button
          className="bifurcation-close"
          onClick={() => setShowBifurcation(false)}
          aria-label="Close bifurcation diagram"
        >
          ✕
        </button>
      </div>
      <div className="bifurcation-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={600}
          height={380}
          className="bifurcation-canvas"
          aria-hidden="true"
        />
        <canvas
          ref={overlayRef}
          width={600}
          height={380}
          className="bifurcation-canvas-overlay"
          onClick={handleClick}
          role="slider"
          aria-label={`Rho value selector, current value ${lorenzParams.rho.toFixed(1)}`}
          aria-valuenow={lorenzParams.rho}
          aria-valuemin={RHO_MIN}
          aria-valuemax={RHO_MAX}
          tabIndex={0}
        />
      </div>
      <p className="bifurcation-hint">
        Click or use ← → arrow keys to set ρ value. Press Escape to close.
      </p>
    </div>
  );
};
