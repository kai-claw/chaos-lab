import React from 'react';
import { useStore, THEMES } from '../store/useStore';
import './LyapunovIndicator.css';

export const LyapunovIndicator: React.FC = () => {
  const { showLyapunov, lyapunovExponent, colorTheme } = useStore();
  const theme = THEMES[colorTheme];

  if (!showLyapunov) return null;

  // Map λ to color: negative = green (stable), ~0 = yellow (edge), positive = red (chaotic)
  const clampedLambda = Math.max(-2, Math.min(3, lyapunovExponent));
  const normalized = (clampedLambda + 2) / 5; // 0..1
  const hue = (1 - normalized) * 120; // 120=green → 0=red
  const barWidth = Math.min(100, Math.max(5, normalized * 100));

  const statusLabel =
    lyapunovExponent > 0.1 ? 'Chaotic' :
    lyapunovExponent > -0.05 ? 'Edge of Chaos' :
    'Stable';

  const statusEmoji =
    lyapunovExponent > 0.1 ? '🔴' :
    lyapunovExponent > -0.05 ? '🟡' :
    '🟢';

  return (
    <div
      className="lyapunov-indicator"
      style={{
        '--panel-bg': theme.panelBg,
        '--panel-border': theme.panelBorder,
        '--text': theme.text,
        '--text-muted': theme.textMuted,
        '--bar-hue': hue,
      } as React.CSSProperties}
    >
      <div className="lyapunov-header">
        <span className="lyapunov-label">λ (Lyapunov)</span>
        <span className="lyapunov-status">{statusEmoji} {statusLabel}</span>
      </div>

      <div className="lyapunov-value" style={{ color: `hsl(${hue}, 90%, 60%)` }}>
        λ = {lyapunovExponent.toFixed(3)}
      </div>

      <div className="lyapunov-bar-track">
        <div
          className="lyapunov-bar-fill"
          style={{
            width: `${barWidth}%`,
            background: `hsl(${hue}, 85%, 50%)`,
            boxShadow: `0 0 10px hsla(${hue}, 85%, 50%, 0.6)`,
          }}
        />
        <div className="lyapunov-bar-zero" />
      </div>

      <div className="lyapunov-hint">
        Measures how fast nearby paths diverge. Positive = chaos.
      </div>
    </div>
  );
};
