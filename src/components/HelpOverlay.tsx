import React, { useEffect, useRef } from 'react';
import './HelpOverlay.css';

interface HelpOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space', action: 'Play / Pause simulation' },
  { key: 'R', action: 'Reset simulation' },
  { key: '1', action: 'Switch to Lorenz attractor' },
  { key: '2', action: 'Switch to Rössler attractor' },
  { key: '3', action: 'Switch to Double Pendulum' },
  { key: 'S', action: 'Toggle side-by-side (Butterfly) mode' },
  { key: 'C', action: 'Toggle cinematic chase camera' },
  { key: 'A', action: 'Toggle chaos autopilot' },
  { key: 'M', action: 'Toggle audio sonification' },
  { key: 'B', action: 'Toggle bloom glow effect' },
  { key: 'T', action: 'Cycle through color themes' },
  { key: 'P', action: 'Screenshot current view' },
  { key: 'L', action: 'Copy share link to clipboard' },
  { key: 'H / ?', action: 'Toggle this help overlay' },
  { key: 'Esc', action: 'Close open dialogs' },
];

export const HelpOverlay: React.FC<HelpOverlayProps> = ({ isVisible, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) overlayRef.current?.focus();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'h' || e.key === 'H' || e.key === '?') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className="help-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={onClose}
    >
      <div
        className="help-modal"
        ref={overlayRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="help-header">
          <h2>⌨️ Keyboard Shortcuts</h2>
          <button className="help-close" onClick={onClose} aria-label="Close help">✕</button>
        </div>

        <div className="help-grid">
          {SHORTCUTS.map(({ key, action }) => (
            <div className="help-row" key={key}>
              <kbd className="help-key">{key}</kbd>
              <span className="help-action">{action}</span>
            </div>
          ))}
        </div>

        <div className="help-footer">
          <p><strong>Mouse:</strong> Drag to rotate · Scroll to zoom · Right-drag to pan</p>
          <p><strong>Touch:</strong> Drag to rotate · Pinch to zoom</p>
          <p><strong>Right-click</strong> canvas for quick actions</p>
        </div>
      </div>
    </div>
  );
};
