import React from 'react';
import { useStore, THEMES } from '../store/useStore';
import './DivergenceMeter.css';

export const DivergenceMeter: React.FC = () => {
  const { sideBySideMode, divergence, colorTheme } = useStore();
  const theme = THEMES[colorTheme];

  if (!sideBySideMode) return null;

  // Map divergence to 0-1 range (log scale)
  const logDiv = Math.log10(Math.max(divergence, 0.0001));
  const normalizedDiv = Math.min(1, Math.max(0, (logDiv + 4) / 6)); // -4 to 2 → 0 to 1
  const percentage = Math.round(normalizedDiv * 100);

  // Color from green → yellow → red
  const barHue = (1 - normalizedDiv) * 120; // 120=green, 0=red
  const displayValue = divergence < 0.001 ? divergence.toExponential(2) : divergence.toFixed(3);

  return (
    <div
      className="divergence-meter"
      role="meter"
      aria-label="Divergence between the two systems"
      aria-valuenow={normalizedDiv}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuetext={`Divergence: ${displayValue}`}
    >
      <div className="divergence-label" style={{ color: theme.textMuted }}>
        Divergence
      </div>
      <div className="divergence-bar-track">
        <div
          className="divergence-bar-fill"
          style={{
            width: `${percentage}%`,
            background: `hsl(${barHue}, 90%, 55%)`,
            boxShadow: `0 0 10px hsla(${barHue}, 90%, 55%, 0.5), 0 0 20px hsla(${barHue}, 90%, 55%, 0.2)`,
          }}
        />
      </div>
      <div
        className="divergence-value"
        style={{
          color: `hsl(${barHue}, 80%, 65%)`,
          textShadow: `0 0 12px hsla(${barHue}, 90%, 55%, 0.4)`,
        }}
      >
        {displayValue}
      </div>
    </div>
  );
};
