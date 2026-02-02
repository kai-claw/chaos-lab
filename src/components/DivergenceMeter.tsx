import React from 'react';
import { useStore, THEMES } from '../store/useStore';

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
      role="meter"
      aria-label="Divergence between the two systems"
      aria-valuenow={normalizedDiv}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuetext={`Divergence: ${displayValue}`}
      style={{
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        pointerEvents: 'none',
        textAlign: 'center',
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <div style={{
        color: theme.textMuted,
        fontSize: '11px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        Divergence
      </div>
      <div style={{
        width: 200,
        height: 6,
        background: `rgba(${theme.bgRgb}, 0.7)`,
        borderRadius: 3,
        overflow: 'hidden',
        border: `1px solid ${theme.panelBorder}`,
        backdropFilter: 'blur(4px)',
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: `hsl(${barHue}, 90%, 55%)`,
          borderRadius: 3,
          transition: 'width 0.1s ease, background 0.3s ease',
          boxShadow: `0 0 8px hsla(${barHue}, 90%, 55%, 0.6)`,
        }} />
      </div>
      <div style={{
        color: theme.text,
        fontSize: '13px',
        marginTop: 4,
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 600,
        textShadow: `0 0 10px hsla(${barHue}, 90%, 55%, 0.5)`,
      }}>
        {displayValue}
      </div>
    </div>
  );
};
