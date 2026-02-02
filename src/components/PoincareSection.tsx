import React, { useRef, useEffect, useCallback } from 'react';
import { useStore, THEMES } from '../store/useStore';
import './PoincareSection.css';

const CANVAS_W = 500;
const CANVAS_H = 400;

export const PoincareSection: React.FC = () => {
  const { showPoincare, setShowPoincare, colorTheme, currentSystem, isPlaying } = useStore();
  const theme = THEMES[colorTheme];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);
  const lastCountRef = useRef(0);

  const axisLabels = useCallback((): { x: string; y: string; title: string } => {
    switch (currentSystem) {
      case 'lorenz':
        return { x: 'x', y: 'y', title: 'Lorenz Poincaré Section (z maxima)' };
      case 'rossler':
        return { x: 'x', y: 'z', title: 'Rössler Poincaré Section (y = 0 crossing)' };
      case 'doublePendulum':
        return { x: 'θ₁', y: 'ω₁', title: 'Pendulum Poincaré Section (θ₂ = 0)' };
      default:
        return { x: 'x', y: 'y', title: 'Poincaré Section' };
    }
  }, [currentSystem]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showPoincare) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const system = (window as any).__chaosLabSystem;
    if (!system || !system.poincarePoints) return;

    const points: [number, number][] = system.poincarePoints;

    // Only redraw if points changed
    if (points.length === lastCountRef.current && points.length > 0) {
      animFrameRef.current = requestAnimationFrame(draw);
      return;
    }
    lastCountRef.current = points.length;

    // Background
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (points.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Collecting points... let the simulation run.', CANVAS_W / 2, CANVAS_H / 2);
      animFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    // Auto-scale based on data range
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [px, py] of points) {
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }

    // Add 10% padding
    const rangeX = (maxX - minX) || 1;
    const rangeY = (maxY - minY) || 1;
    const padX = rangeX * 0.1;
    const padY = rangeY * 0.1;
    minX -= padX; maxX += padX;
    minY -= padY; maxY += padY;

    const margin = 40;
    const plotW = CANVAS_W - 2 * margin;
    const plotH = CANVAS_H - 2 * margin;

    const toCanvasX = (v: number) => margin + ((v - minX) / (maxX - minX)) * plotW;
    const toCanvasY = (v: number) => margin + plotH - ((v - minY) / (maxY - minY)) * plotH;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = margin + (i / 5) * plotW;
      const y = margin + (i / 5) * plotH;
      ctx.beginPath(); ctx.moveTo(x, margin); ctx.lineTo(x, margin + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(margin + plotW, y); ctx.stroke();
    }

    // Draw points with fade effect (older = dimmer)
    const totalPts = points.length;
    for (let i = 0; i < totalPts; i++) {
      const [px, py] = points[i];
      const cx = toCanvasX(px);
      const cy = toCanvasY(py);
      const age = (i / totalPts); // 0 = oldest, 1 = newest
      const alpha = 0.15 + age * 0.7;
      const hue = theme.trailHue1 * 360;
      ctx.fillStyle = `hsla(${hue}, 85%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Axis labels
    const labels = axisLabels();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';

    // X axis values
    for (let i = 0; i <= 4; i++) {
      const val = minX + (i / 4) * (maxX - minX);
      ctx.fillText(val.toFixed(1), margin + (i / 4) * plotW, CANVAS_H - 6);
    }

    // Y axis values
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = minY + (i / 4) * (maxY - minY);
      ctx.fillText(val.toFixed(1), margin - 4, margin + plotH - (i / 4) * plotH + 4);
    }

    // Axis titles
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels.x, CANVAS_W / 2, CANVAS_H - 18);
    ctx.save();
    ctx.translate(14, CANVAS_H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(labels.y, 0, 0);
    ctx.restore();

    // Point count
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${totalPts} points`, CANVAS_W - margin, margin - 6);

    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(draw);
    }
  }, [showPoincare, currentSystem, isPlaying, theme, axisLabels]);

  useEffect(() => {
    if (showPoincare) {
      lastCountRef.current = 0;
      draw();
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [showPoincare, draw]);

  // Restart draw loop when play state changes
  useEffect(() => {
    if (showPoincare && isPlaying) {
      draw();
    }
  }, [isPlaying, showPoincare, draw]);

  if (!showPoincare) return null;

  const labels = axisLabels();

  return (
    <div
      className="poincare-overlay"
      style={{
        '--panel-bg': theme.panelBg,
        '--panel-border': theme.panelBorder,
        '--text': theme.text,
        '--accent': theme.accent,
      } as React.CSSProperties}
    >
      <div className="poincare-header">
        <h3>🎯 {labels.title}</h3>
        <button className="poincare-close" onClick={() => setShowPoincare(false)}>✕</button>
      </div>
      <div className="poincare-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="poincare-canvas"
        />
      </div>
      <p className="poincare-hint">
        Points appear where the trajectory crosses a specific plane in phase space.
        {currentSystem === 'lorenz' && ' Each dot marks a local maximum of z.'}
        {currentSystem === 'rossler' && ' Each dot marks where y crosses zero (ascending).'}
        {currentSystem === 'doublePendulum' && ' Each dot marks where θ₂ passes through zero.'}
      </p>
    </div>
  );
};
